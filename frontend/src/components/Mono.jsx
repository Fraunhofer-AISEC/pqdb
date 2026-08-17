/*
 * Mono — a small wrapper that renders its children in the self-hosted mono
 * accent font (see `fontFamilyMono` in src/theme.js) used for crypto/size and
 * numeric data (sk/pk/ct|sig sizes, cycle counts, memory figures).
 */

import PropTypes from 'prop-types';
import { Typography } from '@mui/material';

import { fontFamilyMono } from '../theme';

function Mono({ children, sx, ...rest }) {
  return (
    <Typography
      component="span"
      sx={{ fontFamily: fontFamilyMono, ...sx }}
      {...rest}
    >
      {children}
    </Typography>
  );
}

Mono.propTypes = {
  children: PropTypes.node,
  sx: PropTypes.object,
};

Mono.defaultProps = {
  children: null,
  sx: undefined,
};

export default Mono;
