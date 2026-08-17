/*
 * Copyright (c) 2023, Fraunhofer AISEC.
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

import {
  Box,
  CircularProgress,
  Container,
  CssBaseline,
  Drawer,
  Grid,
  IconButton,
  Link as MuiLink,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Brightness4 as DarkIcon,
  BrightnessHigh as LightIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import {
  Link,
  Outlet,
  useNavigate,
} from 'react-router-dom';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { useContext, useEffect, useState } from 'react';

import { DatabaseContext } from './components/DatabaseProvider';
import DrawerList from './components/DrawerList';
import getTheme from './theme';
import logo from './pqdb.svg';

// User-facing theme preference. 'system' follows the OS setting and reacts to
// changes live; 'light'/'dark' are the explicit persistent choices.
const THEME_MODES = ['light', 'dark', 'system'];
const THEME_STORAGE_KEY = 'pqdb-theme-mode';

function readStoredMode() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (THEME_MODES.includes(stored)) return stored;
  } catch {
    // localStorage unavailable (e.g. privacy mode) — fall through to default.
  }
  return 'system';
}

// Resolve the effective light/dark palette for the current preference and OS.
function resolveMode(preference, systemDark) {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
}

// Add new views for the DrawerList here
const views = {
  '': {
    name: 'Welcome Page',
    description: 'Contains info about this website.',
  },
  raw_sql: {
    name: 'Custom SQL Query',
    description: 'Enter a custom database query and display the result in a table.',
  },
  detail: {
    name: 'Scheme Details',
    description: 'Browse data stored for a scheme',
  },
  comparison: {
    name: 'Scheme Comparison',
    description: 'Compare schemes based on memory requirements and performance.',
  },
};

const pathname = (key) => `/${key}`;

function Progress() {
  return <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
}

function App() {
  const [themePreference, setThemePreference] = useState(readStoredMode);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { db, error } = useContext(DatabaseContext);

  const navigate = useNavigate();
  // const [searchParams] = useSearchParams();

  function switchView(view) {
    navigate(pathname(view));
    setDrawerOpen(false);
  }

  function cycleTheme() {
    const next = THEME_MODES[(THEME_MODES.indexOf(themePreference) + 1) % THEME_MODES.length];
    setThemePreference(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Persistence is best-effort; the in-memory choice still applies.
    }
  }

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    setSystemDark(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const mode = resolveMode(themePreference, systemDark);
  const theme = getTheme(mode);
  const nextModeLabel = THEME_MODES[(THEME_MODES.indexOf(themePreference) + 1) % THEME_MODES.length];

  let content;
  if (db) {
    content = (
      <Grid container size="grow">
        <Outlet />
      </Grid>
    );
  } else if (error) {
    content = 'There was an error while loading the database.';
  } else {
    content = <Progress />;
  }
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            <div>
              <Container maxWidth="sm">
                <Link to="/">
                  <img src={logo} style={{ width: '100%', height: 'auto' }} alt="Logo" />
                </Link>
              </Container>
            </div>
            {content}
            <div>
              <Container maxWidth="lg">
                <Paper>
                  <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title={`Theme: ${themePreference}. Click to switch to ${nextModeLabel}.`}>
                      <IconButton onClick={cycleTheme} size="large">
                        {(mode === 'dark') ? <LightIcon /> : <DarkIcon />}
                      </IconButton>
                    </Tooltip>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>{themePreference}</Typography>
                  </Box>
                </Paper>
              </Container>
            </div>
            <div>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <MuiLink href="https://www.aisec.fraunhofer.de/en/imprint.html">Imprint</MuiLink>
                <MuiLink component={Link} to="/privacy_policy">Privacy Policy</MuiLink>
              </Box>
            </div>
          </Stack>
          <IconButton
            style={{ position: 'absolute', top: 0, left: 0 }}
            onClick={() => setDrawerOpen(true)}
            size="large"
          >
            <MenuIcon />
          </IconButton>
        </Box>
        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <DrawerList onClick={(view) => switchView(view)} views={views} />
        </Drawer>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
export { pathname, views };
