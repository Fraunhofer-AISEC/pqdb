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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import PropTypes from 'prop-types';
import React from 'react';

const defaultProps = {
  views: { routing: false },
};
const propTypes = {
  onClick: PropTypes.func.isRequired,
  views: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    view: PropTypes.elementType.isRequired,
    routing: PropTypes.bool,
  }),
};

function DrawerList({ views, onClick }) {
  return (
    <List>
      {
        Object.keys(views).map((key) => (
          <ListItem key={key} button onClick={() => onClick(key)}>
            <ListItemText primary={views[key].name} secondary={views[key].description} />
          </ListItem>
        ))
      }
    </List>
  );
}

DrawerList.defaultProps = defaultProps;
DrawerList.propTypes = propTypes;

export default DrawerList;
