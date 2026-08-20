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
/*
 * Scheme Overview — the full scheme catalogue organised by NIST round.
 *
 * Each NIST round with at least one scheme renders as a section: a round
 * header (with count and a descriptive tooltip) followed by two columns of
 * rich SchemeCards (distributed by type icon, not a separate type column).
 * Round sections with no schemes at all are hidden.
 */

import {
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useContext, useEffect } from 'react';

import { DatabaseContext } from '../components/DatabaseProvider';
import SchemeCard from '../components/SchemeCard';
import StatusBadge from '../components/StatusBadge';
import { NIST_ROUNDS, ROUND_DISPLAY_ORDER } from '../constants';
import queryAll from '../utils/queryAll';

// Map of scheme key to the NIST round it should be *displayed* under. Today
// this is a pure display-only workaround: XMSS is the only scheme with
// nist_round = 'none' (see its data file), but it is presented in the
// Standardized section so it is not lost. Ideally this would live in the data
// (xmss.yaml nist round -> 'S') rather than here; the underlying data is left
// untouched for now.
const ROUND_OVERRIDES = {
  xmss: 'S',
};

const displayRound = (scheme) =>
  ROUND_OVERRIDES[scheme.id_text] ?? scheme.nist_round;

function SchemeOverview() {
  useEffect(() => {
    document.title = 'Scheme Overview - pqdb';
  }, []);

  const { db } = useContext(DatabaseContext);
  if (!db) return null;

  // Group all schemes by (display round -> type).
  const sections = {};
  for (const scheme of queryAll(db, 'SELECT * FROM scheme;')) {
    const round = displayRound(scheme);
    const typeKey = scheme.type;
    sections[round] = sections[round] || { enc: [], sig: [] };
    sections[round][typeKey]?.push(scheme);
  }

  // Schemes that have known attacks (for explicit marking on their cards);
  // map scheme id -> attack descriptions so cards can surface them on hover.
  const attacksByScheme = {};
  const attackedIds = new Set();
  for (const a of queryAll(db, 'SELECT scheme_id, url FROM scheme_attack;')) {
    attackedIds.add(a.scheme_id);
    (attacksByScheme[a.scheme_id] = attacksByScheme[a.scheme_id] || []).push(a.url);
  }

  // Order a round's cards by type (enc before sig), then alphabetically.
  const orderedCards = (enc, sig) => [
    ...[...enc].sort((a, b) => a.name.localeCompare(b.name)),
    ...[...sig].sort((a, b) => a.name.localeCompare(b.name)),
  ];

  // Rounds present in the data, in display order; absent ones are dropped
  // entirely (including round 1, which has no schemes today).
  const visibleRounds = ROUND_DISPLAY_ORDER.filter(
    (round) => sections[round] && (sections[round].enc.length > 0 || sections[round].sig.length > 0),
  );

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        {visibleRounds.map((round) => {
          const { enc, sig } = sections[round];
          const count = enc.length + sig.length;
          const roundMeta = NIST_ROUNDS[round];

          // Distribute all of this round's cards across two columns
          // independently of type (the type is shown by each card's icon),
          // filling rows before columns: the first card tops column A, the
          // second tops column B, and so on.
          const cards = orderedCards(enc, sig);
          const columns = [
            cards.filter((_, i) => i % 2 === 0),
            cards.filter((_, i) => i % 2 === 1),
          ];
          return (
            <Paper key={round} sx={{ p: 3 }}>
              <Stack
                direction="row"
                spacing={1.5}
                useFlexGap
                sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 2 }}
              >
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                  {roundMeta?.long ?? round}
                </Typography>
                <StatusBadge
                  kind="rounds"
                  value={round}
                  label={`${count} ${count === 1 ? 'scheme' : 'schemes'}`}
                  title={roundMeta?.long}
                />
              </Stack>

              <Grid container spacing={2}>
                {columns.map((columnCards, i) => (
                  <Grid key={i} size={{ xs: 12, md: 6 }}>
                    <Stack spacing={2}>
                      {columnCards.map((scheme) => (
                        <SchemeCard
                          key={scheme.id}
                          scheme={scheme}
                          roundOverride={displayRound(scheme)}
                          attacked={attackedIds.has(scheme.id)}
                          attacks={attacksByScheme[scheme.id] ?? []}
                        />
                      ))}
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          );
        })}
      </Stack>
    </Container>
  );
}

export default SchemeOverview;
