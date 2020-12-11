import {
  Box,
  Container,
  Grid,
  Paper,
} from '@material-ui/core';
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

  return (
    <Container maxWidth="md">
      <Grid container justify="center" spacing={2}>
        {Object.keys(SCHEME_TYPES).map((typeKey) => (
          <Grid key={typeKey} item xs>
            <Paper>
              <Box p={2}>
                <SchemeList db={props.db} typeKey={typeKey} />
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
