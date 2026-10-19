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
 * Breadcrumb trail for the app shell.
 *
 * Renders a clickable path below the AppBar. Static segments map to NAV_ITEMS
 * labels; the dynamic `/detail/:schemeId[/:flavorId]` segments are resolved to
 * their human-readable scheme/flavor names from the in-browser database (with a
 * graceful fallback to the raw id when a segment is unknown).
 *
 * The trail is hidden below `sm`: on phones the side drawer already carries the
 * whole navigation tree (NAV_ITEMS has three entries), the detail pages render
 * their own back link, and a four-crumb trail cannot coexist with the logo, the
 * nav toggle and the two action buttons without overflowing the toolbar.
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
      const item = NAV_ITEMS.find((n) => n.isActive(`/${segments[0]}`) && n.key !== 'home');
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
      sx={{
        px: 1,
        pb: 1,
        // Keep the trail on a single line when it is shown. MUI's own `ol`
        // wraps (`flexWrap: wrap`), which used to grow the AppBar to four
        // lines on narrow viewports; instead the middle crumbs shrink and
        // ellipsise while the last one stays readable.
        display: { xs: 'none', sm: 'flex' },
        minWidth: 0,
        overflow: 'hidden',
        '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap', minWidth: 0 },
        '& .MuiBreadcrumbs-li': { minWidth: 0 },
        '& .MuiBreadcrumbs-li > *': {
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
        ...sx,
      }}
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
