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

import { MenuBook as MenuBookIcon } from '@mui/icons-material';
import {
  Box,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useContext } from 'react';

import { SCHEME_TYPES } from '../constants';
import humanReadableSize from '../utils/humanReadableSize';
import linkify from '../utils/linkify';
import queryAll from '../utils/queryAll';
import romanCat from '../utils/romanCat';
import Comment from './Comment';
import { DatabaseContext } from './DatabaseProvider';
import Mono from './Mono';
import PropItem from './PropItem';
import StatusBadge from './StatusBadge';

/*
 * ParamsetCard — a compact summary tile for one paramset. It is the
 * "radar"-style at-a-glance card shown in the FlavorDetail Parameter Sets tab:
 * NIST security category, sizes, failure probability, and security levels, with
 * comments available via info-icon tooltips and sources as inline links.
 * Styling is theme-token based via `sx` so it renders correctly in light and
 * dark modes.
 */

function NumOps({ value }) {
  const idx = value && value.indexOf('^');
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.5 }}>
      <Box component="span">
        {idx !== -1 ? (
          <>
            {value.slice(0, idx)}
            <sup>{value.slice(idx + 1)}</sup>
          </>
        ) : (
          value
        )}
      </Box>
    </Box>
  );
}

function SizeBarRow({ label, size, maxSize }) {
  const fill = (maxSize > 0 && Number.isFinite(size)) ? Math.max(0, Math.min(100, (size / maxSize) * 100)) : 0;
  return (
    <>
      <Typography sx={{ fontWeight: 500, color: 'text.secondary', whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
      <Box
        sx={{
          height: 8,
          borderRadius: 1,
          bgcolor: 'action.hover',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${fill}%`,
            height: '100%',
            borderRadius: 1,
            bgcolor: 'primary.main',
          }}
        />
      </Box>
      <Mono sx={{ display: 'block', textAlign: 'right', whiteSpace: 'nowrap' }}>{humanReadableSize(size, 'B')}</Mono>
    </>
  );
}

function ParamsetCard({ p, schemeType, maxSize }) {
  const { db } = useContext(DatabaseContext);

  const ctSigLabel = SCHEME_TYPES[schemeType].ct_sig;

  const paramsetSources = queryAll(db, 'SELECT * FROM paramset_source WHERE paramset_id=?', [p.id]);

  const showFailure = p.failure_probability !== 0 || p.failure_probability_comment;

  return (
    <Paper variant="outlined" sx={{ height: '100%' }}>
      <Box sx={{ px: 2.5, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem', wordBreak: 'break-word' }}>
                {p.name}
              </Typography>
              {(p.security_level_nist_category ?? 0) > 0 && (
                <StatusBadge
                  kind="security"
                  value={p.security_level_nist_category}
                  label={`NIST Cat ${romanCat(p.security_level_nist_category)}`}
                  title={`NIST Category ${p.security_level_nist_category}`}
                />
              )}
              <Comment title={p.comment} />
            </Box>
          </Box>
        </Box>

        <Stack spacing={0.75} sx={{ mt: 1.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 1.5, rowGap: 0.75, alignItems: 'baseline' }}>
            <Typography sx={{ fontWeight: 500, color: 'text.secondary', whiteSpace: 'nowrap' }}>
              Security Level
            </Typography>
            <Box sx={{ display: 'block' }}>
              <Mono>{p.security_level_quantum}</Mono>
              {' '}
              <Box component="span" sx={{ opacity: 0.5 }}>(quantum)</Box>
              {p.security_level_classical && (
                <>
                  {' \u2022 '}
                  <Mono>{p.security_level_classical}</Mono>
                  {' '}
                  <Box component="span" sx={{ opacity: 0.5 }}>(classical)</Box>
                </>
              )}
              <Comment title={p.security_level_comment} />
            </Box>

            {showFailure && (
              <>
                <Typography sx={{ fontWeight: 500, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  Failure Prob.
                </Typography>
                <Box sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Box component="span">
                    {p.failure_probability === 0
                      ? '0'
                      : (
                        <>
                          2
                          <sup>{p.failure_probability}</sup>
                        </>
                      )}
                  </Box>
                  <Comment title={p.failure_probability_comment} />
                </Box>
              </>
            )}

            {p.number_of_operations && p.number_of_operations !== 'inf' && (
              <>
                <Typography sx={{ fontWeight: 500, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  Max Operations
                </Typography>
                <Box sx={{ display: 'block' }}>
                  <NumOps value={p.number_of_operations} />
                </Box>
              </>
            )}
          </Box>

          <Box sx={{ mt: 1, pt: 1, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sizes
              </Typography>
              <Comment title={p.sizes_comment} />
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'max-content 1fr max-content',
                columnGap: 1.5,
                rowGap: 0.5,
                alignItems: 'center',
                mt: 0.75,
              }}
            >
              <SizeBarRow label="Secret key" size={p.sizes_sk} maxSize={maxSize} />
              <SizeBarRow label="Public key" size={p.sizes_pk} maxSize={maxSize} />
              <SizeBarRow label={ctSigLabel} size={p.sizes_ct_sig} maxSize={maxSize} />
            </Box>
          </Box>
        </Stack>

        {paramsetSources.length > 0 && (
          <PropItem title="Sources" Icon={MenuBookIcon}>
            {paramsetSources.map((s) => <div key={s.url}>{linkify(s.url)}</div>)}
          </PropItem>
        )}
      </Box>
    </Paper>
  );
}

ParamsetCard.propTypes = {
  p: PropTypes.object.isRequired,
  schemeType: PropTypes.string.isRequired,
  maxSize: PropTypes.number.isRequired,
};

SizeBarRow.propTypes = {
  label: PropTypes.string.isRequired,
  size: PropTypes.number,
  maxSize: PropTypes.number.isRequired,
};

NumOps.propTypes = {
  value: PropTypes.string,
};

export default ParamsetCard;
