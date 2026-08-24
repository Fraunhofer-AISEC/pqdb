/*
 * Helpers for reading a scheme's standardization `status` rows and former
 * names (`aka`) from the generated SQLite database. The `scheme` table itself
 * no longer carries the round/standardization state - it lives in the
 * normalized `scheme_status` and `scheme_aka` child tables.
 */

import queryAll from './queryAll';

// Map scheme_id -> array of status rows ({process, stage, standard, url, year,
// comment}). Passing a precomputed map avoids a query per scheme.
export function fetchStatusMap(db) {
  const map = new Map();
  for (const row of queryAll(db, 'SELECT * FROM scheme_status')) {
    if (!map.has(row.scheme_id)) map.set(row.scheme_id, []);
    map.get(row.scheme_id).push(row);
  }
  return map;
}

export function fetchStatus(db, schemeId) {
  return queryAll(db, 'SELECT * FROM scheme_status WHERE scheme_id=?', [schemeId]);
}

// Map scheme_id -> array of former/alternative names.
export function fetchAkaMap(db) {
  const map = new Map();
  for (const row of queryAll(db, 'SELECT * FROM scheme_aka')) {
    if (!map.has(row.scheme_id)) map.set(row.scheme_id, []);
    map.get(row.scheme_id).push(row.name);
  }
  return map;
}

export function fetchAka(db, schemeId) {
  return queryAll(db, 'SELECT * FROM scheme_aka WHERE scheme_id=?', [schemeId]).map((r) => r.name);
}
