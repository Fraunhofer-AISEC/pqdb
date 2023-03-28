/*
 * Copyright (c) 2023, Fraunhofer AISEC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
