/*
 * Copyright (c) 2023, Fraunhofer AISEC.
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

import React, {
  createContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import PropTypes from 'prop-types';
import initSqlJs from 'sql.js';

const DatabaseContext = createContext();

function DatabaseProvider({ children }) {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);

  function loadDatabase(SQL) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/pqdb.sqlite', true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = () => {
      const uInt8Array = new Uint8Array(xhr.response);
      setDb(new SQL.Database(uInt8Array));
    };
    xhr.send();
  }

  useEffect(() => {
    // sql.js needs to fetch its wasm file, so we cannot immediately instantiate the database
    // without any configuration, initSqlJs will fetch the wasm files from the specified
    // path, see ../config-overrides.js
    initSqlJs({ locateFile: (file) => `/static/js/${file}` })
      .then((SQL) => loadDatabase(SQL))
      .catch((err) => setError(err));

    return () => {
      db?.close();
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
