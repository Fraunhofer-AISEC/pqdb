/*
 * Copyright (c) 2026, Fraunhofer AISEC.
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
 * DataTable — shared data grid built on AG Grid Community (MIT).
 *
 * Replaces the hand-rolled QueryTable for all three consumers (SchemeComparison,
 * CustomSQLQuery, FlavorDetail Benchmarks). Provides native grouped headers
 * (headerGroups), client-side sorting on raw values, column resize/reorder/hide,
 * row virtualization, CSV export (AG Grid) and a numeric-cell heatmap aligned to
 * the brand teal ramp in light and dark mode.
 *
 * `queryResult` preserves QueryTable's contract:
 *   - undefined → "No results"
 *   - null      → render nothing
 *   - { columns, values } → the grid
 */
import './agGridTheme.css';

import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useRef } from 'react';

// AG Grid v36 is fully modular; register the whole community feature set before
// any grid is created so sorting, column state, cell styling and CSV export work.
ModuleRegistry.registerModules([AllCommunityModule]);

import { brand, fontFamilyMono } from '../theme';
import DataTableTooltip from './DataTableTooltip';
import DownloadTableButton from './DownloadTableButton';

const propTypes = {
  queryResult: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    values: PropTypes.arrayOf(PropTypes.array.isRequired).isRequired,
    ids: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])),
    flavorIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])),
    platformComments: PropTypes.arrayOf(PropTypes.string),
  }),
  headerGroups: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    span: PropTypes.number.isRequired,
  })),
  formatFunctions: PropTypes.arrayOf(PropTypes.func),
  cellRenderers: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object])),
  suppressTooltipColumns: PropTypes.arrayOf(PropTypes.string),
  order: PropTypes.oneOf(['asc', 'desc']),
  orderBy: PropTypes.string,
  onChangeOrder: PropTypes.func,
  onColumnStateChange: PropTypes.func,
};

const defaultProps = {
  queryResult: null,
  headerGroups: null,
  formatFunctions: null,
  cellRenderers: null,
  order: 'asc',
  orderBy: null,
  onChangeOrder: null,
  onColumnStateChange: null,
};

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function mixHex(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return `rgb(${lerp(a[0], b[0], t)}, ${lerp(a[1], b[1], t)}, ${lerp(a[2], b[2], t)})`;
}

// Low/high heatmap endpoints on the brand teal ramp, tuned per theme mode.
// `colors[1]` is the intense end, reached by the best (smallest) value.
const HEATMAP_COLORS = {
  light: [brand[50], brand[300]],
  dark: [brand[900], brand[500]],
};

// Heatmap position (0..1) for a value, where 1 is the most intensely coloured.
// A log10 scale keeps a column readable when its values span orders of magnitude
// (e.g. a reference impl at millions of cycles beside an optimized one at
// hundreds) instead of a single huge value washing out the rest. The result is
// inverted because lower is better for the sizes / timings / memory these
// columns show, so the smallest value is the hottest cell.
function heatmapRatio(value, range) {
  if (range.max === range.min) return 0;
  const lo = Math.max(range.min, 1);
  const hi = Math.max(range.max, 1);
  if (hi <= lo) return 0;
  const t = (Math.log10(Math.max(value, 1)) - Math.log10(lo))
    / (Math.log10(hi) - Math.log10(lo));
  return 1 - t;
}

// AG Grid v36 can pass `params.value` as `undefined` for columns whose values
// are mostly null (its automatic cell-data-type inference leaves those untyped,
// so the value is not forwarded to formatters/heatmap). The value is still
// present on the row node, so fall back to it. `params.value ?? …` keeps the
// normal path unchanged for the common case.
function cellValue(params) {
  return params.value ?? params.node?.data?.[params.colDef?.field];
}

function heatmapStyle(params, range, colors) {
  const value = cellValue(params);
  if (!Number.isFinite(value)) return undefined;
  return { backgroundColor: mixHex(colors[0], colors[1], heatmapRatio(value, range)) };
}

// Numeric columns (those carrying a formatter: sizes / kCycles / memory) render
// their values in the self-hosted mono accent font (see theme.js). The heatmap
// background, when present, is merged in alongside so mono digits keep the
// brand-tinted cell.
function numericCellStyle(heatmapSx) {
  return heatmapSx
    ? { fontFamily: fontFamilyMono, ...heatmapSx }
    : { fontFamily: fontFamilyMono };
}

function DataTable(props) {
  const {
    queryResult,
    headerGroups,
    formatFunctions,
    cellRenderers,
    order,
    orderBy,
    onChangeOrder,
    onColumnStateChange: onColumnStateChangeProp,
    suppressTooltipColumns,
  } = props;
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const gridApiRef = useRef(null);
  const heatmapColors = HEATMAP_COLORS[dark ? 'dark' : 'light'];

  // Unique per-column AG Grid `field` id. Display names are not guaranteed to be
  // unique (SchemeComparison's paramset-`Name` and implementation-`Name` columns
  // share the header "Name"), but row keys / colIds must be. The first
  // occurrence keeps the raw name; later duplicates get a `#n` suffix. This is
  // a no-op for queries whose column names are already unique.
  const uniqueFields = useMemo(
    () => {
      if (!queryResult) return [];
      const used = new Set();
      return queryResult.columns.map((col) => {
        let field = col;
        let n = 1;
        while (used.has(field)) {
          n += 1;
          field = `${col}#${n}`;
        }
        used.add(field);
        return field;
      });
    },
    [queryResult],
  );

  // Row data as objects keyed by the unique per-column field id (AG Grid's
  // expected shape). Parallel `ids` / `flavorIds` arrays (left over after
  // stripping the ID columns from display) are carried on each row so
  // name-column link renderers can reach the scheme and flavor ids.
  const rowData = useMemo(() => queryResult?.values.map((row, rowIdx) => {
    const obj = {};
    uniqueFields.forEach((field, colIdx) => {
      obj[field] = row[colIdx];
    });
    if (queryResult.ids) obj.__id = queryResult.ids[rowIdx];
    if (queryResult.flavorIds) obj.__flavorId = queryResult.flavorIds[rowIdx];
    if (queryResult.platformComments) obj.__platformComment = queryResult.platformComments[rowIdx];
    return obj;
  }) ?? [], [queryResult, uniqueFields]);

  // Per numeric column (those carrying a formatter: sizes / kCycles / memory)
  // compute the [min, max] over finite values; null when not applicable.
  const heatmapRanges = useMemo(() => queryResult?.columns.map((col, idx) => {
    if (!formatFunctions?.[idx]) return null;
    const nums = rowData.map((r) => r[uniqueFields[idx]]).filter((v) => Number.isFinite(v));
    if (nums.length < 2) return null;
    return { min: Math.min(...nums), max: Math.max(...nums) };
  }) ?? [], [queryResult, rowData, uniqueFields, formatFunctions]);

  const columnDefs = useMemo(() => {
    if (!queryResult) return [];
    const plainDefs = queryResult.columns.map((col, idx) => ({
      field: uniqueFields[idx],
      headerName: col,
      sortable: true,
      resizable: true,
      // `formatFunctions` take the raw value; AG Grid passes a params object,
      // so unwrap `params.value` before delegating.
      valueFormatter: formatFunctions?.[idx]
        ? (params) => formatFunctions[idx](cellValue(params))
        : undefined,
      cellRenderer: cellRenderers?.[idx],
      cellStyle: formatFunctions?.[idx]
        ? (params) => numericCellStyle(
          heatmapRanges[idx] ? heatmapStyle(params, heatmapRanges[idx], heatmapColors) : undefined,
        )
        : undefined,
      // Custom tooltip shows the complete value on hover. `tooltipValueGetter`
      // provides the tooltip value (a column with only `tooltipComponent` gets
      // no value), and the grid's `tooltipShowMode: 'whenTruncated'` limits it
      // to values truncated with an ellipsis; `tooltipComponent`/`headerTooltip`
      // apply to the cell and header (plain columns and group headers) alike.
      // `suppressTooltipColumns` disable the grid tooltip entirely for columns
      // whose custom cell renderer provides its own (e.g. the Platform info
      // icon), to avoid a second redundant tooltip on hover.
      tooltipValueGetter: suppressTooltipColumns?.includes(col)
        ? () => null
        : (params) => params.valueFormatted ?? cellValue(params),
      tooltipComponent: suppressTooltipColumns?.includes(col) ? undefined : DataTableTooltip,
      headerTooltip: suppressTooltipColumns?.includes(col) ? undefined : col,
    }));

    if (headerGroups && headerGroups.length) {
      const grouped = [];
      let offset = 0;
      headerGroups.forEach((group) => {
        grouped.push({
          headerName: group.name,
          children: plainDefs.slice(offset, offset + group.span),
          tooltipComponent: DataTableTooltip,
          headerTooltip: group.name,
        });
        offset += group.span;
      });
      return grouped;
    }
    return plainDefs;
  }, [queryResult, uniqueFields, formatFunctions, cellRenderers, heatmapRanges, headerGroups, heatmapColors, suppressTooltipColumns]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    // Let the columns flex to fill the grid's full width so the header row
    // lines up exactly with the body instead of overflowing into a scrollbar.
    flex: 1,
    minWidth: 100,
  }), []);

  const applySort = useCallback((api) => {
    if (!api) return;
    let colId = orderBy;
    // Map a permalink's display-name orderBy back to the unique field id where
    // the name is ambiguous (duplicate headers like the two "Name" columns).
    if (orderBy) {
      const idx = queryResult?.columns.indexOf(orderBy);
      if (idx !== -1) colId = uniqueFields[idx];
    }
    api.applyColumnState({
      state: order && colId ? [{ colId, sort: order }] : [],
      defaultState: { sort: null },
    });
  }, [order, orderBy, queryResult, uniqueFields]);

  const onGridReady = (params) => {
    gridApiRef.current = params.api;
    applySort(params.api);
  };

  // Keep the grid's sort in sync with the controlled order/orderBy (permalink
  // restore and filter-driven resets). Applying the same state the user just
  // set is a no-op, so onSortChanged → onChangeOrder round-trips safely.
  useEffect(() => {
    applySort(gridApiRef.current);
  }, [applySort, order, orderBy]);

  const onSortChanged = (e) => {
    if (!onChangeOrder) return;
    // v36 exposes the active sort via getColumnState() (api.getSortModel was
    // removed); find the first column carrying an asc/desc sort.
    const sorted = (e.api.getColumnState?.() || []).find(
      (c) => c.sort === 'asc' || c.sort === 'desc',
    );
    if (!sorted) {
      onChangeOrder('asc', null);
      return;
    }
    onChangeOrder(sorted.sort, sorted.colId);
  };

  const onColumnStateChanged = () => {
    if (!onColumnStateChangeProp || !gridApiRef.current) return;
    onColumnStateChangeProp(gridApiRef.current.getColumnState());
  };

  if (queryResult === undefined) {
    return <Typography>No results</Typography>;
  }
  if (!queryResult) {
    return null;
  }

  return (
    <Stack spacing={1} sx={{ alignItems: 'stretch', width: '100%' }}>
      <Box
        className={dark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'}
        sx={{ width: '100%' }}
      >
        <AgGridReact
          theme="legacy"
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          tooltipShowMode="whenTruncated"
          tooltipShowDelay={600}
          onGridReady={onGridReady}
          onSortChanged={onSortChanged}
          onColumnMoved={onColumnStateChanged}
          onColumnResized={onColumnStateChanged}
          onColumnVisible={onColumnStateChanged}
          domLayout="autoHeight"
          suppressCellFocus
        />
      </Box>
      <DownloadTableButton
        queryResult={queryResult}
        onExportCsv={() => gridApiRef.current?.exportDataAsCsv()}
      />
    </Stack>
  );
}

DataTable.propTypes = propTypes;
DataTable.defaultProps = defaultProps;

export default DataTable;
