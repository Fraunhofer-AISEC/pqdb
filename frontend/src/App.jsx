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
  CssBaseline,
  Stack,
  Toolbar,
} from '@mui/material';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { useContext, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { DatabaseContext } from './components/DatabaseProvider';

import AppBar from './components/AppBar';
import CommandPalette from './components/CommandPalette';
import NavDrawer from './components/NavDrawer';
import getTheme from './theme';

function Progress() {
  return <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
}

function App() {
  const [themeId, setThemeId] = useState('light');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mini, setMini] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { db, error } = useContext(DatabaseContext);

  function toggleTheme() {
    setThemeId((themeId === 'light') ? 'dark' : 'light');
  }

  // Select the preferred theme from the system.
  useEffect(() => {
    const darkPreferred = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (darkPreferred) setThemeId('dark');
  }, []);

  // Global command-palette shortcut: Ctrl/Cmd+K opens it; '/' opens it unless
  // the user is already typing in a field.
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (e.key === '/' && !searchOpen) {
        const target = e.target;
        const tag = target?.tagName;
        const editable = tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;
        if (!editable) {
          e.preventDefault();
          setSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen]);

  const resolvedTheme = getTheme(themeId);

  let content;
  if (db) {
    content = <Outlet />;
  } else if (error) {
    content = 'There was an error while loading the database.';
  } else {
    content = <Progress />;
  }

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={resolvedTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <AppBar
            onOpenDrawer={() => setDrawerOpen(true)}
            mini={mini}
            onToggleMini={() => setMini((m) => !m)}
            onOpenSearch={() => setSearchOpen(true)}
            themeId={themeId}
            onToggleTheme={toggleTheme}
            db={db}
          />
          <NavDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            mini={mini}
            onToggleMini={() => setMini((m) => !m)}
          />

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            <Toolbar variant="dense" sx={{ mb: 1 }} />
            <Box sx={{ px: 2, flexGrow: 1 }}>
              <Stack spacing={2}>
                {content}
              </Stack>
            </Box>
          </Box>

          <CommandPalette
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            db={db}
          />
        </Box>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
