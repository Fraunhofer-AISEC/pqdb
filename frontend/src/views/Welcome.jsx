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
  Link,
  Paper,
  Typography,
} from '@mui/material';
import { useContext, useEffect } from 'react';

import { DatabaseContext } from '../components/DatabaseProvider';

import SchemeList from '../components/SchemeList';

function Welcome() {
  const { db } = useContext(DatabaseContext);

  useEffect(() => {
    document.title = 'Welcome - pqdb';
  }, []);

  return (
    <Container maxWidth="md">
      <Paper>
        <Box sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>Welcome!</Typography>
          <Typography sx={{ marginBottom: '16px' }}>
            This is the frontend presenting data from
            {' '}
            <Link href="https://github.com/Fraunhofer-AISEC/pqdb/">https://github.com/Fraunhofer-AISEC/pqdb</Link>
            . You can browse schemes via the navigation sidebar, or use the search
            (top right, or Ctrl+K) to jump straight to a scheme or flavor.
          </Typography>
          <Typography sx={{ marginBottom: '16px' }}>
            The page is written in
            {' '}
            <Link href="https://reactjs.org/">React</Link>
            {' '}
            and operates purely client site by loading an
            {' '}
            <Link href="https://www.sqlite.org/">SQLite</Link>
            {' '}
            database (located
            {' '}
            <Link href="pqdb.sqlite">here</Link>
            ) which is generated from the data in pqdb.
          </Typography>
          <Typography sx={{ marginBottom: '16px' }}>
            Contributions are warmly welcomed, see
            {' '}
            <Link href="https://github.com/Fraunhofer-AISEC/pqdb#contribute">here</Link>
            {' '}
            for details.
          </Typography>

          <Typography variant="h4" component="h1" sx={{ textAlign: 'center', pt: 2 }}>Available Schemes</Typography>
          <Grid container>
            <Grid size="grow" key="enc">
              <Box sx={{ p: 4 }}>
                <SchemeList db={db} typeKey="enc" />
              </Box>
            </Grid>
            <Grid size="grow" key="sig">
              <Box sx={{ p: 4 }}>
                <SchemeList db={db} typeKey="sig" />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

export default Welcome;
