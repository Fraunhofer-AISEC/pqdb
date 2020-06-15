import React, { useState } from 'react';
import {
    Grid, Box, Paper, TextField, Button, Typography, Link, Container, List, ListItem, ListItemText,
    Table, TableHead, TableRow, TableCell, TableContainer, TableBody, TableSortLabel, Popper, MenuList,
    MenuItem, Grow, ClickAwayListener
} from '@material-ui/core';
import { AccountTree as DiagramIcon } from '@material-ui/icons';
import qs from 'query-string';
import genCSV from 'csv-stringify';

function startDownload(content, filename) {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

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

const options = [".csv", ".json"];

function DownloadTableButton(props) {
    const [open, setOpen] = useState(false);
    const anchorRef = React.useRef(null);

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return;
        }

        setOpen(false);
    };

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleMenuItemClick = (event, index) => {
        if (index === 0) {
            genCSV([props.queryResult.columns, ...props.queryResult.values], (err, output) => {
                startDownload(output, "data.csv");
            });
        } else if (index === 1) {
            startDownload(JSON.stringify(props.queryResult, null, 2), "data.json");
        }
        setOpen(false);
    };

    return (
        <Box>
            <Button variant='outlined' ref={anchorRef} onClick={handleToggle}>Download as ...</Button>
            <Popper open={open} anchorEl={anchorRef.current} transition disablePortal>
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                        }}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList>
                                    {options.map((option, index) => (
                                        <MenuItem
                                            key={option}
                                            onClick={(event) => handleMenuItemClick(event, index)}
                                        >
                                            {option}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </Box>
    );

}

// As suggested in https://github.com/mui-org/material-ui/issues/1594#issuecomment-272547735
function AutoFocusTextField(props) {
    const inputRef = React.useRef();

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            inputRef.current.focus();
        }, 100);

        return () => {
            clearTimeout(timeout);
        };
    }, []);

    return <TextField inputRef={inputRef} {...props} />;
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
        if (this.queryResult === undefined) return <Typography>No results</Typography>;
        if (!this.queryResult) return null;

        return (
            <Grid direction='column' alignItems='flex-end' spacing={1} container>
                <Grid container item>
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
                </Grid>
                <Grid item><DownloadTableButton queryResult={this.queryResult} /></Grid>
            </Grid>
        );
    }
}

class Welcome extends React.Component {

    constructor(props) {
        super(props);
        this.db = props.db;
        this.state = {
            enc: [],
            sig: []
        };
    }

    componentDidMount() {
        var results = this.db.exec(
            "SELECT name FROM scheme WHERE type='enc' ORDER BY name;" +
            "SELECT name FROM scheme WHERE type='sig' ORDER BY name;"
        );
        var enc = results[0].values.map(row => row[0]);
        var sig = results[1].values.map(row => row[0]);
        this.setState({ enc: enc, sig: sig });
    }

    render() {
        return (
            <Container maxWidth="md">

                <Paper>
                    <Box p={4}>
                        <Typography variant="h4" gutterBottom>Welcome!</Typography>
                        <Typography paragraph>
                            This is the frontend presenting data from <Link href="https://github.com/cryptoeng/pqdb/">https://github.com/cryptoeng/pqdb/</Link>. You can select different views by clicking the menu icon in the top left corner. The automatically generated database scheme can be shown by clicking the <DiagramIcon fontSize='inherit' color='action' /> button at the bottom of the page.
                        </Typography>
                        <Typography paragraph>
                            The page is written in <Link href="https://reactjs.org/">React</Link> and operates purely client site by loading an <Link href="https://www.sqlite.org/">SQLite</Link> database (located <Link href="pqdb.sqlite">here</Link>) which is generated from the data in pqdb.
                        </Typography>
                        <Typography paragraph>
                            Contributions are warmly welcomed, see <Link href="https://github.com/cryptoeng/pqdb#contribute">here</Link> for details.
                        </Typography>

                        <Typography variant='h5' align='center'>Available Schemes</Typography>
                        <Box mt={1} />
                        <Grid container justify="space-evenly">
                            <Grid item>
                                <Paper>
                                    <Box p={4}>
                                        <Typography variant="h6">Encryption Schemes</Typography>
                                        <List>
                                            {this.state.enc.map(name => <ListItem key={name}><ListItemText>{name}</ListItemText></ListItem>)}
                                        </List>
                                    </Box>
                                </Paper>
                            </Grid>
                            <Grid item>
                                <Paper>
                                    <Box p={4}>
                                        <Typography variant="h6">Signature Schemes</Typography>
                                        <List>
                                            {this.state.sig.map(name => <ListItem key={name}><ListItemText>{name}</ListItemText></ListItem>)}
                                        </List>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Container>
        );
    }
}

class CustomSQLQuery extends React.Component {
    constructor(props) {
        super(props);
        this.db = props.db;
        this.params = qs.parse(this.props.history.location.search);
        this.runningQueryHandler = null;
        var sqlInput = ('query' in this.params) ? this.params['query'] : '';

        this.state = {
            sqlInput: sqlInput,
            executedSqlQuery: '',
            queryResult: null,
            error: null,
            queryProcessing: false
        }
    }

    componentDidMount() {
        if (this.state.sqlInput === '') return;

        var sqlQuery = this.state.sqlInput;
        this.setState({ queryProcessing: true });
        setTimeout(
            () => {
                try {
                    var results = this.db.exec(sqlQuery)[0];
                    this.setState({ queryResult: results, error: null, executedSqlQuery: sqlQuery, queryProcessing: false });
                } catch (error) {
                    this.setState({ queryResult: null, error: error, executedSqlQuery: sqlQuery, queryProcessing: false });
                }
            }, 0
        )
    }

    executeSQLQuery() {
        const history = this.props.history;
        this.params.query = this.state.sqlInput;
        var search = '?' + qs.stringify(this.params);
        if (history.location.search !== search) {
            history.push({
                pathname: history.location.pathname,
                search: search
            });
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
                                    <AutoFocusTextField
                                        label="SQL Query"
                                        multiline
                                        fullWidth
                                        margin="normal"
                                        rows={6}
                                        rowsMax={100}
                                        variant="outlined"
                                        error={this.state.error != null}
                                        helperText={this.state.error ? this.state.error.toString() : ""}
                                        value={this.state.sqlInput}
                                        onChange={e => this.setState({ sqlInput: e.target.value })}
                                    />
                                </Grid>
                                <Grid item>
                                    <Box display='flex' justifyContent="center">
                                        <Button variant="contained" color="primary" disabled={this.state.queryProcessing}
                                            onClick={() => this.executeSQLQuery()}>{(this.state.queryProcessing) ? "Computing..." : "Run Query"}</Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                </Grid>
                <Grid container item>
                    <Container maxWidth={false} disableGutters={true}>
                        <Paper>
                            <Box p={2} display='flex' justifyContent="center">
                                <QueryTable key={this.state.executedSqlQuery} queryResult={this.state.queryResult} />
                            </Box>
                        </Paper>
                    </Container>
                </Grid>
            </Grid>
        );
    }
}

export { CustomSQLQuery, Welcome };
