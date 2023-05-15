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
  Card,
  Checkbox,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import PropTypes from 'prop-types';
import React from 'react';
import makeStyles from '@mui/styles/makeStyles';

import intersection from '../utils/intersection';
import not from '../utils/not';
import union from '../utils/union';

const propTypes = {
  list: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  checkedList: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  onChange: PropTypes.func.isRequired,
};

const useStyles = makeStyles(() => ({
  root: {
    minWidth: 240,
    maxWidth: 300,
    overflow: 'auto',
    maxHeight: 200,
  },
  listItem: {
    padding: 1,
  },
}));

function SchemeCheckboxList(props) {
  const { list, checkedList, onChange } = props;
  const checked = checkedList ?? [];

  const handleSchemeToggle = (scheme) => () => {
    const currentIndex = checked.indexOf(scheme);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(scheme);
    } else {
      newChecked.splice(currentIndex, 1);
    }
    onChange(newChecked);
  };
  const numberOfChecked = (items) => intersection(checked, items).length;

  const handleToggleAll = (items) => () => {
    let newChecked;
    if (numberOfChecked(items) === items.length) {
      newChecked = not(checked, items);
    } else {
      newChecked = union(checked, items);
    }
    onChange(newChecked);
  };

  const classes = useStyles();

  return (
    <Card>
      <List>
        <ListItem dense className={classes.listItem} button onClick={handleToggleAll(list)}>
          <ListItemIcon>
            <Checkbox
              checked={numberOfChecked(list) === list.length && list.length !== 0}
              indeterminate={numberOfChecked(list) !== list.length && numberOfChecked(list) !== 0}
              tabIndex={-1}
              disableRipple
            />
          </ListItemIcon>
          <ListItemText primary="Schemes" />
        </ListItem>
      </List>
      <Divider />
      <List className={classes.root}>
        {list.map((value) => (
          <ListItem
            dense
            className={classes.listItem}
            key={value}
            button
            onClick={
            handleSchemeToggle(value)
            }
          >
            <ListItemIcon>
              <Checkbox
                checked={checked.indexOf(value) !== -1}
                tabIndex={-1}
                disableRipple
              />
            </ListItemIcon>
            <ListItemText primary={value} />
          </ListItem>
        ))}
      </List>
    </Card>
  );
}
SchemeCheckboxList.propTypes = propTypes;

export default SchemeCheckboxList;
