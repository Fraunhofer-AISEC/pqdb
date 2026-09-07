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
 * A unified filter bar sits at the top and lets the catalogue be narrowed by
 * track (All tracks / Standardized / per-process), category, type, and author.
 * All filters AND-combine and live in the URL query string so browser
 * navigation restores the exact selection, and Home can deep-link straight into
 * a filtered view.
 *
 * The active track controls how sections are grouped:
 *  - "All tracks" shows every scheme across all processes, grouped into a
 *    leading "Standardized" section followed by one section per standardization
 *    track (newest call first) holding that track's round candidates, so the
 *    whole catalogue is visible while still being attributable to a track;
 *  - "Standardized" shows every standardized/selected scheme across processes;
 *  - a process track shows that track's schemes by round, with its own
 *    standardized/selected schemes first.
 *
 * On large screens a sticky table of contents sits to the left, mirroring the
 * currently rendered page: one entry per visible round band within the active
 * selection, headed by the track it belongs to when several are shown.
 * Selecting an entry scrolls the page to that band.
 *
 * Each round band renders a round header (with count and a descriptive tooltip)
 * followed by two columns of rich SchemeCards (distributed by type icon, not a
 * separate type column). Round bands with no schemes are hidden.
 */

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  Autocomplete,
  Box,
  Button,
  Collapse,
  Container,
  Divider,
  Grid,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DatabaseContext } from '../components/DatabaseProvider';
import SchemeCard from '../components/SchemeCard';
import StatusBadge from '../components/StatusBadge';
import {
  derivePrimaryStatus,
  PROCESS_DISPLAY_ORDER,
  PROCESSES,
  SCHEME_TYPES,
  STAGES,
  STATUS_DISPLAY_ORDER,
} from '../constants';
import detailLink from '../utils/detailLink';
import overviewLink from '../utils/overviewLink';
import queryAll from '../utils/queryAll';
import { fetchAkaMap, fetchStatusMap } from '../utils/schemeStatus';

// Stages shown in the "Standardized" selection, in display order.
const TOP_STAGES = ['standardized', 'selected'];

// The track key used by the "Standardized" selection; distinct from any process
// key so it can prefix its own anchor ids and be told apart from a process.
const STANDARDIZED_TRACK = 'standardized';

// The "All tracks" sentinel: shows every scheme across all processes and all
// stages combined, so Home's Schemes / Key Exchange / Signatures figures can
// link to a genuinely matching overview. Rendered first in the track control.
const ALL_TRACKS = 'all';

// Non-empty sentinels for the "show everything" options in the Category and
// Type selects. Using a non-empty value (like the Track select does with
// `ALL_TRACKS`) lets the select render its matching MenuItem label ("All
// Categories" / "All Types") in the closed control instead of an empty field.
const ALL_CATEGORIES = 'all-categories';
const ALL_TYPES = 'all-types';

// Order in which processes are grouped under "All tracks", newest
// standardization call first (so the 2022 additional-signatures call renders
// above the 2016 initial call). Processes not listed here are appended after in
// object-key order; they typically contribute only standardized schemes, which
// live in the leading "Standardized" group anyway.
const ALL_TRACKS_GROUP_ORDER = ['nist-additional-sigs', 'nist-pqc'];

// Display order of category choices in the filter (most prominent first).
const CATEGORY_ORDER = [
  'lattice',
  'code',
  'multivariate',
  'isogeny',
  'hash',
  'mpc-in-the-head',
  'other',
];

// Human-readable type labels.
const TYPE_LABELS = { enc: 'Key Exchange', sig: 'Signature' };

// Uniform height for every filter control so Track / Category / Type / Author
// all render the same height even though Category shows a Chip as its selected
// value while the others show plain text.
const FILTER_INPUT_HEIGHT = 40;
const filterInputSx = {
  // Fixed input height keeps every select (and the author Autocomplete, which
  // wraps the same OutlinedInput) the same height regardless of its content.
  '& .MuiOutlinedInput-root': {
    height: FILTER_INPUT_HEIGHT,
  },
  // A small Category chip must sit inside the fixed-height input without
  // overflowing it.
  '& .MuiChip-root': { height: 24, my: 0 },
};

// Read a filter param from the URL, treating absent/empty as the "no filter"
// default (null) for category/type/author.
function readParam(searchParams, key) {
  const value = searchParams.get(key);
  return value && value.length > 0 ? value : null;
}

// Order a band's cards by type (enc before sig), then alphabetically.
const orderedCards = (enc, sig) => [
  ...[...enc].sort((a, b) => a.name.localeCompare(b.name)),
  ...[...sig].sort((a, b) => a.name.localeCompare(b.name)),
];

// The on-page heading for a stage: the full STAGES label. Standardized/
// selected stages have no round wording and pass through unchanged.
const roundHeading = (stage) => STAGES[stage]?.long ?? stage;

// One round band: a round header (with count and a descriptive tooltip) followed
// by two columns of rich SchemeCards, distributed by type icon. The header
// carries a toggle so the whole card grid can be collapsed/expanded in place.
function SchemeBand({
  stage,
  sections,
  idPrefix,
  statusByScheme,
  akaByScheme,
  attackedIds,
  attacksByScheme,
  onCardLink,
  defaultExpanded = false,
}) {
  const { enc, sig } = sections[stage];
  const stageCount = enc.length + sig.length;
  const stageMeta = STAGES[stage];
  const [expanded, setExpanded] = useState(defaultExpanded);

  const cards = orderedCards(enc, sig);
  const columns = [
    cards.filter((_, i) => i % 2 === 0),
    cards.filter((_, i) => i % 2 === 1),
  ];

  return (
    <Paper id={`${idPrefix}-${stage}`} sx={{ scrollMarginTop: 56 }}>
      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${roundHeading(stage)}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        sx={{
          alignItems: 'center',
          flexWrap: 'wrap',
          // The header is the clickable, button-like element, so it owns all of
          // the card's padding — the whole padded area, top and bottom, toggles
          // on click, and keeps the heading centred when the band is collapsed.
          p: 3,
          cursor: 'pointer',
          borderRadius: 1,
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
          {roundHeading(stage)}
        </Typography>
        <StatusBadge
          kind="rounds"
          value={stage}
          label={`${stageCount} ${stageCount === 1 ? 'Scheme' : 'Schemes'}`}
          title={stageMeta?.long}
        />
        <Box sx={{ flexGrow: 1 }} />
        <ExpandMoreIcon
          fontSize="small"
          sx={{
            color: 'text.secondary',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s',
          }}
        />
      </Stack>
      <Collapse in={expanded}>
        <Box sx={{ px: 3, pb: 3 }}>
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
                      to={onCardLink(scheme.id_text)}
                    />
                  ))}
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
}

SchemeBand.propTypes = {
  stage: PropTypes.string.isRequired,
  sections: PropTypes.object.isRequired,
  idPrefix: PropTypes.string.isRequired,
  statusByScheme: PropTypes.object,
  akaByScheme: PropTypes.object,
  attackedIds: PropTypes.object,
  attacksByScheme: PropTypes.object,
  onCardLink: PropTypes.func.isRequired,
  defaultExpanded: PropTypes.bool,
};

function SchemeOverview() {
  useEffect(() => {
    document.title = 'Scheme Overview - pqdb';
  }, []);

  // All filter state lives in the URL (`?track=&category=&type=&author=`) so it
  // survives browser navigation, e.g. going back from a scheme detail restores
  // the exact selection. Defaults drop their params to keep the URL clean.
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTrack, setActiveTrack] = useState(
    () => searchParams.get('track') ?? ALL_TRACKS,
  );
  const [activeCategory, setActiveCategory] = useState(() => readParam(searchParams, 'category'));
  const [activeType, setActiveType] = useState(() => readParam(searchParams, 'type'));
  const [activeAuthor, setActiveAuthor] = useState(() => readParam(searchParams, 'author'));

  // Keep the filter state in sync with the URL whenever it changes without a
  // remount (e.g. the browser back button or an external deep-link into the
  // already-mounted overview). The handlers below write URL + state together,
  // so this is idempotent rather than clobbering.
  useEffect(() => {
    setActiveTrack(searchParams.get('track') ?? ALL_TRACKS);
    setActiveCategory(readParam(searchParams, 'category'));
    setActiveType(readParam(searchParams, 'type'));
    setActiveAuthor(readParam(searchParams, 'author'));
  }, [searchParams]);

  // Compose the filter params back into the URL, dropping defaults so the URL
  // stays clean. `replace` keeps the overview page itself out of history (going
  // back always returns to the previous page, not a duplicated overview).
  function pushFilters({ track, category, type, author }) {
    const next = {};
    if (track && track !== ALL_TRACKS) next.track = track;
    if (category) next.category = category;
    if (type) next.type = type;
    if (author) next.author = author;
    setSearchParams(next, { replace: true });
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

  // Scheme id -> author names, used for both the author filter and the
  // per-author counts offered by the author Autocomplete.
  const authorsByScheme = (() => {
    const map = new Map();
    for (const row of queryAll(db, 'SELECT scheme_id, name FROM scheme_author;')) {
      (map.get(row.scheme_id) ?? map.set(row.scheme_id, new Set()).get(row.scheme_id))
        .add(row.name);
    }
    return map;
  })();

  // Distinct authors with their total scheme counts, shown as filter options.
  const authorOptions = (() => {
    const counts = new Map();
    for (const authors of authorsByScheme.values()) {
      for (const name of authors) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  // Group schemes by process -> stage -> type using each scheme's single
  // highest-priority status row. The stage buckets hold every stage a process
  // has reached, including standardized/selected, so a chosen track can render
  // its own current schemes plus its candidates. Schemes with no status entry
  // (not in any standardization process) are left out of the overview.
  const byProcess = (() => {
    const buckets = {};
    for (const scheme of queryAll(db, 'SELECT * FROM scheme;')) {
      const primary = derivePrimaryStatus(statusByScheme.get(scheme.id) ?? []);
      if (!primary) continue;
      const stage = String(primary.stage);
      const typeKey = scheme.type;
      buckets[primary.process] = buckets[primary.process] || {};
      const bucket = buckets[primary.process][stage] || { enc: [], sig: [] };
      bucket[typeKey]?.push(scheme);
      buckets[primary.process][stage] = bucket;
    }
    return buckets;
  })();

  // Schemes that have known attacks (for explicit marking on their cards);
  // map scheme id -> attack descriptions so cards can surface them on hover.
  const attacksByScheme = {};
  const attackedIds = new Set();
  for (const a of queryAll(db, 'SELECT scheme_id, url FROM scheme_attack;')) {
    attackedIds.add(a.scheme_id);
    (attacksByScheme[a.scheme_id] = attacksByScheme[a.scheme_id] || []).push(a.url);
  }

  // Processes that still have schemes, in display order; processes not in
  // PROCESS_DISPLAY_ORDER are appended after.
  const knownProcesses = new Set(PROCESS_DISPLAY_ORDER);
  const visibleProcesses = PROCESS_DISPLAY_ORDER.filter(
    (process) => byProcess[process] && Object.keys(byProcess[process]).length > 0,
  );
  for (const process of Object.keys(byProcess)) {
    if (!knownProcesses.has(process)) visibleProcesses.push(process);
  }

  // The whole set of track choices: All tracks, Standardized, then one entry
  // per visible process.
  const trackChoices = [ALL_TRACKS, STANDARDIZED_TRACK, ...visibleProcesses];

  // Categories present in the data, in display order (unknown ones appended).
  const categoryChoices = (() => {
    const present = new Set(
      queryAll(db, 'SELECT DISTINCT category FROM scheme;').map((r) => r.category),
    );
    const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
    for (const c of present) if (!ordered.includes(c)) ordered.push(c);
    return ordered;
  })();

  // Does a scheme pass the category / type / author filters? The track filter
  // is applied separately when bucketing, so it is not checked here.
  const matchesFilters = (scheme) => {
    if (activeCategory && scheme.category !== activeCategory) return false;
    if (activeType && scheme.type !== activeType) return false;
    if (activeAuthor && !authorsByScheme.get(scheme.id)?.has(activeAuthor)) return false;
    return true;
  };

  // Build the printable groups for a track, each `{ id, title, sections }`
  // where `sections` is { stage: { enc, sig } }. "All tracks" yields a leading
  // combined "Standardized" group plus one group per visible process (newest
  // call first) of its round candidates; the "Standardized" selection is just
  // the combined group; a process track is its own single group holding all of
  // its stages. `ignoreFilters` drops the category/type/author predicates so
  // the track control's headline counts stay unfiltered.
  const buildGroups = (track, ignoreFilters = false) => {
    const hasFilter = !ignoreFilters && Boolean(activeCategory || activeType || activeAuthor);
    const passes = ignoreFilters ? () => true : matchesFilters;
    const take = (types) => (hasFilter ? { enc: types.enc.filter(passes), sig: types.sig.filter(passes) } : types);

    // The combined standardized/selected group.
    const standardized = () => {
      const sections = {};
      for (const process of visibleProcesses) {
        for (const [stage, types] of Object.entries(byProcess[process] ?? {})) {
          if (!TOP_STAGES.includes(stage)) continue;
          sections[stage] = sections[stage] || { enc: [], sig: [] };
          const t = take(types);
          sections[stage].enc.push(...t.enc);
          sections[stage].sig.push(...t.sig);
        }
      }
      return { id: STANDARDIZED_TRACK, title: 'Standardized', sections };
    };

    // One process's non-standardized rounds (or all its stages when `stages`
    // is null), as a renderable group.
    const processGroup = (process, stages) => {
      const sections = {};
      for (const [stage, types] of Object.entries(byProcess[process] ?? {})) {
        if (stages && !stages.includes(stage)) continue;
        sections[stage] = take(types);
      }
      return { id: process, title: PROCESSES[process] ?? process, sections };
    };

    if (track === ALL_TRACKS) {
      // Standardized first, then one group per visible process (newest
      // standardization call first) holding only its round candidates.
      const roundStages = STATUS_DISPLAY_ORDER.filter((s) => !TOP_STAGES.includes(s));
      const groups = [standardized()];
      for (const process of ALL_TRACKS_GROUP_ORDER) {
        if (!visibleProcesses.includes(process)) continue;
        groups.push(processGroup(process, roundStages));
      }
      for (const process of visibleProcesses) {
        if (ALL_TRACKS_GROUP_ORDER.includes(process)) continue;
        groups.push(processGroup(process, roundStages));
      }
      return groups.filter((g) => visibleStagesIn(g.sections).length > 0);
    }
    if (track === STANDARDIZED_TRACK) return [standardized()];
    return [processGroup(track, null)];
  };

  // The stages of a group's sections present in the data, in display order;
  // absent ones are dropped.
  const visibleStagesIn = (sections) => STATUS_DISPLAY_ORDER.filter(
    (stage) => sections[stage] && (sections[stage].enc.length > 0 || sections[stage].sig.length > 0),
  );

  // Total number of schemes in a group's sections, ignoring the other active
  // filters.
  const groupCount = (group) => visibleStagesIn(group.sections)
    .reduce((n, stage) => n + group.sections[stage].enc.length
      + group.sections[stage].sig.length, 0);

  // Total number of schemes shown by a track selection, independent of the
  // other active filters (it describes the track itself, so its count stays
  // stable regardless of the category/type/author selection). The active-filter
  // result count is shown separately in the summary line.
  const trackCount = (track) => buildGroups(track, true)
    .reduce((n, group) => n + groupCount(group), 0);

  // Guard each selection against any choice that is no longer available,
  // falling back to the default (track: All tracks; others: no filter).
  const safeTrack = trackChoices.includes(activeTrack) ? activeTrack : ALL_TRACKS;
  const safeCategory = categoryChoices.includes(activeCategory) ? activeCategory : null;
  const safeType = (activeType === 'enc' || activeType === 'sig') ? activeType : null;
  const safeAuthor = authorOptions.some((o) => o.name === activeAuthor) ? activeAuthor : null;

  // Signature of the active selection. It is folded into every band's React key
  // so that changing the track/filters remounts the bands, resetting each band's
  // collapse state (first band of each group expanded, the rest collapsed) to
  // match the fresh selection.
  const selectionKey = [safeTrack, safeCategory ?? '', safeType ?? '', safeAuthor ?? ''].join('|');

  // Detail link for a scheme that carries the active filters as query params so
  // returning from the detail page (via the browser back button) restores this
  // exact selection. Default-valued params are dropped.
  const cardLink = (schemeId) => overviewLink(
    {
      track: safeTrack,
      category: safeCategory,
      type: safeType,
      author: safeAuthor,
    },
    detailLink(schemeId),
  );

  // The ordered groups (track-aligned) rendered for the active selection. For
  // Standardized and single-process tracks there is one group; "All tracks"
  // yields a leading "Standardized" group plus one group per visible process,
  // newest call first, each showing only its round candidates.
  const groups = buildGroups(safeTrack);

  // Result count for the active selection, shown in the summary line whenever
  // a non-track filter (category/type/author) is active.
  const resultCount = groups.reduce((n, group) => n + groupCount(group), 0);
  const anyFilterActive = safeTrack !== ALL_TRACKS
    || Boolean(safeCategory || safeType || safeAuthor);
  // The summary line only reflects the narrowing filters (category/type/author);
  // choosing a track alone is a navigation choice, not a counted filter.
  const summaryFilterActive = Boolean(safeCategory || safeType || safeAuthor);

  // Handle a change to any single filter, keeping the others.
  function changeFilter(updates) {
    setActiveTrack(updates.track ?? activeTrack);
    setActiveCategory(updates.category !== undefined ? updates.category : activeCategory);
    setActiveType(updates.type !== undefined ? updates.type : activeType);
    setActiveAuthor(updates.author !== undefined ? updates.author : activeAuthor);
    pushFilters({
      track: updates.track ?? activeTrack,
      category: updates.category !== undefined ? updates.category : activeCategory,
      type: updates.type !== undefined ? updates.type : activeType,
      author: updates.author !== undefined ? updates.author : activeAuthor,
    });
  }

  // Reset every filter back to the default (track: All tracks, no others).
  function clearFilters() {
    setActiveTrack(ALL_TRACKS);
    setActiveCategory(null);
    setActiveType(null);
    setActiveAuthor(null);
    setSearchParams({}, { replace: true });
  }

  // Shared label for a track choice in the control.
  const trackLabel = (track) => {
    if (track === ALL_TRACKS) return 'All Tracks';
    if (track === STANDARDIZED_TRACK) return 'Standardized';
    return PROCESSES[track] ?? track;
  };

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        {/* Unified filter bar. */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 0.5 }}>
              Filter
            </Typography>

            {/* Track: All tracks, Standardized, then each visible process. */}
            <TextField
              select
              size="small"
              label="Track"
              value={safeTrack}
              onChange={(e) => changeFilter({ track: e.target.value })}
              sx={{ minWidth: 220, ...filterInputSx }}
            >
              <MenuItem value={ALL_TRACKS}>
                {trackLabel(ALL_TRACKS)} ({trackCount(ALL_TRACKS)})
              </MenuItem>
              <Divider />
              {trackChoices.filter((track) => track !== ALL_TRACKS).map((track) => (
                <MenuItem key={track} value={track}>
                  {trackLabel(track)} ({trackCount(track)})
                </MenuItem>
              ))}
            </TextField>

            {/* Category presence in the data, shown as coloured category chips. */}
            <TextField
              select
              size="small"
              label="Category"
              value={safeCategory ?? ALL_CATEGORIES}
              onChange={(e) => changeFilter({
                category: e.target.value === ALL_CATEGORIES ? null : e.target.value,
              })}
              sx={{ minWidth: 180, ...filterInputSx }}
            >
              <MenuItem value={ALL_CATEGORIES}>All Categories</MenuItem>
              <Divider />
              {categoryChoices.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  <StatusBadge kind="categories" value={cat} />
                </MenuItem>
              ))}
            </TextField>

            {/* Type: enc / sig schemes. */}
            <TextField
              select
              size="small"
              label="Type"
              value={safeType ?? ALL_TYPES}
              onChange={(e) => changeFilter({
                type: e.target.value === ALL_TYPES ? null : e.target.value,
              })}
              sx={{ minWidth: 160, ...filterInputSx }}
            >
              <MenuItem value={ALL_TYPES}>All Types</MenuItem>
              <Divider />
              {Object.entries(TYPE_LABELS).map(([key, label]) => {
                const TypeIcon = SCHEME_TYPES[key]?.icon;
                return (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {TypeIcon && <TypeIcon fontSize="small" sx={{ mr: 1 }} />}
                      {label}
                    </Box>
                  </MenuItem>
                );
              })}
            </TextField>

            {/* Author: distinct authors with per-author counts. */}
            <Autocomplete
              size="small"
              options={authorOptions}
              getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
              value={safeAuthor ? { name: safeAuthor, count: 0 } : null}
              onChange={(_e, value) => changeFilter({ author: value ? value.name : null })}
              sx={{ minWidth: 220, flexGrow: 1, ...filterInputSx }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Author"
                  slotProps={{
                    // Merge into MUI 9's slotProps rather than replacing them:
                    // replacing them drops `htmlInput` (carries MUI's input ref)
                    // and `inputLabel`. We only add the label, keeping
                    // Autocomplete's internally-managed props intact.
                    ...params.slotProps,
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.name}>
                  {option.name} ({option.count})
                </li>
              )}
            />

            <Button
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={clearFilters}
              disabled={!anyFilterActive}
            >
              Clear filters
            </Button>
          </Stack>
        </Paper>

        {/* Summary line shown when a non-track filter is active and at least
            one scheme matches (an empty result is already covered by the
            "No schemes match" message in the content area). */}
        {summaryFilterActive && resultCount > 0 && (
          <Typography variant="body2" color="text.secondary">
            {resultCount} {resultCount === 1 ? 'scheme matches' : 'schemes match'} the filters
          </Typography>
        )}

        <Grid container spacing={3}>
          {/* Left table of contents, sticky on large screens. */}
          <Grid size={{ xs: 12, lg: 3 }} sx={{ display: { xs: 'none', lg: 'block' } }}>
            <Box sx={{ position: 'sticky', top: 56, maxHeight: 'calc(100vh - 72px)', overflowY: 'auto' }}>
              <Paper variant="outlined" sx={{ px: 1, py: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, px: 1.5, py: 0.5 }}>
                  Contents
                </Typography>
                <Stack spacing={0.25}>
                  {groups.flatMap((group) => {
                    const stages = visibleStagesIn(group.sections);
                    if (stages.length === 0) return [];
                    // In the "All tracks" selection each group gets a heading
                    // naming its track, with its rounds indented beneath (this
                    // holds even if only a single track's schemes end up
                    // visible). Single-group selections (Standardized, or a
                    // specific process track) keep the flat round list, since
                    // the selection itself already names them.
                    const multiple = safeTrack === ALL_TRACKS;
                    return [
                      // The combined Standardized group is already labelled by its
                      // band entries, so it gets no redundant Contents heading.
                      ...(multiple && group.id !== STANDARDIZED_TRACK ? [(
                        <Typography
                          key={`${group.id}-h`}
                          variant="subtitle2"
                          sx={{ fontWeight: 600, px: 1.5, pt: 1 }}
                        >
                          {group.title}
                        </Typography>
                      )] : []),
                      ...stages.map((stage) => (
                        <ListItemButton
                          key={stage}
                          onClick={() => setPendingScroll(`${group.id}-${stage}`)}
                          sx={{ borderRadius: 1, ...(multiple ? { pl: 4 } : {}) }}
                        >
                          <ListItemText primary={roundHeading(stage)} />
                        </ListItemButton>
                      )),
                    ];
                  })}
                </Stack>
              </Paper>
            </Box>
          </Grid>

          {/* Main content. */}
          <Grid size={{ xs: 12, lg: 9 }}>
            <Stack spacing={4}>
              {groups.length === 0 || !groups.some((g) => visibleStagesIn(g.sections).length > 0) ? (
                <Typography color="text.secondary">
                  No schemes match the current filters.
                </Typography>
              ) : (
                groups.filter((g) => visibleStagesIn(g.sections).length > 0).map((group) => {
                  const stages = visibleStagesIn(group.sections);
                  const multiple = safeTrack === ALL_TRACKS;
                  return (
                    <Box key={group.id}>
                      {/* The combined Standardized group is already labelled by
                          its Standardized/selected band headings, so it gets no
                          redundant group heading; process groups keep theirs. */}
                      {multiple && group.id !== STANDARDIZED_TRACK && (
                        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 1.5 }}>
                          {group.title}
                        </Typography>
                      )}
                      <Stack spacing={4}>
                        {stages.map((stage, i) => (
                          <SchemeBand
                            key={`${group.id}-${stage}-${selectionKey}`}
                            stage={stage}
                            sections={group.sections}
                            idPrefix={group.id}
                            statusByScheme={statusByScheme}
                            akaByScheme={akaByScheme}
                            attackedIds={attackedIds}
                            attacksByScheme={attacksByScheme}
                            onCardLink={cardLink}
                            defaultExpanded={i === 0}
                          />
                        ))}
                      </Stack>
                    </Box>
                  );
                })
              )}
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}

export default SchemeOverview;
