import { Link } from '@mui/material';
import React from 'react';

export default function linkify(s) {
  const url = s.match(/https?:\/\/[^\s]*[^-.,;()]/g);
  return url ? <Link href={url}>{s}</Link> : s;
}
