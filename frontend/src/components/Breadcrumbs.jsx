/*
 * Breadcrumb trail for the app shell.
 *
 * Renders a clickable path below the AppBar. Static segments map to NAV_ITEMS
 * labels; the dynamic `/detail/:schemeId[/:flavorId]` segments are resolved to
 * their human-readable scheme/flavor names from the in-browser database (with a
 * graceful fallback to the raw id when a segment is unknown).
 */

import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import { NAV_ITEMS } from '../nav';
import queryAll from '../utils/queryAll';

function useCrumbs({ db, pathname }) {
  return useMemo(() => {
    const crumbs = [{ label: 'Home', to: '/' }];
    const rest = pathname.replace(/^\/+/, '');
    if (!rest) return crumbs;

    const segments = rest.split('/').filter(Boolean);

    // Static top-level destinations from the nav config.
    let i = 0;
    if (segments[0] === 'detail') {
      const item = NAV_ITEMS.find((n) => n.key === 'overview');
      crumbs.push({ label: item.label, to: item.path });
      i = 1;
    } else if (segments[0] === 'privacy_policy') {
      crumbs.push({ label: 'Privacy Policy', to: '/privacy_policy' });
      i = 1;
    } else {
      const item = NAV_ITEMS.find((n) => n.isActive(`/${segments[0]}`) && n.key !== 'welcome');
      if (item) {
        crumbs.push({ label: item.label, to: item.path });
        i = 1;
      }
    }

    // Dynamic detail segments: `/detail/:schemeId` and `/detail/:schemeId/:flavorId`.
    if (segments[0] === 'detail') {
      const schemeId = segments[i];
      if (schemeId && db) {
        const scheme = queryAll(db, 'SELECT name FROM scheme WHERE id_text=?', [schemeId])[0];
        crumbs.push({
          label: scheme ? scheme.name : schemeId,
          to: `/detail/${schemeId}`,
        });
        const flavorId = segments[i + 1];
        if (flavorId && scheme) {
          const schemeRow = queryAll(db, 'SELECT id FROM scheme WHERE id_text=?', [schemeId])[0];
          const flavor = schemeRow
            ? queryAll(db, 'SELECT name FROM flavor WHERE scheme_id=? AND id_text=?', [schemeRow.id, flavorId])[0]
            : undefined;
          crumbs.push({
            label: flavor ? flavor.name : flavorId,
            to: `/detail/${schemeId}/${flavorId}`,
          });
        }
      }
    }

    return crumbs;
  }, [db, pathname]);
}

function Breadcrumbs({ db, sx }) {
  const { pathname } = useLocation();
  const crumbs = useCrumbs({ db, pathname });

  if (!crumbs.length) return null;

  return (
    <MuiBreadcrumbs
      maxItems={4}
      aria-label="breadcrumb"
      sx={{ px: 1, pb: 1, ...sx }}
    >
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        if (isLast) {
          return (
            <Typography key={crumb.to} color="text.primary" variant="body2" noWrap>
              {crumb.label}
            </Typography>
          );
        }
        return (
          <Link
            key={crumb.to}
            component={RouterLink}
            to={crumb.to}
            color="inherit"
            underline="hover"
            variant="body2"
            noWrap
          >
            {crumb.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}

Breadcrumbs.propTypes = {
  db: PropTypes.shape({
    prepare: PropTypes.func.isRequired,
  }),
  sx: PropTypes.object,
};

Breadcrumbs.defaultProps = {
  db: null,
  sx: undefined,
};

export default Breadcrumbs;
