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
  Collapse,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Link as LinkIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import { useContext, useState } from 'react';
import PropTypes from 'prop-types';

import Comment from './Comment';
import { DatabaseContext } from './DatabaseProvider';
import Mono from './Mono';
import PropItem from './PropItem';
import { SCHEME_TYPES } from '../constants';
import StatusBadge from './StatusBadge';
import TextComment from './TextComment';
import humanReadableSize from '../utils/humanReadableSize';
import linkify from '../utils/linkify';
import queryAll from '../utils/queryAll';
import romanCat from '../utils/romanCat';

/*
 * ParamsetCard — a compact, expandable summary tile for one paramset. It is the
 * "radar"-style at-a-glance card shown in the FlavorDetail Parameter Sets tab:
 * NIST security category, sizes, failure probability, and security levels on the
 * surface, with the full paramset detail (comment, links, sources) revealed when
 * the tile is expanded. Styling is theme-token based via `sx` so it renders
 * correctly in light and dark modes.
 */

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
  const [expanded, setExpanded] = useState(false);

  const ctSigLabel = SCHEME_TYPES[schemeType].ct_sig;

  // Lazily fetch links/sources only when the tile is expanded, so a collapsed
  // summary never walks the link/source tables for every paramset.
  const paramsetLinks = expanded
    ? queryAll(db, 'SELECT * FROM paramset_link WHERE paramset_id=?', [p.id])
    : [];
  const paramsetSources = expanded
    ? queryAll(db, 'SELECT * FROM paramset_source WHERE paramset_id=?', [p.id])
    : [];

  const showFailure = schemeType === 'enc' || p.failure_probability !== 0 || p.failure_probability_comment;

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
            </Box>
          </Box>
          <IconButton
            size="small"
            aria-label={expanded ? 'Collapse' : 'Expand'}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
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

            {p.number_of_operations !== 'inf' && (
              <>
                <Typography sx={{ fontWeight: 500, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  Max Operations
                </Typography>
                <Box sx={{ display: 'block' }}>
                  {p.number_of_operations}
                </Box>
              </>
            )}
          </Box>

          <Box sx={{ mt: 1, pt: 1, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sizes
            </Typography>
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

        <Collapse in={expanded} unmountOnExit>
          <Stack spacing={1} sx={{ mt: 1.5, pt: 1.5, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
            {p.comment && <TextComment>{p.comment}</TextComment>}
            {p.security_level_comment && <div><TextComment>{p.security_level_comment}</TextComment></div>}
            {p.sizes_comment && <div><TextComment>{p.sizes_comment}</TextComment></div>}

            {paramsetLinks.length > 0 && (
              <PropItem key="links" title="Links" Icon={LinkIcon}>
                {paramsetLinks.map((l) => <div key={l.url}>{linkify(l.url)}</div>)}
              </PropItem>
            )}

            {paramsetSources.length > 0 && (
              <PropItem key="sources" title="Sources" Icon={MenuBookIcon}>
                {paramsetSources.map((s) => <div key={s.url}>{linkify(s.url)}</div>)}
              </PropItem>
            )}
          </Stack>
        </Collapse>
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

export default ParamsetCard;
