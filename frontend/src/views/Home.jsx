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

import {
  alpha,
  Box,
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
import StatusBadge from '../components/StatusBadge';
import { CATEGORY_LABELS } from '../theme';
import logo from '../pqdb.svg';
import overviewLink from '../utils/overviewLink';
import queryAll from '../utils/queryAll';
import { fetchAkaMap, fetchStatusMap } from '../utils/schemeStatus';

const SCHEME_TABLES = {
  total: 'SELECT COUNT(*) AS c FROM scheme',
  enc: "SELECT COUNT(*) AS c FROM scheme WHERE type='enc'",
  sig: "SELECT COUNT(*) AS c FROM scheme WHERE type='sig'",
  // "Standardized" here matches the Scheme Overview's Standardized track: it
  // counts both published-final-standard schemes and those selected for
  // standardization whose standard is still pending (e.g. Falcon).
  standardized: `SELECT COUNT(DISTINCT s.id) AS c
    FROM scheme s JOIN scheme_status ss ON ss.scheme_id = s.id
    WHERE ss.stage IN ('standardized', 'selected')`,
  flavors: 'SELECT COUNT(*) AS c FROM flavor',
  paramsets: 'SELECT COUNT(*) AS c FROM paramset',
};

function count(db, sql) {
  const row = queryAll(db, sql)[0];
  return row ? row.c : 0;
}

function Home() {
  const { db } = useContext(DatabaseContext);
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
    // Scheme-level figures link into the filtered overview; flavor/paramset
    // tiles stay static because they are not scheme filters.
    {
      label: 'Schemes',
      value: stats.total,
      to: overviewLink({ track: 'all' }),
    },
    {
      label: 'Key Exchange',
      value: stats.enc,
      to: overviewLink({ track: 'all', type: 'enc' }),
    },
    {
      label: 'Signatures',
      value: stats.sig,
      to: overviewLink({ track: 'all', type: 'sig' }),
    },
    {
      label: 'Standardized',
      value: stats.standardized,
      to: overviewLink({ track: 'standardized' }),
    },
    { label: 'Flavors', value: stats.flavors },
    { label: 'Parameter sets', value: stats.paramsets },
  ];

  // Whether a stat tile should render as a link (scheme-level figures only).
  const isStatLink = (tile) => Boolean(tile.to);

  const statContent = (tile) => (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        textAlign: 'center',
        height: '100%',
        ...(isStatLink(tile)
          ? {
              color: 'inherit',
              textDecoration: 'none',
              display: 'block',
              transition: 'background-color 0.15s, border-color 0.15s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.06),
              },
            }
          : {}),
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
        {tile.value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {tile.label}
      </Typography>
    </Box>
  );

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
      </Paper>

      {/* Live stats */}
      <Paper sx={{ mb: 3, p: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Key figures
        </Typography>
        <Grid container spacing={2}>
          {statTiles.map((t) => (
            <Grid key={t.label} size={{ xs: 6, sm: 4, md: 2 }}>
              {isStatLink(t) ? (
                <Link component={RouterLink} to={t.to} underline="none" sx={{ display: 'block', height: '100%' }}>
                  {statContent(t)}
                </Link>
              ) : (
                statContent(t)
              )}
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
              <Link
                key={row.category}
                component={RouterLink}
                to={overviewLink({ track: 'all', category: row.category })}
                underline="none"
                sx={{ display: 'inline-block' }}
              >
                <StatusBadge
                  kind="categories"
                  value={row.category}
                  label={`${CATEGORY_LABELS[row.category] ?? row.category} · ${row.c}`}
                />
              </Link>
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
