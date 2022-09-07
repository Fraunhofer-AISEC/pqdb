import React from 'react';
import { SvgIcon } from '@mui/material';

export default function makeSvgIcon(code) {
  function forwardRef(props, ref) {
    return (
      <SvgIcon ref={ref} {...props}>
        {code}
      </SvgIcon>
    );
  }
  forwardRef.displayName = 'SvgIconWrapper';
  return React.forwardRef(forwardRef);
}
