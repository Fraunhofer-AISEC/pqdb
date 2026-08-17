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

import RouteError, { SafeErrorBoundary } from './components/AppErrorFallback';
import App from './App';
import DatabaseProvider from './components/DatabaseProvider';

// Lazy-load every route view so that a single blocked module (e.g. a browser
// add-on blocking a request) can never take down the whole app. Each view is
// only fetched when its route is actually visited, and any failure is contained
// to that route via the errorElement below. This also code-splits the bundle.
const lazyView = (importFn) => async () => {
  const module = await importFn();
  return { Component: module.default };
};

// Add new views for routing here
const router = createBrowserRouter([{
  path: '/',
  Component: App,
  errorElement: <RouteError />,
  children: [
    {
      path: '',
      lazy: lazyView(() => import('./views/Welcome')),
    },
    {
      path: 'raw_sql',
      lazy: lazyView(() => import('./views/CustomSQLQuery')),
    },
    {
      path: 'comparison',
      lazy: lazyView(() => import('./views/SchemeComparison')),
    },
    {
      path: 'detail',
      lazy: lazyView(() => import('./views/SchemeOverview')),
    },
    {
      path: 'detail/:schemeId',
      lazy: lazyView(() => import('./views/SchemeDetail')),
    },
    {
      path: 'detail/:schemeId/:flavorId',
      lazy: lazyView(() => import('./views/FlavorDetail')),
    },
    {
      path: 'privacy_policy',
      lazy: lazyView(() => import('./views/PrivacyPolicy')),
    },
  ],
}]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SafeErrorBoundary>
      <DatabaseProvider>
        <RouterProvider router={router} />
      </DatabaseProvider>
    </SafeErrorBoundary>
  </React.StrictMode>,
);
