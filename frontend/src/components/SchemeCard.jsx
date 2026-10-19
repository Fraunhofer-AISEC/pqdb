/*
 * Copyright (c) 2026, Fraunhofer AISEC.
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
 * SchemeCard — a reusable card tile for a single scheme, used on the landing
 * page's "Standardized schemes" highlights (and reusable by future schemes
 * views). It surfaces the scheme's name (linked to its detail page), its type
 * icon, semantic category / NIST-round badges, and a short description, with a
 * clear "View" affordance.
 */

import {
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';

import { derivePrimaryStatus, SCHEME_TYPES, STAGES, statusTitle } from '../constants';
import detailLink from '../utils/detailLink';
import AttackedMarker from './AttackedMarker';
import StatusBadge from './StatusBadge';

function SchemeCard({ scheme, statusRows = [], aka = [], attacked, to }) {
  const type = SCHEME_TYPES[scheme.type];

  // The primary (headline) status drives the badge; `standardized` wins over
  // `selected` over any round. Falls back to nothing when the scheme has no
  // status (i.e. not in any standardization process).
  const primaryStatus = derivePrimaryStatus(statusRows);
  const stage = primaryStatus?.stage;
  return (
    <Card sx={{ height: 214, border: 1, borderColor: 'divider' }}>
      <CardActionArea
        component={RouterLink}
        to={to ?? detailLink(scheme.id_text)}
        sx={{ height: '100%' }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="h6" component="h3" sx={{ flexGrow: 1, minWidth: 0 }}>
              <Link component="span" underline="hover">
                {scheme.name}
              </Link>
              {aka.length > 0 && (
                <Box
                  component="span"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 'normal',
                    fontSize: '0.85em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {' '}({aka.join(', ')})
                </Box>
              )}
            </Typography>
            {attacked && <AttackedMarker label wrapLabel size="small" />}
            {type && (
              <type.icon color="action" sx={{ fontSize: 22 }} titleAccess={type.name} />
            )}
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 1, rowGap: 1 }}>
            <StatusBadge kind="categories" value={scheme.category} title={scheme.category_comment} />
            {stage && (
              <StatusBadge
                kind="rounds"
                value={stage}
                label={STAGES[stage]?.short}
                title={statusTitle(statusRows)}
              />
            )}
            {scheme.stateful === 1 && (
              <StatusBadge
                kind="statefulness"
                value={1}
                label="Stateful"
                title={scheme.stateful_comment}
              />
            )}
          </Stack>

          {scheme.description && (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mt: 1,
                flexGrow: 1,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {scheme.description}
            </Typography>
          )}

          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', color: 'primary.main' }}>
            <Typography variant="button" sx={{ fontWeight: 600 }}>View</Typography>
            <ArrowForwardIcon sx={{ fontSize: 18, ml: 0.5 }} />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// Tooltip for the status badge is built by `statusTitle` in ../constants (it
// joins every status entry with its process + standard so multi-entry schemes
// like XMSS: RFC 8554 + SP 800-208 are fully described).
SchemeCard.propTypes = {
  scheme: PropTypes.shape({
    id_text: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['enc', 'sig']).isRequired,
    category: PropTypes.string,
    category_comment: PropTypes.string,
    description: PropTypes.string,
    stateful: PropTypes.number,
    stateful_comment: PropTypes.string,
  }).isRequired,
  statusRows: PropTypes.arrayOf(PropTypes.object),
  aka: PropTypes.arrayOf(PropTypes.string),
  attacked: PropTypes.bool,
  to: PropTypes.string,
};

export default SchemeCard;
