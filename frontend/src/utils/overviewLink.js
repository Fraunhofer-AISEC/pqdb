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

// Defaults shared by both consumers (SchemeOverview's card link and Home's
// deep-links): a param left at its default drops out of the query string, so
// the URL stays clean. The track default is "all" because it is
// SchemeOverview's fallback when no track param is present.
const OVERVIEW_DEFAULTS = { track: 'all', category: null, type: null, author: null };

// Build the query string (incl. leading `?` when non-empty) for a combination
// of overview filters, appended to a `base` path (default `/detail`). Params
// equal to their default (or null/undefined) are omitted. Used by
// SchemeOverview.cardLink (so returning from a scheme detail restores the
// exact selection) and by Home's clickable figures/categories.
export default function overviewLink({ track, category, type, author } = {}, base = '/detail') {
  const params = new URLSearchParams();
  if (track && track !== OVERVIEW_DEFAULTS.track) params.set('track', track);
  if (category && category !== OVERVIEW_DEFAULTS.category) params.set('category', category);
  if (type && type !== OVERVIEW_DEFAULTS.type) params.set('type', type);
  if (author && author !== OVERVIEW_DEFAULTS.author) params.set('author', author);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export { OVERVIEW_DEFAULTS };
