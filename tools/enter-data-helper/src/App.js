import React from 'react';
import { HashRouter as Router, Switch, Route, withRouter } from 'react-router-dom';
import { Container } from '@material-ui/core';
import SelectScheme from './components/SelectScheme';
import SchemeOverview from './components/SchemeOverview';
import { FlavorOverview, SubtypeOverview } from './components/FlavorOverview';
import { NavBar } from './components/BaseComponents';
import { checkRootDir } from './components/Tools'
import './App.css';

const NavBarRouter = withRouter(props => <NavBar {...props} />);

class App extends React.Component {
  constructor(props) {
    super(props)
    this.foundRootDir = checkRootDir();
  }

  render() {
    if (!this.foundRootDir) {
      return <h1>Required directories not found. Please specify the correct path to the repository as a command line argument.</h1>;
    }
    return (
        <Container disableGutters maxWidth={false}>
          <Router forceRefresh={false}>
            <NavBarRouter />
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
