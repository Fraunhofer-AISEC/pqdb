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
import { NIST_ROUNDS, SCHEME_TYPES } from '../constants';
import detailLink from '../utils/detailLink';
import StatusBadge from './StatusBadge';

function SchemeCard({ scheme, roundOverride, attacked, attacks = [] }) {
  const type = SCHEME_TYPES[scheme.type];

  // Optional override for the NIST-round badge (e.g. XMSS displayed in the
  // Standardized section while its underlying data is unchanged). Falls back
  // to the scheme's own round when not provided.
  const displayRound = roundOverride ?? scheme.nist_round;
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
            </Typography>
            {attacked && <AttackedMarker label size="small" attacks={attacks} />}
            {type && (
              <type.icon color="action" sx={{ fontSize: 22 }} titleAccess={type.name} />
            )}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 1 }}>
            <StatusBadge kind="categories" value={scheme.category} title={scheme.category_comment} />
            {displayRound !== 'none' && (
              <StatusBadge
                kind="rounds"
                value={displayRound}
                label={NIST_ROUNDS[displayRound]?.short}
                title={scheme.nist_round_comment}
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

SchemeCard.propTypes = {
  scheme: PropTypes.shape({
    id_text: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['enc', 'sig']).isRequired,
    category: PropTypes.string,
    nist_round: PropTypes.string,
    category_comment: PropTypes.string,
    nist_round_comment: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
  roundOverride: PropTypes.string,
  attacked: PropTypes.bool,
  attacks: PropTypes.arrayOf(PropTypes.string),
};

export default SchemeCard;
