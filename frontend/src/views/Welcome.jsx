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
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import SchemeList from '../components/SchemeList';
import menuArrow from '../res/menu-arrow.svg';

const propTypes = {
  db: PropTypes.shape({
    prepare: PropTypes.func.isRequired,
  }).isRequired,
};

function Welcome({ db }) {
  useEffect(() => {
    document.title = 'Welcome - pqdb';
  }, []);

  return (
    <Container maxWidth="md">
      <img
        style={{
          position: 'absolute',
          left: 15,
          top: 50,
          opacity: 0.54,
          transform: 'scale(.8)',
          transformOrigin: 'left top',
        }}
        src={menuArrow}
        alt=""
      />

      <Paper>
        <Box p={4}>
          <Typography variant="h4" component="h1" gutterBottom>Welcome!</Typography>
          <Typography paragraph>
            This is the frontend presenting data from
            {' '}
            <Link href="https://github.com/Fraunhofer-AISEC/pqdb/">https://github.com/Fraunhofer-AISEC/pqdb</Link>
            . You can select different views by clicking the menu icon in the top left corner.
          </Typography>
          <Typography paragraph>
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
          <Typography paragraph>
            Contributions are warmly welcomed, see
            {' '}
            <Link href="https://github.com/Fraunhofer-AISEC/pqdb#contribute">here</Link>
            {' '}
            for details.
          </Typography>

          <Typography variant="h4" component="h1" align="center" pt={2}>Available Schemes</Typography>
          <Grid container>
            <Grid item xs key="enc">
              <Box p={4}>
                <SchemeList db={db} typeKey="enc" />
              </Box>
            </Grid>
            <Grid item xs key="sig">
              <Box p={4}>
                <SchemeList db={db} typeKey="sig" />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

Welcome.propTypes = propTypes;

export default Welcome;
