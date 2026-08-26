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
import ListIcon from '@mui/icons-material/List';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
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
import { fetchAkaMap, fetchStatusMap } from '../utils/schemeStatus';

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
  // "Standardized" now means a final standard has been published, so only
  // stage='standardized' counts here (selected-only schemes like Falcon do not).
  standardized: `SELECT COUNT(DISTINCT s.id) AS c
    FROM scheme s JOIN scheme_status ss ON ss.scheme_id = s.id
    WHERE ss.stage = 'standardized'`,
  flavors: 'SELECT COUNT(*) AS c FROM flavor',
  paramsets: 'SELECT COUNT(*) AS c FROM paramset',
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
    paramsets: count(db, SCHEME_TABLES.paramsets),
  };

  // Per-category breakdown (schemes only), most common first.
  const categories = queryAll(
    db,
    'SELECT category, COUNT(*) AS c FROM scheme GROUP BY category ORDER BY c DESC',
  );

  // Highlight selection: standardized schemes, plus those selected for
  // standardization but with no published standard yet (e.g. Falcon). The
  // badge on each card distinguishes the two.
  const highlights = queryAll(
    db,
    `SELECT DISTINCT s.* FROM scheme s
     JOIN scheme_status ss ON ss.scheme_id = s.id
     WHERE ss.stage IN ('selected', 'standardized')
     ORDER BY s.name ASC`,
  );

  const statusByScheme = fetchStatusMap(db);
  const akaByScheme = fetchAkaMap(db);

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
    { label: 'Parameter sets', value: stats.paramsets },
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

        <Stack
          direction="row"
          sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}
        >
          <Button
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
            onClick={openSearch}
            sx={{ px: 4, py: 1.25, fontSize: '1rem', width: { xs: '100%', sm: 'auto' } }}
          >
            Search schemes &amp; flavors…
          </Button>
          <Button
            component={RouterLink}
            to="/detail"
            variant="contained"
            size="large"
            startIcon={<ListIcon />}
            sx={{ px: 4, py: 1.25, fontSize: '1rem', width: { xs: '100%', sm: 'auto' } }}
          >
            Browse all schemes
          </Button>
          <Button
            component={RouterLink}
            to="/comparison"
            variant="contained"
            size="large"
            startIcon={<CompareArrowsIcon />}
            sx={{ px: 4, py: 1.25, fontSize: '1rem', width: { xs: '100%', sm: 'auto' } }}
          >
            Compare schemes
          </Button>
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
          direction="column"
          spacing={1}
          sx={{ mt: 2 }}
        >
          <Typography sx={{ fontWeight: 500, color: 'text.secondary' }}>
            Categories
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {categories.map((row) => (
              <StatusBadge
                key={row.category}
                kind="categories"
                value={row.category}
                label={`${CATEGORY_LABELS[row.category] ?? row.category} · ${row.c}`}
              />
            ))}
          </Box>
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
                <SchemeCard
                  scheme={scheme}
                  statusRows={statusByScheme.get(scheme.id) ?? []}
                  aka={akaByScheme.get(scheme.id) ?? []}
                  attacked={attackedIds.has(scheme.id)}
                  attacks={attacksByScheme[scheme.id] ?? []}
                />
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
