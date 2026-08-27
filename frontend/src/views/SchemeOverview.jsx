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
/*
 * Scheme Overview — the full scheme catalogue.
 *
 * Standardized and selected-for-standardization schemes are shown together in a
 * top section, regardless of the standardization process they came from, so the
 * "current" schemes are immediately visible. The remaining candidates are
 * grouped by standardization process, with a row of selection tiles to switch
 * between the processes; within a process the candidates are grouped into
 * round bands.
 *
 * On large screens a sticky table of contents sits to the left, mirroring the
 * currently rendered page: one entry per visible round band, grouped under the
 * standardized/selected section and the active process. Selecting an entry
 * scrolls the page to that band.
 *
 * Each round band renders a round header (with count and a descriptive tooltip)
 * followed by two columns of rich SchemeCards (distributed by type icon, not a
 * separate type column). Round bands and processes with no schemes are hidden.
 */

import {
  Box,
  Container,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';

import { DatabaseContext } from '../components/DatabaseProvider';
import SchemeCard from '../components/SchemeCard';
import StatusBadge from '../components/StatusBadge';
import {
  derivePrimaryStatus,
  PROCESS_DISPLAY_ORDER,
  PROCESS_META,
  PROCESSES,
  STAGES,
  STATUS_DISPLAY_ORDER,
} from '../constants';
import queryAll from '../utils/queryAll';
import { fetchAkaMap, fetchStatusMap } from '../utils/schemeStatus';

// Stages shown in the unified top section, in display order.
const TOP_STAGES = ['standardized', 'selected'];

// Shared styling for the process-selection tiles. The active tile is outlined
// in the brand colour with a subtle selected tint so it reads as the current
// process, matching the Scheme Comparison mode tiles.
function modeTileSx(active) {
  return {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    p: 1.5,
    borderRadius: 2,
    border: '1px solid',
    borderColor: active ? 'primary.main' : 'divider',
    bgcolor: active ? 'action.selected' : 'transparent',
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s',
    '&:hover': {
      borderColor: 'primary.main',
      bgcolor: active ? 'action.selected' : 'action.hover',
    },
  };
}

function SchemeOverview() {
  useEffect(() => {
    document.title = 'Scheme Overview - pqdb';
  }, []);

  // Index of the currently selected process tile.
  const [activeTab, setActiveTab] = useState(0);

  // Element id to scroll to once the matching band has rendered.
  const [pendingScroll, setPendingScroll] = useState(null);
  useEffect(() => {
    if (pendingScroll) {
      document.getElementById(pendingScroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setPendingScroll(null);
    }
  }, [pendingScroll]);

  const { db } = useContext(DatabaseContext);
  if (!db) return null;

  const statusByScheme = fetchStatusMap(db);
  const akaByScheme = fetchAkaMap(db);

  // Group schemes by their single highest-priority status row:
  //  - `top`: stage is standardized or selected (all processes combined).
  //  - `candidatesByProcess`: every other stage, keyed process -> stage -> type,
  //    one entry per process the scheme has been submitted to.
  // Schemes with no status entry (not in any standardization process) are left
  // out of the overview.
  const top = {};
  const candidatesByProcess = {};
  for (const scheme of queryAll(db, 'SELECT * FROM scheme;')) {
    const primary = derivePrimaryStatus(statusByScheme.get(scheme.id) ?? []);
    if (!primary) continue;
    const stage = String(primary.stage);
    const typeKey = scheme.type;
    if (TOP_STAGES.includes(stage)) {
      top[stage] = top[stage] || { enc: [], sig: [] };
      top[stage][typeKey]?.push(scheme);
    } else {
      candidatesByProcess[primary.process] = candidatesByProcess[primary.process] || {};
      candidatesByProcess[primary.process][stage] = candidatesByProcess[primary.process][stage] || { enc: [], sig: [] };
      candidatesByProcess[primary.process][stage][typeKey]?.push(scheme);
    }
  }

  // Schemes that have known attacks (for explicit marking on their cards);
  // map scheme id -> attack descriptions so cards can surface them on hover.
  const attacksByScheme = {};
  const attackedIds = new Set();
  for (const a of queryAll(db, 'SELECT scheme_id, url FROM scheme_attack;')) {
    attackedIds.add(a.scheme_id);
    (attacksByScheme[a.scheme_id] = attacksByScheme[a.scheme_id] || []).push(a.url);
  }

  // Order a band's cards by type (enc before sig), then alphabetically.
  const orderedCards = (enc, sig) => [
    ...[...enc].sort((a, b) => a.name.localeCompare(b.name)),
    ...[...sig].sort((a, b) => a.name.localeCompare(b.name)),
  ];

  // Processes that still have non-standardized candidates, in display order;
  // processes not in PROCESS_DISPLAY_ORDER are appended after.
  const knownProcesses = new Set(PROCESS_DISPLAY_ORDER);
  const visibleProcesses = PROCESS_DISPLAY_ORDER.filter(
    (process) => candidatesByProcess[process] && Object.keys(candidatesByProcess[process]).length > 0,
  );
  for (const process of Object.keys(candidatesByProcess)) {
    if (!knownProcesses.has(process)) visibleProcesses.push(process);
  }

  // The stages of a section (top, or an active process) present in the data, in
  // display order; absent ones are dropped.
  const visibleStagesIn = (sections) => STATUS_DISPLAY_ORDER.filter(
    (stage) => sections[stage] && (sections[stage].enc.length > 0 || sections[stage].sig.length > 0),
  );

  // The on-page heading for a stage: the full STAGES label without the
  // trailing process clause ("of the …"), since the process name already
  // appears in the section heading above. Standardized/selected stages have no
  // such clause and pass through unchanged.
  const roundHeading = (stage) => {
    const long = STAGES[stage]?.long ?? stage;
    return long.replace(/ of the .*$/, '');
  };

  // Render one stage's bands as Papers of SchemeCards. `idPrefix` gives the
  // Paper a stable anchor (`idPrefix-stage`) so the table of contents can jump
  // to it.
  const renderBand = (stage, sections, idPrefix) => {
    const { enc, sig } = sections[stage];
    const stageCount = enc.length + sig.length;
    const stageMeta = STAGES[stage];

    // Distribute this band's cards across two columns independently of type
    // (the type is shown by each card's icon), filling rows before columns: the
    // first card tops column A, the second tops column B, and so on.
    const cards = orderedCards(enc, sig);
    const columns = [
      cards.filter((_, i) => i % 2 === 0),
      cards.filter((_, i) => i % 2 === 1),
    ];
    return (
      <Paper key={stage} id={`${idPrefix}-${stage}`} sx={{ p: 3, scrollMarginTop: 88 }}>
        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 2 }}
        >
          <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
            {roundHeading(stage)}
          </Typography>
          <StatusBadge
            kind="rounds"
            value={stage}
            label={`${stageCount} ${stageCount === 1 ? 'scheme' : 'schemes'}`}
            title={stageMeta?.long}
          />
        </Stack>

        <Grid container spacing={2}>
          {columns.map((columnCards, i) => (
            <Grid key={i} size={{ xs: 12, md: 6 }}>
              <Stack spacing={2}>
                {columnCards.map((scheme) => (
                  <SchemeCard
                    key={scheme.id}
                    scheme={scheme}
                    statusRows={statusByScheme.get(scheme.id) ?? []}
                    aka={akaByScheme.get(scheme.id) ?? []}
                    attacked={attackedIds.has(scheme.id)}
                    attacks={attacksByScheme[scheme.id] ?? []}
                  />
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  // Clamp the selected filter to the current set of visible processes and
  // resolve it to a process key.
  const safeActiveTab = Math.min(activeTab, Math.max(visibleProcesses.length - 1, 0));
  const activeProcess = visibleProcesses[safeActiveTab];

  // The top section is shown whenever at least one standardized/selected
  // scheme exists.
  const hasTop = visibleStagesIn(top).length > 0;

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        {/* Left table of contents, sticky on large screens. */}
        <Grid size={{ xs: 12, lg: 3 }} sx={{ display: { xs: 'none', lg: 'block' } }}>
          <Box sx={{ position: 'sticky', top: 88, maxHeight: 'calc(100vh - 104px)', overflowY: 'auto' }}>
            <Paper variant="outlined" sx={{ px: 1, py: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, px: 1.5, py: 0.5 }}>
                Contents
              </Typography>
              <List dense disablePadding>
                {hasTop && visibleStagesIn(top).map((stage) => (
                  <ListItemButton
                    key={stage}
                    onClick={() => setPendingScroll(`top-${stage}`)}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemText
                      primary={roundHeading(stage)}
                    />
                  </ListItemButton>
                ))}
                {activeProcess && (
                  <>
                    <Typography
                      variant="subtitle2"
                      sx={{ px: 1.5, pt: 1, pb: 0.5, color: 'text.secondary', fontWeight: 600 }}
                    >
                      {PROCESSES[activeProcess] ?? activeProcess}
                    </Typography>
                    {visibleStagesIn(candidatesByProcess[activeProcess]).map((stage) => (
                      <ListItemButton
                        key={stage}
                        onClick={() => setPendingScroll(`${activeProcess}-${stage}`)}
                        sx={{ borderRadius: 1 }}
                      >
                        <ListItemText primary={roundHeading(stage)} />
                      </ListItemButton>
                    ))}
                  </>
                )}
              </List>
            </Paper>
          </Box>
        </Grid>

        {/* Main content. */}
        <Grid size={{ xs: 12, lg: 9 }}>
          <Stack spacing={4}>
            {/* Unified standardized / selected section, independent of process. */}
            {hasTop && (
              <Stack spacing={3}>
                {visibleStagesIn(top).map((stage) => renderBand(stage, top, 'top'))}
              </Stack>
            )}

            {/* Remaining candidates, grouped by standardization process. */}
            {visibleProcesses.length > 0 && (
              <Stack spacing={3}>
                {visibleProcesses.length > 1 ? (
                  <Grid container spacing={2}>
                    {visibleProcesses.map((process, i) => {
                      const count = visibleStagesIn(candidatesByProcess[process])
                        .reduce((n, stage) => n + candidatesByProcess[process][stage].enc.length
                          + candidatesByProcess[process][stage].sig.length, 0);
                      const active = i === safeActiveTab;
                      const meta = PROCESS_META[process];
                      const Icon = meta?.icon;
                      return (
                        <Grid key={process} size={{ xs: 12, sm: 6 }}>
                          <Box
                            role="button"
                            tabIndex={0}
                            onClick={() => setActiveTab(i)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setActiveTab(i);
                              }
                            }}
                            sx={modeTileSx(active)}
                          >
                            {Icon && (
                              <Icon sx={{
                                fontSize: 28,
                                color: active ? 'primary.main' : 'text.secondary',
                              }}
                              />
                            )}
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                              {PROCESSES[process] ?? process}
                              <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                {' '}({count})
                              </Box>
                            </Typography>
                            {meta?.description && (
                              <Typography variant="caption" color="text.secondary">
                                {meta.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Grid>
                      );
                    })}
                  </Grid>
                ) : (
                  <Typography variant="h4" component="h2" sx={{ fontWeight: 800 }}>
                    {PROCESSES[activeProcess] ?? activeProcess}
                  </Typography>
                )}

                {activeProcess && (
                  visibleStagesIn(candidatesByProcess[activeProcess]).map((stage) => (
                    renderBand(stage, candidatesByProcess[activeProcess], activeProcess)
                  ))
                )}
              </Stack>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}

export default SchemeOverview;
