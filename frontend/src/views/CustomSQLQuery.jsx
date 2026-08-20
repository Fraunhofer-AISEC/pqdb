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

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  TextField,
} from '@mui/material';
import {
  useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';

import { DatabaseContext } from '../components/DatabaseProvider';
import DataTable from '../components/DataTable';
import diagramImage from '../tables.svg';
import useDbQuery from '../utils/useDbQuery';

// Custom SQL runs without bound parameters; a stable reference avoids
// retriggering useDbQuery on every render.
const NO_PARAMS = [];

// As suggested in https://github.com/mui-org/material-ui/issues/1594#issuecomment-272547735
function AutoFocusTextField(props) {
  const inputRef = useRef();

  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRef.current.focus();
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return <TextField inputRef={inputRef} {...props} />;
}

// Glass-style magnifier over the database diagram. The SVG is shown at full
// width, and a square lens follows the cursor, displaying the image zoomed via
// an absolutely-positioned background. (The previous react-image-magnifiers
// dependency is incompatible with React 19, so this self-contained version
// replaces it.)
const ZOOM = 2.5;
const LENS_SIZE = 220;

function DatabaseDiagram() {
  const containerRef = useRef(null);
  const [cursor, setCursor] = useState(null);

  function onMouseMove(e) {
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    setCursor({
      // Fractional position within the image.
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      // Position of the lens within the (position: relative) container.
      left: e.clientX - rect.left,
      top: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    });
  }

  function onMouseLeave() {
    setCursor(null);
  }

  const lens = cursor && (
    <div
      style={{
        position: 'absolute',
        width: LENS_SIZE,
        height: LENS_SIZE,
        pointerEvents: 'none',
        left: cursor.left - LENS_SIZE / 2,
        top: cursor.top - LENS_SIZE / 2,
        border: '2px solid rgba(255,255,255,0.8)',
        boxShadow: '0 0 12px rgba(0,0,0,0.5)',
        borderRadius: 4,
        overflow: 'hidden',
        backgroundImage: `url(${diagramImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${cursor.width * ZOOM}px ${cursor.height * ZOOM}px`,
        backgroundPosition: `${-(cursor.x * cursor.width * ZOOM - LENS_SIZE / 2)}px ${-(cursor.y * cursor.height * ZOOM - LENS_SIZE / 2)}px`,
      }}
    />
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ position: 'relative', width: '100%', cursor: 'zoom-in' }}
    >
      <img
        src={diagramImage}
        alt="Database diagram"
        style={{ display: 'block', width: '100%', height: 'auto', maxWidth: '100%' }}
      />
      {lens}
    </div>
  );
}

function CustomSQLQuery() {
  const { db } = useContext(DatabaseContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchSqlInput = searchParams.get('query') ?? '';
  const [sqlInput, setSqlInput] = useState(searchSqlInput);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState(null);

  const { data: queryResult, processing: queryProcessing, error } = useDbQuery(
    db,
    searchParams.has('query') ? searchParams.get('query') : '',
    NO_PARAMS,
  );

  function executeSQLQuery() {
    setSearchParams({ query: sqlInput });
  }

  useEffect(() => {
    document.title = 'Custom SQL Query - pqdb';
  }, []);

  useEffect(() => {
    if (!searchParams.has('query')) return;
    setSqlInput(searchParams.get('query'));
    setOrder('asc');
    setOrderBy(null);
  }, [searchParams]);

  const onChangeOrder = useCallback((newOrder, newOrderBy) => {
    setOrder(newOrder);
    setOrderBy(newOrderBy);
  }, []);

  return (
    <Stack spacing={2}>
      <div>
        <Paper>
          <Box sx={{ p: 2 }}>
            <Stack spacing={3}>
              <AutoFocusTextField
                label="SQL Query"
                multiline
                fullWidth
                margin="normal"
                minRows={6}
                maxRows={100}
                variant="outlined"
                error={error != null}
                helperText={error ? error.toString() : ''}
                value={sqlInput}
                onChange={(e) => setSqlInput(e.target.value)}
              />
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={queryProcessing}
                  onClick={() => executeSQLQuery()}
                >
                  {(queryProcessing) ? 'Computing...' : 'Run Query'}
                </Button>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </div>
      <Grid container size="grow">
        <Container maxWidth={false} disableGutters>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              Database Diagram
            </AccordionSummary>
            <AccordionDetails>
              <DatabaseDiagram />
            </AccordionDetails>
          </Accordion>
        </Container>
      </Grid>
      <Grid container size="grow">
        <Container maxWidth={false} disableGutters>
          <Paper>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
              {error ? null : (
                <DataTable
                  queryResult={queryResult}
                  order={order}
                  orderBy={orderBy}
                  onChangeOrder={onChangeOrder}
                />
              )}
            </Box>
          </Paper>
        </Container>
      </Grid>
    </Stack>
  );
}

export default CustomSQLQuery;
