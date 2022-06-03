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
