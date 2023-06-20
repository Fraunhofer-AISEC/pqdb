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
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  Link,
  Paper,
  Slider,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import React, {
  useContext, useEffect, useMemo, useState,
} from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { DatabaseContext } from '../components/DatabaseProvider';
import QueryTable from '../components/QueryTable';
import { SCHEME_TYPES } from '../constants';
import SchemeCheckboxList from '../components/SchemeCheckboxList';
import detailLink from '../utils/detailLink';
import humanReadableSize from '../utils/humanReadableSize';
import not from '../utils/not';
import queryAll from '../utils/queryAll';
import queryAllAsArray from '../utils/queryAllAsArray';

function schemesListQueryDB(db, type, nistRound, nonNist) {
  const schemesListQuery = `
    SELECT id_text FROM scheme
    WHERE
      type = ?
      AND (nist_round BETWEEN ? AND 'S' ${(nonNist) ? 'OR nist_round = \'none\'' : ''})
  `;
  const schemesList = queryAll(db, schemesListQuery, [type, nistRound]);
  return schemesList.map((row) => row.id_text);
}

const secLevelMarks = [
  { label: '0', value: 0 }, { label: '128', value: 128 }, { label: '64', value: 64 },
  { label: '192', value: 192 }, { label: '256+', value: 256 },
];

const nistRoundMarks = [
  { label: '2', value: 2 }, { label: '3a', value: 3 }, { label: '3f', value: 4 }, { label: '4', value: 5 }, { label: 'S', value: 6 },
];

function getNistRoundLabel(v) {
  const round = nistRoundMarks.find((entry) => entry.value === v);
  return round.label;
}

function getNistRoundValue(l) {
  const round = nistRoundMarks.find((entry) => entry.label === l);
  return round.value;
}

function buildQuery(state) {
  return `SELECT
  s.id_text as 'ID',
  p.name || CASE
      s.stateful
      WHEN 0 THEN ''
      ELSE ' (Stateful)'
  END AS 'Name'${
  (state.showColumns.includes('nist_round')) ? ',\n   s.nist_round AS \'NIST Round\'' : ''
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
      s.nist_round BETWEEN ? AND 'S'${
  (state.showNonNistSchemes) ? '\n        OR s.nist_round = \'none\'' : ''}
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
  if (state.showColumns.includes('nist_round')) { headerSpans[headerSpans.length - 1] += 1; }
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
  const params = [state.schemeType, state.nistRound, state.securityLevel, state.securityQuantum];
  if (state.showColumns.includes('benchmarks') && state.platformFilter !== '') {
    params.push(state.platformFilter);
  }
  return params;
}

function getFormatFunctions(results) {
  if (results === undefined) return undefined;
  const formatFunctions = Array(results.columns.length).fill(undefined);
  results.columns.forEach((col, idx) => {
    if (col.endsWith('(kCycles)')) formatFunctions[idx] = (val) => val?.toLocaleString();
    if (col.endsWith('Size')) formatFunctions[idx] = (val) => humanReadableSize(val, 'B');
    if (col.endsWith('Memory Req.')) formatFunctions[idx] = (val) => humanReadableSize(val, 'B');
  });
  return formatFunctions;
}

function SchemeComparison() {
  const { db } = useContext(DatabaseContext);

  let platformFilterTimeout = null;

  const fullSchemeLists = useMemo(() => ({
    enc: schemesListQueryDB(db, 'enc', '0', true),
    sig: schemesListQueryDB(db, 'sig', '0', true),
  }), []);

  const [queryProcessing, setQueryProcessing] = useState(true);
  const [queryResult, setQueryResult] = useState(undefined);
  const [schemesList, setSchemesList] = useState([]);
  const [orderChanged, setOrderChanged] = useState(false);

  const defaultState = {
    // not shown: 'storage', 'security_levels', 'nist_round', 'memory_req', 'code_size'
    showColumns: ['benchmarks', 'hw_features', 'nist_category'],
    schemeType: 'sig',
    platformFilter: '',
    securityLevel: 0,
    securityQuantum: 0,
    showRef: false,
    nistRound: '4',
    showNonNistSchemes: false,
    order: 'asc',
    orderBy: null,
    checkedSchemes: null,
  };

  const [searchParams, setSearchParams] = useSearchParams();

  function filterStateFromSearchParams() {
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
  }

  const filterState = filterStateFromSearchParams();
  const headerSections = createHeaderSections(filterState);
  const query = buildQuery(filterState);

  function updateSearchParams(replace, newFilterState) {
    const searchParam = {};
    const { schemeType } = newFilterState;
    defaultState.checkedSchemes = fullSchemeLists[schemeType];
    if (!replace) Object.assign(newFilterState, { order: 'asc', orderBy: null });

    Object.keys(defaultState).forEach((key) => {
      const value = newFilterState[key];
      if (Array.isArray(defaultState[key]) && Array.isArray(value)) {
        if (not(defaultState[key], value).length > 0
           || not(value, defaultState[key]).length > 0) {
          searchParam[key] = value;
        }
      } else if (value !== defaultState[key]) {
        searchParam[key] = value;
      }
    });
    const searchParamStr = JSON.stringify(searchParam);
    setOrderChanged(replace);
    if (searchParamStr === '{}') setSearchParams({}, { replace });
    else setSearchParams({ state: searchParamStr }, { replace });
  }

  function computeResult(queryState, sqlQuery) {
    const params = prepareParams(queryState);
    const results = queryAllAsArray(db, sqlQuery, params);
    if (results.values.length === 0) return undefined;
    results.columns.shift(); // Remove the 'ID' column name
    results.values.forEach((res) => {
      res[1] = <Link component={RouterLink} to={detailLink(res[0])}>{res[1]}</Link>;
      res.shift(); // Remove the 'ID' entry
    });

    return results;
  }

  function updateResult() {
    const { schemeType, nistRound, showNonNistSchemes } = filterState;
    const schemesListDb = schemesListQueryDB(db, schemeType, nistRound, showNonNistSchemes);
    const queryResultDb = computeResult(filterState, query);

    setQueryProcessing(false);
    setQueryResult(queryResultDb);
    setSchemesList(schemesListDb);
  }

  function setFilter(change, replace = false) {
    updateSearchParams(replace, { ...filterState, ...change });
  }

  useEffect(() => {
    updateResult();
    document.title = 'Scheme Comparison - pqdb';
  }, []);

  useEffect(() => {
    if (!orderChanged) setQueryProcessing(true);
  }, [searchParams]);

  useEffect(() => {
    if (!queryProcessing) return;

    setTimeout(() => {
      updateResult();
    }, 300);
  }, [queryProcessing]);

  function expandQuery() {
    // UNSAFE, DO NOT USE
    // this is very hacky and unreliable - we just use it here to generate
    // an expanded string that is returned back to the user, so there is no
    // injection possibility, and no real harm results when it goes wrong.

    const params = prepareParams(filterState).slice();
    let error = false;

    function replacer() {
      const val = params.shift();
      if (val === undefined) {
        error = true;
        return '';
      }
      if (typeof val === 'string') return `'${val.replaceAll('\'', '\'\'')}'`;
      return val.toString();
    }

    const sqlQuery = query.replaceAll('?', replacer);
    if (error && params.length > 0) {
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

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <Container maxWidth="md">
          <Paper>
            <Box p={2}>
              <Grid justifyContent="space-between" container direction="row">
                <Grid item>
                  <Typography variant="h4">Scheme Comparison</Typography>
                </Grid>
                <Grid item>
                  <ToggleButtonGroup
                    value={schemeType}
                    exclusive
                    size="medium"
                    onChange={(_event, value) => {
                      if (value !== null) {
                        setFilter({ schemeType: value, checkedSchemes: fullSchemeLists[value] });
                      }
                    }}
                  >
                    <ToggleButton disabled={queryProcessing} value="sig">
                      Signature
                    </ToggleButton>
                    <ToggleButton disabled={queryProcessing} value="enc">
                      Key Exchange
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
              </Grid>
              <Box my={2}>
                <Paper>
                  <Box p={2} mb={2}>
                    <Box mb={2}>
                      <Typography variant="button">Select columns to display</Typography>
                    </Box>
                    <Box display="flex" justifyContent="center">
                      <ToggleButtonGroup
                        value={showColumns}
                        size="medium"
                        onChange={(_event, value) => setFilter({ showColumns: value })}
                      >
                        <ToggleButton disabled={queryProcessing} value="storage">
                          <Tooltip title="Size of keys and ciphertext/signature">
                            <div>Sizes</div>
                          </Tooltip>
                        </ToggleButton>
                        <ToggleButton disabled={queryProcessing} value="benchmarks">
                          <Tooltip title="Timings for cryptographic operations">
                            <div>Benchmarks</div>
                          </Tooltip>
                        </ToggleButton>
                        <ToggleButton
                          disabled={queryProcessing || !showColumns.includes('benchmarks')}
                          value="hw_features"
                        >
                          <Tooltip title="Hardware features required by the implementation">
                            <div>Hardware Features</div>
                          </Tooltip>
                        </ToggleButton>
                        <ToggleButton
                          disabled={queryProcessing || !showColumns.includes('benchmarks')}
                          value="code_size"
                        >
                          <Tooltip title="Code size required by the implementation">
                            <div>Code Size</div>
                          </Tooltip>
                        </ToggleButton>
                        <ToggleButton
                          disabled={queryProcessing || !showColumns.includes('benchmarks')}
                          value="memory_req"
                        >
                          <Tooltip title="Memory used by the functions at runtime">
                            <div>Memory Requirements</div>
                          </Tooltip>
                        </ToggleButton>
                        <ToggleButton disabled={queryProcessing} value="security_levels">
                          <Tooltip title="Security level in bits (classical/quantum)">
                            <div>Security Levels</div>
                          </Tooltip>
                        </ToggleButton>
                        <ToggleButton disabled={queryProcessing} value="nist_category">
                          <Tooltip title="NIST security level (1-5)">
                            <div>NIST Category</div>
                          </Tooltip>
                        </ToggleButton>
                        <ToggleButton disabled={queryProcessing} value="nist_round">
                          <Tooltip title="Round of the NIST PQC standardization">
                            <div>NIST Round</div>
                          </Tooltip>
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  </Box>
                </Paper>
                <Grid container justify="space-between" spacing={1}>
                  <Grid item xs>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="button">Filter parameter sets</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={3} justify="space-between">
                          <Grid container item direction="column" xs>
                            <Grid container item spacing={2}>
                              <Grid item xs={3} style={{ minWidth: 80 }}>
                                <Box><Typography>Classical Security</Typography></Box>
                              </Grid>
                              <Grid item xs style={{ minWidth: 150 }}>
                                <Slider
                                  disabled={queryProcessing}
                                  color="secondary"
                                  defaultValue={securityLevel}
                                  step={16}
                                  min={0}
                                  max={256}
                                  marks={secLevelMarks}
                                  track="inverted"
                                  onChangeCommitted={
                                      (e, v) => setFilter({ securityLevel: v })
                                    }
                                  valueLabelDisplay="auto"
                                />
                              </Grid>
                            </Grid>
                            <Grid container item spacing={2}>
                              <Grid item xs={3} style={{ minWidth: 80 }}>
                                <Typography>Quantum Security</Typography>
                              </Grid>
                              <Grid item xs style={{ minWidth: 150 }}>
                                <Slider
                                  disabled={queryProcessing}
                                  color="secondary"
                                  defaultValue={securityQuantum}
                                  step={16}
                                  min={0}
                                  max={256}
                                  marks={secLevelMarks}
                                  track="inverted"
                                  onChangeCommitted={
                                      (e, v) => setFilter({ securityQuantum: v })
                                    }
                                  valueLabelDisplay="auto"
                                />
                              </Grid>
                            </Grid>
                            <Grid container item spacing={2}>
                              <Grid item xs={3} style={{ minWidth: 80 }}>
                                <Typography>NIST Round</Typography>
                              </Grid>
                              <Grid item xs style={{ minWidth: 150 }}>
                                <Slider
                                  disabled={queryProcessing}
                                  color="secondary"
                                  defaultValue={getNistRoundValue(nistRound)}
                                  step={null}
                                  min={2}
                                  max={6}
                                  marks={nistRoundMarks}
                                  track="inverted"
                                  onChangeCommitted={(e, v) => setFilter({
                                    nistRound: getNistRoundLabel(v),
                                  })}
                                  valueLabelFormat={getNistRoundLabel}
                                  valueLabelDisplay="auto"
                                />
                              </Grid>
                            </Grid>
                            <Grid item>
                              <FormControlLabel
                                control={(
                                  <Checkbox
                                    disabled={queryProcessing}
                                    defaultChecked={showNonNistSchemes}
                                    onChange={() => setFilter({
                                      showNonNistSchemes: !showNonNistSchemes,
                                    })}
                                  />
                                  )}
                                label="Include schemes not in the NIST competition"
                              />
                            </Grid>
                          </Grid>
                          <Grid item>
                            <SchemeCheckboxList
                              list={schemesList}
                              checkedList={checkedSchemes}
                              onChange={(newChecked) => setFilter({
                                checkedSchemes: newChecked,
                              })}
                            />
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                  <Grid item>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="button">Filter implementations</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <FormControl component="fieldset">
                          <FormControlLabel
                            control={(
                              <Checkbox
                                disabled={queryProcessing || !showColumns.includes('benchmarks')}
                                defaultChecked={showRef}
                                onChange={() => setFilter({ showRef: !showRef })}
                              />
                              )}
                            label="Include 'ref' Implementations"
                          />
                          <TextField
                            disabled={queryProcessing || !showColumns.includes('benchmarks')}
                            defaultValue={platformFilter}
                            color="secondary"
                            label="Platform"
                            variant="outlined"
                            onChange={(e) => {
                              clearTimeout(platformFilterTimeout);
                              const filterValue = e.target.value;
                              platformFilterTimeout = setTimeout(() => {
                                platformFilterTimeout = null;
                                setFilter({ platformFilter: filterValue });
                              }, 750);
                            }}
                          />
                        </FormControl>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>

                </Grid>
              </Box>
              <Link
                component={RouterLink}
                to={`/raw_sql?query=${encodeURIComponent(expandedQuery)}`}
              >
                View this query as SQL
              </Link>
            </Box>
          </Paper>
        </Container>
      </Grid>
      <Grid container item>
        <Container maxWidth={false} disableGutters>
          <Paper>
            <Box p={2} display="flex" justifyContent="center">
              <QueryTable
                onChangeOrder={onChangeOrder}
                order={order}
                orderBy={orderBy}
                queryResult={queryResult}
                formatFunctions={getFormatFunctions(queryResult)}
                headers={headerSections.headers}
                headerSpans={headerSections.headerSpans}
              />
            </Box>
          </Paper>
        </Container>
      </Grid>
    </Grid>
  );
}

export default SchemeComparison;
