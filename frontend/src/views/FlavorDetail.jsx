/*
 * Copyright (c) 2023-2026, Fraunhofer AISEC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  ArrowBack as ArrowBackIcon,
  BarChart as BarChartIcon,
  Category as CategoryIcon,
  Code as CodeIcon,
  Fort as FortIcon,
  InfoOutlined as InfoIcon,
  Link as LinkIcon,
  Memory as ChipIcon,
  MenuBook as MenuBookIcon,
  Security as SecurityIcon,
  SyncAlt as DiffieHellmanIcon,
  Translate as LanguageIcon,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Container,
  Grid,
  Link,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

import AttackedMarker from '../components/AttackedMarker';
import Comment from '../components/Comment';
import { DatabaseContext } from '../components/DatabaseProvider';
import DataTable from '../components/DataTable';
import DetailCard from '../components/DetailCard';
import ParamsetCard from '../components/ParamsetCard';
import PropItem from '../components/PropItem';
import StatusBadge from '../components/StatusBadge';
import {
  derivePrimaryStatus,
  PLATFORMS,
  SCHEME_TYPES,
  SEC_NOTIONS,
  STAGES,
  statusTitle,
} from '../constants';
import detailLink from '../utils/detailLink';
import humanReadableSize from '../utils/humanReadableSize';
import linkify from '../utils/linkify';
import queryAll from '../utils/queryAll';
import queryAllAsArray from '../utils/queryAllAsArray';
import { fetchStatus } from '../utils/schemeStatus';

/**
 * Build the SQL used both for the inline benchmark table and the raw-SQL link.
 * `flavorId` is injected directly (it is an integer primary key, not user input).
 * The timing/memory column names (enc_sign/dec_vrfy) are literal DB columns,
 * independent of the scheme type; only the display labels differ per type.
 * When no benchmark row carries memory-requirement data, omit those columns.
 */
function benchmarkSql(flavorId, schemeType, withMemory = true) {
  const { enc_sign, dec_vrfy } = SCHEME_TYPES[schemeType];
  const memoryCols = withMemory
    ? `,
  b.memory_requirements_gen AS 'KeyGen Memory Req.',
  b.memory_requirements_enc_sign AS '${enc_sign} Memory Req.',
  b.memory_requirements_dec_vrfy AS '${dec_vrfy} Memory Req.'`
    : '';
  return `SELECT
  p.name AS 'Parameter Set',
  i.name AS 'Implementation',
  b.platform AS 'Platform',
  b.platform_comment AS 'Platform Comment',
  round(b.timings_gen / 1000) AS 'KeyGen (kCycles)',
  round(b.timings_enc_sign / 1000) AS '${enc_sign} (kCycles)',
  round(b.timings_dec_vrfy / 1000) AS '${dec_vrfy} (kCycles)'
  ${memoryCols}
FROM benchmark b, paramset p, implementation i
WHERE p.id = b.paramset_id AND i.id = b.implementation_id AND p.flavor_id = ${flavorId}
ORDER BY p.security_level_nist_category ASC, p.security_level_quantum ASC, i.name ASC, b.platform ASC`;
}

// Reuse the SchemeComparison benchmark format functions: cycle counts as
// locale-formatted kCycles, sizes/memory as human-readable bytes.
// The array length/order must match the columns returned by benchmarkSql,
// so memory formatters are only included when withMemory is true.
// Rank the literal `number of operations` string so paramsets can be sorted.
// Values are "<base>^<exp>" (e.g. "2^20"), the literal "inf" (no limit), or
// an unknown marker such as "todo". Non-finite values map to Infinity so they
// sort last in any ascending order; finite values keep their numeric ranking.
function numberOpsRank(value) {
  if (value == null) return Infinity;
  const m = /^(\d+)\^(\d+)$/.exec(String(value));
  return m ? Number(m[1]) ** Number(m[2]) : Infinity;
}

// Order parametersets by NIST category, then classical security level, then
// max number of operations (ascending). Missing sort keys sort last, so
// paramsets that lack a NIST category/classical level still form a coherent
// trailing group ordered by number of operations. Keys are compared with
// `!==`/`-` only when they differ, so missing values (ranked as Infinity) never
// subtract Infinity - Infinity, which would yield NaN and corrupt the sort.
function sortParamsets(paramsets) {
  const missing = Infinity;
  return [...paramsets].sort((a, b) => {
    const aNist = a.security_level_nist_category ?? missing;
    const bNist = b.security_level_nist_category ?? missing;
    if (aNist !== bNist) return aNist - bNist;
    const aClass = a.security_level_classical ?? missing;
    const bClass = b.security_level_classical ?? missing;
    if (aClass !== bClass) return aClass - bClass;
    return numberOpsRank(a.number_of_operations) - numberOpsRank(b.number_of_operations);
  });
}

function getBenchmarkFormatFunctions(schemeType, withMemory = true) {
  const { enc_sign, dec_vrfy } = SCHEME_TYPES[schemeType];
  const columns = [
    'Parameter Set',
    'Implementation',
    'Platform',
    'KeyGen (kCycles)',
    `${enc_sign} (kCycles)`,
    `${dec_vrfy} (kCycles)`,
  ];
  if (withMemory) {
    columns.push(
      'KeyGen Memory Req.',
      `${enc_sign} Memory Req.`,
      `${dec_vrfy} Memory Req.`,
    );
  }
  return columns.map((col) => {
    if (col.endsWith('(kCycles)')) return (val) => val?.toLocaleString();
    if (col.endsWith('Memory Req.') || col.endsWith('Memory Requirements')) {
      return (val) => humanReadableSize(val, 'B');
    }
    return undefined;
  });
}

// The `Platform Comment` column is a hidden lookup column (feeds the Platform
// cell tooltip), not a display column: capture it per row and strip it out.
function reshapeBenchmarkResult(rawResults) {
  if (rawResults === undefined || rawResults === null) return rawResults;
  const commentIdx = rawResults.columns.indexOf('Platform Comment');
  if (commentIdx === -1) return rawResults;
  const columns = rawResults.columns.filter((_, i) => i !== commentIdx);
  const values = rawResults.values.map((res) => res.filter((_, i) => i !== commentIdx));
  const platformComments = rawResults.values.map((res) => res[commentIdx]);
  return { columns, values, platformComments };
}

// Renders the normalized platform label plus an info icon revealing the exact
// hardware (`platform comment`) in a tooltip on hover.
function BenchmarkPlatformRenderer(params) {
  const comment = params.data?.__platformComment;
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {PLATFORMS[params.value]?.label ?? params.value}
      {comment && (
        <Tooltip title={comment} arrow>
          <InfoIcon fontSize="small" sx={{ cursor: 'help', color: 'text.secondary' }} />
        </Tooltip>
      )}
    </Box>
  );
}

function FlavorDetail() {
  const { schemeId, flavorId } = useParams();
  const { db } = useContext(DatabaseContext);
  const [scheme, setScheme] = useState(null);
  const [flavor, setFlavor] = useState(undefined);
  const [attacks, setAttacks] = useState(undefined);
  const [status, setStatus] = useState(undefined);
  const [paramsets, setParamsets] = useState(undefined);
  const [implementations, setImplementations] = useState(undefined);
  const [sources, setSources] = useState(undefined);
  const [links, setLinks] = useState(undefined);
  const [benchmarksQuery, setBenchmarksQuery] = useState(undefined);
  const [hasMemoryData, setHasMemoryData] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [benchmarkOrder, setBenchmarkOrder] = useState('asc');
  const [benchmarkOrderBy, setBenchmarkOrderBy] = useState(null);

  useEffect(() => {
    const queriedScheme = queryAll(db, 'SELECT * FROM scheme WHERE id_text=?', [schemeId])[0];
    setScheme(queriedScheme);
    setAttacks(
      queriedScheme ? queryAll(db, 'SELECT * FROM scheme_attack WHERE scheme_id=?', [queriedScheme.id]) : [],
    );
    setStatus(queriedScheme ? fetchStatus(db, queriedScheme.id) : []);
    if (queriedScheme === undefined) {
      setFlavor(undefined);
      document.title = 'Unknown - Flavor Details - pqdb';
      return;
    }
    const queriedFlavor = queryAll(db, 'SELECT * FROM flavor WHERE scheme_id=? AND id_text=?', [queriedScheme.id, flavorId])[0];
    setFlavor(queriedFlavor);
    if (queriedFlavor === undefined) {
      document.title = 'Unknown - Flavor Details - pqdb';
    } else {
      document.title = `${queriedFlavor.name} - Flavor Details - pqdb`;
      setParamsets(sortParamsets(queryAll(db, 'SELECT * FROM paramset WHERE flavor_id=?', [queriedFlavor.id])));
      setImplementations(queryAll(db, 'SELECT * FROM implementation WHERE flavor_id=? ORDER BY type DESC', [queriedFlavor.id])); // reference before optimized
      setLinks(queryAll(db, 'SELECT * FROM flavor_link WHERE flavor_id=?', [queriedFlavor.id]));
      setSources(queryAll(db, 'SELECT * FROM flavor_source WHERE flavor_id=?', [queriedFlavor.id]));
      // Does any benchmark row for this flavor carry memory-requirement data?
      // If so we show the memory columns and widen the page; otherwise we omit
      // those columns (and the page stays narrower).
      const hasMem = queryAll(db, `SELECT COUNT(*) AS c FROM benchmark b, paramset p
        WHERE b.paramset_id = p.id AND p.flavor_id = ?
          AND (b.memory_requirements_gen IS NOT NULL
            OR b.memory_requirements_enc_sign IS NOT NULL
            OR b.memory_requirements_dec_vrfy IS NOT NULL)`, [queriedFlavor.id])[0].c > 0;
      setHasMemoryData(hasMem);
      setBenchmarksQuery(reshapeBenchmarkResult(queryAllAsArray(db, benchmarkSql(queriedFlavor.id, queriedScheme.type, hasMem))));
      setBenchmarkOrder('asc');
      setBenchmarkOrderBy(null);
    }
  }, [db, schemeId, flavorId]);

  if (scheme === null) return null;

  if (scheme === undefined) {
    return <Container><Paper>No such scheme.</Paper></Container>;
  }
  if (flavor === undefined) {
    return <Container><Paper>No such flavor.</Paper></Container>;
  }

  const TypeIcon = SCHEME_TYPES[scheme.type].icon;

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        <Typography variant="h6" component="span">
          <Link component={RouterLink} to={detailLink(scheme.id_text)} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <ArrowBackIcon fontSize="inherit" />
            {scheme.name}
          </Link>
        </Typography>

        <Tooltip title={SCHEME_TYPES[scheme.type].name} arrow>
          <TypeIcon fontSize="inherit" aria-hidden={false} role="img" aria-label={SCHEME_TYPES[scheme.type].name} aria-describedby={null} />
        </Tooltip>

        <StatusBadge kind="categories" value={scheme.category} title={scheme.category_comment} sx={{ height: 20 }} />

        {(scheme.stateful === 1)
          && (
          <StatusBadge kind="statefulness" value={1} label="Stateful" title={scheme.stateful_comment} sx={{ height: 20 }} />
          )}

        {(derivePrimaryStatus(status) !== undefined)
          && (
          <StatusBadge
            kind="rounds"
            value={derivePrimaryStatus(status).stage}
            label={STAGES[derivePrimaryStatus(status).stage]?.short}
            title={statusTitle(status)}
            sx={{ height: 20 }}
          />
          )}

        {flavor.deprecated === 1 && (
          <StatusBadge
            kind="rounds"
            value="deprecated"
            label="Deprecated"
            title={flavor.deprecated_comment ?? 'Superseded/archived flavor'}
            sx={{ height: 20 }}
          />
        )}

        {attacks && attacks.length > 0 && (
          <AttackedMarker
            label
            sx={{ height: 20 }}
          />
        )}
      </Box>

      <Paper elevation={0} sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, mb: 2 }}>
        <Box sx={{ px: 3, pt: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{flavor.name}</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip size="small" icon={<SecurityIcon />} label={flavor.security_notion} title={SEC_NOTIONS[flavor.security_notion]} />
              {flavor.comment && <Comment title={flavor.comment} />}
            </Stack>
          </Stack>
          {flavor.description && <Box sx={{ mt: 0.5 }}>{flavor.description}</Box>}
          {flavor.dh_ness
            && (
            <Box sx={{ mt: 0.5, display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 1, alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DiffieHellmanIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography sx={{ fontWeight: 500, color: 'text.secondary', whiteSpace: 'nowrap' }}>Diffie-Hellman-Ness</Typography>
              </Box>
              <Box component="span">
                {flavor.dh_ness}
              </Box>
            </Box>
            )}
          {sources.length > 0
            && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <MenuBookIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography sx={{ fontWeight: 500, color: 'text.secondary' }}>Sources</Typography>
              {sources.map((s, i) => (
                <span key={s.url}>
                  {i > 0 && ', '}
                  {linkify(s.url)}
                </span>
              ))}
            </Box>
            )}
        </Box>
        <Tabs
          value={activeTab}
          onChange={(_event, value) => setActiveTab(value)}
          sx={{ px: 2, borderTop: (theme) => `1px solid ${theme.palette.divider}`, mt: 1 }}
        >
          <Tab label="Parameter Sets" />
          <Tab label="Implementations" />
          <Tab label="Benchmarks" />
        </Tabs>
      </Paper>

      {links.length > 0
        && (
        <DetailCard title="Links" Icon={LinkIcon} sx={{ mb: 2 }}>
          <PropItem key="links" title="Links" Icon={LinkIcon}>
            {links.map((l) => <div key={l.url}>{linkify(l.url)}</div>)}
          </PropItem>
        </DetailCard>
        )}

      {activeTab === 0 && (
        <Grid container spacing={2}>
          {(() => {
            const maxSize = paramsets.reduce(
              (max, pa) => Math.max(
                max,
                ...['sizes_sk', 'sizes_pk', 'sizes_ct_sig']
                  .map((key) => pa[key])
                  .filter((v) => Number.isFinite(v)),
              ),
              0,
            );
            return paramsets.map((p) => (
              <Grid key={`p-${p.id}`} size={{ xs: 12, md: 6, lg: 4 }}>
                <ParamsetCard p={p} schemeType={scheme.type} maxSize={maxSize} />
              </Grid>
            ));
          })()}
        </Grid>
      )}

      {activeTab === 1 && (
        <Stack spacing={2}>
          {implementations.map((i) => {
            const implLinks = queryAll(db, 'SELECT * FROM implementation_link WHERE implementation_id=?', [i.id]);
            const implSources = queryAll(db, 'SELECT * FROM implementation_source WHERE implementation_id=?', [i.id]);
            const implHardware = queryAll(db, 'SELECT * FROM implementation_hardware_feature WHERE implementation_id=?', [i.id]);
            const implDependencies = queryAll(db, 'SELECT * FROM implementation_dependency WHERE implementation_id=?', [i.id]);
            const sideChannelInfo = { 0: 'no', 1: 'yes', null: 'unknown' };

            return (
              <DetailCard
                key={`i-${i.id}`}
                Icon={CodeIcon}
                title={(
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                    {i.name}
                    {i.comment && <Comment title={i.comment} />}
                  </Box>
                )}
              >

                <PropItem key={`i-${i.id}-platform`} title="Platform" Icon={LanguageIcon}>
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                    {PLATFORMS[i.platform]?.label ?? i.platform}
                    {i.platform_comment && <Comment title={i.platform_comment} />}
                  </Box>
                </PropItem>

                <PropItem key={`i-${i.id}-type`} title="Type" Icon={CategoryIcon}>
                  <Chip size="small" variant="outlined" label={i.type} />
                </PropItem>

                {implHardware.length > 0
                  && (
                  <PropItem key={`i-${i.id}-hardware`} title="Hardware Features" Icon={ChipIcon}>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                      {implHardware.map((h) => <Chip size="small" key={h.feature} label={h.feature} />)}
                    </Stack>
                  </PropItem>
                  )}

                {implDependencies.length > 0
                  && (
                  <PropItem key={`i-${i.id}-deps`} title="Code Dependencies" Icon={CodeIcon}>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                      {implDependencies.map((d) => <Chip size="small" key={d.dependency} label={d.dependency} variant="outlined" />)}
                    </Stack>
                  </PropItem>
                  )}

                <PropItem key={`i-${i.id}-sidechannel`} title="Side Channel Guarding" Icon={FortIcon}>
                  <div>
                    branching:
                    {' '}
                    {sideChannelInfo[i.side_channel_guarding_branching]}
                    <Comment title={i.side_channel_guarding_branching_comment} />
                  </div>
                  <div>
                    timing:
                    {' '}
                    {sideChannelInfo[i.side_channel_guarding_timing]}
                    <Comment title={i.side_channel_guarding_timing_comment} />
                  </div>
                </PropItem>

                {/*
                  Follow-up note (see devlog/FRONTEND_DETAIL_PAGES.md): the
                  `code size` (overall/gen/enc|sign/dec|vrfy) and `randomness
                  required` schema fields are not currently displayed here.
                */}

                {implLinks.length > 0
                  && (
                  <PropItem key={`i-${i.id}-links`} title="Links" Icon={LinkIcon}>
                    {implLinks.map((l) => <div key={l.url}>{linkify(l.url)}</div>)}
                  </PropItem>
                  )}

                {implSources.length > 0
                  && (
                  <PropItem key={`i-${i.id}-sources`} title="Sources" Icon={MenuBookIcon}>
                    {implSources.map((s) => <div key={s.url}>{linkify(s.url)}</div>)}
                  </PropItem>
                  )}
              </DetailCard>
            );
          })}
        </Stack>
      )}

      {activeTab === 2 && (
        <Paper elevation={0} sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, p: 2 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <BarChartIcon fontSize="small" color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Benchmarks</Typography>
              </Stack>
              <Link component={RouterLink} to={`/raw_sql?query=${encodeURIComponent(benchmarkSql(flavor.id, scheme.type, hasMemoryData))}`}>
                Show all benchmarks (raw SQL)
              </Link>
            </Stack>
            {benchmarksQuery && benchmarksQuery.values.length > 0 ? (
              <DataTable
                queryResult={benchmarksQuery}
                formatFunctions={getBenchmarkFormatFunctions(scheme.type, hasMemoryData)}
                cellRenderers={benchmarksQuery?.columns.map((col) => (col === 'Platform' ? BenchmarkPlatformRenderer : undefined))}
                suppressTooltipColumns={['Platform']}
                order={benchmarkOrder}
                orderBy={benchmarkOrderBy}
                onChangeOrder={(newOrder, newOrderBy) => {
                  setBenchmarkOrder(newOrder);
                  setBenchmarkOrderBy(newOrderBy);
                }}
              />
            ) : (
              <Typography>No benchmark data available for this flavor.</Typography>
            )}
          </Stack>
        </Paper>
      )}
    </Container>
  );
}

export default FlavorDetail;
