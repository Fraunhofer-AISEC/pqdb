import React from 'react';
import {
  CssBaseline, Grid, Box, Paper, List, ListItem, ListItemText,
  IconButton, Drawer, CircularProgress, Container, Tooltip
} from '@material-ui/core';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import {
  Menu as MenuIcon, BrightnessHigh as LightIcon, Brightness4 as DarkIcon,
  AccountTree as DiagramIcon
} from '@material-ui/icons';
import initSqlJs from "sql.js";
import Lightbox from 'react-image-lightbox';
import { CustomSQLQuery, Welcome } from './components/views';
import { Route, Switch, Redirect } from 'react-router-dom';


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

const pathname = (key) => '/' + key;

// Add new views here
const views = {
  "": {
    name: "Welcome Page",
    description: "Contains info about this website.",
    view: Welcome
  },
  "raw_sql": {
    name: "Custom SQL Query",
    description: "Enter a custom database query and display the result in a table.",
    view: CustomSQLQuery
  }
};

const Progress = (props) => <Box display='flex' justifyContent="center"><CircularProgress /></Box>;

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

  componentWillUnmount() {
    this.state.db.close();
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

  switchView(view) {
    const history = this.props.history;
    history.replace({
      pathname: pathname(view)
    });
    this.setState({ drawerOpen: false });
  }

  toggleTheme() {
    this.setState({ themeId: (this.state.themeId === 'light') ? 'dark' : 'light' });
  }

  render() {
    return (
      <ThemeProvider theme={getTheme(this.state.themeId)}>
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
              (this.state.db != null) ?
                <Grid container item>
                  <Switch>
                    {
                      Object.keys(views).map(key =>
                        <Route key={key} exact path={pathname(key)} render={(props) =>
                          React.createElement(views[key].view, { key: key + "?" + this.props.history.location.search, db: this.state.db, ...props })} />
                      )
                    }
                    <Route render={(props) => <Redirect to='/' />} />
                  </Switch>
                </Grid> : <Progress />
            }
            <Grid item>
              <Container maxWidth="md">
                <Paper>
                  <Box p={1} display='flex' alignItems="center" justifyContent="center">
                    <Tooltip title="Show database diagram">
                      <IconButton onClick={() => this.setState({ lightBoxIsOpen: true })}>
                        <DiagramIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={"Switch to " + ((this.state.themeId === 'light') ? 'dark' : 'light') + " theme"}>
                    <IconButton onClick={() => this.toggleTheme()}>
                      {(this.state.themeId === 'light') ? <DarkIcon /> : <LightIcon />}
                    </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Container>
            </Grid>
          </Grid>
          <IconButton style={{ position: "absolute", top: 0, left: 0 }} onClick={() => this.setState({ drawerOpen: true })}>
            <MenuIcon />
          </IconButton>
        </Box>
        <Drawer anchor="left" open={this.state.drawerOpen} onClose={() => this.setState({ drawerOpen: false })}>
          <DrawerList onClick={(view) => this.switchView(view)} />
        </Drawer>
      </ThemeProvider>
    );
  }
}

export default App;
