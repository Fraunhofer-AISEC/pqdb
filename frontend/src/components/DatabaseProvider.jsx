/*
 * Copyright (c) 2023-2026, Fraunhofer AISEC.
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

import PropTypes from 'prop-types';
import {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import initSqlJs from 'sql.js';

const DatabaseContext = createContext();

function DatabaseProvider({ children }) {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);
  const dbRef = useRef(null);

  useEffect(() => {
    // sql.js must fetch its wasm file first, so the database cannot be
    // instantiated until initSqlJs has resolved the wasm binary.
    let cancelled = false;

    const loadDatabase = (SQL) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/pqdb.sqlite', true);
      xhr.responseType = 'arraybuffer';

      xhr.onload = () => {
        if (cancelled) return;
        const uInt8Array = new Uint8Array(xhr.response);
        const database = new SQL.Database(uInt8Array);
        dbRef.current = database;
        setDb(database);
      };
      xhr.send();
    };

    initSqlJs({ locateFile: (file) => `/${file}` })
      .then((SQL) => loadDatabase(SQL))
      .catch((err) => setError(err));

    return () => {
      cancelled = true;
      dbRef.current?.close();
      dbRef.current = null;
    };
  }, []);

  const dbStateValue = useMemo(() => ({ db, error }), [db, error]);

  return <DatabaseContext.Provider value={dbStateValue}>{children}</DatabaseContext.Provider>;
}

const propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};
DatabaseProvider.propTypes = propTypes;

export { DatabaseContext };
export default DatabaseProvider;
