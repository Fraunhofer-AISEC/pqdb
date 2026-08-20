/*
 * Copyright (c) 2023, Fraunhofer AISEC.
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
  Link as LinkIcon,
  Memory as ChipIcon,
  MenuBook as MenuBookIcon,
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

import Comment from '../components/Comment';
import { DatabaseContext } from '../components/DatabaseProvider';
import DetailCard from '../components/DetailCard';
import ParamsetCard from '../components/ParamsetCard';
import PropItem from '../components/PropItem';
import QueryTable from '../components/QueryTable';
import StatusBadge from '../components/StatusBadge';
import TextComment from '../components/TextComment';
import {
  NIST_ROUNDS,
  SCHEME_TYPES,
  SEC_NOTIONS,
} from '../constants';
import detailLink from '../utils/detailLink';
import humanReadableSize from '../utils/humanReadableSize';
import linkify from '../utils/linkify';
import queryAll from '../utils/queryAll';
import queryAllAsArray from '../utils/queryAllAsArray';

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

function FlavorDetail() {
  const { schemeId, flavorId } = useParams();
  const { db } = useContext(DatabaseContext);
  const [scheme, setScheme] = useState(null);
  const [flavor, setFlavor] = useState(undefined);
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
      setParamsets(queryAll(db, 'SELECT * FROM paramset WHERE flavor_id=? ORDER BY security_level_nist_category ASC, security_level_quantum ASC', [queriedFlavor.id]));
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
      setBenchmarksQuery(queryAllAsArray(db, benchmarkSql(queriedFlavor.id, queriedScheme.type, hasMem)));
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

  const typeLabel = SEC_NOTIONS[flavor.security_notion] ?? undefined;

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
          <StatusBadge kind="statefulness" value={1} label="stateful" title={scheme.stateful_comment} sx={{ height: 20 }} />
          )}

        {(scheme.nist_round !== 'none')
          && (
          <StatusBadge
            kind="rounds"
            value={scheme.nist_round}
            label={NIST_ROUNDS[scheme.nist_round].short}
            title={NIST_ROUNDS[scheme.nist_round].long}
            sx={{ height: 20 }}
          />
          )}
      </Box>

      <Paper elevation={0} sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, mb: 2 }}>
        <Box sx={{ px: 3, pt: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{flavor.name}</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip size="small" label={flavor.type} />
              <Chip size="small" color="primary" variant="outlined" label={flavor.security_notion} title={typeLabel} />
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
          {flavor.comment && <Box sx={{ mt: 0.5 }}><TextComment>{flavor.comment}</TextComment></Box>}
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
        <DetailCard title="Links" Icon={LinkIcon}>
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
              <DetailCard key={`i-${i.id}`} title={i.name} Icon={CodeIcon}>
                {i.comment && <Box sx={{ pb: 1 }}><TextComment>{i.comment}</TextComment></Box>}

                <PropItem key={`i-${i.id}-platform`} title="Platform" Icon={LanguageIcon}>
                  {i.platform}
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
              <QueryTable
                queryResult={benchmarksQuery}
                formatFunctions={getBenchmarkFormatFunctions(scheme.type, hasMemoryData)}
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
