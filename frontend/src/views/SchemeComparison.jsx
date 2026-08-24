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
  Checklist as ChecklistIcon,
  Security as SecurityIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  Link,
  Paper,
  Popover,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

import { DatabaseContext } from '../components/DatabaseProvider';
import DataTable from '../components/DataTable';
import SchemeCheckboxList from '../components/SchemeCheckboxList';
import { SCHEME_TYPES, STAGES } from '../constants';
import detailLink from '../utils/detailLink';
import humanReadableSize from '../utils/humanReadableSize';
import not from '../utils/not';
import queryAll from '../utils/queryAll';
import useDbQuery from '../utils/useDbQuery';

const defaultState = {
  // not shown: 'storage', 'security_levels', 'status', 'memory_req', 'code_size'
  showColumns: ['benchmarks', 'nist_category'],
  schemeType: 'sig',
  platformFilter: '',
  securityLevel: 0,
  securityQuantum: 0,
  showRef: false,
  nistRound: 6,
  showNonNistSchemes: false,
  order: 'asc',
  orderBy: null,
  checkedSchemes: null,
};

// Maps a status stage to a numeric rank (low-to-high: 1 < 2 < 3a < 3f < 4 <
// selected < standardized) so filters like "reached at least round X" can use a
// numeric comparison instead of lexical string ordering. The `stage` column
// lives in `scheme_status`; the CASE only appears inside queries that already
// reference that table.
const STAGE_RANK_SQL = `CASE stage
  WHEN '1' THEN 1 WHEN '2' THEN 2 WHEN '3a' THEN 3 WHEN '3f' THEN 4
  WHEN '4' THEN 5 WHEN 'selected' THEN 6 WHEN 'standardized' THEN 7
END`;

function schemesListQueryDB(db, type, minRank, nonNist) {
  const schemesListQuery = `
    SELECT id_text FROM scheme
    WHERE
      type = ?
      AND (
        id IN (
          SELECT scheme_id FROM scheme_status
          WHERE process = 'nist-pqc' AND ${STAGE_RANK_SQL} >= ?
        )
        ${(nonNist) ? `
        OR id IN (SELECT scheme_id FROM scheme_status WHERE process != 'nist-pqc')
        OR NOT EXISTS (SELECT 1 FROM scheme_status WHERE scheme_status.scheme_id = scheme.id)
        ` : ''}
      )
  `;
  // Bind the stage rank as a number: SQLite compares the CASE (integer) result
  // against a text-bound param coercively and yields no rows, so coerce here.
  const schemesList = queryAll(db, schemesListQuery, [type, Number(minRank)]);
  return schemesList.map((row) => row.id_text);
}

const secLevelMarks = [
  { label: '0', value: 0 }, { label: '128', value: 128 }, { label: '64', value: 64 },
  { label: '192', value: 192 }, { label: '256+', value: 256 },
];

const nistRoundMarks = [
  { label: '2', value: 2 }, { label: '3a', value: 3 }, { label: '3f', value: 4 },
  { label: '4', value: 5 }, { label: 'pending', value: 6 }, { label: 'standard', value: 7 },
];

// Clearer label for the slider handle popup. The on-track marks use compact
// text (see nistRoundMarks) so they don't overlap, so the popup resolves the
// full STAGES text instead of reusing the mark labels.
function getNistRoundLabel(v) {
  const stageKey = { 2: '2', 3: '3a', 4: '3f', 5: '4', 6: 'selected', 7: 'standardized' }[v];
  return stageKey ? STAGES[stageKey].long : v;
}

// Display-column options for the Columns panel. `group` places each option
// under a section heading in the order listed below; `requires` expresses a
// dependency on another column being shown (the implementation-level columns
// only make sense once `benchmarks` is active) and is used to gate the toggle.
const columnGroups = ['General', 'Sizes', 'Benchmarks'];

const columnOptions = [
  { value: 'security_levels', label: 'Security Levels', group: 'General', title: 'Security level in bits (classical/quantum)' },
  { value: 'nist_category', label: 'NIST Category', group: 'General', title: 'NIST security level (1-5)' },
  { value: 'status', label: 'Status', group: 'General', title: 'Standardization status/stage (round, selected, standardized)' },
  { value: 'storage', label: 'Sizes', group: 'Sizes', title: 'Size of keys and ciphertext/signature' },
  { value: 'benchmarks', label: 'Benchmarks', group: 'Benchmarks', title: 'Timings for cryptographic operations' },
  { value: 'hw_features', label: 'Hardware Features', group: 'Benchmarks', title: 'Hardware features required by the implementation', requires: 'benchmarks' },
  { value: 'code_size', label: 'Code Size', group: 'Benchmarks', title: 'Code size required by the implementation', requires: 'benchmarks' },
  { value: 'memory_req', label: 'Memory Requirements', group: 'Benchmarks', title: 'Memory used by the functions at runtime', requires: 'benchmarks' },
];

// Tooltip for a display-column chip. When the chip is disabled because its
// parent column is off (e.g. Hw Features without Benchmarks), explain how to
// enable it; otherwise show the column's one-line description.
function columnChipTitle(opt, showColumns) {
  if (opt.requires && !showColumns.includes(opt.requires)) {
    const parent = columnOptions.find((o) => o.value === opt.requires)?.label;
    return `Enable ${parent} to show ${opt.label}`;
  }
  return opt.title;
}

// Shared styling for the primary Signature / Key Exchange selection tiles. The
// active tile is outlined in the brand colour with a subtle selected tint so it
// reads as the current comparison mode, distinct from the smaller filter buttons.
function modeTileSx(active) {
  return {
    flexGrow: 1,
    minWidth: 180,
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

function buildQuery(state) {
  return `SELECT
  f.id_text AS 'flavor_id',
  s.id_text as 'ID',
  p.name || CASE
      s.stateful
      WHEN 0 THEN ''
      ELSE ' (Stateful)'
  END AS 'Name'${
  (state.showColumns.includes('status')) ? `,
   (SELECT ss.stage FROM scheme_status ss WHERE ss.scheme_id = s.id ORDER BY ${STAGE_RANK_SQL} DESC LIMIT 1) AS 'Status'` : ''
}${(state.showColumns.includes('security_levels')) ? ',\n    p.security_level_classical AS \'Security Level (classical)\'' : ''
}${(state.showColumns.includes('security_levels')) ? ',\n    p.security_level_quantum AS \'Security Level (quantum)\'' : ''
}${(state.showColumns.includes('nist_category')) ? ',\n    p.security_level_nist_category AS \'NIST Category\'' : ''
}${(state.showColumns.includes('storage')) ? `,
  p.sizes_sk AS 'Secret Key Size',
  p.sizes_pk AS 'Public Key Size',
  p.sizes_ct_sig AS '${SCHEME_TYPES[state.schemeType].ct_sig} Size',
  (p.sizes_pk + p.sizes_ct_sig) AS 'Communication Size'` : ''}${(state.showColumns.includes('benchmarks')) ? `,
  i.name AS 'Name'${(state.showColumns.includes('hw_features')) ? `,
  (
      SELECT
          GROUP_CONCAT(hf.feature, ", ")
      FROM
          implementation_hardware_feature hf
      WHERE
          hf.implementation_id = i.id
  ) AS 'Hardware Features'` : ''},
  ${(state.showColumns.includes('code_size')) ? `
  i.code_size_overall AS 'Overall Code Size',
  i.code_size_gen AS 'KeyGen Code Size',
  i.code_size_enc_sign AS '${SCHEME_TYPES[state.schemeType].enc_sign} Code Size',
  i.code_size_dec_vrfy AS '${SCHEME_TYPES[state.schemeType].dec_vrfy} Code Size',` : ''}
  b.platform AS 'Platform',
  round(b.timings_gen / 1000) AS 'KeyGen (kCycles)',
  round(b.timings_enc_sign / 1000) AS '${SCHEME_TYPES[state.schemeType].enc_sign} (kCycles)',
  round(b.timings_dec_vrfy / 1000) AS '${SCHEME_TYPES[state.schemeType].dec_vrfy} (kCycles)',
  round((timings_gen + b.timings_enc_sign + b.timings_dec_vrfy) / 1000) AS 'Total (kCycles)'
  ${(state.showColumns.includes('memory_req')) ? `,
  b.memory_requirements_gen AS 'KeyGen Memory Req.',
  b.memory_requirements_enc_sign AS '${SCHEME_TYPES[state.schemeType].enc_sign} Memory Req.',
  b.memory_requirements_dec_vrfy AS '${SCHEME_TYPES[state.schemeType].dec_vrfy} Memory Req.' ` : ''}
` : ''}
FROM
  scheme s
  JOIN flavor f ON s.id = f.scheme_id
  JOIN paramset p ON f.id = p.flavor_id${(state.showColumns.includes('benchmarks')) ? `
  LEFT JOIN benchmark b ON p.id = b.paramset_id
  LEFT JOIN implementation i ON i.id = b.implementation_id` : ''}
WHERE
  s.type = ?
  AND s.id_text IN (${JSON.stringify(state.checkedSchemes ?? []).slice(1, -1)})
  AND (
      s.id IN (
          SELECT scheme_id FROM scheme_status
          WHERE process = 'nist-pqc' AND ${STAGE_RANK_SQL} >= ?
      )${
  (state.showNonNistSchemes)
    ? `
      OR s.id IN (SELECT scheme_id FROM scheme_status WHERE process != 'nist-pqc')
      OR NOT EXISTS (SELECT 1 FROM scheme_status WHERE scheme_status.scheme_id = s.id)`
    : ''}
  )
  AND p.security_level_classical >= ?
  AND p.security_level_quantum >= ?${
  (state.showColumns.includes('benchmarks'))
    ? ((!state.showRef) ? '\n    AND i.type = \'optimized\'' : '')
        + ((state.platformFilter !== '') ? '\n    AND b.platform LIKE \'%\' || ? || \'%\'' : '')
    : ''}`;
  // Note: The (very fragile) `expandQuery` method below makes quite
  // some assumptions on the structure of this query (for example, no
  // question marks in strings or comments). When making changes,
  // please verify that the "view as SQL" link still works.
}

function createHeaderSections(state) {
  const headers = [];
  const headerSpans = [];
  headers.push('Parameter Set');
  headerSpans.push(1);
  if (state.showColumns.includes('security_levels')) { headerSpans[headerSpans.length - 1] += 2; }
  if (state.showColumns.includes('nist_category')) { headerSpans[headerSpans.length - 1] += 1; }
  if (state.showColumns.includes('status')) { headerSpans[headerSpans.length - 1] += 1; }
  if (state.showColumns.includes('storage')) {
    headers.push('Size');
    headerSpans.push(4);
  }
  if (state.showColumns.includes('benchmarks')) {
    headers.push('Implementation');
    headerSpans.push(1);
    if (state.showColumns.includes('hw_features')) { headerSpans[headerSpans.length - 1] += 1; }
    if (state.showColumns.includes('code_size')) { headerSpans[headerSpans.length - 1] += 4; }
    headers.push('Benchmark');
    headerSpans.push(5);
    if (state.showColumns.includes('memory_req')) { headerSpans[headerSpans.length - 1] += 3; }
  }
  return { headers, headerSpans };
}

function prepareParams(state) {
  // Coerce the stage rank to a number: SQLite compares the CASE (integer)
  // result against a text-bound param coercively and yields no rows (see
  // schemesListQueryDB).
  const params = [state.schemeType, Number(state.nistRound), state.securityLevel, state.securityQuantum];
  if (state.showColumns.includes('benchmarks') && state.platformFilter !== '') {
    params.push(state.platformFilter);
  }
  return params;
}

function getFormatFunctions(results) {
  if (results === undefined || results === null) return undefined;
  const formatFunctions = Array(results.columns.length).fill(undefined);
  results.columns.forEach((col, idx) => {
    if (col === 'Status') {
      formatFunctions[idx] = (val) => (val === undefined || val === null ? val : STAGES[val]?.long ?? val);
    }
    if (col.endsWith('(kCycles)')) formatFunctions[idx] = (val) => val?.toLocaleString();
    if (col.endsWith('Size')) formatFunctions[idx] = (val) => humanReadableSize(val, 'B');
    if (col.endsWith('Memory Req.')) formatFunctions[idx] = (val) => humanReadableSize(val, 'B');
  });
  return formatFunctions;
}

// Renders the "Name" column as a router link to the flavor detail page. The
// scheme and flavor ids are carried on each row as `__id` / `__flavorId` (kept
// when the ID columns were stripped from the display columns in
// `reshapeResult`).
function NameLinkRenderer(params) {
  return (
    <Link component={RouterLink} to={detailLink(params.data.__id, params.data.__flavorId)}>
      {params.value}
    </Link>
  );
}

// Pure reshape of the raw queryAllAsArray result: drop the leading 'flavor_id'
// and 'ID' columns (display only) while preserving the ids for the name-link
// renderer.
function reshapeResult(rawResults) {
  if (rawResults === undefined) return undefined;
  if (rawResults === null) return null;
  const columns = rawResults.columns.slice(2);
  const ids = rawResults.values.map((res) => res[1]);
  const flavorIds = rawResults.values.map((res) => res[0]);
  const values = rawResults.values.map((res) => res.slice(2));
  return { columns, values, ids, flavorIds };
}

function SchemeComparison() {
  const { db } = useContext(DatabaseContext);

  const fullSchemeLists = useMemo(() => ({
    enc: schemesListQueryDB(db, 'enc', '0', true),
    sig: schemesListQueryDB(db, 'sig', '0', true),
  }), [db]);

  // Detect which column-selection group starts a wrapped line so its leading
  // divider can be hidden (a divider at the left edge of a new line looks
  // wrong) and the gap it would introduce can be removed.
  const columnBoxRef = useRef(null);
  const groupRefs = useRef([]);
  const [wrappedGroups, setWrappedGroups] = useState(() => ({}));

  const measureColumnWrap = useCallback(() => {
    const box = columnBoxRef.current;
    if (!box) return;
    const groups = groupRefs.current;
    const firstTop = groups[0]?.offsetTop;
    const next = {};
    groups.forEach((el, i) => {
      // A group whose top edge is below the first group's edge has wrapped to
      // a new line; its leading divider (present for i > 0) is then the first
      // item on that line and should be hidden.
      if (el && firstTop !== undefined && el.offsetTop !== firstTop) next[i] = true;
    });
    setWrappedGroups(next);
  }, []);

  useEffect(() => {
    const box = columnBoxRef.current;
    if (!box) return undefined;
    measureColumnWrap();
    const ro = new ResizeObserver(measureColumnWrap);
    ro.observe(box);
    return () => ro.disconnect();
  }, [measureColumnWrap]);

  const [searchParams, setSearchParams] = useSearchParams();

  const filterState = useMemo(() => {
    const resultState = { ...defaultState };
    if (searchParams.has('state')) {
      try {
        const paramState = JSON.parse(searchParams.get('state'));
        Object.assign(resultState, paramState);
      } catch {
        // JSON state was invalid -> ignore
      }
    }
    if (!resultState.checkedSchemes) {
      resultState.checkedSchemes = fullSchemeLists[resultState.schemeType];
    }
    return resultState;
  }, [searchParams, fullSchemeLists]);

  // `query`/`params` only change with the SQL-relevant filter fields, never for
  // order changes, so useDbQuery re-runs exactly for "real" filter changes.
  // The narrowed dep arrays (excluding order/orderBy) are intentional: sorting
  // must not re-trigger the (debounced) DB query.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const query = useMemo(() => buildQuery(filterState), [
    filterState.schemeType,
    filterState.showColumns,
    filterState.nistRound,
    filterState.securityLevel,
    filterState.securityQuantum,
    filterState.platformFilter,
    filterState.showRef,
    filterState.showNonNistSchemes,
    filterState.checkedSchemes,
  ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const params = useMemo(() => prepareParams(filterState), [
    filterState.schemeType,
    filterState.nistRound,
    filterState.securityLevel,
    filterState.securityQuantum,
    filterState.showColumns,
    filterState.platformFilter,
  ]);

  const { data, processing: queryProcessing, error } = useDbQuery(
    db,
    query,
    params,
    { debounceMs: 300 },
  );
  const queryResult = useMemo(() => reshapeResult(data), [data]);

  // Scheme list for the checkbox picker; only depends on the three filter
  // fields it is derived from.
  const schemesList = useMemo(
    () => schemesListQueryDB(
      db,
      filterState.schemeType,
      filterState.nistRound,
      filterState.showNonNistSchemes,
    ),
    [db, filterState.schemeType, filterState.nistRound, filterState.showNonNistSchemes],
  );

  // Only the selected display columns drive the header grouping.
  const headerGroups = useMemo(() => {
    const { headers, headerSpans } = createHeaderSections({ showColumns: filterState.showColumns });
    return headers.map((name, idx) => ({ name, span: headerSpans[idx] }));
  }, [filterState.showColumns]);

  function updateSearchParams(replace, newFilterState) {
    const searchParam = {};
    const { schemeType } = newFilterState;
    const comparisonState = { ...defaultState, checkedSchemes: fullSchemeLists[schemeType] };
    if (!replace) Object.assign(newFilterState, { order: 'asc', orderBy: null });

    Object.keys(comparisonState).forEach((key) => {
      const value = newFilterState[key];
      if (Array.isArray(comparisonState[key]) && Array.isArray(value)) {
        if (not(comparisonState[key], value).length > 0
           || not(value, comparisonState[key]).length > 0) {
          searchParam[key] = value;
        }
      } else if (value !== comparisonState[key]) {
        searchParam[key] = value;
      }
    });
    const searchParamStr = JSON.stringify(searchParam);
    if (searchParamStr === '{}') setSearchParams({}, { replace });
    else setSearchParams({ state: searchParamStr }, { replace });
  }

  function setFilter(change, replace = false) {
    updateSearchParams(replace, { ...filterState, ...change });
  }

  useEffect(() => {
    document.title = 'Scheme Comparison - pqdb';
  }, []);

  function expandQuery() {
    // UNSAFE, DO NOT USE
    // this is very hacky and unreliable - we just use it here to generate
    // an expanded string that is returned back to the user, so there is no
    // injection possibility, and no real harm results when it goes wrong.

    const paramsList = prepareParams(filterState).slice();
    let errorFlag = false;

    function replacer() {
      const val = paramsList.shift();
      if (val === undefined) {
        errorFlag = true;
        return '';
      }
      if (typeof val === 'string') return `'${val.replaceAll('\'', '\'\'')}'`;
      return val.toString();
    }

    const sqlQuery = query.replaceAll('?', replacer);
    if (errorFlag && paramsList.length > 0) {
      return '';
    }
    return sqlQuery;
  }

  const onChangeOrder = (newOrder, newOrderBy) => {
    setFilter({ order: newOrder, orderBy: newOrderBy }, true);
  };
  const expandedQuery = expandQuery();
  const {
    checkedSchemes, nistRound, order, orderBy, platformFilter, securityLevel,
    securityQuantum, schemeType, showColumns, showNonNistSchemes, showRef,
  } = filterState;

  // Local slider positions so the thumb tracks the drag while the committed
  // value (and the URL/query) only updates on release, keeping the original
  // commit-on-release behavior with controlled inputs. Re-synced whenever the
  // URL state changes so restoring a `?state=` link is reflected live.
  const [sliderDraft, setSliderDraft] = useState({
    securityLevel,
    securityQuantum,
    nistRound,
  });
  useEffect(() => {
    setSliderDraft({
      securityLevel,
      securityQuantum,
      nistRound,
    });
  }, [securityLevel, securityQuantum, nistRound]);

  // Active popover for the category filter buttons. `kind` selects which
  // filter group (security / scope / schemes) is open; `anchor` is the button
  // it is anchored to.
  const [filterMenu, setFilterMenu] = useState(null);

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <div>
        <Container maxWidth="lg">
          <Paper>
            <Box sx={{ p: 2 }}>
              {/* Row 1: primary comparison mode (Signature vs Key Exchange) */}
              <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => setFilter({ schemeType: 'sig', checkedSchemes: fullSchemeLists.sig })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFilter({ schemeType: 'sig', checkedSchemes: fullSchemeLists.sig });
                    }
                  }}
                  sx={modeTileSx(schemeType === 'sig')}
                >
                  <SCHEME_TYPES.sig.icon sx={{
                    fontSize: 28,
                    color: schemeType === 'sig' ? 'primary.main' : 'text.secondary',
                  }}
                  />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                      Signature
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Post-quantum signature schemes
                    </Typography>
                  </Box>
                </Box>
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => setFilter({ schemeType: 'enc', checkedSchemes: fullSchemeLists.enc })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFilter({ schemeType: 'enc', checkedSchemes: fullSchemeLists.enc });
                    }
                  }}
                  sx={modeTileSx(schemeType === 'enc')}
                >
                  <SCHEME_TYPES.enc.icon sx={{
                    fontSize: 28,
                    color: schemeType === 'enc' ? 'primary.main' : 'text.secondary',
                  }}
                  />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                      Key Exchange
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Post-quantum key encapsulation
                    </Typography>
                  </Box>
                </Box>
              </Stack>

              {/* Row 2: column selection + filter buttons */}
              <Stack spacing={1.5} sx={{ mt: 2.5 }}>
                {/* Column category selects, side-by-side with dividers, wrapping on overflow */}
                <Box
                  ref={columnBoxRef}
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    columnGap: 2,
                    rowGap: 1.5,
                  }}
                >
                  {columnGroups.map((group, gi) => (
                    <Fragment key={group}>
                      {gi > 0 && !wrappedGroups[gi] && (
                        <Divider
                          orientation="vertical"
                          flexItem
                          sx={{ alignSelf: 'stretch' }}
                        />
                      )}
                      <Stack
                        ref={(el) => { groupRefs.current[gi] = el; }}
                        spacing={1}
                        sx={{ flexGrow: 1, minWidth: group === 'Sizes' ? 'auto' : 150 }}
                      >
                        <Typography
                          variant="overline"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.7rem',
                            letterSpacing: '0.08em',
                            lineHeight: 1,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {group}
                        </Typography>
                        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                          {columnOptions.filter((opt) => opt.group === group).map((opt) => {
                            const active = showColumns.includes(opt.value);
                            const blockedBy = opt.requires && !showColumns.includes(opt.requires);
                            return (
                              <Tooltip key={opt.value} title={columnChipTitle(opt, showColumns)}>
                                <span>
                                  <Chip
                                    size="small"
                                    label={opt.label}
                                    variant={active ? 'filled' : 'outlined'}
                                    color={active ? 'primary' : 'default'}
                                    disabled={queryProcessing || blockedBy}
                                    onClick={() => setFilter({
                                      showColumns: active
                                        ? showColumns.filter((c) => c !== opt.value)
                                        : [...showColumns, opt.value],
                                    })}
                                    sx={{ fontWeight: 600 }}
                                  />
                                </span>
                              </Tooltip>
                            );
                          })}
                        </Stack>
                      </Stack>
                    </Fragment>
                  ))}
                </Box>

                {/* Filter buttons (bottom left) + SQL link (right) on one row */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      startIcon={<SecurityIcon />}
                      aria-haspopup="true"
                      onClick={(e) => setFilterMenu({ anchor: e.currentTarget, kind: 'security' })}
                    >
                      Security
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      startIcon={<TuneIcon />}
                      aria-haspopup="true"
                      onClick={(e) => setFilterMenu({ anchor: e.currentTarget, kind: 'scope' })}
                    >
                      Scope
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      startIcon={<ChecklistIcon />}
                      aria-haspopup="true"
                      onClick={(e) => setFilterMenu({ anchor: e.currentTarget, kind: 'schemes' })}
                    >
                      Schemes
                    </Button>
                  </Stack>
                  <Link
                    component={RouterLink}
                    to={`/raw_sql?query=${encodeURIComponent(expandedQuery)}`}
                    sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                  >
                    View this query as SQL
                  </Link>
                </Box>
              </Stack>

              {/* Security filters */}
              <Popover
                open={filterMenu?.kind === 'security'}
                anchorEl={filterMenu?.anchor}
                onClose={() => setFilterMenu(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                slotProps={{ paper: { sx: { width: 480, maxWidth: '92vw', p: 3 } } }}
              >
                <Typography variant="overline" color="text.secondary">Security</Typography>
                <Stack spacing={2} sx={{ mt: 1, px: 2 }}>
                  <Box>
                    <Typography variant="body2">Classical Security</Typography>
                    <Slider
                      disabled={queryProcessing}
                      color="secondary"
                      value={sliderDraft.securityLevel}
                      step={16}
                      min={0}
                      max={256}
                      marks={secLevelMarks}
                      track="inverted"
                      valueLabelDisplay="auto"
                      onChange={(_e, v) => setSliderDraft((d) => ({ ...d, securityLevel: v }))}
                      onChangeCommitted={(_e, v) => setFilter({ securityLevel: v })}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2">Quantum Security</Typography>
                    <Slider
                      disabled={queryProcessing}
                      color="secondary"
                      value={sliderDraft.securityQuantum}
                      step={16}
                      min={0}
                      max={256}
                      marks={secLevelMarks}
                      track="inverted"
                      valueLabelDisplay="auto"
                      onChange={(_e, v) => setSliderDraft((d) => ({ ...d, securityQuantum: v }))}
                      onChangeCommitted={(_e, v) => setFilter({ securityQuantum: v })}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2">NIST Round</Typography>
                    <Slider
                      disabled={queryProcessing}
                      color="secondary"
                      value={sliderDraft.nistRound}
                      step={null}
                      min={2}
                      max={7}
                      marks={nistRoundMarks}
                      track="inverted"
                      valueLabelFormat={getNistRoundLabel}
                      valueLabelDisplay="auto"
                      onChange={(_e, v) => setSliderDraft((d) => ({ ...d, nistRound: v }))}
                      onChangeCommitted={(_e, v) => setFilter({ nistRound: v })}
                    />
                  </Box>
                </Stack>
              </Popover>

              {/* Scope / implementation filters */}
              <Popover
                open={filterMenu?.kind === 'scope'}
                anchorEl={filterMenu?.anchor}
                onClose={() => setFilterMenu(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                slotProps={{ paper: { sx: { width: 360, maxWidth: '90vw', p: 2 } } }}
              >
                <Typography variant="overline" color="text.secondary">Scope / Implementations</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <FormControlLabel
                    control={(
                      <Checkbox
                        size="small"
                        disabled={queryProcessing}
                        checked={showNonNistSchemes}
                        onChange={() => setFilter({ showNonNistSchemes: !showNonNistSchemes })}
                        sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}
                      />
                    )}
                    sx={{ mx: 0, '& .MuiButtonBase-root': { p: 0.5 } }}
                    label={(
                      <Typography variant="body2">Include schemes outside the NIST PQC process</Typography>
                    )}
                  />
                  <FormControlLabel
                    control={(
                      <Checkbox
                        size="small"
                        disabled={queryProcessing || !showColumns.includes('benchmarks')}
                        checked={showRef}
                        onChange={() => setFilter({ showRef: !showRef })}
                        sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}
                      />
                    )}
                    sx={{ mx: 0, '& .MuiButtonBase-root': { p: 0.5 } }}
                    label={(
                      <Typography variant="body2">{`Include 'ref' Implementations`}</Typography>
                    )}
                  />
                  <TextField
                    disabled={queryProcessing || !showColumns.includes('benchmarks')}
                    value={platformFilter}
                    color="secondary"
                    label="Platform"
                    variant="outlined"
                    size="small"
                    onChange={(e) => setFilter({ platformFilter: e.target.value })}
                  />
                </Stack>
              </Popover>

              {/* Scheme picker */}
              <Popover
                open={filterMenu?.kind === 'schemes'}
                anchorEl={filterMenu?.anchor}
                onClose={() => setFilterMenu(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                slotProps={{ paper: { sx: { width: 320, maxWidth: '90vw', p: 2 } } }}
              >
                <Typography variant="overline" color="text.secondary">Schemes</Typography>
                <Box sx={{ mt: 1 }}>
                  <SchemeCheckboxList
                    list={schemesList}
                    checkedList={checkedSchemes}
                    onChange={(newChecked) => setFilter({ checkedSchemes: newChecked })}
                  />
                </Box>
              </Popover>
            </Box>
          </Paper>
        </Container>
      </div>
      <Grid container size="grow">
        <Container maxWidth={false} disableGutters>
          <Paper>
            <Box sx={{ p: 2 }}>
              {error ? (
                <Alert severity="error">{error.toString()}</Alert>
              ) : (
                <DataTable
                  onChangeOrder={onChangeOrder}
                  order={order}
                  orderBy={orderBy}
                  queryResult={queryResult}
                  formatFunctions={getFormatFunctions(queryResult)}
                  headerGroups={headerGroups}
                  cellRenderers={[NameLinkRenderer]}
                />
              )}
            </Box>
          </Paper>
        </Container>
      </Grid>
    </Stack>
  );
}

export default SchemeComparison;
