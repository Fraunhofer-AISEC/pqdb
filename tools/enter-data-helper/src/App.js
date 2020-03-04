import React from 'react';
import { Router, Switch, Route, } from 'react-router-dom';
import { createBrowserHistory } from "history";
import SelectScheme from './components/SelectScheme';
import SchemeOverview from './components/SchemeOverview';
import { FlavorOverview, SubtypeOverview } from './components/FlavorOverview';
import { NavBar } from './components/BaseComponents';
import './App.css';
const history = createBrowserHistory();


//const schemaForScheme = JSON.parse(fs.readFileSync('../schema/scheme.json', 'utf-8'));
//const schemaForFlavor = JSON.parse(fs.readFileSync('../schema/flavor.json', 'utf-8'));
//const schemaForParam = JSON.parse(fs.readFileSync('../schema/paramset.json', 'utf-8'));
//const schemaForImpl = JSON.parse(fs.readFileSync('../schema/implementation.json', 'utf-8'));;
//const schemaForBench = JSON.parse(fs.readFileSync('../schema/benchmark.json', 'utf-8'));;


class App extends React.Component {

  render() {
    return (
      <Router history={history} forceRefresh={false}>
        <div>
          <NavBar history={history} />
          <hr />
          <Switch>
            <Route path='/:type/:schemeName/:name/:subType/:subName' component={SubtypeOverview} />
            <Route path='/:type/:schemeName/:name/' component={FlavorOverview} />
            <Route path='/:type/:name/' component={SchemeOverview} />
            <Route exact path='/' component={SelectScheme} />
          </Switch>
        </div>
      </Router>
    )
  }
}

export default App;
