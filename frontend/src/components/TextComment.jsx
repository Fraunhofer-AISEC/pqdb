import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';
import React from 'react';

const propTypes = {
  children: PropTypes.node.isRequired,
};

function TextComment({ children }) {
  return (
    <>
      <InfoIcon fontSize="inherit" />
      <em>
        {' '}
        {children}
        {' '}
      </em>
    </>
  );
}

TextComment.propTypes = propTypes;

export default TextComment;
