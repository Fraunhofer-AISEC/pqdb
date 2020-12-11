import { Redirect, Route, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';

import FlavorDetail from './FlavorDetail';
import SchemeDetail from './SchemeDetail';
import SchemeOverview from './SchemeOverview';

const propTypes = {
  db: PropTypes.shape({
    prepare: PropTypes.func.isRequired,
  }).isRequired,
};

function SchemeDetailSwitch({ db }) {
  return (
    <Switch>
      <Route exact path="/detail" render={() => <SchemeOverview db={db} />} />
      <Route
        exact
        path="/detail/:schemeId"
        render={(props) => <SchemeDetail db={db} {...props} />}
      />
      <Route
        exact
        path="/detail/:schemeId/:flavorId"
        render={(props) => <FlavorDetail db={db} {...props} />}
      />
      <Route render={() => <Redirect to="/" />} />
    </Switch>
  );
}

SchemeDetailSwitch.propTypes = propTypes;

export default SchemeDetailSwitch;
