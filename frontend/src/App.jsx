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
  Paper,
  Tooltip,
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
import React, { useContext, useEffect, useState } from 'react';
import { StyledEngineProvider, ThemeProvider, createTheme } from '@mui/material/styles';

import { DatabaseContext } from './components/DatabaseProvider';
import DrawerList from './components/DrawerList';
import logo from './pqdb.svg';

const defaultTheme = createTheme();
function getTheme(type) {
  return createTheme({
    components: {
      MuiToggleButton: {
        styleOverrides: {
          root: {
            '&.Mui-disabled': {
              color: defaultTheme.palette.action.disabled,
            },
          },
        },
      },
    },
    palette: {
      mode: type,
    },
  });
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
  return <Box display="flex" justifyContent="center"><CircularProgress /></Box>;
}

function App() {
  const [themeId, setThemeId] = useState('light');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { db, error } = useContext(DatabaseContext);

  const navigate = useNavigate();
  // const [searchParams] = useSearchParams();

  function switchView(view) {
    navigate(pathname(view));
    setDrawerOpen(false);
  }

  function toggleTheme() {
    setThemeId((themeId === 'light') ? 'dark' : 'light');
  }

  useEffect(() => {
    const darkPreferred = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (darkPreferred) setThemeId('dark');
  }, []);

  let content;
  if (db) {
    content = (
      <Grid container item>
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
      <ThemeProvider theme={getTheme(themeId)}>
        <CssBaseline />
        <Box p={2}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <Container maxWidth="sm">
                <Link to="/">
                  <img src={logo} style={{ width: '100%', height: 'auto' }} alt="Logo" />
                </Link>
              </Container>
            </Grid>
            {content}
            <Grid item>
              <Container maxWidth="lg">
                <Paper>
                  <Box p={1} display="flex" alignItems="center" justifyContent="center">
                    <Tooltip title={`Switch to ${(themeId === 'light') ? 'dark' : 'light'} theme`}>
                      <IconButton onClick={() => toggleTheme()} size="large">
                        {(themeId === 'light') ? <DarkIcon /> : <LightIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Container>
            </Grid>
          </Grid>
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
