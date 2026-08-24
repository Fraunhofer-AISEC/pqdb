/*
 * Command palette — a global "jump to" search over schemes and flavors.
 *
 * Triggered from the AppBar search button or via Ctrl/Cmd+K (and `/` when not
 * already typing in a field). It reads the already-loaded in-browser SQLite
 * database (no network), filters schemes/flavors by name / id / description /
 * category, and navigates straight to the matching detail page.
 *
 * Kept dependency-free on purpose: a plain MUI Autocomplete + Dialog, so no new
 * runtime dependency (and therefore no privacy or CSP impact) is introduced.
 */

import {
  ArrowForward as ArrowForwardIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Dialog,
  DialogContent,
  ListItemButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { derivePrimaryStatus, SCHEME_TYPES, STAGES } from '../constants';
import detailLink from '../utils/detailLink';
import queryAll from '../utils/queryAll';
import { fetchStatusMap } from '../utils/schemeStatus';
import Mono from './Mono';
import StatusBadge from './StatusBadge';

// Build a flat list of searchable records (one per scheme and one per flavor),
// each carrying enough context to render and to construct its detail link.
function buildIndex(db) {
  const statusByScheme = fetchStatusMap(db);
  const schemes = queryAll(
    db,
    'SELECT id, id_text, name, description, category, stateful, stateful_comment FROM scheme ORDER BY name ASC',
  );
  const entries = schemes.flatMap((s) => {
    const statusRows = statusByScheme.get(s.id) ?? [];
    const schemeEntry = {
      id: `scheme-${s.id}`,
      to: detailLink(s.id_text),
      title: s.name,
      subtitle: s.description ?? '',
      scheme: s,
      statusRows,
      flavor: null,
    };
    const flavors = queryAll(
      db,
      'SELECT id, id_text, name, description, type FROM flavor WHERE scheme_id=? ORDER BY name ASC',
      [s.id],
    ).map((f) => ({
      id: `flavor-${f.id}`,
      to: detailLink(s.id_text, f.id_text),
      title: `${s.name} · ${f.name}`,
      subtitle: f.description ?? '',
      scheme: s,
      statusRows,
      flavor: f,
    }));
    return [schemeEntry, ...flavors];
  });
  return entries;
}

function matches(entry, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    entry.title,
    entry.subtitle,
    entry.scheme.name,
    entry.scheme.id_text,
    entry.scheme.category,
    entry.statusRows.map((s) => `${s.process} ${s.stage}`).join(' '),
    ...(entry.flavor
      ? [entry.flavor.id_text, entry.flavor.name, entry.flavor.type]
      : []),
  ].join(' ').toLowerCase();
  return haystack.includes(q);
}

function CommandPalette({ open, onClose, db }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const index = useMemo(() => (db ? buildIndex(db) : []), [db]);
  const results = useMemo(
    () => index.filter((entry) => matches(entry, query)),
    [index, query],
  );

  // Focus the text field and reset the query each time the palette opens.
  // The Autocomplete popup is forced open (`open={open}`) so the whole list is
  // visible immediately like a command palette; typing narrows it via `query`.
  useEffect(() => {
    if (open) {
      setQuery('');
      // Small delay so the dialog has mounted before we focus its input.
      const id = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  // Close the palette on Escape. MUI's Autocomplete calls stopPropagation() on
  // Escape to keep its popup open/close handling local, which would otherwise
  // swallow the keystroke before the Dialog's own escape handling runs. A
  // capture-phase listener runs before that bubble-phase handler, so Escape
  // reliably closes the whole palette.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDownCapture = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDownCapture, true);
    return () => window.removeEventListener('keydown', onKeyDownCapture, true);
  }, [open, onClose]);

  function handleSelect(_event, value) {
    if (!value) return;
    navigate(value.to);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden' },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Autocomplete
          open={open}
          options={results}
          getOptionLabel={(option) => option.title}
          filterOptions={(options) => options}
          noOptionsText={db ? 'No matching schemes or flavors' : 'Loading…'}
          autoHighlight
          onChange={handleSelect}
          onInputChange={(_event, value) => setQuery(value)}
          slotProps={{
            popper: {
              // The listbox portals to document.body; raise it above the
              // Dialog (zIndex.modal) so it renders over the search box.
              sx: { zIndex: 1400 },
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={inputRef}
              placeholder="Search schemes and flavors…"
              slotProps={{
                // Merge into MUI 9's slotProps rather than replacing them:
                // replacing them drops `htmlInput` (carries MUI's input ref)
                // and `inputLabel`. We only swap the leading adornment with
                // the search icon, keeping the popper anchor + popup indicator.
                ...params.slotProps,
                input: {
                  ...params.slotProps.input,
                  startAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', pl: 1 }}>
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </Box>
                  ),
                },
              }}
              sx={{
                '& fieldset': { border: 'none' },
                '& .MuiAutocomplete-input': { py: 2.5, fontSize: '1.05rem' },
              }}
            />
          )}
          renderOption={(props, option) => (
            <ListItemButton
              {...props}
              sx={{ display: 'block', px: 2.5, py: 1.25 }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                    {option.title}
                  </Typography>
                  {option.subtitle && (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {option.subtitle}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center' }}>
                    <StatusBadge
                      kind="categories"
                      value={option.scheme.category}
                      label={option.scheme.category}
                      size="small"
                    />
                    {(() => {
                      const primary = derivePrimaryStatus(option.statusRows);
                      return primary && (
                        <StatusBadge
                          kind="rounds"
                          value={primary.stage}
                          label={STAGES[primary.stage]?.short}
                          size="small"
                        />
                      );
                    })()}
                    {option.scheme.stateful === 1 && (
                      <StatusBadge
                        kind="statefulness"
                        value={1}
                        label="stateful"
                        title={option.scheme.stateful_comment}
                        size="small"
                      />
                    )}
                    {option.flavor
                      ? (
                        <Typography variant="caption" color="text.secondary">
                          {SCHEME_TYPES[option.scheme.type]?.name}
                          {' · '}
                          <Mono>{option.flavor.id_text}</Mono>
                        </Typography>
                      )
                      : (
                        <Typography variant="caption" color="text.secondary">
                          {SCHEME_TYPES[option.scheme.type]?.name}
                        </Typography>
                      )}
                  </Stack>
                </Box>
                <ArrowForwardIcon sx={{ color: 'text.disabled' }} />
              </Stack>
            </ListItemButton>
          )}
        />
        <Paper
          square
          elevation={0}
          sx={{
            px: 2.5,
            py: 1,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {results.length}
            {' '}
            result{results.length === 1 ? '' : 's'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ↑↓ to move · Enter to open · Esc to close
          </Typography>
        </Paper>
      </DialogContent>
    </Dialog>
  );
}

CommandPalette.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  db: PropTypes.shape({
    prepare: PropTypes.func.isRequired,
  }),
};

CommandPalette.defaultProps = {
  db: null,
};

export default CommandPalette;
