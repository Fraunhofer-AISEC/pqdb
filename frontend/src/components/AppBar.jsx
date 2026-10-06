/*
 * Top application bar for the shell.
 *
 * Holds the side-nav expand/collapse control, the logo (which links home), and
 * the global search trigger. Uses MUI tokens for both palettes; no hard-coded
 * colours beyond the theme. On large screens the bar is shifted right by the
 * persistent drawer's width; on smaller screens it spans full width and the
 * hamburger toggles a temporary overlay drawer.
 */

import {
  Brightness4 as DarkIcon,
  BrightnessHigh as LightIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  AppBar as MuiAppBar,
  Box,
  IconButton,
  Link,
  Toolbar,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';

import { DRAWER_MINI_WIDTH, DRAWER_WIDTH } from '../nav';
import logo from '../pqdb.svg';
import Breadcrumbs from './Breadcrumbs';

function AppBar({ onOpenDrawer, mini, onToggleMini, onOpenSearch, themeId, onToggleTheme, db }) {
  const theme = useTheme();
  const isLarge = useMediaQuery(theme.breakpoints.up('lg'));
  const dw = mini ? DRAWER_MINI_WIDTH : DRAWER_WIDTH;

  return (
    <MuiAppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
        ml: { lg: dw },
        width: { lg: `calc(100% - ${dw}px)` },
      }}
    >
      <Toolbar variant="dense" sx={{ gap: 1 }}>
        {isLarge ? (
          <Tooltip title={mini ? 'Expand navigation' : 'Collapse navigation'}>
            <IconButton onClick={onToggleMini} edge="start" size="small">
              {mini ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Open navigation">
            <IconButton onClick={onOpenDrawer} edge="start" size="small">
              <MenuIcon />
            </IconButton>
          </Tooltip>
        )}

        <Link component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <Box
            component="img"
            src={logo}
            alt="pqdb"
            sx={{ height: 40, width: 'auto' }}
          />
        </Link>

        {db && <Breadcrumbs db={db} sx={{ px: 1, pb: 0 }} />}

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title={`Switch to ${(themeId === 'light') ? 'dark' : 'light'} theme`}>
          <IconButton onClick={onToggleTheme} size="small" aria-label="Toggle theme">
            {(themeId === 'light') ? <DarkIcon /> : <LightIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Search schemes and flavors (Ctrl+K / /)">
          <IconButton onClick={onOpenSearch} size="small" aria-label="Search">
            <SearchIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </MuiAppBar>
  );
}

AppBar.propTypes = {
  onOpenDrawer: PropTypes.func.isRequired,
  mini: PropTypes.bool.isRequired,
  onToggleMini: PropTypes.func.isRequired,
  onOpenSearch: PropTypes.func.isRequired,
  themeId: PropTypes.string.isRequired,
  onToggleTheme: PropTypes.func.isRequired,
  db: PropTypes.shape({
    prepare: PropTypes.func.isRequired,
  }),
};

export default AppBar;
