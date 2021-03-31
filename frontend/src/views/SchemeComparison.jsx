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
  Tooltip,
  Typography,
} from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import qs from 'query-string';

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
      AND (nist_round BETWEEN ? AND '3f' ${(nonNist) ? 'OR nist_round = \'none\'' : ''})
  `;
  const schemesList = queryAll(db, schemesListQuery, [type, nistRound]);
  return schemesList.map((row) => row.id_text);
}

const secLevelMarks = [
  { label: '0', value: 0 }, { label: '128', value: 128 }, { label: '64', value: 64 },
  { label: '192', value: 192 }, { label: '256+', value: 256 },
];

const nistRoundMarks = [
  { label: '2', value: 2 }, { label: '3a', value: 3 }, { label: '3f', value: 4 },
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
      s.nist_round BETWEEN ? AND '3f'${
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
  });
  return formatFunctions;
}

class SchemeComparison extends React.Component {
  constructor(props) {
    super(props);
    const { history, db } = props;
    this.platformFilterTimeout = null;
    this.fullSchemeLists = {
      enc: schemesListQueryDB(db, 'enc', '0', true),
      sig: schemesListQueryDB(db, 'sig', '0', true),
    };
    this.state = {
      queryProcessing: true,
      queryResult: undefined,
      schemesList: [],
      query: 'null',
      headers: [],
      headerSpans: [],
    };

    this.defaultState = {
      // not shown: 'storage', 'security_levels', 'nist_round', 'code_size'
      showColumns: ['benchmarks', 'hw_features', 'nist_category'],
      schemeType: 'sig',
      platformFilter: '',
      sliderValue: 128,
      securityLevel: 128,
      securityQuantum: 0,
      showRef: false,
      nistRound: '3a',
      showNonNistSchemes: false,
      order: 'asc',
      orderBy: null,
      checkedSchemes: null,
    };
    Object.assign(this.state, this.defaultState);
    const params = qs.parse(history.location.search);
    if ('state' in params) {
      try {
        const paramState = JSON.parse(params.state);
        Object.assign(this.state, paramState);
      } catch {
        // JSON state was invalid -> ignore
      }
    }
    const { checkedSchemes, schemeType } = this.state;
    if (!checkedSchemes) {
      this.state.checkedSchemes = this.fullSchemeLists[schemeType];
    }
  }

  componentDidMount() {
    const { checkedSchemes } = this.state;
    this.updateResult(!checkedSchemes, false);
    document.title = 'Scheme Comparison - pqdb';
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      queryProcessing, schemeType, order, orderBy,
    } = this.state;
    if (queryProcessing) {
      const resetChecked = prevState.schemeType !== schemeType;
      setTimeout(() => {
        this.updateResult(resetChecked, true);
        this.updateSearchParams(false);
      }, 300);
    } else if (prevState.order !== order || prevState.orderBy !== orderBy) {
      this.updateSearchParams(true);
    }
  }

  setFilterState(change) {
    this.setState({ queryProcessing: true, ...change });
  }

  expandQuery() {
    // UNSAFE, DO NOT USE
    // this is very hacky and unreliable - we just use it here to generate
    // an expanded string that is returned back to the user, so there is no
    // injection possibility, and no real harm results when it goes wrong.

    const params = prepareParams(this.state).slice();
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

    const { query } = this.state;
    const sqlQuery = query.replaceAll('?', replacer);
    if (error && params.length > 0) {
      return '';
    }
    return sqlQuery;
  }

  computeResult(state, sqlQuery) {
    const { db } = this.props;
    const params = prepareParams(state);
    const results = queryAllAsArray(db, sqlQuery, params);
    if (results.values.length === 0) return undefined;
    results.columns.shift(); // Remove the 'ID' column name
    results.values.forEach((res) => {
      res[1] = <Link component={RouterLink} to={detailLink(res[0])}>{res[1]}</Link>;
      res.shift(); // Remove the 'ID' entry
    });

    return results;
  }

  updateResult(resetChecked, resetOrder) {
    const queryState = { ...this.state };
    const { db } = this.props;
    const { schemeType, nistRound, showNonNistSchemes } = this.state;
    const schemesList = schemesListQueryDB(db, schemeType, nistRound, showNonNistSchemes);
    if (resetChecked) queryState.checkedSchemes = this.fullSchemeLists[schemeType];
    const query = buildQuery(queryState);
    const queryResult = this.computeResult(queryState, query);
    let change = Object.assign(createHeaderSections(queryState), {
      queryProcessing: false, queryResult, schemesList, query,
    });
    if (resetChecked) change.checkedSchemes = this.fullSchemeLists[schemeType];
    if (resetOrder) change = Object.assign(change, { order: 'asc', orderBy: null });
    this.setState(change);
  }

  updateSearchParams(replace) {
    const searchParam = {};
    const { schemeType } = this.state;
    this.defaultState.checkedSchemes = this.fullSchemeLists[schemeType];
    Object.keys(this.defaultState).forEach((key) => {
      // eslint-disable-next-line react/destructuring-assignment
      const value = this.state[key];
      if (Array.isArray(this.defaultState[key]) && Array.isArray(value)) {
        if (not(this.defaultState[key], value).length > 0
         || not(value, this.defaultState[key]).length > 0) {
          searchParam[key] = value;
        }
      } else if (value !== this.defaultState[key]) {
        searchParam[key] = value;
      }
    });
    const searchParamStr = JSON.stringify(searchParam);
    const historyParams = [
      null, null, (searchParamStr === '{}') ? '?' : `?${qs.stringify({ state: searchParamStr })}`,
    ];
    if (replace) window.history.replaceState(...historyParams);
    else window.history.pushState(...historyParams);
  }

  render() {
    const expandedQuery = this.expandQuery();
    const {
      checkedSchemes, headers, headerSpans, nistRound, order, orderBy, platformFilter,
      queryProcessing, queryResult, securityLevel, securityQuantum, schemesList, schemeType,
      showColumns, showNonNistSchemes, showRef,
    } = this.state;
    return (
      <Grid container direction="column" spacing={2}>
        <Grid item>
          <Container maxWidth="md">
            <Paper>
              <Box p={2}>
                <Grid justify="space-between" spacing={2} container direction="row">
                  <Grid item>
                    <Typography variant="h4">Scheme Comparison</Typography>
                  </Grid>
                  <Grid item>
                    <ToggleButtonGroup
                      value={schemeType}
                      exclusive
                      size="medium"
                      onChange={(_event, value) => {
                        if (value !== null) this.setFilterState({ schemeType: value });
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
                          onChange={(_event, value) => this.setFilterState({ showColumns: value })}
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
                                      (e, v) => this.setFilterState({ securityLevel: v })
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
                                      (e, v) => this.setFilterState({ securityQuantum: v })
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
                                    max={4}
                                    marks={nistRoundMarks}
                                    track="inverted"
                                    onChangeCommitted={(e, v) => this.setFilterState({
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
                                      onChange={() => this.setFilterState({
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
                                onChange={(newChecked) => this.setFilterState({
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
                                  onChange={
                                    () => this.setFilterState({ showRef: !showRef })
                                  }
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
                                clearTimeout(this.platformFilterTimeout);
                                const filterValue = e.target.value;
                                this.platformFilterTimeout = setTimeout(() => {
                                  this.platformFilterTimeout = null;
                                  this.setFilterState({ platformFilter: filterValue });
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
                  onChangeOrder={(newOrder, newOrderBy) => this.setState({
                    order: newOrder, orderBy: newOrderBy,
                  })}
                  order={order}
                  orderBy={orderBy}
                  queryResult={queryResult}
                  formatFunctions={getFormatFunctions(queryResult)}
                  headers={headers}
                  headerSpans={headerSpans}
                />
              </Box>
            </Paper>
          </Container>
        </Grid>
      </Grid>
    );
  }
}

SchemeComparison.propTypes = {
  db: PropTypes.shape({
    prepare: PropTypes.func.isRequired,
  }).isRequired,
  history: PropTypes.shape({
    location: PropTypes.shape({
      search: PropTypes.string.isRequired,
    }),
  }).isRequired,
};

export default SchemeComparison;
