import {
  Card,
  Checkbox,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

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
