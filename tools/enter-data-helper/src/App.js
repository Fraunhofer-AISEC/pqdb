import React from 'react';
import { Router, Switch, Route, } from 'react-router-dom';
import { createBrowserHistory } from "history";
import { Container } from '@material-ui/core';
import SelectScheme from './components/SelectScheme';
import SchemeOverview from './components/SchemeOverview';
import { FlavorOverview, SubtypeOverview } from './components/FlavorOverview';
import { NavBar } from './components/BaseComponents';
import './App.css';
const history = createBrowserHistory();

class App extends React.Component {

  render() {
    return (
        <Container disableGutters maxWidth={false}>
          <Router history={history} forceRefresh={false}>
            <NavBar history={history} />
            <Container>
              <Switch>
                <Route path='/:type/:schemeName/:name/:subType/:subName' component={SubtypeOverview} />
                <Route path='/:type/:schemeName/:name/' component={FlavorOverview} />
                <Route path='/:type/:name/' component={SchemeOverview} />
                <Route exact path='/' component={SelectScheme} />
              </Switch>
            </Container>
          </Router>
        </Container>
    )
  }
}

export default App;
