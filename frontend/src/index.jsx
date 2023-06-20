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

import {
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom';

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import CustomSQLQuery from './views/CustomSQLQuery';
import DatabaseProvider from './components/DatabaseProvider';
import FlavorDetail from './views/FlavorDetail';
import SchemeComparison from './views/SchemeComparison';
import SchemeDetail from './views/SchemeDetail';
import SchemeOverview from './views/SchemeOverview';
import Welcome from './views/Welcome';

// Add new views for routing here
const router = createBrowserRouter([{
  path: '/',
  Component: App,
  children: [
    {
      path: '',
      Component: Welcome,
    },
    {
      path: 'raw_sql',
      Component: CustomSQLQuery,
    },
    {
      path: 'comparison',
      Component: SchemeComparison,
    },
    {
      path: 'detail',
      Component: SchemeOverview,
    },
    {
      path: 'detail/:schemeId',
      Component: SchemeDetail,
    },
    {
      path: 'detail/:schemeId/:flavorId',
      Component: FlavorDetail,
    },
  ],
}]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DatabaseProvider>
      <RouterProvider router={router} />
    </DatabaseProvider>
  </React.StrictMode>,
);
