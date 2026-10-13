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
  Chip,
  Container,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { Fragment, useContext, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { DatabaseContext } from '../components/DatabaseProvider';
import SchemeCard from '../components/SchemeCard';
import { PROCESS_DISPLAY_ORDER, PROCESSES } from '../constants';
import logo from '../pqdb.svg';
import { CATEGORY_LABELS, STATUS_COLORS } from '../theme';
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
};

// Scheme count within a single standardization process (distinct scheme ids),
// used for the per-process tiles. Mirrors the Overview's "visible processes".
const PROCESS_SCHEME_COUNT = `SELECT COUNT(DISTINCT s.id) AS c
  FROM scheme s JOIN scheme_status ss ON ss.scheme_id = s.id
  WHERE ss.process = ?`;

// Short labels for the per-process tiles (PROCESSES holds the full names,
// which would not fit a tile). Falls back to the full process name.
const PROCESS_TILE_LABELS = {
  'nist-pqc': 'NIST PQC',
  'nist-additional-sigs': 'NIST Additional Signatures',
  'nist-sp': 'NIST SP',
  rfc: 'IETF RFC',
  iso: 'ISO',
  other: 'Other',
};

function count(db, sql, params) {
  const row = queryAll(db, sql, params)[0];
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
  };

  // Per-process scheme counts (only the processes shown on the Overview),
  // most prominent first.
  const processStats = PROCESS_DISPLAY_ORDER
    .map((process) => ({
      process,
      value: count(db, PROCESS_SCHEME_COUNT, [process]),
    }))
    .filter(({ value }) => value > 0);

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

  // Schemes that have known attacks (for explicit marking on their cards).
  const attackedIds = new Set(
    queryAll(db, 'SELECT DISTINCT scheme_id FROM scheme_attack;').map((a) => a.scheme_id),
  );

  // Coverage summary: the whole catalogue split by scheme type. The total is
  // the strongest element; the type split reads as quieter detail on one row.
  const coverage = [
    {
      value: stats.total,
      singular: 'scheme',
      plural: 'schemes',
      to: overviewLink({ track: 'all' }),
      primary: true,
    },
    {
      value: stats.enc,
      singular: 'key exchange',
      plural: 'key exchange',
      to: overviewLink({ track: 'all', type: 'enc' }),
    },
    {
      value: stats.sig,
      singular: 'signature',
      plural: 'signatures',
      to: overviewLink({ track: 'all', type: 'sig' }),
    },
  ];

  // Standardization figures, shown in the Standardization Overview section
  // where their meaning has context: the combined standardized/selected count
  // plus one entry per process (distinct schemes).
  const standardization = [
    {
      label: 'Standardized',
      value: stats.standardized,
      to: overviewLink({ track: 'standardized' }),
    },
    ...processStats.map(({ process, value }) => ({
      label: PROCESS_TILE_LABELS[process] ?? PROCESSES[process] ?? process,
      value,
      to: overviewLink({ track: process }),
    })),
  ];

  // Subdued "browse by category" chip: a tinted background + faint border
  // instead of a solid block, a small colour dot to keep the badge mapping,
  // and the count rendered quieter than the category name. Stronger on hover.
  const categoryChip = (row) => {
    const color =
      STATUS_COLORS.categories[row.category]
      ?? STATUS_COLORS.categories.other
      ?? '#64748b';
    const name = CATEGORY_LABELS[row.category] ?? row.category;
    return (
      <Link
        key={row.category}
        component={RouterLink}
        to={overviewLink({ track: 'all', category: row.category })}
        underline="none"
        sx={{ display: 'inline-block' }}
      >
        <Chip
          label={
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: color,
                  flexShrink: 0,
                }}
              />
              <Typography
                component="span"
                sx={{ fontWeight: 500, color: 'text.primary' }}
              >
                {name}
              </Typography>
              <Typography
                component="span"
                sx={{ color: 'text.secondary', fontSize: '0.78rem' }}
              >
                · {row.c}
              </Typography>
            </Box>
          }
          sx={{
            height: 30,
            bgcolor: alpha(color, 0.10),
            border: '1px solid',
            borderColor: alpha(color, 0.25),
            transition: 'background-color 0.15s, border-color 0.15s',
            '& .MuiChip-label': { px: 1.5 },
            '&:hover': {
              bgcolor: alpha(color, 0.18),
              borderColor: alpha(color, 0.5),
            },
          }}
        />
      </Link>
    );
  };

  return (
    <Container maxWidth="lg">
      {/* Hero */}
      <Paper
      elevation={0}
      sx={{
        mb: 3,
        px: { xs: 3, md: 5 },
        py: { xs: 3, md: 4 },
        textAlign: 'center',
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
        background: `linear-gradient(
          135deg,
          ${alpha(theme.palette.primary.main, 0.08)},
          ${alpha(theme.palette.primary.main, 0.02)}
        )`,
      }}
      >
        <Box
          component="img"
          src={logo}
          alt="pqdb"
          sx={{
            display: 'block',
            height: { xs: 80, md: 96 },
            width: 'auto',
            mx: 'auto',
            mb: 2,
          }}
        />

        <Typography
          component="h1"
          sx={{
            fontSize: { xs: '1.75rem', md: '2.125rem' },
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.025em',
            textWrap: 'balance',
            mb: 1.5,
          }}
        >
          Post-Quantum Cryptography Database
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            maxWidth: 600,
            mx: 'auto',
            fontSize: { xs: '1rem', md: '1.125rem' },
            lineHeight: 1.6,
            textWrap: 'pretty',
          }}
        >
          Explore post-quantum schemes, compare parameter sets and
          benchmarks, and track NIST standardization status.
        </Typography>
      </Paper>

      {/* Explore the database: coverage summary + browse by category */}
      <Paper sx={{ mb: 3, p: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Explore the database
        </Typography>

        {/* Coverage summary on one compact row, no individual card
            backgrounds. The total is the strongest element; the type split is
            quieter detail, with a separator between figures. Rendered in
            normal inline flow (not flex) so all figures share a single text
            baseline regardless of font size. */}
        <Box sx={{ mb: 3 }}>
          {coverage.map((c, i) => (
            <Fragment key={c.label}>
              {i > 0 && (
                <>
                  {' '}
                  <Typography component="span" color="text.secondary" aria-hidden>
                    ·
                  </Typography>
                  {' '}
                </>
              )}
              <Link
                component={RouterLink}
                to={c.to}
                underline="hover"
                color={c.primary ? 'text.primary' : 'text.secondary'}
                sx={{ whiteSpace: 'nowrap' }}
              >
                <Typography
                  component="span"
                  sx={{
                    lineHeight: 1.2,
                    ...(c.primary
                      ? { fontSize: { xs: '1.5rem', md: '1.9rem' }, fontWeight: 800 }
                      : { fontSize: '1rem', fontWeight: 600 }),
                  }}
                >
                  {c.value}
                </Typography>
                {' '}
                <Typography component="span" sx={{ lineHeight: 1.2 }}>
                  {c.value === 1 ? c.singular : c.plural}
                </Typography>
              </Link>
            </Fragment>
          ))}
        </Box>

        <Typography sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
          Browse by category
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {categories.map(categoryChip)}
        </Box>
      </Paper>

      {/* Highlight cards */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Standardization Overview
        </Typography>

        {/* Standardization figures live here, where their meaning has
            context. Each links to the matching filtered Overview view. */}
        <Stack
          direction="row"
          flexWrap="wrap"
          useFlexGap
          spacing={2.5}
          sx={{ mb: 2 }}
        >
          {standardization.map((s) => (
            <Link
              key={s.label}
              component={RouterLink}
              to={s.to}
              underline="hover"
              color="text.secondary"
            >
              <Typography
                component="span"
                sx={{ fontWeight: 700, color: 'text.primary' }}
              >
                {s.value}
              </Typography>
              {' '}
              <Typography component="span">{s.label}</Typography>
            </Link>
          ))}
        </Stack>
        {highlights.length > 0 ? (
          <Grid container spacing={2}>
            {highlights.map((scheme) => (
              <Grid key={scheme.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <SchemeCard
                  scheme={scheme}
                  statusRows={statusByScheme.get(scheme.id) ?? []}
                  aka={akaByScheme.get(scheme.id) ?? []}
                  attacked={attackedIds.has(scheme.id)}
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
