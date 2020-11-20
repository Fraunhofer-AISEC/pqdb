import { InfoOutlined as InfoIcon } from '@material-ui/icons';
import PropTypes from 'prop-types';
import React from 'react';
import { Tooltip } from '@material-ui/core';

const propTypes = {
  title: PropTypes.string,
};

const defaultProps = {
  title: null,
};

function Comment({ title }) {
  if (title === undefined || title === null || title === '') { return null; }

  return (
    <>
      {'\u2002'}
      <Tooltip interactive title={title} placement="right" arrow>
        <InfoIcon fontSize="inherit" style={{ cursor: 'help' }} />
      </Tooltip>
    </>
  );
}
Comment.propTypes = propTypes;
Comment.defaultProps = defaultProps;

export default Comment;
