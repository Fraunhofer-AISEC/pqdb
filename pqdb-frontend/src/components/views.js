import React from 'react';
import {
    Grid, Box, Paper, TextField, Button,
    Table, TableHead, TableRow, TableCell, TableContainer, TableBody, TableSortLabel
} from '@material-ui/core';

function comparator(a, b, orderBy, isAsc) {
    if (b[orderBy] < a[orderBy]) {
        return isAsc ? 1 : -1;
    }
    if (b[orderBy] > a[orderBy]) {
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
        this.queryResult = props.queryResult;
        this.state = {
            orderBy: null,
            order: 'asc'
        };
    }

    handleRequestSort(property) {
        const isAsc = this.state.orderBy === property && this.state.order === 'asc';
        this.setState({
            order: isAsc ? 'desc' : 'asc',
            orderBy: property
        });
    }

    render() {
        const { order, orderBy } = this.state;
        if (!this.queryResult) return null;

        return (
            <TableContainer component={Paper}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            {
                                this.queryResult.columns.map((column, idx) =>
                                    <TableCell key={idx}>
                                        <TableSortLabel
                                            active={orderBy === idx}
                                            direction={orderBy === idx ? order : 'asc'}
                                            onClick={(e) => this.handleRequestSort(idx)}>
                                            {column}
                                        </TableSortLabel>
                                    </TableCell>
                                )
                            }
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {
                            sortedRows(this.queryResult.values, orderBy, order === 'asc').map(
                                (row) => (
                                    <TableRow key={row[1]}>
                                        {
                                            row[0].map((val, j) => <TableCell key={j}>{val}</TableCell>)
                                        }
                                    </TableRow>
                                )
                            )
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }
}

class CustomSQLQuery extends React.Component {
    constructor(props) {
        super(props);
        this.db = props.db;
        this.state = {
            sqlInput: "",
            executedSqlQuery: "",
            queryResult: null,
            error: null,
        }
    }

    executeSQLQuery() {
        var sqlQuery = this.state.sqlInput;
        try {
            var results = this.db.exec(sqlQuery)[0];
            this.setState({ queryResult: results, error: null, executedSqlQuery: sqlQuery });
        } catch (error) {
            this.setState({ queryResult: null, error: error, executedSqlQuery: sqlQuery });
        }
    }

    render() {
        return (
            <Grid container direction="column" spacing={2}>
                <Grid item>
                    <Paper>
                        <Box p={2}>
                            <Grid container direction="column" spacing={3}>
                                <Grid item>
                                    <TextField
                                        label="SQL Query"
                                        multiline
                                        fullWidth
                                        margin="normal"
                                        rows={6}
                                        variant="outlined"
                                        error={this.state.error != null}
                                        helperText={this.state.error ? this.state.error.toString() : ""}
                                        value={this.state.sqlInput}
                                        onChange={e => this.setState({ sqlInput: e.target.value })}
                                    />
                                </Grid>
                                <Grid item>
                                    <Box display='flex' justifyContent="center">
                                        <Button variant="contained" color="primary"
                                            onClick={this.executeSQLQuery.bind(this)}>Run Query</Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper>
                        <Box p={2} display='flex' justifyContent="center">
                            <QueryTable key={this.state.executedSqlQuery} queryResult={this.state.queryResult} />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        );
    }
}

export { CustomSQLQuery };
