import { BrowserRouter as Router, withRouter } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';

const AppWithRouter = withRouter(App);
ReactDOM.render(
  <React.StrictMode>
    <Router basename="/pqdb">
      <AppWithRouter />
    </Router>
  </React.StrictMode>,
  document.getElementById('root'),
);
