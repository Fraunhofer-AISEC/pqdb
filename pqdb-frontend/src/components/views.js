import React from 'react';
import {
    Grid, Box, Paper, TextField, Button,
    Table, TableHead, TableRow, TableCell, TableContainer, TableBody
} from '@material-ui/core';

function QueryTable(props) {
    if (!props.queryResult) return null;
    return (
        <TableContainer component={Paper}>
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        {
                            props.queryResult.columns.map(column => <TableCell>{column}</TableCell>)
                        }
                    </TableRow>
                </TableHead>
                <TableBody>
                    {props.queryResult.values.map((row) => (
                        <TableRow>
                            {
                                row.map(val => <TableCell>{val}</TableCell>)
                            }
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

class CustomSQLQuery extends React.Component {
    constructor(props) {
        super(props);
        this.db = props.db;
        this.state = {
            sqlQuery: "",
            queryResult: null,
            error: null,
        }
    }

    executeSQLQuery() {
        try {
            var results = this.db.exec(this.state.sqlQuery)[0];
            console.log(results);
            this.setState({ queryResult: results, error: null });
        } catch (e) {
            this.setState({ queryResult: null, error: e });
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
                                        value={this.state.sqlQuery}
                                        onChange={e => this.setState({ sqlQuery: e.target.value })}
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
                            <QueryTable queryResult={this.state.queryResult} />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        );
    }
}

export { CustomSQLQuery };
