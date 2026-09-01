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
 * A prominent track selector sits at the top, offering a "Standardized" option
 * alongside one tile per standardization process. Selecting "Standardized"
 * shows every standardized and selected-for-standardization scheme together,
 * regardless of the process they came from, so the "current" schemes are
 * immediately visible. Selecting a process track shows that track's schemes by
 * round, with that track's own standardized/selected schemes at the top, so each
 * process can be browsed on its own.
 *
 * On large screens a sticky table of contents sits to the left, mirroring the
 * currently rendered page: one entry per visible round band within the active
 * selection. Selecting an entry scrolls the page to that band.
 *
 * Each round band renders a round header (with count and a descriptive tooltip)
 * followed by two columns of rich SchemeCards (distributed by type icon, not a
 * separate type column). Round bands with no schemes are hidden.
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
import { useSearchParams } from 'react-router-dom';

import VerifiedIcon from '@mui/icons-material/Verified';

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
import detailLink from '../utils/detailLink';
import { fetchAkaMap, fetchStatusMap } from '../utils/schemeStatus';

// Stages shown in the "Standardized" selection, in display order.
const TOP_STAGES = ['standardized', 'selected'];

// The track key used by the "Standardized" selection; distinct from any process
// key so it can prefix its own anchor ids and be told apart from a track.
const STANDARDIZED_TRACK = 'standardized';

// Shared styling for the prominent track-selection tiles. The active tile is
// outlined in the brand colour with a subtle selected tint so it reads as the
// current selection, matching the Scheme Comparison mode tiles. Tiles flex out
// to fill the row and wrap as needed on narrow screens.
function trackTileSx(active) {
  return {
    flexGrow: 1,
    minWidth: 200,
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

  // The selected track lives in the URL (`?track=<key>`) so it survives browser
  // navigation, e.g. going back from a scheme detail keeps the same tab. The
  // key is either STANDARDIZED_TRACK or a process key.
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTrack, setActiveTrack] = useState(
    () => searchParams.get('track') ?? STANDARDIZED_TRACK,
  );

  // Select a track and mirror the choice into the URL. The default
  // (Standardized) selection drops the param so the URL stays clean.
  function selectTrack(track) {
    setActiveTrack(track);
    if (track === STANDARDIZED_TRACK) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ track }, { replace: true });
    }
  }

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

  // Group schemes by process -> stage -> type using each scheme's single
  // highest-priority status row. The stage buckets hold every stage a process
  // has reached, including standardized/selected, so a chosen track can render
  // its own current schemes plus its candidates. Schemes with no status entry
  // (not in any standardization process) are left out of the overview.
  const byProcess = {};
  for (const scheme of queryAll(db, 'SELECT * FROM scheme;')) {
    const primary = derivePrimaryStatus(statusByScheme.get(scheme.id) ?? []);
    if (!primary) continue;
    const stage = String(primary.stage);
    const typeKey = scheme.type;
    byProcess[primary.process] = byProcess[primary.process] || {};
    const bucket = byProcess[primary.process][stage] || { enc: [], sig: [] };
    bucket[typeKey]?.push(scheme);
    byProcess[primary.process][stage] = bucket;
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

  // Processes that still have schemes, in display order; processes not in
  // PROCESS_DISPLAY_ORDER are appended after.
  const knownProcesses = new Set(PROCESS_DISPLAY_ORDER);
  const visibleProcesses = PROCESS_DISPLAY_ORDER.filter(
    (process) => byProcess[process] && Object.keys(byProcess[process]).length > 0,
  );
  for (const process of Object.keys(byProcess)) {
    if (!knownProcesses.has(process)) visibleProcesses.push(process);
  }

  // The whole set of track choices: the "Standardized" selection first, then one
  // tile per visible process.
  const trackChoices = [STANDARDIZED_TRACK, ...visibleProcesses];

  // The sections (stage -> { enc, sig }) rendered for a given selection:
  //  - the STANDARDIZED_TRACK combines the standardized/selected stages of every
  //    visible process;
  //  - a process track serves that process's own buckets, all stages.
  const sectionsForTrack = (track) => {
    if (track === STANDARDIZED_TRACK) {
      const sections = {};
      for (const process of visibleProcesses) {
        for (const [stage, types] of Object.entries(byProcess[process] ?? {})) {
          if (!TOP_STAGES.includes(stage)) continue;
          sections[stage] = sections[stage] || { enc: [], sig: [] };
          sections[stage].enc.push(...types.enc);
          sections[stage].sig.push(...types.sig);
        }
      }
      return sections;
    }
    return byProcess[track] ?? {};
  };

  // The stages of a section present in the data, in display order; absent ones
  // are dropped.
  const visibleStagesIn = (sections) => STATUS_DISPLAY_ORDER.filter(
    (stage) => sections[stage] && (sections[stage].enc.length > 0 || sections[stage].sig.length > 0),
  );

  // Total number of schemes shown by a track selection (used on its tile).
  const trackCount = (track) => visibleStagesIn(sectionsForTrack(track))
    .reduce((n, stage) => n + sectionsForTrack(track)[stage].enc.length
      + sectionsForTrack(track)[stage].sig.length, 0);

  // The on-page heading for a stage: the full STAGES label. Standardized/
  // selected stages have no round wording and pass through unchanged.
  const roundHeading = (stage) => STAGES[stage]?.long ?? stage;

  // Render one stage's band as a Paper of SchemeCards. `idPrefix` gives the
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
      <Paper key={stage} id={`${idPrefix}-${stage}`} sx={{ p: 3, scrollMarginTop: 56 }}>
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
                    to={cardLink(scheme.id_text)}
                  />
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  // Guard the selection against any choice that is no longer available.
  const safeTrack = trackChoices.includes(activeTrack) ? activeTrack : STANDARDIZED_TRACK;

  // Detail link for a scheme that carries the current track as a query param so
  // returning from the detail page (via the browser back button) restores this
  // exact selection. The default Standardized selection needs no param.
  const cardLink = (schemeId) => safeTrack === STANDARDIZED_TRACK
    ? detailLink(schemeId)
    : `${detailLink(schemeId)}?track=${encodeURIComponent(safeTrack)}`;

  // The sections and bands rendered for the active selection.
  const sections = sectionsForTrack(safeTrack);
  const stages = visibleStagesIn(sections);
  // The "Standardized" selection is combined across processes, so its anchors
  // use the track key itself; a process track anchors by its key.
  const idPrefix = safeTrack === STANDARDIZED_TRACK ? STANDARDIZED_TRACK : safeTrack;
  const activeIsStandardized = safeTrack === STANDARDIZED_TRACK;

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        {/* Prominent track selection, spanning the full width. */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Track
          </Typography>
          <Grid container spacing={2} sx={{ flexWrap: 'wrap' }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex' }}>
              <Box
                role="button"
                tabIndex={0}
                onClick={() => selectTrack(STANDARDIZED_TRACK)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectTrack(STANDARDIZED_TRACK);
                  }
                }}
                sx={trackTileSx(activeIsStandardized)}
              >
                <VerifiedIcon sx={{ fontSize: 28, color: activeIsStandardized ? 'primary.main' : 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    Standardized
                    <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      {' '}({trackCount(STANDARDIZED_TRACK)})
                    </Box>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Standardized &amp; selected for standardization
                  </Typography>
                </Box>
              </Box>
            </Grid>
            {visibleProcesses.map((process) => {
              const active = safeTrack === process;
              const meta = PROCESS_META[process];
              const Icon = meta?.icon;
              return (
                <Grid key={process} size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex' }}>
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={() => selectTrack(process)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectTrack(process);
                      }
                    }}
                    sx={trackTileSx(active)}
                  >
                    {Icon && (
                      <Icon sx={{ fontSize: 28, color: active ? 'primary.main' : 'text.secondary' }} />
                    )}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                        {PROCESSES[process] ?? process}
                        <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          {' '}({trackCount(process)})
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
        </Box>

        <Grid container spacing={3}>
          {/* Left table of contents, sticky on large screens. */}
          <Grid size={{ xs: 12, lg: 3 }} sx={{ display: { xs: 'none', lg: 'block' } }}>
            <Box sx={{ position: 'sticky', top: 56, maxHeight: 'calc(100vh - 72px)', overflowY: 'auto' }}>
              <Paper variant="outlined" sx={{ px: 1, py: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, px: 1.5, py: 0.5 }}>
                  Contents
                </Typography>
                <List dense disablePadding>
                  {stages.map((stage) => (
                    <ListItemButton
                      key={stage}
                      onClick={() => setPendingScroll(`${idPrefix}-${stage}`)}
                      sx={{ borderRadius: 1 }}
                    >
                      <ListItemText primary={roundHeading(stage)} />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            </Box>
          </Grid>

          {/* Main content. */}
          <Grid size={{ xs: 12, lg: 9 }}>
            <Stack spacing={4}>
              {stages.length === 0 ? (
                <Typography color="text.secondary">
                  No schemes in this track yet.
                </Typography>
              ) : (
                stages.map((stage) => renderBand(stage, sections, idPrefix))
              )}
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}

export default SchemeOverview;
