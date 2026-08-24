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
import { derivePrimaryStatus, STAGES, STATUS_DISPLAY_ORDER } from '../constants';
import queryAll from '../utils/queryAll';
import { fetchAkaMap, fetchStatusMap } from '../utils/schemeStatus';

function SchemeOverview() {
  useEffect(() => {
    document.title = 'Scheme Overview - pqdb';
  }, []);

  const { db } = useContext(DatabaseContext);
  if (!db) return null;

  const statusByScheme = fetchStatusMap(db);
  const akaByScheme = fetchAkaMap(db);

  // Group all schemes by (primary status stage -> type). Schemes with no status
  // entry (not in any standardization process) are left out of the overview.
  const sections = {};
  for (const scheme of queryAll(db, 'SELECT * FROM scheme;')) {
    const primary = derivePrimaryStatus(statusByScheme.get(scheme.id) ?? []);
    if (!primary) continue;
    const stage = String(primary.stage);
    const typeKey = scheme.type;
    sections[stage] = sections[stage] || { enc: [], sig: [] };
    sections[stage][typeKey]?.push(scheme);
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

  // Stages present in the data, in display order; absent ones are dropped.
  const visibleStages = STATUS_DISPLAY_ORDER.filter(
    (stage) => sections[stage] && (sections[stage].enc.length > 0 || sections[stage].sig.length > 0),
  );

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        {visibleStages.map((stage) => {
          const { enc, sig } = sections[stage];
          const count = enc.length + sig.length;
          const stageMeta = STAGES[stage];

          // Distribute all of this stage's cards across two columns
          // independently of type (the type is shown by each card's icon),
          // filling rows before columns: the first card tops column A, the
          // second tops column B, and so on.
          const cards = orderedCards(enc, sig);
          const columns = [
            cards.filter((_, i) => i % 2 === 0),
            cards.filter((_, i) => i % 2 === 1),
          ];
          return (
            <Paper key={stage} sx={{ p: 3 }}>
              <Stack
                direction="row"
                spacing={1.5}
                useFlexGap
                sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 2 }}
              >
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                  {stageMeta?.long ?? stage}
                </Typography>
                <StatusBadge
                  kind="rounds"
                  value={stage}
                  label={`${count} ${count === 1 ? 'scheme' : 'schemes'}`}
                  title={stageMeta?.long}
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
                          statusRows={statusByScheme.get(scheme.id) ?? []}
                          aka={akaByScheme.get(scheme.id) ?? []}
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
