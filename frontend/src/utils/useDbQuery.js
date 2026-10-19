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
 * useDbQuery — generic hook that centralises sql.js reads and owns debounce +
 * loading state.
 *
 * Replaces the per-view `useEffect` + `setTimeout` + `isFirstRender` plumbing
 * (previously inline in SchemeComparison / CustomSQLQuery). It is data-agnostic:
 * it knows nothing about schemes/paramsets, so any view can reuse it.
 *
 * `data` semantics (mirror QueryTable's contract):
 *   - `{ columns, values }`  — a non-empty queryAllAsArray result
 *   - `undefined`            — the query ran but returned no rows ("No results")
 *   - `null`                 — not yet computed (or an error occurred)
 *
 * `sql` may be `null`/empty to opt out of running (e.g. CustomSQLQuery with no
 * committed query yet).
 */
import { useEffect, useRef, useState } from 'react';

import queryAllAsArray from './queryAllAsArray';

export default function useDbQuery(db, sql, params, options = {}) {
  const { debounceMs = 300, firstImmediate = true } = options;

  // Executes synchronously on the first (non-empty) call, then only via the
  // debounce timer, mirroring the previous `isFirstRender` behaviour.
  const firstRender = useRef(firstImmediate);
  // Content of the last executed query ([sql, params]). Compared on every
  // render so that a fresh-but-equal reference (e.g. an inline `[]` passed by a
  // caller) does not retrigger the debounced run and flicker `processing`.
  const lastKey = useRef(null);
  const [data, setData] = useState(null);
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // No query yet — stay in the "not computed" state.
    if (!sql) {
      setProcessing(false);
      lastKey.current = null;
      return undefined;
    }

    // Skip when only the reference changed but the query content did not.
    const key = JSON.stringify([sql, params || []]);
    if (key === lastKey.current) {
      return undefined;
    }
    lastKey.current = key;

    const runQuery = () => {
      try {
        const result = queryAllAsArray(db, sql, params || []);
        setData(result.values.length === 0 ? undefined : result);
        setError(null);
      } catch (e) {
        setData(null);
        setError(e);
      } finally {
        setProcessing(false);
      }
    };

    if (firstRender.current) {
      firstRender.current = false;
      runQuery();
      return undefined;
    }

    setProcessing(true);
    const timeout = setTimeout(runQuery, debounceMs);
    return () => clearTimeout(timeout);
  }, [db, sql, params, debounceMs]);

  return { data, processing, error };
}
