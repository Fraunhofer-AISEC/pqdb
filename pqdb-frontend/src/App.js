import React from 'react';
import {
  CssBaseline, Grid, Box, Paper, TextField, Button,
  Table, TableHead, TableRow, TableCell, TableContainer, TableBody
} from '@material-ui/core';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import initSqlJs from "sql.js";
import Lightbox from 'react-image-lightbox';

import logo from './pqdb.svg';
import databaseDiagram from './tables.svg';
import 'react-image-lightbox/style.css';


function getTheme(type) {
  return createMuiTheme({
    palette: {
      type: type
    },
  });
}

const themes = {
  'light': getTheme('light'),
  'dark': getTheme('dark')
}

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

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      themeId: "light",
      db: null,
      sqlQuery: "",
      queryResult: null,
      error: null,
      lightBoxIsOpen: false
    };
  }

  componentDidMount() {
    // sql.js needs to fetch its wasm file, so we cannot immediately instantiate the database
    // without any configuration, initSqlJs will fetch the wasm files directly from the same path as the js
    // see ../config-overrides.js
    initSqlJs()
      .then(SQL => this.loadDatabase(SQL))
      .catch(err => this.setState({ error: err }));
  }

  loadDatabase(SQL) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'pqdb.sqlite', true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = e => {
      var uInt8Array = new Uint8Array(xhr.response);
      this.setState({ db: new SQL.Database(uInt8Array) });
    };
    xhr.send();
  }

  executeSQLQuery() {
    try {
      var results = this.state.db.exec(this.state.sqlQuery)[0];
      console.log(results);
      this.setState({ queryResult: results, error: null });
    } catch (e) {
      this.setState({ queryResult: null, error: e });
    }
  }

  render() {
    return (
      <React.Fragment>
        <ThemeProvider key={this.state.themeId} theme={themes[this.state.themeId]}>
          <CssBaseline />
          {this.state.lightBoxIsOpen && (
            <Lightbox
              mainSrc={databaseDiagram}
              onCloseRequest={() => this.setState({ lightBoxIsOpen: false })}

            />
          )}
          <Box p={2}>
            <Grid container direction="column" spacing={2}>
              <Grid item><Box display='flex' justifyContent="center">
                <img src={logo} width="500em" height="192.5em" alt="Logo" />
              </Box></Grid>
              <Grid item>
                <Paper>
                  <Box p={2} display='flex' alignItems="center" justifyContent="center">
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
                        <Box display='flex' alignItems="center" justifyContent="center">
                          <Button variant="contained" color="primary" disabled={!this.state.db}
                            onClick={this.executeSQLQuery.bind(this)}>Run Query</Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>
              <Grid item>
                <Paper>
                  <Box p={2} display='flex' alignItems="center" justifyContent="center">
                    <QueryTable queryResult={this.state.queryResult} />
                  </Box>
                </Paper>
              </Grid>
              <Grid item>
                <Paper>
                  <Box p={2} display='flex' alignItems="center" justifyContent="center">
                    <Button onClick={() => this.setState({ lightBoxIsOpen: true })}>
                      Show Database Diagram
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </ThemeProvider>
      </React.Fragment>
    );
  }
}

export default App;
