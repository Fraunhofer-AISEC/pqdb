import React, { div, useState } from 'react';
import { Link as RouterLink, Route, Switch, Redirect, useParams } from 'react-router-dom';
import {
    Grid, Box, Paper, TextField, Button, Typography, Link, Container, List, ListItem, ListItemText, ListItemIcon,
    Table, TableHead, TableRow, TableCell, TableContainer, TableBody, TableSortLabel, Popper, MenuList,
    MenuItem, Grow, ClickAwayListener, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, Tooltip,
    Checkbox, FormControlLabel, FormControl, Slider, Accordion, AccordionSummary, AccordionDetails
} from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import CategoryIcon from '@material-ui/icons/Category';
import CodeIcon from '@material-ui/icons/Code';
import ChipIcon from '@material-ui/icons/Memory';
import DiffieHellmanIcon from '@material-ui/icons/SyncAlt';
import EncryptionIcon from '@material-ui/icons/LockOutlined';
import EventIcon from '@material-ui/icons/Event';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import LanguageIcon from '@material-ui/icons/Translate';
import LinkIcon from '@material-ui/icons/Link';
import ParamSetIcon from '@material-ui/icons/Tune';
import PeopleIcon from '@material-ui/icons/PeopleAlt';
import SaveIcon from '@material-ui/icons/Save';
import SecurityIcon from '@material-ui/icons/Security';
import qs from 'query-string';
import genCSV from 'csv-stringify';
import { GlassMagnifier } from "react-image-magnifiers";
import Card from '@material-ui/core/Card';
import Divider from '@material-ui/core/Divider';
import { makeStyles } from '@material-ui/core/styles';


import diagramImage from '../tables.svg';

import { queryAll, BookIcon as SourceIcon, BottomIcon, CastleIcon, CounterIcon, MeasureIcon, PodiumIcon, SealIcon as SignatureIcon } from '../utils';

const SCHEME_TYPES = {
    enc: {
        name: "Key Exchange Scheme",
        icon: EncryptionIcon,
        ctsig: "ct",
        ct_sig: "Ciphertext",
        encsign: "enc",
        enc_sign: "Encrypt",
        decvrfy: "dec",
        dec_vrfy: "Decrypt",
    },
    sig: {
        name: "Signature Scheme",
        icon: SignatureIcon,
        ctsig: "sig",
        ct_sig: "Signature",
        encsign: "sign",
        enc_sign: "Sign",
        decvrfy: "vrfy",
        dec_vrfy: "Verify",
    }
}

const SEC_NOTIONS = {
    "IND-CCA": "Indistinguishability under an adaptive Chosen Ciphertext Attack",
    "IND-CPA": "Indistinguishability under an adaptive Chosen Plaintext Attack",
    "EUF-CMA": "Existential Unforgeability under a Chosen Message Attack",
    "SUF-CMA": "Strong Existential Unforgeability under a Chosen Message Attack",
}


const NIST_ROUNDS = {
    "none": { short: null, long: "Not submitted to the NIST standardization" },
    "1": { short: "round 1", long: "Reached Round 1 of the NIST standardization" },
    "2": { short: "round 2", long: "Reached Round 2 of the NIST standardization" },
    "3a": { short: "round 3 alternate", long: "Alternate Candidate in Round 3 of the NIST standardization" },
    "3f": { short: "round 3 finalist", long: "Finalist in Round 3 of the NIST standardization" },
}

const Comment = function (props) {
    if (props.title === undefined || props.title === null || props.title === '')
        return null;

    return [
        '\u2002',
        <Tooltip interactive title={props.title} placement="right" arrow>
            <InfoIcon fontSize="inherit" style={{ cursor: "help" }} />
        </Tooltip>
    ];
}

const MaybeTooltip = function (props) {
    if (props.title === undefined || props.title === null || props.title === '')
        return props.children;
    else
        return <Tooltip {...props}>{props.children}</Tooltip>;
}

const TextComment = function (props) {
    return [
        <InfoIcon fontSize="inherit" />,
        <em {...props}> {props.children} </em>
    ];
}

const PropItem = function (props) {
    let ItemIcon = props.icon;
    return <ListItem key={props.k} alignItems="flex-start">
        <ListItemIcon>
            {props.hasOwnProperty('title') ?
                <Typography component="h2" variant="inherit">
                    <Tooltip title={props.title} arrow>
                        { /* overwrite some properties <Tooltip> sets */}
                        <ItemIcon role="img" aria-hidden={false} aria-label={props.title} aria-describedby={null} />
                    </Tooltip>
                </Typography>
                :
                <ItemIcon />
            }
        </ListItemIcon>
        <ListItemText>
            {props.children}
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
    var x = a[orderBy];
    var y = b[orderBy];
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

function SchemeList(props) {
    let { typeKey, db } = props;
    const stmt = "SELECT * FROM scheme WHERE type=? ORDER BY nist_round DESC, name ASC;";
    const type = SCHEME_TYPES[typeKey];

    return (
        <>
            <Typography component="h2" variant="h5">
                {type.name}s
                {"  "}
                <type.icon fontSize="inherit" />
            </Typography>
            <List>
                {queryAll(db, stmt, [typeKey]).map(s => (
                    <ListItem key={`${typeKey}-${s.id_text}`} style={{ paddingLeft: 0 }}><ListItemText>
                        <Typography variant="h6">
                            <Link component={RouterLink} to={detailLink(s.id_text)}>
                                {s.name}
                            </Link>
                        </Typography>
                        <small style={{ lineHeight: 1 }}>
                            <MaybeTooltip title={s.category_comment}>
                                <span>{s.category}</span>
                            </MaybeTooltip>
                            {s.nist_round !== "none" && [" \u2022 ",
                                <MaybeTooltip title={s.nist_round_comment}>
                                    <span>{NIST_ROUNDS[s.nist_round].short}</span>
                                </MaybeTooltip>]}
                            {s.description && " \u2022 "}
                            <em>{s.description}</em>
                        </small>
                    </ListItemText></ListItem>
                ))}
            </List>
        </>
    );
}

function intersection(a, b) {
    return a.filter((value) => b.indexOf(value) !== -1);
}

function union(a, b) {
    return [...a, ...not(b, a)];
}

function not(a, b) {
    return a.filter((value) => b.indexOf(value) === -1);
}
const useStyles = makeStyles((theme) => ({
    root: {
        minWidth: 240,
        maxWidth: 300,
        overflow: 'auto',
        maxHeight: 200,
    },
    listItem: {
        padding: 1,
    }
}))

export default function SchemeCheckboxList(props) {
    let { list, checkedList, onChange } = props;
    let checked = checkedList ?? [];

    const handleSchemeToggle = (scheme) => () => {
        const currentIndex = checked.indexOf(scheme);
        const newChecked = [...checked];

        if (currentIndex === -1) {
            newChecked.push(scheme);
        } else {
            newChecked.splice(currentIndex, 1);
        }
        onChange(newChecked);
    };
    const numberOfChecked = (items) => intersection(checked, items).length;

    const handleToggleAll = (items) => () => {
        var newChecked;
        if (numberOfChecked(items) === items.length) {
            newChecked = not(checked, items);
        } else {
            newChecked = union(checked, items);
        }
        onChange(newChecked);
    };

    const classes = useStyles();

    return (
        <Card>
            <List>
                <ListItem dense className={classes.listItem} button onClick={handleToggleAll(list)}>
                    <ListItemIcon>
                        <Checkbox
                            checked={numberOfChecked(list) === list.length && list.length !== 0}
                            indeterminate={numberOfChecked(list) !== list.length && numberOfChecked(list) !== 0}
                            tabIndex={-1}
                            disableRipple
                        />
                    </ListItemIcon>
                    <ListItemText primary="Schemes" />
                </ListItem>
            </List>
            <Divider />
            <List className={classes.root}>
                {list.map((value) => {
                    return (
                        <ListItem dense className={classes.listItem} key={value} button onClick={handleSchemeToggle(value)}>
                            <ListItemIcon>
                                <Checkbox
                                    checked={checked.indexOf(value) !== -1}
                                    tabIndex={-1}
                                    disableRipple
                                />
                            </ListItemIcon>
                            <ListItemText primary={value} />
                        </ListItem>
                    );
                })}
            </List>
        </Card>
    );
}

class QueryTable extends React.Component {
    handleRequestSort(property) {
        if (!this.props.onChangeOrder)
            return;
        const isAsc = this.props.orderBy === property && this.props.order === 'asc';
        this.props.onChangeOrder(isAsc ? 'desc' : 'asc', property);
    }

    render() {
        const { queryResult, formatFunctions, orderBy } = this.props;
        const order = this.props.order ?? 'asc';
        if (queryResult === undefined) return <Typography>No results</Typography>;
        if (!queryResult) return null;
        return (
            <Grid direction='column' alignItems='flex-end' spacing={1} container>
                <Grid container item>
                    <TableContainer component={Paper}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    {
                                        queryResult.columns.map((column, idx) =>
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
                                    sortedRows(queryResult.values, orderBy, order === 'asc').map(
                                        (row) => (
                                            <TableRow key={row[1]}>
                                                {
                                                    row[0].map((val, j) =>
                                                        (formatFunctions && formatFunctions[j]) ?
                                                            <TableCell key={j}>{formatFunctions[j](val)}</TableCell>
                                                            :
                                                            <TableCell key={j}>{val}</TableCell>
                                                    )
                                                }
                                            </TableRow>
                                        )
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

class Welcome extends React.Component {

    constructor(props) {
        super(props);
        this.db = props.db;
    }

    render() {
        return (
            <Container maxWidth="md">
                <Paper>
                    <Box p={4}>
                        <Typography variant="h4" component="h1" gutterBottom>Welcome!</Typography>
                        <Typography paragraph>
                            This is the frontend presenting data from <Link href="https://github.com/cryptoeng/pqdb/">https://github.com/cryptoeng/pqdb/</Link>. You can select different views by clicking the menu icon in the top left corner.
                        </Typography>
                        <Typography paragraph>
                            The page is written in <Link href="https://reactjs.org/">React</Link> and operates purely client site by loading an <Link href="https://www.sqlite.org/">SQLite</Link> database (located <Link href="pqdb.sqlite">here</Link>) which is generated from the data in pqdb.
                        </Typography>
                        <Typography paragraph>
                            Contributions are warmly welcomed, see <Link href="https://github.com/cryptoeng/pqdb#contribute">here</Link> for details.
                        </Typography>

                        <Typography variant="h4" component="h1" align="center" pt={2}>Available Schemes</Typography>
                        <Grid container>
                            <Grid item xs px={4} key="enc">
                                <Box p={4}>
                                    <SchemeList db={this.db} typeKey={'enc'} />
                                </Box>
                            </Grid>
                            <Grid item xs px={4} key="sig">
                                <Box p={4}>
                                    <SchemeList db={this.db} typeKey={'sig'} />
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Container>
        );
    }
}

const secLevelMarks = [
    { label: '0', value: 0 }, { label: '128', value: 128 }, { label: '64', value: 64 },
    { label: '192', value: 192 }, { label: '256+', value: 256 }
];

const nistRoundMarks = [
    { label: '2', value: 2 }, { label: '3a', value: 3 }, { label: '3f', value: 4 }
];

function getNistRoundLabel(v) {
    var round = nistRoundMarks.find((entry) => { return entry.value === v })
    return round.label
};

function getNistRoundValue(l) {
    var round = nistRoundMarks.find((entry) => { return entry.label === l })
    return round.value
}

function humanReadableSize(size, baseUnit) {
    if (!Number.isFinite(size)) return '';
    var i = (size === 0) ? 0 : Math.floor(Math.log(size) / Math.log(1000));
    return `${(size / Math.pow(1000, i)).toFixed(2) * 1} ${['', 'k', 'M', 'G', 'T'][i]}${baseUnit}`;
};

function schemesListQueryDB(db, type, nistRound, nonNist) {
    var schemes_list_query = `
        SELECT id_text FROM scheme 
        WHERE 
            type = ?
            AND (nist_round BETWEEN ? AND '3f' ${(nonNist) ? "OR nist_round = 'none'" : ""})`;
    var schemes_list = queryAll(db, schemes_list_query, [type, nistRound]);
    return schemes_list.map(row => row.id_text);
}

class SchemeComparison extends React.Component {
    constructor(props) {
        super(props);
        this.db = props.db;
        this.platformFilterTimeout = null;
        this.fullSchemeLists = {
            'enc': schemesListQueryDB(this.db, 'enc', '0', true),
            'sig': schemesListQueryDB(this.db, 'sig', '0', true)
        };
        this.state = { queryProcessing: true, queryResult: undefined, schemesList: [], query: "null" };

        this.defaultState = {
            showColumns: ['benchmarks', 'hw_features', 'nist_category'], // not shown: 'storage', 'security_levels', 'nist_round'
            schemeType: 'sig', platformFilter: '', sliderValue: 128, securityLevel: 128, securityQuantum: 0,
            showRef: false, nistRound: '3a', showNonNistSchemes: false, order: 'asc', orderBy: null, checkedSchemes: null
        };
        Object.assign(this.state, this.defaultState);
        var params = qs.parse(this.props.history.location.search);
        if ('state' in params) {
            try {
                var paramState = JSON.parse(params.state);
                Object.assign(this.state, paramState);
            } catch {
                // JSON state was invalid -> ignore
            }
        }
        if (!this.state.checkedSchemes)
            this.state.checkedSchemes = this.fullSchemeLists[this.state.schemeType];
    }

    buildQuery(state) {
        return `SELECT
    s.id_text as 'ID',
    p.name || CASE
        s.stateful
        WHEN 0 THEN ''
        ELSE ' (Stateful)'
    END AS 'Parameter Set'` +
            ((state.showColumns.includes('nist_round')) ? ",\n   s.nist_round AS 'NIST Round'" : '') +
            ((state.showColumns.includes('security_levels')) ? ",\n    p.security_level_classical AS 'Security Level (classical)'" : '') +
            ((state.showColumns.includes('security_levels')) ? ",\n    p.security_level_quantum AS 'Security Level (quantum)'" : '') +
            ((state.showColumns.includes('nist_category')) ? ",\n    p.security_level_nist_category AS 'NIST Category'" : '') +
            ((state.showColumns.includes('storage')) ? `,
    p.sizes_sk AS 'Secret Key Size',
    p.sizes_pk AS 'Public Key Size',
    p.sizes_ct_sig AS '${SCHEME_TYPES[state.schemeType].ct_sig} Size',
    (p.sizes_pk + p.sizes_ct_sig) AS 'Communication Size'` : '') + ((state.showColumns.includes('benchmarks')) ? `,
    i.name AS 'Implementation Name'${(state.showColumns.includes('hw_features')) ? `,
    (
        SELECT
            GROUP_CONCAT(hf.feature, ", ")
        FROM
            implementation_hardware_feature hf
        WHERE
            hf.implementation_id = i.id
    ) AS 'Hardware Features'` : ''},
    b.platform AS 'Platform',
    round(b.timings_gen / 1000) AS 'KeyGen (kCycles)',
    round(b.timings_enc_sign / 1000) AS '${SCHEME_TYPES[state.schemeType].enc_sign} (kCycles)',
    round(b.timings_dec_vrfy / 1000) AS '${SCHEME_TYPES[state.schemeType].dec_vrfy} (kCycles)',
    round((timings_gen + b.timings_enc_sign + b.timings_dec_vrfy) / 1000) AS 'Total (kCycles)'
` : '') + `
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
        s.nist_round BETWEEN ? AND '3f'` +
            ((state.showNonNistSchemes) ? "\n        OR s.nist_round = 'none'" : '') + `
    )
    AND p.security_level_classical >= ?
    AND p.security_level_quantum >= ?` + (
                (state.showColumns.includes('benchmarks')) ?
                    ((!state.showRef) ? "\n    AND i.type = 'optimized'" : '') +
                    ((state.platformFilter !== '') ? "\n    AND b.platform LIKE '%' || ? || '%'" : '')
                    : ''
            );
        // Note: The (very fragile) `expandQuery` method below makes quite
        // some assumptions on the structure of this query (for example, no
        // question marks in strings or comments). When making changes,
        // please verify that the "view as SQL" link still works.
    }

    prepareParams(state) {
        var params = [state.schemeType, state.nistRound, state.securityLevel, state.securityQuantum];
        if (state.showColumns.includes('benchmarks') && state.platformFilter !== '') params.push(state.platformFilter);
        return params;
    }


    computeResult(state, sqlQuery) {
        var params = this.prepareParams(state);
        var results = queryAll(this.db, sqlQuery, params);
        if (results.length === 0) return undefined;
        results.forEach(res => {
            res['Parameter Set'] = <Link component={RouterLink} to={detailLink(res.ID)}>{res['Parameter Set']}</Link>;
            delete res.ID;
        });

        return {
            columns: Object.keys(results[0]),
            values: results.map(row => Object.keys(row).map(k => row[k]))
        };
    }

    expandQuery() {
        // UNSAFE, DO NOT USE
        // this is very hacky and unreliable - we just use it here to generate
        // an expanded string that is returned back to the user, so there is no
        // injection possibility, and no real harm results when it goes wrong.

        var params = this.prepareParams(this.state).slice();
        var error = false;

        function replacer(match) {
            const val = params.shift();
            if (val === undefined) {
                error = true;
                return;
            }
            if (typeof val === 'string')
                return "'" + val.replaceAll("'", "''") + "'";
            else
                return val.toString();
        }

        const sqlQuery = this.state.query.replaceAll('?', replacer);
        if (error && params.length > 0) {
            console.error("expandQuery called with number of `?`s not matching the number of params");
        } else {
            return sqlQuery;
        }
    }

    getFormatFunctions(results) {
        if (results === undefined) return undefined;
        var formatFunctions = Array(results.columns.length).fill(undefined);
        results.columns.forEach((col, idx) => {
            if (col.endsWith('(kCycles)')) formatFunctions[idx] = (val => val?.toLocaleString());
            if (col.endsWith('Size')) formatFunctions[idx] = (val => humanReadableSize(val, 'B'));
        });
        return formatFunctions;
    }

    updateResult(resetChecked, resetOrder) {
        var queryState = Object.assign({}, this.state);
        var schemesList = schemesListQueryDB(this.db, this.state.schemeType, this.state.nistRound, this.state.showNonNistSchemes);
        if (resetChecked) queryState.checkedSchemes = this.fullSchemeLists[this.state.schemeType];
        var query = this.buildQuery(queryState);
        var queryResult = this.computeResult(queryState, query);
        var change = { queryProcessing: false, queryResult: queryResult, schemesList: schemesList, query: query };
        if (resetChecked) change.checkedSchemes = this.fullSchemeLists[this.state.schemeType];
        if (resetOrder) change = Object.assign(change, { order: 'asc', orderBy: null });
        this.setState(change);
    }

    componentDidMount() {
        this.updateResult(!this.state.checkedSchemes, false);
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.queryProcessing) {
            const resetChecked = prevState.schemeType !== this.state.schemeType;
            setTimeout(() => {
                this.updateResult(resetChecked, true);
                this.updateSearchParams(false);
            }, 300);
        } else if (prevState.order !== this.state.order || prevState.orderBy !== this.state.orderBy) {
            this.updateSearchParams(true);
        }
    }

    updateSearchParams(replace) {
        var searchParam = {};
        this.defaultState.checkedSchemes = this.fullSchemeLists[this.state.schemeType];
        Object.keys(this.defaultState).forEach(key => {
            if (Array.isArray(this.defaultState[key]) && Array.isArray(this.state[key])) {
                if (not(this.defaultState[key], this.state[key]).length > 0 || not(this.state[key], this.defaultState[key]).length > 0)
                    searchParam[key] = this.state[key];
            } else if (this.state[key] !== this.defaultState[key])
                searchParam[key] = this.state[key];
        });
        const searchParamStr = JSON.stringify(searchParam);
        const historyParams = [null, null, (searchParamStr === '{}') ? '?' : `?${qs.stringify({ state: searchParamStr })}`];
        replace ? window.history.replaceState(...historyParams) : window.history.pushState(...historyParams);
    }

    setFilterState(change) {
        this.setState(Object.assign({ queryProcessing: true }, change));
    }

    render() {
        const expandedQuery = this.expandQuery();
        return (
            <Grid container direction="column" spacing={2} >
                <Grid item>
                    <Container maxWidth="md">
                        <Paper>
                            <Box p={2}>
                                <Grid justify="space-between" spacing={2} container direction="row">
                                    <Grid item>
                                        <Typography variant="h4">Scheme Comparison</Typography>
                                    </Grid>
                                    <Grid item>
                                        <ToggleButtonGroup value={this.state.schemeType} exclusive
                                            size="medium" onChange={(_event, value) => { if (value !== null) this.setFilterState({ schemeType: value }); }}>
                                            <ToggleButton disabled={this.state.queryProcessing} value="sig">
                                                Signature
                                            </ToggleButton>
                                            <ToggleButton disabled={this.state.queryProcessing} value="enc">
                                                Key Exchange
                                            </ToggleButton>
                                        </ToggleButtonGroup>
                                    </Grid>
                                </Grid>
                                <Box my={2}>
                                    <Paper><Box p={2} mb={2}>
                                        <Box mb={2}>
                                            <Typography variant="button">Select columns to display</Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="center">
                                            <ToggleButtonGroup value={this.state.showColumns}
                                                size="medium" onChange={(_event, value) => this.setFilterState({ showColumns: value })}>
                                                <ToggleButton disabled={this.state.queryProcessing} value="storage">
                                                    <Tooltip title="Size of keys and ciphertext/signature">
                                                        <div>Sizes</div>
                                                    </Tooltip>
                                                </ToggleButton>
                                                <ToggleButton disabled={this.state.queryProcessing} value="benchmarks">
                                                    <Tooltip title="Timings for cryptographic operations">
                                                        <div>Benchmarks</div>
                                                    </Tooltip>
                                                </ToggleButton>
                                                <ToggleButton disabled={this.state.queryProcessing || !this.state.showColumns.includes('benchmarks')}
                                                    value="hw_features">
                                                    <Tooltip title="Hardware features required by the implementation">
                                                        <div>Hardware Features</div>
                                                    </Tooltip>
                                                </ToggleButton>
                                                <ToggleButton disabled={this.state.queryProcessing} value="security_levels">
                                                    <Tooltip title="Security level in bits (classical/quantum)">
                                                        <div>Security Levels</div>
                                                    </Tooltip>
                                                </ToggleButton>
                                                <ToggleButton disabled={this.state.queryProcessing} value="nist_category">
                                                    <Tooltip title="NIST security level (1-5)">
                                                        <div>NIST Category</div>
                                                    </Tooltip>
                                                </ToggleButton>
                                                <ToggleButton disabled={this.state.queryProcessing} value="nist_round">
                                                    <Tooltip title="Round of the NIST PQC standardization">
                                                        <div>NIST Round</div>
                                                    </Tooltip>
                                                </ToggleButton>
                                            </ToggleButtonGroup>
                                        </Box>
                                    </Box></Paper>
                                    <Grid container justify="space-between" spacing={1}>
                                        <Grid item xs>
                                            <Accordion>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Typography variant="button">Filter parameter sets</Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <Grid container spacing={3} justify="space-between">
                                                        <Grid container item direction="column" xs>
                                                            <Grid container item spacing={2} >
                                                                <Grid item xs={3} style={{ "min-width": 80 }}>
                                                                    <Box><Typography>Classical Security</Typography></Box>
                                                                </Grid>
                                                                <Grid item xs style={{ "min-width": 150 }}>
                                                                    <Slider disabled={this.state.queryProcessing} color="secondary" defaultValue={this.state.securityLevel}
                                                                        step={16} min={0} max={256} marks={secLevelMarks} track="inverted"
                                                                        onChangeCommitted={(e, v) => this.setFilterState({ securityLevel: v })}
                                                                        valueLabelDisplay="auto" />
                                                                </Grid>
                                                            </Grid>
                                                            <Grid container item spacing={2}>
                                                                <Grid item xs={3} style={{ "min-width": 80 }}>
                                                                    <Typography>Quantum Security</Typography>
                                                                </Grid>
                                                                <Grid item xs style={{ "min-width": 150 }}>
                                                                    <Slider disabled={this.state.queryProcessing} color="secondary" defaultValue={this.state.securityQuantum} step={16}
                                                                        min={0} max={256} marks={secLevelMarks} track="inverted"
                                                                        onChangeCommitted={(e, v) => this.setFilterState({ securityQuantum: v })}
                                                                        valueLabelDisplay="auto" />
                                                                </Grid>
                                                            </Grid>
                                                            <Grid container item spacing={2}>
                                                                <Grid item xs={3} style={{ "min-width": 80 }}>
                                                                    <Typography>NIST Round</Typography>
                                                                </Grid>
                                                                <Grid item xs style={{ "min-width": 150 }}>
                                                                    <Slider disabled={this.state.queryProcessing} color="secondary" defaultValue={getNistRoundValue(this.state.nistRound)} step={null}
                                                                        min={2} max={4} marks={nistRoundMarks} track="inverted"
                                                                        onChangeCommitted={(e, v) => this.setFilterState({ nistRound: getNistRoundLabel(v) })}
                                                                        valueLabelFormat={getNistRoundLabel}
                                                                        valueLabelDisplay="auto" />
                                                                </Grid>
                                                            </Grid>
                                                            <Grid item>
                                                                <FormControlLabel control={
                                                                    <Checkbox disabled={this.state.queryProcessing} defaultChecked={this.state.showNonNistSchemes}
                                                                        onChange={() => this.setFilterState({ showNonNistSchemes: !this.state.showNonNistSchemes })} />
                                                                } label="Include schemes not in the NIST competition" />
                                                            </Grid>
                                                        </Grid>
                                                        <Grid item>
                                                            <SchemeCheckboxList list={this.state.schemesList} checkedList={this.state.checkedSchemes}
                                                                onChange={(newChecked) => this.setFilterState({ checkedSchemes: newChecked })} />
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
                                                        <FormControlLabel control={
                                                            <Checkbox disabled={this.state.queryProcessing | !this.state.showColumns.includes('benchmarks')}
                                                                defaultChecked={this.state.showRef} onChange={() => this.setFilterState({ showRef: !this.state.showRef })} />
                                                        } label="Include 'ref' Implementations" />
                                                        <TextField disabled={this.state.queryProcessing || !this.state.showColumns.includes('benchmarks')}
                                                            defaultValue={this.state.platformFilter} color="secondary" label="Platform" variant="outlined"
                                                            onChange={e => {
                                                                clearTimeout(this.platformFilterTimeout);
                                                                const filterValue = e.target.value;
                                                                this.platformFilterTimeout = setTimeout(() => {
                                                                    this.platformFilterTimeout = null;
                                                                    this.setFilterState({ platformFilter: filterValue });
                                                                }, 750);
                                                            }} />
                                                    </FormControl>
                                                </AccordionDetails>
                                            </Accordion>
                                        </Grid>

                                    </Grid>
                                </Box>
                                <Link component={RouterLink} to={`/raw_sql?query=${encodeURIComponent(expandedQuery)}`}>View this query as SQL</Link>
                            </Box>
                        </Paper>
                    </Container>
                </Grid>
                <Grid container item>
                    <Container maxWidth={false} disableGutters={true}>
                        <Paper>
                            <Box p={2} display='flex' justifyContent="center">
                                <QueryTable onChangeOrder={(order, orderBy) => this.setState({ order: order, orderBy: orderBy })}
                                    order={this.state.order} orderBy={this.state.orderBy} queryResult={this.state.queryResult}
                                    formatFunctions={this.getFormatFunctions(this.state.queryResult)} />
                            </Box>
                        </Paper>
                    </Container>
                </Grid>
            </Grid>
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
        super();
        this.db = props.db;
        this.params = qs.parse(props.history.location.search);
        this.runningQueryHandler = null;
        var sqlInput = ('query' in this.params) ? this.params['query'] : '';

        this.state = {
            sqlInput: sqlInput,
            executedSqlQuery: '',
            order: null,
            orderBy: 'asc',
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
        var search = `?${qs.stringify(this.params)}`;
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
                                <QueryTable queryResult={this.state.queryResult} order={this.state.order} orderBy={this.state.orderBy}
                                    onChangeOrder={(order, orderBy) => this.setState({ order: order, orderBy: orderBy })} />
                            </Box>
                        </Paper>
                    </Container>
                </Grid>
            </Grid>
        );
    }
}

function SchemeDetailSwitch(props) {
    return (
        <Switch>
            <Route exact path={'/detail'}><SchemeOverview db={props.db} /></Route>
            <Route exact path={'/detail/:schemeId'}><SchemeDetail db={props.db} /></Route>
            <Route exact path={'/detail/:schemeId/:flavorId'}><FlavorDetail db={props.db} /></Route>
            <Route render={() => <Redirect to='/' />} />
        </Switch>
    );
}

function SchemeOverview(props) {
    return (
        <Container maxWidth="md">
            <Grid container justify="center" spacing={2}>
                {Object.keys(SCHEME_TYPES).map(typeKey => (
                    <Grid item xs>
                        <Paper>
                            <Box p={2}>
                                <SchemeList db={props.db} typeKey={typeKey} />
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}

function SchemeDetail(props) {
    let db = props.db;
    let { schemeId } = useParams();

    const s = queryAll(db, "SELECT * FROM scheme WHERE id_text=?", [schemeId])[0];
    if (s === undefined) {
        return <Container><Paper>No such scheme.</Paper></Container>;
    }

    const authors = queryAll(db, "SELECT * FROM scheme_author WHERE scheme_id=?", [s.id]);
    const problems = queryAll(db, "SELECT * FROM scheme_problem WHERE scheme_id=?", [s.id]);
    const links = queryAll(db, "SELECT * FROM scheme_link WHERE scheme_id=?", [s.id]);
    const sources = queryAll(db, "SELECT * FROM scheme_source WHERE scheme_id=?", [s.id]);
    const flavors = queryAll(db, "SELECT * FROM flavor WHERE scheme_id=?", [s.id]);

    let TypeIcon = SCHEME_TYPES[s.type].icon;
    return (
        <Container maxWidth="md">
            <Paper>
                <Box>
                    <List>
                        <ListItem key="head" alignItems="flex-start">
                            <ListItemText>
                                <Typography component="h1" variant="h2">
                                    {s.name}
                                    {"  "}
                                    <Tooltip title={SCHEME_TYPES[s.type].name} arrow>
                                        <TypeIcon fontSize="large" aria-hidden={false} role="img" aria-label={SCHEME_TYPES[s.type].name} aria-describedby={null} />
                                    </Tooltip>
                                </Typography>
                                {s.description && <div>{s.description}</div>}
                                {s.comment && <div><TextComment>{s.comment}</TextComment></div>}
                            </ListItemText>
                        </ListItem>

                        <PropItem k="category" title="Category" icon={CategoryIcon}>
                            {s.category} based <Comment title={s.category_comment} />
                        </PropItem>

                        {(s.stateful || s.stateful_comment) && (
                            <PropItem k="stateful" title="Statefulness" icon={SaveIcon}>
                                {s.stateful ? 'stateful' : 'stateless' /* stateless only shown if there's a comment */}
                                <Comment title={s.stateful_comment} />
                            </PropItem>)
                        }
                        <PropItem k="nist_round" title="NIST standardization" icon={PodiumIcon}>
                            {NIST_ROUNDS[s.nist_round].long}
                        </PropItem>

                        <PropItem k="year" title="Year" icon={EventIcon}>
                            {
                                [
                                    s.year_paper === null ? [] :
                                        [s.year_paper, <span style={{ opacity: .5 }}> (paper)</span>],
                                    s.year_candidate === null ? [] :
                                        [s.year_candidate, <span style={{ opacity: .5 }}> (NIST candidate)</span>],
                                    s.year_standardization === null ? [] :
                                        [s.year_standardization, <span style={{ opacity: .5 }}> (standardization)</span>],
                                    s.year_comment === null ? [] :
                                        <em>{s.year_comment}</em>,
                                ].reduce((accu, elem) => { /* join(), but skipping empty entries */
                                    return !elem.length ? accu : !accu.length ? [elem] :
                                        [...accu, " \u2022 ", elem]
                                }, []
                                )
                            }
                        </PropItem>

                        <PropItem k="problems_trust" title="Security Properties" icon={SecurityIcon}>
                            {[
                                s.trust_comment && [
                                    <div><strong>Trust: </strong></div>,
                                    <div style={{ marginBottom: ".6em" }}>{s.trust_comment}</div>
                                ],
                                (problems.length > 0 || s.problems_comment) && [
                                    <div><strong>Problems:</strong></div>,
                                    s.problems_comment && <div><TextComment>{s.problems_comment}</TextComment></div>,
                                    problems.map(p => <div>{p.assumption} <Comment title={p.comment} /></div>),
                                ]
                            ]}
                        </PropItem>

                        <PropItem k="authors" title="Authors" icon={PeopleIcon}>
                            {authors.map(a => <div>{a.name}</div>)}
                        </PropItem>

                        {links.length > 0 &&
                            <PropItem k="links" title="Links" icon={LinkIcon}>
                                {links.map(l => <div>{linkify(l.url)}</div>)}
                            </PropItem>}

                        {sources.length > 0 &&
                            <PropItem k="sources" title="Sources" icon={SourceIcon}>
                                {sources.map(s => <div>{linkify(s.url)}</div>)}
                            </PropItem>}


                        <ListItem key="flavors">
                            <Typography component="h2" variant="h4">Flavors</Typography>
                        </ListItem>

                        {flavors.map((function (f) {
                            const f_paramsets = queryAll(db, "SELECT * FROM paramset WHERE flavor_id=? ORDER BY security_level_nist_category ASC, security_level_quantum ASC", [f.id]);
                            const f_implementations = queryAll(db, "SELECT name FROM implementation WHERE flavor_id=? ORDER BY type DESC", [f.id]);

                            return [
                                <ListItem key={`flavor-${f.id}-head`} style={{ display: "block" }}>
                                    <Typography component="h3" variant="h5">
                                        <Link component={RouterLink} to={detailLink(s.id_text, f.id_text)}>{f.name}</Link>
                                    </Typography>
                                    {f.description && <div>{f.description}</div>}
                                    {f.comment && <div><TextComment>{f.comment}</TextComment></div>}
                                </ListItem>,

                                f.type !== "SIG" && !f.type_comment && // there's just one type for signatures, not worth showing this here
                                <PropItem k={`flavor-${f.id}-type`} title="API Type" icon={CategoryIcon}>
                                    {f.type} <Comment title={f.type_comment} />
                                </PropItem>,

                                <PropItem k={`flavor-${f.id}-securitynotion`} title="Security Notion" icon={SecurityIcon}>
                                    <Tooltip title={SEC_NOTIONS[f.security_notion]}>
                                        <span>{f.security_notion}</span>
                                    </Tooltip>
                                    <Comment title={f.security_notion_comment} />
                                </PropItem>,

                                f.dh_ness && (
                                    <PropItem k={`flavor-${f.id}-dhness`} title="Diffie-Hellman-Ness" icon={DiffieHellmanIcon}>
                                        <strong>Diffie-Hellman-Ness: </strong>
                                        {f.dh_ness}
                                    </PropItem>
                                ),

                                <PropItem k={`flavor-${f.id}-paramsets`} title="Parameter sets" icon={ParamSetIcon}>
                                    {f_paramsets.map(p =>
                                        <div>
                                            {p.name}{" "}
                                            <Tooltip title={`NIST Category ${p.security_level_nist_category}`}><span>({romanCat(p.security_level_nist_category)})</span></Tooltip>
                                        </div>)
                                    }
                                </PropItem>,

                                <PropItem k={`flavor-${f.id}-implementations`} title="Implementations" icon={CodeIcon}>
                                    {f_implementations.map(i => <div>{i.name}</div>)}
                                </PropItem>,
                            ]
                        }))}
                    </List>
                </Box>
            </Paper>
        </Container>
    );
}

function FlavorDetail(props) {
    let db = props.db;
    let { schemeId, flavorId } = useParams();

    const s = queryAll(db, "SELECT * FROM scheme WHERE id_text=?", [schemeId])[0];
    if (s === undefined) {
        return <Container><Paper>No such scheme.</Paper></Container>;
    }
    const f = queryAll(db, "SELECT * FROM flavor WHERE scheme_id=? AND id_text=?", [s.id, flavorId])[0];
    if (f === undefined) {
        return <Container><Paper>No such flavor.</Paper></Container>;
    }
    const paramsets = queryAll(db, "SELECT * FROM paramset WHERE flavor_id=? ORDER BY security_level_nist_category ASC, security_level_quantum ASC", [f.id]);
    const implementations = queryAll(db, "SELECT * FROM implementation WHERE flavor_id=? ORDER BY type DESC", [f.id]); // reference before optimized
    const links = queryAll(db, "SELECT * FROM flavor_link WHERE flavor_id=?", [f.id]);
    const sources = queryAll(db, "SELECT * FROM flavor_source WHERE flavor_id=?", [f.id]);

    let TypeIcon = SCHEME_TYPES[s.type].icon;
    return (
        <Container maxWidth="md">
            <Paper>
                <Box>
                    <List>
                        <ListItem key="scheme-head" alignItems="flex-start">
                            <ListItemText>
                                <Typography variant="h6">
                                    <Link component={RouterLink} to={detailLink(s.id_text)}>
                                        <ArrowBackIcon fontSize="inherit" />
                                        {[" "]}
                                        {s.name}
                                    </Link>
                                    {" "}
                                    <Tooltip title={SCHEME_TYPES[s.type].name} arrow>
                                        <TypeIcon fontSize="inherit" aria-hidden={false} role="img" aria-label={SCHEME_TYPES[s.type].name} aria-describedby={null} />
                                    </Tooltip>
                                    {" "}
                                    <span style={{ fontWeight: "normal", marginLeft: ".4em" }}>
                                        {s.category} <Comment title={s.category_comment} />
                                        {s.stateful ?
                                            [" \u2022 stateful", <Comment title={s.stateful_comment} />] : null}
                                        {s.nist_round > 0 &&
                                            [` \u2022 round ${s.nist_round}`, <Comment title={s.nist_round_comment} />]}
                                    </span>
                                </Typography>
                            </ListItemText>
                        </ListItem>

                        <ListItem key="flavor-head" alignItems="flex-start">
                            <ListItemText>
                                <Typography variant="h3">
                                    {f.name}
                                </Typography>
                                {f.description && <div>{f.description}</div>}
                                {f.comment && <div><TextComment>{f.comment}</TextComment></div>}
                            </ListItemText>
                        </ListItem>

                        <PropItem k="type" title="API Type" icon={CategoryIcon}>
                            {f.type} <Comment title={f.type_comment} />
                        </PropItem>

                        <PropItem k="securitynotion" title="Security Notion" icon={SecurityIcon}>
                            <Tooltip title={SEC_NOTIONS[f.security_notion]}>
                                <span>{f.security_notion}</span>
                            </Tooltip>
                            <Comment title={f.security_notion_comment} />
                        </PropItem>

                        {f.dh_ness &&
                            <PropItem k="dhness" title="Diffie-Hellman-Ness" icon={DiffieHellmanIcon}>
                                <strong>Diffie-Hellman-Ness: </strong>
                                {f.dh_ness}
                            </PropItem>}

                        {links.length > 0 &&
                            <PropItem k="links" title="Links" icon={LinkIcon}>
                                {links.map(l => <div>{linkify(l.url)}</div>)}
                            </PropItem>}

                        {sources.length > 0 &&
                            <PropItem k="sources" title="Sources" icon={SourceIcon}>
                                {sources.map(s => <div>{linkify(s.url)}</div>)}
                            </PropItem>}

                        <ListItem key="paramsets">
                            <Typography component="h3" variant="h4">Parameter Sets</Typography>
                        </ListItem>

                        {paramsets.map((function (p) {
                            const p_links = queryAll(db, "SELECT * FROM paramset_link WHERE paramset_id=?", [p.id]);
                            const p_sources = queryAll(db, "SELECT * FROM paramset_source WHERE paramset_id=?", [p.id]);
                            return [

                                <ListItem key={`p-${p.id}-head`} style={{ display: "block" }}>
                                    <Typography component="h4" variant="h5">
                                        {p.name}
                                    </Typography>
                                    {p.comment && <div><TextComment>{p.comment}</TextComment></div>}
                                </ListItem>,

                                <PropItem k={`p-${p.id}-seclevel`} title="Security Level" icon={SecurityIcon}>
                                    <div>
                                        {p.security_level_nist_category > 0 && [
                                            <Tooltip title={`NIST Category ${p.security_level_nist_category}`}>
                                                <span>{romanCat(p.security_level_nist_category)}</span>
                                            </Tooltip>,
                                            " \u2022 "
                                        ]}
                                        {p.security_level_quantum} <span style={{ opacity: .5 }}> (quantum)</span>
                                        {p.security_level_classical &&
                                            [" \u2022 ", p.security_level_classical, <span style={{ opacity: .5 }}> (classical)</span>]}
                                    </div>
                                    {p.security_level_comment &&
                                        <div><TextComment>{p.security_level_comment}</TextComment></div>}
                                </PropItem>,

                                (s.type === 'enc' || p.failure_probability !== 0 || p.failure_probability_comment) &&
                                <PropItem k={`p-${p.id}-failureprob`} title="Failure Probability" icon={BottomIcon}>
                                    {p.failure_probability === 0
                                        ? "0"
                                        : ["2", <sup>{p.failure_probability}</sup>]
                                    }
                                    <Comment title={p.failure_probability_comment} />
                                </PropItem>,

                                <PropItem k={`p-${p.id}-numop`} title="Number of operations" icon={CounterIcon}>
                                    {p.number_of_operations === "inf"
                                        ? "unlimited"
                                        : p.number_of_operations
                                    }
                                </PropItem>,

                                <PropItem k={`p-${p.id}-sizes`} title="Sizes" icon={MeasureIcon}>
                                    <div>
                                        sk: {p.sizes_sk} {" \u2022 "}
                                    pk: {p.sizes_pk} {" \u2022 "}
                                        {SCHEME_TYPES[s.type].ctsig}: {p.sizes_ct_sig}
                                    </div>
                                    {p.sizes_comment && <div><TextComment>{p.sizes_comment}</TextComment></div>}
                                </PropItem>,

                                p_links.length > 0 &&
                                <PropItem k={`p-${p.id}-links`} title="Links" icon={LinkIcon}>
                                    {p_links.map(l => <div>{linkify(l.url)}</div>)}
                                </PropItem>,

                                p_sources.length > 0 &&
                                <PropItem k={`p-${p.id}-sources`} title="Sources" icon={SourceIcon}>
                                    {p_sources.map(s => <div>{linkify(s.url)}</div>)}
                                </PropItem>,


                            ]
                        }))}

                        <ListItem key="implementations">
                            <Typography component="h3" variant="h4">Implementations</Typography>
                        </ListItem>

                        {implementations.map(function (i) {
                            const i_links = queryAll(db, "SELECT * FROM implementation_link WHERE implementation_id=?", [i.id]);
                            const i_sources = queryAll(db, "SELECT * FROM implementation_source WHERE implementation_id=?", [i.id]);
                            const i_hardware = queryAll(db, "SELECT * FROM implementation_hardware_feature WHERE implementation_id=?", [i.id]);
                            const i_dependencies = queryAll(db, "SELECT * FROM implementation_dependency WHERE implementation_id=?", [i.id]);
                            let i_side_channel_guarding = [
                                i.side_channel_guarding_branching && 'branching',
                                i.side_channel_guarding_timing && 'timing',
                            ].filter(Boolean);
                            if (i_side_channel_guarding.length === 0) i_side_channel_guarding = ['none'];
                            const side_channel_info = { 0: 'no', 1: 'yes', null: 'unknown' };

                            return [

                                <ListItem key={`i-${i.id}-head`} style={{ display: "block" }}>
                                    <Typography component="h4" variant="h5">
                                        {i.name}
                                    </Typography>
                                    {i.comment && <div><TextComment>{i.comment}</TextComment></div>}
                                </ListItem>,

                                <PropItem k={`i-${i.id}-platform`} title="Platform" icon={LanguageIcon}>
                                    {i.platform}
                                </PropItem>,

                                <PropItem k={`i-${i.id}-type`} title="Type of Implementation" icon={CategoryIcon}>
                                    {i.type}
                                </PropItem>,

                                i_hardware.length > 0 &&
                                <PropItem k={`i-${i.id}-hardware`} title="Required Hardware Features" icon={ChipIcon}>
                                    {i_hardware.map(h => <div>{h.feature}</div>)}
                                </PropItem>,

                                i_dependencies.length > 0 &&
                                <PropItem k={`i-${i.id}-deps`} title="Code Dependencies" icon={CodeIcon}>
                                    {i_dependencies.map(d => <div>{d.dependency}</div>)}
                                </PropItem>,

                                <PropItem k={`i-${i.id}-sidechannel`} title="Side Channel Guarding" icon={CastleIcon}>
                                    <div>
                                        branching: {side_channel_info[i.side_channel_guarding_branching]}
                                        <Comment title={i.side_channel_guarding_branching_comment} />
                                    </div>
                                    <div>
                                        timing: {side_channel_info[i.side_channel_guarding_timing]}
                                        <Comment title={i.side_channel_guarding_timing_comment} />
                                    </div>
                                </PropItem>,

                                // TODO code size and randomness missing

                                i_links.length > 0 &&
                                <PropItem k={`i-${i.id}-links`} title="Links" icon={LinkIcon}>
                                    {i_links.map(l => <div>{linkify(l.url)}</div>)}
                                </PropItem>,

                                i_sources.length > 0 &&
                                <PropItem k={`i-${i.id}-sources`} title="Sources" icon={SourceIcon}>
                                    {i_sources.map(s => <div>{linkify(s.url)}</div>)}
                                </PropItem>,

                            ]
                        })}

                        <ListItem key="benchmarks">
                            <ListItemText>
                                <Typography component="h3" variant="h4">Benchmarks</Typography>
                                <div><Link component={RouterLink} to={`/raw_sql?query=SELECT p.name AS 'Parameter Set'%2C i.name AS Implementation%2C b.platform AS Platform%2C b.comment AS '🛈'%2C b.timings_unit%2C b.timings_gen%2C b.timings_enc_sign%2C b.timings_dec_vrfy%2C b.timings_comment AS '🛈'%2C b.memory_requirements_gen%2C b.memory_requirements_enc_sign%2C b.memory_requirements_dec_vrfy%2C b.memory_requirements_comment AS '🛈' FROM benchmark b%2C paramset p%2C implementation i WHERE p.id%3Db.paramset_id AND i.id%3Db.implementation_id AND p.flavor_id%3D${f.id}`}>Show all benchmarks for this flavor</Link></div> { /* TODO: include this right here as a table */}
                            </ListItemText>
                        </ListItem>
                    </List>
                </Box>
            </Paper>
        </Container>
    );
}

function romanCat(nistCat) {
    let romans = ['ø', 'I', 'II', 'III', 'IV', 'V'];
    if (Number.isInteger(nistCat) && romans[nistCat] !== undefined)
        return romans[nistCat];
    else
        return nistCat;
}

function linkify(s) {
    let url = s.match(/https?:\/\/[^\s]+/g);
    return url ? <Link href={url}>{s}</Link> : s;
}

function detailLink(scheme, flavor) {
    let url = '/detail';
    url += `/${scheme}`;
    if (flavor !== undefined)
        url += `/${flavor}`;

    return url;
}

export { CustomSQLQuery, SchemeDetailSwitch, Welcome, SchemeComparison };
