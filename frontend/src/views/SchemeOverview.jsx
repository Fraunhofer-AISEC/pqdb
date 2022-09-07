import {
  Box,
  Container,
  Grid,
  Paper,
} from '@mui/material';
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { SCHEME_TYPES } from '../constants';
import SchemeList from '../components/SchemeList';

const propTypes = {
  db: PropTypes.shape({
    prepare: PropTypes.func.isRequired,
  }).isRequired,
};

function SchemeOverview(props) {
  useEffect(() => {
    document.title = 'Scheme Overview - pqdb';
  }, []);

  const { db } = props;
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

SchemeOverview.propTypes = propTypes;

export default SchemeOverview;
