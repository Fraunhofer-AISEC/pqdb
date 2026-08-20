/*
 * SchemeCard — a reusable card tile for a single scheme, used on the landing
 * page's "Standardized schemes" highlights (and reusable by future schemes
 * views). It surfaces the scheme's name (linked to its detail page), its type
 * icon, semantic category / NIST-round badges, and a short description, with a
 * clear "View" affordance.
 */

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';

import { NIST_ROUNDS, SCHEME_TYPES } from '../constants';
import StatusBadge from './StatusBadge';
import detailLink from '../utils/detailLink';

function SchemeCard({ scheme }) {
  const type = SCHEME_TYPES[scheme.type];
  return (
    <Card sx={{ height: '100%' }}>
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
            {type && (
              <type.icon color="action" sx={{ fontSize: 22 }} titleAccess={type.name} />
            )}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 1 }}>
            <StatusBadge kind="categories" value={scheme.category} title={scheme.category_comment} />
            {scheme.nist_round !== 'none' && (
              <StatusBadge
                kind="rounds"
                value={scheme.nist_round}
                label={NIST_ROUNDS[scheme.nist_round]?.short}
                title={scheme.nist_round_comment}
              />
            )}
          </Stack>

          {scheme.description && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, flexGrow: 1 }}>
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
};

export default SchemeCard;
