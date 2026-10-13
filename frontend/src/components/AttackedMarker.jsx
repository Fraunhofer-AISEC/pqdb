/*
 * AttackedMarker — a shared, compact warning indicator for schemes that have
 * known attacks. Renders a red warning icon (optionally with a "known attacks"
 * label). The attack descriptions themselves remain on the scheme detail page.
 * Used across the scheme overview cards, scheme detail, and flavor views so
 * the "has been attacked" signal looks consistent everywhere.
 */

import { Report as ReportIcon } from '@mui/icons-material';
import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import PropTypes from 'prop-types';

function AttackedMarker({ label = false, size = 'small', wrapLabel = false, sx }) {
  const theme = useTheme();

  const iconSize = size === 'small' ? 18 : 22;

  return (
    <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: label ? 1 : 0.5,
          py: 0.25,
          borderRadius: 1,
          color: 'error.main',
          bgcolor: label ? alpha(theme.palette.error.main, 0.12) : 'transparent',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          ...sx,
        }}
      >
        <ReportIcon sx={{ fontSize: iconSize, flexShrink: 0 }} />
        {label && (
          <Typography
            component="span"
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              // On xs viewports the label wraps over two lines ("known" /
              // "attacks") so the badge stays narrow next to a scheme name.
              ...(wrapLabel && {
                width: { xs: 'min-content', sm: 'auto' },
                whiteSpace: { xs: 'normal', sm: 'inherit' },
                lineHeight: { xs: 1.15, sm: 1 },
              }),
            }}
          >
            known attacks
          </Typography>
        )}
      </Box>
  );
}

AttackedMarker.propTypes = {
  label: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium']),
  wrapLabel: PropTypes.bool,
  sx: PropTypes.object,
};

export default AttackedMarker;
