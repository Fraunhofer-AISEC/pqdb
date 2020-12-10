import React from 'react';
import makeSvgIcon from '../utils/makeSvgIcon';

const Bottom = makeSvgIcon(
  <path d="M 19,3 H 5 C 3.89,3 3,3.9 3,5 v 14 c 0,1.1 0.89,2 2,2 h 14 c 1.1,0 2,-0.9 2,-2 V 5 C 21,3.9 20.1,3 19,3 Z M 17,17 H 7 v -2 h 4 V 7 h 2 v 8 h 4 z" />,
);
// without box: <path d="M 3,21 v -2 H 11 V 5 h 2 V 19 H 21 V 21 z" />

export default Bottom;
