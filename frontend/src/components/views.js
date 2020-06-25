import React, { useState } from 'react';
import {
    Grid, Box, Paper, TextField, Button, Typography, Link, Container, List, ListItem, ListItemText, ListItemIcon,
    Table, TableHead, TableRow, TableCell, TableContainer, TableBody, TableSortLabel, Popper, MenuList,
    MenuItem, Grow, ClickAwayListener, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, SvgIcon, Tooltip,
} from '@material-ui/core';
import CategoryIcon from '@material-ui/icons/Category';
import CodeIcon from '@material-ui/icons/Code';
import DiffieHellmanIcon from '@material-ui/icons/SyncAlt';
import EncryptionIcon from '@material-ui/icons/LockOutlined';
import EventIcon from '@material-ui/icons/Event';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import LinkIcon from '@material-ui/icons/Link';
import ParamSetIcon from '@material-ui/icons/Tune';
import PeopleIcon from '@material-ui/icons/PeopleAlt';
import SaveIcon from '@material-ui/icons/Save';
import SecurityIcon from '@material-ui/icons/Security';
import SignatureIcon from '@material-ui/icons/Create';
import qs from 'query-string';
import genCSV from 'csv-stringify';
import { GlassMagnifier } from "react-image-magnifiers";

import diagramImage from '../tables.svg';

import { queryAll, BookIcon as SourceIcon, PodiumIcon } from '../utils';

const Comment = function (props) {
    if ( props.title === undefined || props.title === null || props.title === '' )
        return null;

    return [
      '\u2002',
      <Tooltip interactive title={props.title} placement="right" arrow>
        <span>&#x1f6c8;</span>
      </Tooltip>
    ];
}

const TextComment = function (props) {
    return ["\u{1f6c8}", <em {...props}> { props.children } </em> ];
}

const PropItem = function (props) {
    let ItemIcon = props.icon;
    return <ListItem key={ props.k } alignItems="flex-start">
        <ListItemIcon>
            { props.hasOwnProperty('title') ?
                <Typography component="h2" variant="inherit">
                    <Tooltip title={ props.title } arrow>
                        <ItemIcon titleAccess={ props.title } />
                    </Tooltip>
                </Typography>
                :
                <ItemIcon />
            }
        </ListItemIcon>
        <ListItemText>
            { props.children }
        </ListItemText>
    </ListItem>
}

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
                            This is the frontend presenting data from <Link href="https://github.com/cryptoeng/pqdb/">https://github.com/cryptoeng/pqdb/</Link>. You can select different views by clicking the menu icon in the top left corner.
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

function DatabaseDiagram() {
    return <GlassMagnifier
        imageSrc={diagramImage}
        square={true}
        magnifierSize='25%'
        allowOverflow={true}
    />
};

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
                        <ExpansionPanel>
                            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                Database Diagram
                                </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <DatabaseDiagram />
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                    </Container>
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

class SchemeDetail extends React.Component {
    types = {
        enc: {
            name: "Encryption Scheme",
            icon: EncryptionIcon,
        },
        sig: {
            name: "Signature Scheme",
            icon: SignatureIcon,
        }
    }
    sec_notions = {
        "IND-CCA": "Indistinguisability under an adaptive Chosen Ciphertext Attack",
        "IND-CPA": "Indistinguisability under an adaptive Chosen Plaintext Attack",
        "EUF-CMA": "Existential Unforgeability under a Chosen Message Attack",
        "SUF-CMA": "Strong Existential Unforgeability under a Chosen Message Attack",
    }

    constructor(props) {
        super(props);
        this.db = props.db;
        this.params = qs.parse(this.props.history.location.search);

        // TODO: use path not query string
        var path = this.params['_'] ?? '';

        this.state = {
            path: path
        }
    }

    renderOverview () {
        var stmt = "SELECT id, name FROM scheme WHERE type=? ORDER BY name;";

        return (
            <Grid container justify="center" spacing={2} maxWidth="md">
                {Object.keys(this.types).map(type => (
                <Grid item>
                    <Paper>
                        <Box p={4}>
                            <Typography variant="h6">{ this.types[type].name }s</Typography>
                            <List>
                                {queryAll(this.db, stmt, [type]).map(s => (
                                    <ListItem key={s.id}><ListItemText>
                                        <Link href={"?_=" + type + "/" + s.id}>{s.name}</Link>
                                    </ListItemText></ListItem>
                                ))}
                            </List>
                        </Box>
                    </Paper>
                </Grid>
                ))}
            </Grid>
        );
    }

    renderScheme (type, id) {
        let db = this.db; // `this` is overriden inside `map`s and the like

        const s = queryAll(this.db, "SELECT * FROM scheme WHERE type=? AND id=?", [type, id])[0];
        if ( s === undefined ) {
            return <Container><Paper>No such scheme.</Paper></Container>;
        }

        const authors = queryAll(db, "SELECT * FROM scheme_author WHERE scheme_id=?", [id]);
        const problems = queryAll(db, "SELECT * FROM scheme_problem WHERE scheme_id=?", [id]);
        const links = queryAll(db, "SELECT * FROM scheme_link WHERE scheme_id=?", [id]);
        const sources = queryAll(db, "SELECT * FROM scheme_source WHERE scheme_id=?", [id]);
        const flavors = queryAll(db, "SELECT * FROM flavor WHERE scheme_id=?", [id]);

        let TypeIcon = this.types[s.type].icon;
        return [
            <Container maxWidth="md">
            <Paper>
            <Box>
                <List>
                    <ListItem key="head" alignItems="flex-start">
                        <ListItemIcon>
                            <Typography component="span" variant="h2">
                                <Tooltip title={ this.types[s.type].name } arrow>
                                    { <TypeIcon fontSize="large" titleAccess={ this.types[s.type].name } /> }
                                </Tooltip>
                            </Typography>
                        </ListItemIcon>
                        <ListItemText>
                            <Typography component="h1" variant="h2">
                                { s.name }
                            </Typography>
                            { s.comment && <div><TextComment>{ s.comment }</TextComment></div> }
                        </ListItemText>
                    </ListItem>

                    <PropItem k="category" title="Category" icon={ CategoryIcon }>
                        { s.category } based <Comment title={s.category_comment} />
                    </PropItem>

                { s.stateful === true && (
                    <PropItem k="stateful" icon={ SaveIcon }>
                        stateful <Comment title={s.stateful_comment} />
                    </PropItem>)
                }
                    <PropItem k="nist_round" icon={ PodiumIcon }>
                        { ["Not submitted to the NIST standardization",
                           "Reached Round 1 of the NIST standardization",
                           "In Round 2 of the NIST standardization"][s.nist_round] }
                    </PropItem>

                    <PropItem k="year" title="Year" icon={ EventIcon }>
                        {
                            [
                                s.year_paper === null ? [] :
                                    [s.year_paper, <span style={{opacity:.5}}> (paper)</span>],
                                s.year_candidate === null ? [] :
                                    [s.year_candidate, <span style={{opacity:.5}}> (NIST candidate)</span>],
                                s.year_standardization === null ? [] :
                                    [s.year_standardization, <span style={{opacity:.5}}> (standardization)</span>],
                                s.year_comment === null ? [] :
                                    <em>{ s.year_comment }</em>,
                            ].reduce((accu, elem) => { /* join(), but skipping empty entries */
                                return !elem.length ? accu : !accu.length ? [elem] :
                                    [...accu, " \u2022 ", elem]}, []
                            )
                        }
                    </PropItem>

                    <PropItem k="problems_trust" icon={ SecurityIcon }>
                        { [
                            s.trust_comment && [
                                <div><strong>Trust: </strong></div>,
                                <div style={{ marginBottom: ".6em" }}>{ s.trust_comment }</div>
                            ],
                            ( problems.length > 0 || s.problems_comment ) && [
                                <div><strong>Problems:</strong></div>,
                                s.problems_comment && <div><TextComment>{ s.problems_comment }</TextComment></div>,
                                problems.map(p => <div>{ p.assumption } <Comment title={ p.comment } /></div>),
                            ]
                        ] }
                    </PropItem>

                    <PropItem k="authors" title="Authors" icon={ PeopleIcon }>
                        { authors.map(a => <div>{ a.name }</div>) }
                    </PropItem>

                    { /* TODO: make links links (maybe altering the db scheme, let's see) */ }
                    { links.length > 0 &&
                    <PropItem k="links" title="Links" icon={ LinkIcon }>
                        { links.map(l => <div>{ l.url }</div>) }
                    </PropItem> }

                    { sources.length > 0 &&
                    <PropItem k="sources" title="Sources" icon={ SourceIcon }>
                        { sources.map(s => <div>{ s.url }</div>) }
                    </PropItem> }


                    <ListItem key="flavors">
                        <Typography component="h2" variant="h4">Flavors</Typography>
                    </ListItem>

                    { flavors.map((function (f) {
                        const f_paramsets = queryAll(db, "SELECT name FROM paramset WHERE flavor_id=?", [f.id]);
                        const f_implementations = queryAll(db, "SELECT name FROM implementation WHERE flavor_id=?", [f.id]);
                        const f_links = queryAll(db, "SELECT * FROM flavor_link WHERE flavor_id=?", [f.id]);
                        const f_sources = queryAll(db, "SELECT * FROM flavor_source WHERE flavor_id=?", [f.id]);

                        return [
                        <ListItem key={ "flavor-" + f.id + "-head" } style={{ display: "block" }}>
                            <Typography component="h3" variant="h5">{ f.name }</Typography>
                            { f.comment && <div><TextComment>{ f.comment }</TextComment></div> }
                        </ListItem>,

                        f.type != "SIG" && // there's just one type for signatures, not worth showing this here
                        <PropItem k={ "flavor-" + f.id + "-type" } title="API Type" icon={ CategoryIcon }>
                            { f.type } <Comment title={ f.type_comment } />
                        </PropItem>,

                        <PropItem k={ "flavor-" + f.id + "-securitynotion" } title="Security Notion" icon={ SecurityIcon }>
                            <Tooltip title={ this.sec_notions[f.security_notion] }>
                                <span>{ f.security_notion }</span>
                            </Tooltip>
                            <Comment title={ f.security_notion_comment } />
                        </PropItem>,

                        f.dh_ness && (
                        <PropItem k={ "flavor-" + f.id + "-dhness" } title="Diffie-Hellman-Ness" icon={ DiffieHellmanIcon }>
                            <strong>Diffie-Hellman-Ness: </strong>
                            { f.dh_ness }
                        </PropItem>
                        ),

                        <PropItem k={ "flavor-" + f.id + "-paramsets" } title="Parameter sets" icon={ ParamSetIcon }>
                            { f_paramsets.map(p => <div>{ p.name }</div>) }
                        </PropItem>,

                        <PropItem k={ "flavor-" + f.id + "-implementations" } title="Implementations" icon={ CodeIcon }>
                            { f_implementations.map(i => <div>{ i.name }</div>) }
                        </PropItem>,

                        f_links.length > 0 &&
                        <PropItem k={ "flavor-" + f.id + "-links" } title="Links" icon={ LinkIcon }>
                            { f_links.map(l => <div>{ l.url }</div>) }
                        </PropItem>,

                        f_sources.length > 0 &&
                        <PropItem k={ "flavor-" + f.id + "-sources" } title="Sources" icon={ SourceIcon }>
                            { f_sources.map(s => <div>{ s.url }</div>) }
                        </PropItem>,
                    ] } ).bind(this)) }
                </List>
            </Box>
            </Paper>
            </Container>,
        ];
    }

    render () {
        let comp = this.state.path.split('/');

        if ( comp.length === 1 && comp[0] === '' )
            return this.renderOverview();

        if ( comp.length > 1 && ! (comp[0] in this.types) ) {
            // TODO error
            return "invalid url, must be enc or sig"
        }
        if ( comp.length === 1 ) {
            return "invalid url, go up"
            // TODO redirect to /
        }

        if ( comp.length === 2 ) {
            return this.renderScheme(...comp)
        }
    }
}

export { CustomSQLQuery, SchemeDetail, Welcome };
