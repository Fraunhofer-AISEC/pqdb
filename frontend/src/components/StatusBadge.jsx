/*
 * StatusBadge — a small coloured MUI Chip backed by the semantic STATUS_COLORS
 * tokens (see src/theme.js). It gives scheme categories, NIST rounds, and
 * security levels consistent, low-effort colour coding instead of ad-hoc inline
 * styling. Colours are picked from the token tables by value with a neutral
 * fallback for unknown values, so new categories/rounds degrade gracefully.
 */

import { Chip } from '@mui/material';
import PropTypes from 'prop-types';

import { CATEGORY_LABELS, STATUS_COLORS } from '../theme';

const toneFor = (kind, value) => {
  const table = STATUS_COLORS[kind];
  return (table && table[value]) || '#64748b';
};

function StatusBadge({ kind, value, label, title, size, sx }) {
  if (value === undefined || value === null || value === '') return null;
  const color = toneFor(kind, value);
  // Categories default to a human-readable name; any other kind (or an explicit
  // `label` from the caller) falls back to the raw value/string.
  const resolvedLabel = label
    ?? (kind === 'categories' ? (CATEGORY_LABELS[value] ?? value) : String(value));
  return (
    <Chip
      size={size}
      label={resolvedLabel}
      title={title}
      sx={{
        color: '#fff',
        backgroundColor: color,
        fontWeight: 600,
        '&:hover': { backgroundColor: color },
        ...sx,
      }}
    />
  );
}

StatusBadge.propTypes = {
  kind: PropTypes.oneOf(['categories', 'rounds', 'security', 'statefulness']).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.node,
  title: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium']),
  sx: PropTypes.object,
};

StatusBadge.defaultProps = {
  value: undefined,
  label: undefined,
  title: undefined,
  size: 'small',
};

export default StatusBadge;
