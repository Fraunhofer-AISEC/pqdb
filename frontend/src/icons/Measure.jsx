import React from 'react';
import makeSvgIcon from '../utils/makeSvgIcon';

const Measure = makeSvgIcon(
  <g fill="none" stroke="currentColor" strokeWidth="2px" strokeLinecap="round">
    <path d="m 16,18 v 2 M 4,16 v 4 H 20 V 16 M 8,18 v 2 m 4,-4 v 4" />
    <path d="m 5.5,8 -2,2 2,2 m -2,-2 h 5" />
    <path d="m 18.5,8 2,2 -2,2 m 2,-2 h -5" />
  </g>,
);

export default Measure;
