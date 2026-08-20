/*
 * Landing page (route "/").
 *
 * A hero/landing for pqdb: brand value proposition, a well-visible search entry
 * point, live stats computed from the in-browser SQLite DB, and a highlight
 * selection of standardized schemes as cards. It deliberately does NOT list the
 * full scheme catalogue (that lives on the Scheme Overview page,
 * which is a separate backlog task). Instead it features scheme cards and a
 * search button that opens the global CommandPalette.
 */

import SearchIcon from '@mui/icons-material/Search';
import {
  alpha,
  Box,
  Button,
  Container,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useContext, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { DatabaseContext } from '../components/DatabaseProvider';
import SchemeCard from '../components/SchemeCard';
import { useSearchDialog } from '../components/SearchDialogContext';
import StatusBadge from '../components/StatusBadge';
import logo from '../pqdb.svg';
import queryAll from '../utils/queryAll';

// Human-readable category labels for the per-category breakdown. Unknown
// categories fall back to their raw value.
const CATEGORY_LABELS = {
  lattice: 'Lattice',
  code: 'Code',
  multivariate: 'Multivariate',
  isogeny: 'Isogeny',
  hash: 'Hash',
  other: 'Other',
};

const SCHEME_TABLES = {
  total: 'SELECT COUNT(*) AS c FROM scheme',
  enc: "SELECT COUNT(*) AS c FROM scheme WHERE type='enc'",
  sig: "SELECT COUNT(*) AS c FROM scheme WHERE type='sig'",
  standardized: "SELECT COUNT(*) AS c FROM scheme WHERE nist_round='S'",
  flavors: 'SELECT COUNT(*) AS c FROM flavor',
};

function count(db, sql) {
  const row = queryAll(db, sql)[0];
  return row ? row.c : 0;
}

function Home() {
  const { db } = useContext(DatabaseContext);
  const { openSearch } = useSearchDialog();
  const theme = useTheme();

  useEffect(() => {
    document.title = 'pqdb';
  }, []);

  if (!db) return null;

  const stats = {
    total: count(db, SCHEME_TABLES.total),
    enc: count(db, SCHEME_TABLES.enc),
    sig: count(db, SCHEME_TABLES.sig),
    standardized: count(db, SCHEME_TABLES.standardized),
    flavors: count(db, SCHEME_TABLES.flavors),
  };

  // Per-category breakdown (schemes only), most common first.
  const categories = queryAll(
    db,
    'SELECT category, COUNT(*) AS c FROM scheme GROUP BY category ORDER BY c DESC',
  );

  // Highlight selection: standardized schemes only (one-line WHERE change if
  // round-3 finalists should be included later, e.g. IN ('S','3f')).
  const highlights = queryAll(
    db,
    "SELECT * FROM scheme WHERE nist_round='S' ORDER BY name ASC",
  );

  // Schemes that have known attacks (for explicit marking on their cards);
  // map scheme id -> attack descriptions so cards can surface them on hover.
  const attacksByScheme = {};
  const attackedIds = new Set();
  for (const a of queryAll(db, 'SELECT scheme_id, url FROM scheme_attack;')) {
    attackedIds.add(a.scheme_id);
    (attacksByScheme[a.scheme_id] = attacksByScheme[a.scheme_id] || []).push(a.url);
  }

  const statTiles = [
    { label: 'Schemes', value: stats.total },
    { label: 'Key Exchange', value: stats.enc },
    { label: 'Signatures', value: stats.sig },
    { label: 'Standardized', value: stats.standardized },
    { label: 'Flavors', value: stats.flavors },
  ];

  return (
    <Container maxWidth="lg">
      {/* Hero */}
      <Paper
        sx={{
          mb: 3,
          p: { xs: 3, md: 5 },
          textAlign: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)}, ${alpha(theme.palette.primary.main, 0.05)})`,
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="pqdb"
          sx={{ height: 72, width: 'auto', mb: 2 }}
        />
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          The database of post-quantum cryptography
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: 640, mx: 'auto', mb: 3, fontWeight: 400 }}
        >
          Browse schemes, flavors, parameter sets, and benchmarks, and see
          where each one stands in NIST standardization.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<SearchIcon />}
          onClick={openSearch}
          sx={{ px: 4, py: 1.25, fontSize: '1rem' }}
        >
          Search schemes &amp; flavors…
        </Button>

        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: 'center', flexWrap: 'wrap', mt: 2 }}
        >
          <Link href="https://github.com/Fraunhofer-AISEC/pqdb/" target="_blank" rel="noopener">
            GitHub
          </Link>
          <Link component={RouterLink} to="/detail">Browse all schemes</Link>
          <Link component={RouterLink} to="/comparison">Compare schemes</Link>
        </Stack>
      </Paper>

      {/* Live stats */}
      <Paper sx={{ mb: 3, p: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Key figures
        </Typography>
        <Grid container spacing={2}>
          {statTiles.map((t) => (
            <Grid key={t.label} size={{ xs: 6, sm: 4, md: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  textAlign: 'center',
                  height: '100%',
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {t.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 2 }}
        >
          <Typography sx={{ fontWeight: 500, color: 'text.secondary', mr: 1, whiteSpace: 'nowrap' }}>
            Categories
          </Typography>
          {categories.map((row) => (
            <StatusBadge
              key={row.category}
              kind="categories"
              value={row.category}
              label={`${CATEGORY_LABELS[row.category] ?? row.category} · ${row.c}`}
            />
          ))}
        </Stack>
      </Paper>

      {/* Highlight cards */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Standardized schemes
        </Typography>
        {highlights.length > 0 ? (
          <Grid container spacing={2}>
            {highlights.map((scheme) => (
              <Grid key={scheme.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <SchemeCard scheme={scheme} attacked={attackedIds.has(scheme.id)} attacks={attacksByScheme[scheme.id] ?? []} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography color="text.secondary">
            No schemes are marked as standardized yet.
          </Typography>
        )}
      </Paper>

      {/* Informational strip */}
      <Paper sx={{ mt: 3, p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Built with
          {' '}
          <Link href="https://reactjs.org/">React</Link>
          , this page runs entirely in the browser. It reads its data from a
          {' '}
          <Link href="https://www.sqlite.org/">SQLite</Link>
          {' '}
          database (
          <Link href="pqdb.sqlite">pqdb.sqlite</Link>
          ) generated from the
          {' '}
          <Link href="https://github.com/Fraunhofer-AISEC/pqdb/">pqdb</Link>
          {' '}
          repository. Want to help? See
          {' '}
          <Link href="https://github.com/Fraunhofer-AISEC/pqdb#contribute">the contribution guide</Link>
          .
        </Typography>
      </Paper>
    </Container>
  );
}

export default Home;
