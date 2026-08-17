/*
 * Copyright (c) 2026, Fraunhofer AISEC.
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
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
} from '@mui/material';
import { Component } from 'react';

import PropTypes from 'prop-types';

/**
 * Last-resort error boundary. If anything rendered below it throws (for example
 * a browser add-on that blocks a lazily loaded route module, or any unexpected
 * runtime error), this boundary renders a friendly message instead of letting
 * the whole app fall over to a blank page.
 */
class SafeErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card sx={{ m: 2 }}>
          <CardHeader title="Something went wrong" />
          <CardContent>
            <Typography>
              An error occurred while rendering this page. Browser extensions
              (such as ad blockers) can occasionally block parts of this site.
              You can try reloading the page, or continue using the rest of the
              site via the menu.
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

SafeErrorBoundary.propTypes = {
  children: PropTypes.node,
};

/**
 * Rendered by react-router when a route component fails to load (for example
 * because an add-on blocked the module request).
 */
function RouteError() {
  return (
    <Card sx={{ m: 2 }}>
      <CardHeader title="This page could not be loaded" />
      <CardContent>
        <Typography>
          The page could not be loaded, possibly because a browser extension
          blocked part of it. The rest of the site is still available.
        </Typography>
      </CardContent>
    </Card>
  );
}

export { SafeErrorBoundary };
export default RouteError;
