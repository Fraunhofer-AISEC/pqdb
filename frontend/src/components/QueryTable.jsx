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
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import React from 'react';
import md5 from 'md5';
import withStyles from '@mui/styles/withStyles';

import DownloadTableButton from './DownloadTableButton';

const propTypes = {
  formatFunctions: PropTypes.arrayOf(PropTypes.func),
  headers: PropTypes.arrayOf(PropTypes.string.isRequired),
  headerSpans: PropTypes.arrayOf(PropTypes.number.isRequired),
  onChangeOrder: PropTypes.func,
  orderBy: PropTypes.number,
  order: PropTypes.oneOf(['asc', 'desc']),
  queryResult: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    values: PropTypes.arrayOf(PropTypes.array.isRequired).isRequired,
  }),
};

const defaultProps = {
  formatFunctions: null,
  headers: [],
  headerSpans: [],
  onChangeOrder: null,
  order: 'asc',
  orderBy: null,
  queryResult: null,
};

// Variables for coloring properly
function styleTableCell(a, b) {
  return withStyles((theme) => {
    const cellBgColors = (theme.palette.mode === 'dark') ? [
      ['#303030', '#414141'],
      ['#3a3a3a', '#575757'],
    ] : [
      ['#ffffff', '#eeeeee'],
      ['#f5f5f5', '#d8d8d8'],
    ];
    return {
      head: {
        backgroundColor: cellBgColors[a][b],
      },
      body: {
        backgroundColor: cellBgColors[a][b],
      },
    };
  })(TableCell);
}
const styledCells = [0, 1].map((a) => ([0, 1].map((b) => styleTableCell(a, b))));

function comparator(a, b, orderBy, isAsc) {
  let x = a[orderBy];
  let y = b[orderBy];
  if (React.isValidElement(x)) x = x.props.children;
  if (React.isValidElement(y)) y = y.props.children;
  if (y < x) {
    return isAsc ? 1 : -1;
  }
  if (y > x) {
    return isAsc ? -1 : 1;
  }
  return 0;
}

function sortedRows(array, orderBy, isAsc) {
  const indexedRows = array.map((row, index) => [row, index]);
  if (orderBy === null) return indexedRows;
  indexedRows.sort((a, b) => {
    const order = comparator(a[0], b[0], orderBy, isAsc);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return indexedRows;
}

class QueryTable extends React.Component {
  constructor(props) {
    super(props);
    this.resultHash = 'null';
  }

  componentDidUpdate() {
    const { queryResult } = this.props;
    this.resultHash = (queryResult) ? md5(JSON.stringify(queryResult)) : 'null';
  }

  handleRequestSort(property) {
    const { onChangeOrder, orderBy, order } = this.props;
    if (!onChangeOrder) { return; }
    const isAsc = orderBy === property && order === 'asc';
    onChangeOrder(isAsc ? 'desc' : 'asc', property);
  }

  createKey(str) {
    return this.resultHash + str;
  }

  headerModVal(idx) {
    const { headerSpans } = this.props;
    if (!headerSpans.length) return 0;
    const headerPositions = headerSpans.reduce(
      (prev, cur) => prev.concat([cur + prev[prev.length - 1]]),
      [0],
    );
    return (headerPositions.findIndex((e) => idx < e) - 1) % 2;
  }

  render() {
    const {
      queryResult, formatFunctions, headers, headerSpans, order, orderBy,
    } = this.props;
    if (headerSpans.length !== headers.length) { throw new Error('A span needs to be specified for each header.'); }
    if (queryResult === undefined) return <Typography>No results</Typography>;
    if (!queryResult) return null;
    return (
      <Grid direction="column" alignItems="flex-end" spacing={1} container>
        <Grid container item>
          <TableContainer component={Paper} style={{ maxHeight: 850 }}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                {
                  headers.length > 0 && (
                    <TableRow>
                      {
                          headers.map((name, idx) => {
                            const StyledTableCell = styledCells[1][idx % 2];
                            return (
                              <StyledTableCell
                                key={name}
                                align="center"
                                colSpan={headerSpans[idx]}
                              >
                                {name}
                              </StyledTableCell>
                            );
                          })
                        }
                    </TableRow>
                  )
                }
                <TableRow>
                  {
                    queryResult.columns.map((column, idx) => {
                      const StyledTableCell = styledCells[1][this.headerModVal(idx)];
                      return (
                        <StyledTableCell
                          key={this.createKey(column + idx)}
                          style={{
                            top: headers.length > 0 ? 57 : 0, // So headers don't collapse on scroll
                          }}
                        >
                          <TableSortLabel
                            active={orderBy === idx}
                            direction={orderBy === idx ? order : 'asc'}
                            onClick={() => this.handleRequestSort(idx)}
                          >
                            {column}
                          </TableSortLabel>
                        </StyledTableCell>
                      );
                    })
                  }
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  sortedRows(queryResult.values, orderBy, order === 'asc').map(
                    (row, idx) => (
                      <TableRow key={this.createKey(row[1])}>
                        {
                          row[0].map(
                            (val, j) => {
                              let value = val;
                              if (formatFunctions && formatFunctions[j]) {
                                value = formatFunctions[j](val);
                              }
                              const StyledTableCell = styledCells[idx % 2][this.headerModVal(j)];
                              return (
                                <StyledTableCell
                                  key={this.createKey(`${row[1]}-${j}`)}
                                >
                                  {value}
                                </StyledTableCell>
                              );
                            },
                          )
                        }
                      </TableRow>
                    ),
                  )
                }
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item><DownloadTableButton queryResult={queryResult} /></Grid>
      </Grid>
    );
  }
}

QueryTable.propTypes = propTypes;
QueryTable.defaultProps = defaultProps;

export default QueryTable;
