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
import { useLayoutEffect, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { DRAWER_MINI_WIDTH, DRAWER_WIDTH } from '../nav';
import logo from '../pqdb.svg';
import Breadcrumbs from './Breadcrumbs';

function AppBar({ onOpenDrawer, mini, onToggleMini, onOpenSearch, themeId, onToggleTheme, db }) {
  const theme = useTheme();
  const isLarge = useMediaQuery(theme.breakpoints.up('lg'));
  const dw = mini ? DRAWER_MINI_WIDTH : DRAWER_WIDTH;
  const toolbarRef = useRef(null);

  // Publish the bar's real height as a CSS variable so the layout spacer
  // (`App.jsx`) always matches. A ResizeObserver keeps it in sync with font
  // loading and responsive reflows; writing the variable directly avoids a
  // React re-render on every resize tick.
  useLayoutEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return undefined;
    const publish = () => {
      // `getBoundingClientRect` is fractional; round up so the spacer can never
      // be a sub-pixel short of the bar.
      const h = Math.ceil(toolbar.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--appbar-h', `${h}px`);
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(toolbar);
    return () => observer.disconnect();
  }, []);

  return (
    <MuiAppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
        ml: { lg: dw },
        width: { lg: `calc(100% - ${dw}px)` },
        // Never let the toolbar push the page wider than the viewport. The
        // breadcrumb already clips itself, so content is ellipsised rather
        // than clipped mid-glyph.
        overflowX: 'hidden',
      }}
    >
      <Toolbar ref={toolbarRef} variant="dense" sx={{ gap: 1 }}>
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
