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
 * Navigation configuration for the app shell.
 *
 * Single source of truth for the top-level destinations shown in the side nav
 * and used by the breadcrumbs. Each item knows how to report whether the
 * current route belongs to it, so the `Scheme Overview` entry stays highlighted
 * on both the overview list (`/detail`) and its detail sub-routes (`/detail/...`).
 */

import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import HomeIcon from '@mui/icons-material/Home';

// Fixed widths for the side drawer (used by the shell layout + AppBar offset).
const DRAWER_WIDTH = 240;
const DRAWER_MINI_WIDTH = 64;

const NAV_ITEMS = [
  {
    key: 'home',
    label: 'Home',
    path: '/',
    icon: HomeIcon,
    isActive: (pathname) => pathname === '/',
  },
  {
    key: 'overview',
    label: 'Scheme Overview',
    path: '/detail',
    icon: AccountTreeIcon,
    isActive: (pathname) => pathname === '/detail' || pathname.startsWith('/detail/'),
  },
  {
    key: 'comparison',
    label: 'Scheme Comparison',
    path: '/comparison',
    icon: CompareArrowsIcon,
    isActive: (pathname) => pathname === '/comparison',
  },
];

export { DRAWER_MINI_WIDTH, DRAWER_WIDTH, NAV_ITEMS };
