import { Link } from '@material-ui/core';
import React from 'react';

export default function linkify(s) {
  const url = s.match(/https?:\/\/[^\s]+/g);
  return url ? <Link href={url}>{s}</Link> : s;
}
