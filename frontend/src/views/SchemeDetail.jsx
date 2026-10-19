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
  Bolt as BoltIcon,
  Category as CategoryIcon,
  Event as EventIcon,
  ExpandMore as ExpandMoreIcon,
  Layers as LayersIcon,
  Leaderboard as LeaderboardIcon,
  Link as LinkIcon,
  MenuBook as MenuBookIcon,
  PendingActions as PendingActionsIcon,
  PeopleAlt as PeopleIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Container,
  Divider,
  Grid,
  Link,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

import AttackedMarker from '../components/AttackedMarker';
import Comment from '../components/Comment';
import { DatabaseContext } from '../components/DatabaseProvider';
import DetailCard from '../components/DetailCard';
import PropItem from '../components/PropItem';
import StatusBadge from '../components/StatusBadge';
import {
  PROCESSES,
  SCHEME_TYPES,
  SEC_NOTIONS,
  STAGES,
} from '../constants';
import detailLink from '../utils/detailLink';
import linkify from '../utils/linkify';
import queryAll from '../utils/queryAll';
import { fetchAka, fetchStatus } from '../utils/schemeStatus';

function SchemeDetail() {
  const { schemeId } = useParams();
  const { db } = useContext(DatabaseContext);
  const [scheme, setScheme] = useState(null);
  const [authors, setAuthors] = useState(undefined);
  const [problems, setProblems] = useState(undefined);
  const [sources, setSources] = useState(undefined);
  const [links, setLinks] = useState(undefined);
  const [attacks, setAttacks] = useState(undefined);
  const [flavors, setFlavors] = useState(undefined);
  const [patentslink, setPatentslink] = useState(undefined);
  const [status, setStatus] = useState(undefined);
  const [aka, setAka] = useState(undefined);

  useEffect(() => {
    const queriedScheme = queryAll(db, 'SELECT * FROM scheme WHERE id_text=?', [schemeId])[0];
    setScheme(queriedScheme);
    if (queriedScheme === undefined) {
      document.title = 'Unknown - Scheme Details - pqdb';
      setScheme(undefined);
    } else {
      document.title = `${queriedScheme.name} - Scheme Details - pqdb`;
      setAuthors(queryAll(db, 'SELECT * FROM scheme_author WHERE scheme_id=?', [queriedScheme.id]));
      setProblems(queryAll(db, 'SELECT * FROM scheme_problem WHERE scheme_id=?', [queriedScheme.id]));
      setLinks(queryAll(db, 'SELECT * FROM scheme_link WHERE scheme_id=?', [queriedScheme.id]));
      setSources(queryAll(db, 'SELECT * FROM scheme_source WHERE scheme_id=?', [queriedScheme.id]));
      setAttacks(queryAll(db, 'SELECT * FROM scheme_attack WHERE scheme_id=?', [queriedScheme.id]));
      setFlavors(queryAll(db, 'SELECT * FROM flavor WHERE scheme_id=?', [queriedScheme.id]));
      setPatentslink(queryAll(db, 'SELECT * FROM scheme_patents_source WHERE scheme_id=?', [queriedScheme.id]));
      setStatus(fetchStatus(db, queriedScheme.id));
      setAka(fetchAka(db, queriedScheme.id));
    }
  }, [db, schemeId]);

  if (scheme === null) return null;

  if (scheme === undefined) {
    return <Container><Paper>No such scheme.</Paper></Container>;
  }

  const TypeIcon = SCHEME_TYPES[scheme.type].icon;

  const exp = /([[0-9]+])/;
  const patentString = scheme.patents?.split(exp);

  // Build the year line as a list of present year entries, sorted ascending.
  // Each entry is tagged with a descriptive label and rendered separated by a
  // middot, skipping any absent years.
  const yearEntries = [
    { year: scheme.year_paper, label: 'paper' },
    { year: scheme.year_candidate, label: 'NIST candidate' },
    { year: scheme.year_selection, label: 'selection' },
    { year: scheme.year_standardization, label: 'standardization' },
  ]
    .filter((e) => e.year)
    .sort((a, b) => a.year - b.year);
  const yearParts = yearEntries.map((e) => (
    <span key={e.label}>{e.year}<Box component="span" sx={{ opacity: 0.5 }}> ({e.label})</Box></span>
  ));
  const yearRow = yearParts.flatMap((part, i) => (i > 0 ? [' · ', part] : [part]));

  const yearRowNode = (
    <Box component="div" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 0.5 }}>
      {yearRow}
      {scheme.year_comment && <Comment title={scheme.year_comment} />}
    </Box>
  );

  // Render a single flavor row (name, chips, counts, description/comment).
  // Shared by the active list and the deprecated accordion so both look alike.
  const renderFlavor = (f) => {
    const counts = queryAll(
      db,
      `SELECT
         (SELECT COUNT(*) FROM paramset WHERE flavor_id=?) AS paramsets,
         (SELECT COUNT(*) FROM implementation WHERE flavor_id=?) AS implementations,
         (SELECT COUNT(*) FROM benchmark
           WHERE paramset_id IN (SELECT id FROM paramset WHERE flavor_id=?)) AS benchmarks`,
      [f.id, f.id, f.id],
    )[0] ?? {};
    const { paramsets: pCount = 0, implementations: implCount = 0, benchmarks: benchCount = 0 } = counts;

    return (
      <Box key={`flavor-${f.id}`}>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography component="h3" variant="h6">
            <Link component={RouterLink} to={detailLink(scheme.id_text, f.id_text)}>
              {f.name}
            </Link>
          </Typography>

          <Chip
            size="small"
            icon={<SecurityIcon />}
            label={f.security_notion}
            title={SEC_NOTIONS[f.security_notion]}
          />

          {f.deprecated === 1 && (
            <Chip
              size="small"
              color="warning"
              label="Deprecated"
              title={f.deprecated_comment ?? 'Superseded/archived flavor'}
            />
          )}

          {f.comment && <Comment title={f.comment} />}

          {(pCount > 0 || implCount > 0 || benchCount > 0) && (
            <Link
              component={RouterLink}
              to={detailLink(scheme.id_text, f.id_text)}
              sx={{
                // On small screens the counts drop onto their own full-width
                // line and wrap, instead of being pushed right and cut off.
                ml: { xs: 0, sm: 'auto' },
                width: { xs: '100%', sm: 'auto' },
                color: 'text.secondary',
                fontSize: 13,
                whiteSpace: { xs: 'normal', sm: 'nowrap' },
              }}
            >
              {[
                pCount > 0 && `${pCount} parameter set${pCount !== 1 ? 's' : ''}`,
                implCount > 0 && `${implCount} implementation${implCount !== 1 ? 's' : ''}`,
                benchCount > 0 && `${benchCount} benchmark${benchCount !== 1 ? 's' : ''}`,
              ].filter(Boolean).join(' · ')}
              {' →'}
            </Link>
          )}
        </Box>
        {f.description && <Box sx={{ mt: 0.5 }}>{f.description}</Box>}
      </Box>
    );
  };

  // Non-deprecated flavors on top; deprecated ones collapsed into an accordion.
  const activeFlavors = flavors.filter((f) => f.deprecated !== 1);
  const deprecatedFlavors = flavors.filter((f) => f.deprecated === 1);

  return (
    <Container maxWidth="xl">
      <Stack spacing={2}>
        <Paper elevation={0} sx={{ border: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ p: 3 }}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.5 }}>
              {scheme.name}
              <Tooltip title={SCHEME_TYPES[scheme.type].name} arrow>
                <TypeIcon fontSize="large" aria-hidden={false} role="img" aria-label={SCHEME_TYPES[scheme.type].name} aria-describedby={null} />
              </Tooltip>
              {attacks.length > 0 && <AttackedMarker label />}
            </Typography>
            {scheme.description && (
              <Box sx={{ mt: 1 }}>
                {scheme.description}
                {scheme.comment && <Comment title={scheme.comment} />}
              </Box>
            )}
            {aka && aka.length > 0 && (
              <Box sx={{ mt: 0.5 }}>
                <Typography component="span" sx={{ opacity: 0.7 }}>
                  Formerly known as:
                  {' '}
                  {aka.join(', ')}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={2}>
              <DetailCard title="Details" Icon={CategoryIcon}>
                <PropItem key="category" title="Category" Icon={CategoryIcon}>
                  <StatusBadge kind="categories" value={scheme.category} title={scheme.category_comment} />
                </PropItem>

                <PropItem key="status" title="Standardization Status" Icon={LeaderboardIcon}>
                  {status && status.length > 0 ? (
                    status.map((s, idx) => (
                      <Box key={`${s.process}-${s.stage}-${s.standard ?? s.url ?? ''}`} sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <StatusBadge
                            kind="rounds"
                            value={s.stage}
                            label={STAGES[s.stage]?.short ?? s.stage}
                            title={STAGES[s.stage]?.long ?? s.stage}
                          />
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {PROCESSES[s.process] ?? s.process}
                          </Typography>
                          {s.standard && (
                            s.url
                              ? (
                                <Link href={s.url} target="_blank" rel="noreferrer">
                                  {s.standard}
                                </Link>
                              )
                              : <Typography variant="body2">{s.standard}</Typography>
                          )}
                          {s.comment && <Comment title={s.comment} />}
                        </Box>
                        {idx < status.length - 1 && <Divider sx={{ my: 1 }} />}
                      </Box>
                    ))
                  ) : (
                    <span>Not submitted to any standardization process</span>
                  )}
                </PropItem>

                {(scheme.stateful || scheme.stateful_comment) && (
                  <PropItem key="stateful" title="Statefulness" Icon={SaveIcon}>
                    {scheme.stateful === 1
                      ? <StatusBadge kind="statefulness" value={1} label="Stateful" title={scheme.stateful_comment} />
                      : <span>stateless <Comment title={scheme.stateful_comment} /></span> /* stateless only shown if there's a comment */}
                  </PropItem>
                )}

                <PropItem key="year" title="Year" Icon={EventIcon}>
                  {yearRowNode}
                </PropItem>
              </DetailCard>

              <DetailCard title="Security" Icon={SecurityIcon}>
                <PropItem key="problems_trust" title="Security Properties" Icon={SecurityIcon}>
                  {scheme.trust_comment
                      && (
                      <>
                        <div><strong>Trust </strong></div>
                        <Box sx={{ marginBottom: '.6em', overflowWrap: 'anywhere' }}>{scheme.trust_comment}</Box>
                      </>
                      )}
                  {(problems.length > 0 || scheme.problems_comment)
                      && (
                      <>
                        <div><strong>Problems </strong>{scheme.problems_comment && <Comment title={scheme.problems_comment} />}</div>
                        {problems.map((p) => (
                          <div key={p.assumption}>
                            {p.assumption}
                            {' '}
                            <Comment title={p.comment} />
                          </div>
                        ))}
                      </>
                      )}
                </PropItem>

                {attacks.length > 0
                    && (
                    <PropItem key="attacks" title="Attacks" Icon={BoltIcon}>
                      {attacks.map((a) => <div key={a.url}>{linkify(a.url)}</div>)}
                    </PropItem>
                    )}
              </DetailCard>

              <Paper elevation={0} sx={{ border: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1 }}>
                    <LayersIcon fontSize="small" color="primary" />
                    <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
                      Flavors
                    </Typography>
                  </Stack>

                  {activeFlavors.map(renderFlavor)}

                  {deprecatedFlavors.length > 0 && (
                    <Accordion sx={{ mt: 2, border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', '&:before': { display: 'none' } }}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ minHeight: 0, '&.Mui-expanded': { minHeight: 0 } }}
                      >
                        <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Deprecated flavors
                          {' '}
                          ({deprecatedFlavors.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
                        {deprecatedFlavors.map(renderFlavor)}
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              </Paper>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={2}>
              <DetailCard title="Attribution" Icon={PeopleIcon}>
                <PropItem key="authors" title="Authors" Icon={PeopleIcon}>
                  {authors.map((a) => <div key={a.name}>{a.name}</div>)}
                </PropItem>

                {(scheme.website || links.length > 0)
                    && (
                    <PropItem key="links" title="Links" Icon={LinkIcon}>
                      {
                        scheme.website
                        && (
                        <div key={scheme.website}>
                          <Link href={scheme.website}>
                            Website (
                            {scheme.website}
                            )
                          </Link>
                        </div>
                        )
                      }
                      {links.map((l) => <div key={l.url}>{linkify(l.url)}</div>)}
                    </PropItem>
                    )}

                {sources.length > 0
                    && (
                    <PropItem key="sources" title="Sources" Icon={MenuBookIcon}>
                      {sources.map((s) => <div key={s.url}>{linkify(s.url)}</div>)}
                    </PropItem>
                    )}

                {scheme.patents
                    && (
                    <PropItem key="patents" title="Patents" Icon={PendingActionsIcon}>
                      <Box component="div" key={patentString}>
                        {patentString.map((ps, i) => {
                          if (exp.test(ps)) {
                            const x = parseInt(ps.replace(/[[\]]/g, ''), 10);
                            const plElement = patentslink[x - 1];
                            const plUrl = plElement?.url;
                            return plUrl
                              ? <Link key={`${plUrl}-${i}`} href={plUrl} target="_blank" rel="noreferrer">{ps}</Link>
                              : <span key={`${ps}-${i}`}>{ps}</span>;
                          }
                          return <span key={`${ps}-${i}`}>{ps}</span>;
                        })}
                      </Box>
                    </PropItem>
                    )}
              </DetailCard>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}

export default SchemeDetail;
