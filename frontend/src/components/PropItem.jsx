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
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import React from 'react';

const defaultProps = {
  children: null,
};

const propTypes = {
  Icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function PropItem({ children, Icon, title }) {
  return (
    <ListItem alignItems="flex-start">
      <ListItemIcon>
        <Typography component="h2" variant="inherit">
          <Tooltip title={title} arrow>
            {/* overwrite some properties <Tooltip> sets */}
            <Icon role="img" aria-hidden={false} aria-label={title} aria-describedby={null} />
          </Tooltip>
        </Typography>
      </ListItemIcon>
      <ListItemText>
        {children}
      </ListItemText>
    </ListItem>
  );
}

PropItem.defaultProps = defaultProps;
PropItem.propTypes = propTypes;

export default PropItem;
