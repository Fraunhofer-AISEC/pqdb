import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter as Router, withRouter } from 'react-router-dom';

const AppWithRouter = withRouter(props => <App {...props} />);
ReactDOM.render(
  <React.StrictMode>
    <Router basename={process.env.PUBLIC_URL}>
      <AppWithRouter />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
