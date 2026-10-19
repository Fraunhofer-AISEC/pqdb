/*
 * Copyright (c) 2023-2026, Fraunhofer AISEC.
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
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';

import intersection from '../utils/intersection';
import not from '../utils/not';
import union from '../utils/union';

const propTypes = {
  list: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  checkedList: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  onChange: PropTypes.func.isRequired,
};

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

  const itemSx = {
    py: 0.25,
    px: 1,
    borderRadius: 1,
    '&:hover': {
      bgcolor: 'action.hover',
    },
  };
  const checkboxSx = {
    p: 0.25,
    '& .MuiSvgIcon-root': {
      fontSize: 18,
    },
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <List disablePadding sx={{ pt: 0.5 }}>
        <ListItemButton dense sx={itemSx} onClick={handleToggleAll(list)}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Checkbox
              size="small"
              sx={checkboxSx}
              checked={numberOfChecked(list) === list.length && list.length !== 0}
              indeterminate={numberOfChecked(list) !== list.length && numberOfChecked(list) !== 0}
              tabIndex={-1}
              disableRipple
            />
          </ListItemIcon>
          <ListItemText
            primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>Schemes</Typography>}
          />
        </ListItemButton>
      </List>
      <Divider sx={{ my: 0 }} />
      <List
        disablePadding
        sx={{
          minWidth: 240,
          maxWidth: 300,
          overflow: 'auto',
          maxHeight: 200,
          py: 0.5,
        }}
      >
        {list.map((value) => (
          <ListItemButton
            dense
            sx={itemSx}
            key={value}
            onClick={
            handleSchemeToggle(value)
            }
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Checkbox
                size="small"
                sx={checkboxSx}
                checked={checked.indexOf(value) !== -1}
                tabIndex={-1}
                disableRipple
              />
            </ListItemIcon>
            <ListItemText primary={<Typography variant="body2">{value}</Typography>} />
          </ListItemButton>
        ))}
      </List>
    </Card>
  );
}
SchemeCheckboxList.propTypes = propTypes;

export default SchemeCheckboxList;
