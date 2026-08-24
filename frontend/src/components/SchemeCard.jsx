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

import AttackedMarker from './AttackedMarker';
import { derivePrimaryStatus, PROCESSES, SCHEME_TYPES, STAGES } from '../constants';
import detailLink from '../utils/detailLink';
import StatusBadge from './StatusBadge';

function SchemeCard({ scheme, statusRows = [], aka = [], attacked, attacks = [] }) {
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
        to={detailLink(scheme.id_text)}
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
            {attacked && <AttackedMarker label size="small" attacks={attacks} />}
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

// Compose a tooltip summarizing what the scheme's status entries say (process,
// stage, standard) so a multi-entry scheme (e.g. XMSS: RFC 8554 + SP 800-208)
// is fully described.
function statusTitle(statusRows) {
  const parts = statusRows.map((s) => (
    `${PROCESSES[s.process] ?? s.process}: ${STAGES[s.stage]?.long ?? s.stage}`
    + (s.standard ? ` (${s.standard})` : '')
  ));
  return parts.join(' · ');
}

SchemeCard.propTypes = {
  scheme: PropTypes.shape({
    id_text: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['enc', 'sig']).isRequired,
    category: PropTypes.string,
    category_comment: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
  statusRows: PropTypes.arrayOf(PropTypes.object),
  aka: PropTypes.arrayOf(PropTypes.string),
  attacked: PropTypes.bool,
  attacks: PropTypes.arrayOf(PropTypes.string),
};

export default SchemeCard;
