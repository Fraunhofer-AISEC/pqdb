import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@material-ui/core';
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
