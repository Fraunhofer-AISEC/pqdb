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

import {
  Box,
  Container,
  Grid,
  Paper,
} from '@mui/material';
import React, { useContext, useEffect } from 'react';

import { DatabaseContext } from '../components/DatabaseProvider';
import { SCHEME_TYPES } from '../constants';
import SchemeList from '../components/SchemeList';

function SchemeOverview() {
  useEffect(() => {
    document.title = 'Scheme Overview - pqdb';
  }, []);

  const { db } = useContext(DatabaseContext);

  return (
    <Container maxWidth="md">
      <Grid container justify="center" spacing={2}>
        {Object.keys(SCHEME_TYPES).map((typeKey) => (
          <Grid key={typeKey} item xs>
            <Paper>
              <Box p={2}>
                <SchemeList db={db} typeKey={typeKey} />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default SchemeOverview;
