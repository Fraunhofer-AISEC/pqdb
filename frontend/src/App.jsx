import {
  Box,
  CircularProgress,
  Container, CssBaseline,
  Drawer,
  Grid,
  IconButton,

  Paper,
  Tooltip,
} from '@material-ui/core';
import {
  Brightness4 as DarkIcon,
  BrightnessHigh as LightIcon,
  Menu as MenuIcon,
} from '@material-ui/icons';
import {
  Link, Redirect, Route, Switch,
} from 'react-router-dom';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import React from 'react';
import initSqlJs from 'sql.js';

import CustomSQLQuery from './views/CustomSQLQuery';
import DrawerList from './components/DrawerList';
import SchemeComparison from './views/SchemeComparison';
import SchemeDetailSwitch from './views/SchemeDetailSwitch';
import Welcome from './views/Welcome';
import logo from './pqdb.svg';

function getTheme(type) {
  return createMuiTheme({
    palette: {
      type,
    },
  });
}

const pathname = (key) => `/${key}`;

// Add new views here
const views = {
  '': {
    name: 'Welcome Page',
    description: 'Contains info about this website.',
    view: Welcome,
  },
  raw_sql: {
    name: 'Custom SQL Query',
    description: 'Enter a custom database query and display the result in a table.',
    view: CustomSQLQuery,
  },
  detail: {
    name: 'Scheme Details',
    description: 'Browse data stored for a scheme',
    routing: true,
    view: SchemeDetailSwitch,
  },
  comparison: {
    name: 'Scheme Comparison',
    description: 'Compare schemes based on memory requirements and performance.',
    view: SchemeComparison,
  },
};

const Progress = () => <Box display="flex" justifyContent="center"><CircularProgress /></Box>;

const propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
    location: PropTypes.shape({
      search: PropTypes.string.isRequired,
    }),
  }).isRequired,
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      themeId: 'light',
      db: null,
      drawerOpen: false,
    };
  }

  componentDidMount() {
    // sql.js needs to fetch its wasm file, so we cannot immediately instantiate the database
    // without any configuration, initSqlJs will fetch the wasm files directly from the same
    // path as the js see ../config-overrides.js
    initSqlJs()
      .then((SQL) => this.loadDatabase(SQL))
      .catch((err) => this.setState({ error: err }));
  }

  componentWillUnmount() {
    const { db } = this.state;
    db.close();
  }

  loadDatabase(SQL) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/pqdb/pqdb.sqlite', true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = () => {
      const uInt8Array = new Uint8Array(xhr.response);
      this.setState({ db: new SQL.Database(uInt8Array) });
    };
    xhr.send();
  }

  switchView(view) {
    const { history } = this.props;
    history.push({
      pathname: pathname(view),
    });
    this.setState({ drawerOpen: false });
  }

  toggleTheme() {
    const { themeId } = this.state;
    this.setState({ themeId: (themeId === 'light') ? 'dark' : 'light' });
  }

  render() {
    const { history } = this.props;
    const {
      db, error, drawerOpen, themeId,
    } = this.state;
    let content;
    if (db) {
      content = (
        <Grid container item>
          <Switch>
            {
              Object.keys(views).map((key) => (
                <Route
                  key={key}
                  exact={!Object.prototype.hasOwnProperty.call(views[key], 'routing')}
                  path={pathname(key)}
                  render={
                    (props) => React.createElement(views[key].view, {
                      key: `${key}?${history.location.search}`, db, ...props,
                    })
                  }
                />
              ))
            }
            <Route render={() => <Redirect to="/" />} />
          </Switch>
        </Grid>
      );
    } else if (error) {
      content = 'There was an error while loading the database.';
    } else {
      content = <Progress />;
    }
    return (
      <ThemeProvider theme={getTheme(themeId)}>
        <CssBaseline />
        <Box p={2}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <Box display="flex" justifyContent="center">
                <Link to="/">
                  <img src={logo} width="500em" height="192.5em" alt="Logo" />
                </Link>
              </Box>
            </Grid>
            {content}
            <Grid item>
              <Container maxWidth="md">
                <Paper>
                  <Box p={1} display="flex" alignItems="center" justifyContent="center">
                    <Tooltip title={`Switch to ${(themeId === 'light') ? 'dark' : 'light'} theme`}>
                      <IconButton onClick={() => this.toggleTheme()}>
                        {(themeId === 'light') ? <DarkIcon /> : <LightIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Container>
            </Grid>
          </Grid>
          <IconButton style={{ position: 'absolute', top: 0, left: 0 }} onClick={() => this.setState({ drawerOpen: true })}>
            <MenuIcon />
          </IconButton>
        </Box>
        <Drawer anchor="left" open={drawerOpen} onClose={() => this.setState({ drawerOpen: false })}>
          <DrawerList onClick={(view) => this.switchView(view)} views={views} />
        </Drawer>
      </ThemeProvider>
    );
  }
}

App.propTypes = propTypes;

export default App;
