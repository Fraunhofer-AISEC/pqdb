/*
 * Copyright (c) 2026, Fraunhofer AISEC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * StatusBadge — a small coloured MUI Chip backed by the semantic STATUS_COLORS
 * tokens (see src/theme.js). It gives scheme categories, NIST rounds, and
 * security levels consistent, low-effort colour coding instead of ad-hoc inline
 * styling. Colours are picked from the token tables by value with a neutral
 * fallback for unknown values, so new categories/rounds degrade gracefully.
 *
 * Two variants: `subdued` (tinted background + faint border + colour dot) for
 * categories, so scheme cards and filter lists stay calm; and `solid` (filled)
 * for status kinds (rounds / security / statefulness), so status remains the
 * strongest signal. Categories default to `subdued`; `variant` overrides it.
 */

import { alpha, Box, Chip } from '@mui/material';
import PropTypes from 'prop-types';

import { CATEGORY_LABELS, STATUS_COLORS } from '../theme';

const toneFor = (kind, value) => {
  const table = STATUS_COLORS[kind];
  return (table && table[value]) || '#64748b';
};

function StatusBadge({ kind, value, label, title, size, variant, sx }) {
  if (value === undefined || value === null || value === '') return null;
  const color = toneFor(kind, value);
  const resolvedVariant = variant ?? (kind === 'categories' ? 'subdued' : 'solid');
  // Categories default to a human-readable name; any other kind (or an explicit
  // `label` from the caller) falls back to the raw value/string.
  const resolvedLabel = label
    ?? (kind === 'categories' ? (CATEGORY_LABELS[value] ?? value) : String(value));

  if (resolvedVariant === 'subdued') {
    return (
      <Chip
        size={size}
        title={title}
        label={
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
            <Box
              sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }}
            />
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>
              {resolvedLabel}
            </Box>
          </Box>
        }
        sx={{
          bgcolor: alpha(color, 0.10),
          border: '1px solid',
          borderColor: alpha(color, 0.25),
          ...sx,
        }}
      />
    );
  }

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
  variant: PropTypes.oneOf(['solid', 'subdued']),
  sx: PropTypes.object,
};

StatusBadge.defaultProps = {
  value: undefined,
  label: undefined,
  title: undefined,
  size: 'small',
  variant: undefined,
  sx: undefined,
};

export default StatusBadge;
