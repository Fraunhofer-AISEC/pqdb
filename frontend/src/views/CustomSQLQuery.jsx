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
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { GlassMagnifier } from 'react-image-magnifiers';
import PropTypes from 'prop-types';
import React from 'react';
import qs from 'query-string';

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

class CustomSQLQuery extends React.Component {
  constructor(props) {
    super();
    this.db = props.db;
    this.params = qs.parse(props.history.location.search);
    this.runningQueryHandler = null;
    const sqlInput = ('query' in this.params) ? this.params.query : '';

    this.state = {
      sqlInput,
      order: 'asc',
      orderBy: null,
      queryResult: null,
      error: null,
      queryProcessing: false,
    };
  }

  componentDidMount() {
    const { sqlInput } = this.state;
    document.title = 'Custom SQL Query - pqdb';
    if (sqlInput === '') return;

    const sqlQuery = sqlInput;
    this.setState({ queryProcessing: true });
    setTimeout(
      () => {
        try {
          const results = this.db.exec(sqlQuery)[0];
          this.setState({ queryResult: results, error: null, queryProcessing: false });
        } catch (error) {
          this.setState({ queryResult: null, error, queryProcessing: false });
        }
      }, 0,
    );
  }

  executeSQLQuery() {
    const { history } = this.props;
    const { sqlInput } = this.state;
    this.params.query = sqlInput;
    const search = `?${qs.stringify(this.params)}`;
    if (history.location.search !== search) {
      history.push({
        pathname: history.location.pathname,
        search,
      });
    }
  }

  render() {
    const {
      error, order, orderBy, queryProcessing, queryResult, sqlInput,
    } = this.state;
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
                    rows={6}
                    rowsMax={100}
                    variant="outlined"
                    error={error != null}
                    helperText={error ? error.toString() : ''}
                    value={sqlInput}
                    onChange={(e) => this.setState({ sqlInput: e.target.value })}
                  />
                </Grid>
                <Grid item>
                  <Box display="flex" justifyContent="center">
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={queryProcessing}
                      onClick={() => this.executeSQLQuery()}
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
                  onChangeOrder={(newOrder, newOrderBy) => this.setState({
                    order: newOrder, orderBy: newOrderBy,
                  })}
                />
              </Box>
            </Paper>
          </Container>
        </Grid>
      </Grid>
    );
  }
}

CustomSQLQuery.propTypes = {
  db: PropTypes.shape({
    exec: PropTypes.func.isRequired,
  }).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
    location: PropTypes.shape({
      pathname: PropTypes.string.isRequired,
      search: PropTypes.string.isRequired,
    }),
  }).isRequired,
};

export default CustomSQLQuery;
