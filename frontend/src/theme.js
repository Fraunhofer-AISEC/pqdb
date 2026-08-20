/*
 * Design tokens and MUI theme factory.
 *
 * All styling decisions (colors, radius, elevation, component defaults) are
 * centralised here so views/components consume tokens instead of ad-hoc inline
 * values. The `dark` palette keeps the same brand hue but lightens the primary
 * for contrast on dark surfaces.
 *
 * Fonts are self-hosted (see src/fonts/fonts.css) — the family stack below
 * lists Inter first with system fallbacks.
 */

import { createTheme } from '@mui/material/styles';

// Self-hosted Inter (variable font, all weights). Explicit system/UI fallbacks
// mirror MUI's default stack so rendering stays sane if the font hasn't loaded.
const fontFamily = [
  'Inter',
  'system-ui',
  '-apple-system',
  'Segoe UI',
  'Roboto',
  'Helvetica',
  'Arial',
  'sans-serif',
].join(',');

// Self-hosted JetBrains Mono (static 400/500 + italic), used as a mono accent
// for crypto/size and numeric data. System mono fallbacks mirror the sans stack.
const fontFamilyMono = [
  'JetBrains Mono',
  'ui-monospace',
  'SFMono-Regular',
  'Menlo',
  'Monaco',
  'Consolas',
  'monospace',
].join(',');

// Deep "quantum electron" teal brand. `main` is tuned per mode so it meets
// contrast on light and dark surfaces.
const brand = {
  50: '#e9f7f8',
  100: '#c8ebee',
  200: '#9ddce2',
  300: '#6cc8d2',
  400: '#3daebd',
  500: '#2195a6',
  600: '#167885',
  700: '#12626d',
  800: '#0f4e58',
  900: '#0c3b43',
};

// Semantic status colors for category / NIST round / security-level badges.
// Kept in one place so a badge can look them up by value.
const STATUS_COLORS = {
  categories: {
    lattice: '#3d8bff',
    code: '#0d9488',
    hash: '#f59e0b',
    multivariate: '#b45309',
    isogeny: '#d946ef',
    isogenyost: '#d946ef',
    other: '#64748b',
  },
  rounds: {
    1: '#94a3b8',
    2: '#64748b',
    '3a': '#8b5cf6',
    '3f': '#6366f1',
    S: '#16a34a',
  },
  security: {
    1: '#12b76a',
    2: '#12a3b7',
    3: '#3d8bff',
    4: '#f59e0b',
    5: '#ef4444',
  },
  statefulness: {
    1: '#ea580c',
  },
};

function getTheme(mode) {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: {
        main: dark ? brand[300] : brand[600],
        light: dark ? brand[400] : brand[300],
        dark: dark ? brand[200] : brand[800],
        contrastText: dark ? brand[900] : '#ffffff',
      },
      secondary: {
        main: dark ? '#94a3b8' : '#52606d',
      },
      background: {
        default: dark ? '#0b1220' : '#f6f8fb',
        paper: dark ? '#111a2b' : '#ffffff',
      },
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily,
    },
    components: {
      MuiPaper: {
        defaultProps: {
          elevation: dark ? 1 : 2,
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '0.78rem',
          },
        },
      },
    },
  });
}

export { brand, fontFamilyMono,STATUS_COLORS };
export default getTheme;
