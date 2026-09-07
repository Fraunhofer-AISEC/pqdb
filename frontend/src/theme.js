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

// Self-hosted JetBrains Mono (static 400 only; see fonts.css), used as a mono
// accent for crypto/size and numeric data. System mono fallbacks mirror the
// sans stack.
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

// ---------------------------------------------------------------------------
// Unified colour palette (the single source of truth for every non-neutral
// colour in the app). `brand` above is the teal anchor; each additional hue is
// exposed as { main, light, dark } so a token can be drawn as a solid badge
// (`main`) or tinted surface (`light`/`dark`) on both light and dark paper.
// Every semantic colour below and the logo's fills derive from these hues so
// the whole site reads as one palette. See DESIGN_LANGUAGE.md.
// ---------------------------------------------------------------------------
const PALETTE = {
  teal: { main: '#2195a6', light: '#6cc8d2', dark: '#12626d' },
  indigo: { main: '#4f6ef7', light: '#8199f8', dark: '#3a54c9' },
  violet: { main: '#8b5cf6', light: '#a78bfa', dark: '#6d3ef0' },
  sky: { main: '#0ea5e9', light: '#38bdf8', dark: '#0284c7' },
  magenta: { main: '#d946ef', light: '#e879f9', dark: '#b11fd0' },
  amber: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
  green: { main: '#16a34a', light: '#22c55e', dark: '#15803d' },
  coral: { main: '#ef4444', light: '#f87171', dark: '#dc2626' },
  slate: { main: '#64748b', light: '#94a3b8', dark: '#475569' },
};

// Semantic status colors for category / NIST round / security-level badges,
// derived from PALETTE so badges always match the brand/logo hues.
const STATUS_COLORS = {
  categories: {
    lattice: PALETTE.indigo.main,
    code: PALETTE.teal.main,
    hash: PALETTE.violet.main,
    multivariate: PALETTE.amber.dark,
    isogeny: PALETTE.magenta.main,
    isogenyost: PALETTE.magenta.main,
    'mpc-in-the-head': PALETTE.sky.main,
    other: PALETTE.slate.main,
  },
  rounds: {
    1: PALETTE.slate.light,
    2: PALETTE.slate.main,
    '3a': PALETTE.violet.main,
    '3': '#a855f7',
    '3f': '#6366f1',
    4: PALETTE.sky.main,
    selected: PALETTE.amber.main,
    standardized: PALETTE.green.main,
    deprecated: PALETTE.slate.main,
  },
  security: {
    1: PALETTE.green.main,
    2: '#12a3b7',
    3: PALETTE.indigo.main,
    4: PALETTE.amber.main,
    5: PALETTE.coral.main,
  },
  statefulness: {
    1: '#ea580c',
  },
};

// Human-readable category names, keyed by the category value used for chips and
// UI. Kept alongside the category colour tokens so the display name of every
// category lives in one place.
const CATEGORY_LABELS = {
  lattice: 'Lattice',
  code: 'Code',
  multivariate: 'Multivariate',
  isogeny: 'Isogeny',
  hash: 'Hash',
  'mpc-in-the-head': 'MPC-in-the-Head',
  other: 'Other',
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

export { brand, fontFamilyMono, CATEGORY_LABELS, PALETTE, STATUS_COLORS };
export default getTheme;
