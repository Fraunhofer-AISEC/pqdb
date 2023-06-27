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
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  TextField,
} from '@mui/material';
import React, {
  useCallback, useContext, useEffect, useState,
} from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { GlassMagnifier } from 'react-image-magnifiers';
import { useSearchParams } from 'react-router-dom';

import { DatabaseContext } from '../components/DatabaseProvider';
import QueryTable from '../components/QueryTable';
import diagramImage from '../tables.svg';

// As suggested in https://github.com/mui-org/material-ui/issues/1594#issuecomment-272547735
function AutoFocusTextField(props) {
  const inputRef = React.useRef();

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      inputRef.current.focus();
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return <TextField inputRef={inputRef} {...props} />;
}

function DatabaseDiagram() {
  return (
    <GlassMagnifier
      imageSrc={diagramImage}
      square
      magnifierSize="25%"
      allowOverflow
    />
  );
}

function CustomSQLQuery() {
  const { db } = useContext(DatabaseContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchSqlInput = searchParams.has('query') ? searchParams.get('query') : '';
  const [sqlInput, setSqlInput] = useState(searchSqlInput);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [error, setError] = useState(null);
  const [queryProcessing, setQueryProcessing] = useState(false);

  function executeSQLQuery() {
    setSearchParams({ query: sqlInput });
  }

  useEffect(() => {
    document.title = 'Custom SQL Query - pqdb';
  }, []);

  useEffect(() => {
    if (sqlInput === '') return;

    const query = searchParams.get('query');
    setSqlInput(query);

    setQueryProcessing(true);
    setTimeout(
      () => {
        try {
          const results = db.exec(query)[0];
          setQueryResult(results);
          setError(null);
        } catch (e) {
          setQueryResult(null);
          setError(e);
        }
        setQueryProcessing(false);
        setOrder('asc');
        setOrderBy(null);
      },
      0,
    );
  }, [searchParams]);

  const onChangeOrder = useCallback((newOrder, newOrderBy) => {
    setOrder(newOrder);
    setOrderBy(newOrderBy);
  }, []);

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <Paper>
          <Box p={2}>
            <Grid container direction="column" spacing={3}>
              <Grid item>
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
              </Grid>
              <Grid item>
                <Box display="flex" justifyContent="center">
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={queryProcessing}
                    onClick={() => executeSQLQuery()}
                  >
                    {(queryProcessing) ? 'Computing...' : 'Run Query'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Grid>
      <Grid container item>
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
      <Grid container item>
        <Container maxWidth={false} disableGutters>
          <Paper>
            <Box p={2} display="flex" justifyContent="center">
              <QueryTable
                queryResult={queryResult}
                order={order}
                orderBy={orderBy}
                onChangeOrder={onChangeOrder}
              />
            </Box>
          </Paper>
        </Container>
      </Grid>
    </Grid>
  );
}

export default CustomSQLQuery;
