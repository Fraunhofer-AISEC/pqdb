import React from 'react';
import {
  CssBaseline, Grid, Box, Paper, List, ListItem, ListItemText, Button, IconButton, Drawer, CircularProgress
} from '@material-ui/core';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { Menu as MenuIcon } from '@material-ui/icons';
import initSqlJs from "sql.js";
import Lightbox from 'react-image-lightbox';
import { CustomSQLQuery } from './components/views';

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

// Add new views here
const views = {
  "default": {
    name: "Custom SQL Query",
    description: "Enter a custom database query and display the result in a table.",
    view: (db) => <CustomSQLQuery db={db} />
  }
};

const Progess = (props) => <Box display='flex' justifyContent="center"><CircularProgress /></Box>;

const DrawerList = (props) =>
  <List>
    {
      Object.keys(views).map(key =>
        <ListItem key={key} button onClick={() => props.onClick(key)}>
          <ListItemText primary={views[key].name} secondary={views[key].description} />
        </ListItem>
      )
    }
  </List>;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      themeId: "light",
      db: null,
      lightBoxIsOpen: false,
      selectedView: "default",
      drawerOpen: false
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
              <Grid item>
                <Box display='flex' justifyContent="center">
                  <img src={logo} width="500em" height="192.5em" alt="Logo" />
                </Box>
              </Grid>
              {
                (this.state.db != null) ? <Grid item style={{ overflow: 'auto' }}>{views[this.state.selectedView].view(this.state.db)}</Grid> : <Progess />
              }
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
            <IconButton style={{ position: "absolute", top: 0, left: 0 }} onClick={() => this.setState({ drawerOpen: true })}>
              <MenuIcon />
            </IconButton>
          </Box>
          <Drawer anchor="left" open={this.state.drawerOpen} onClose={() => this.setState({ drawerOpen: false })}>
            <DrawerList onClick={(key) => this.setState({ selectedView: key, drawerOpen: false })} />
          </Drawer>
        </ThemeProvider>
      </React.Fragment>
    );
  }
}

export default App;
