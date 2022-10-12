import {
  ArrowBack as ArrowBackIcon,
  AutoMode as AutoModeIcon,
  Category as CategoryIcon,
  Memory as ChipIcon,
  Code as CodeIcon,
  SyncAlt as DiffieHellmanIcon,
  Fort as FortIcon,
  Translate as LanguageIcon,
  Link as LinkIcon,
  MenuBook as MenuBookIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import {
  Box,
  Container,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  NIST_ROUNDS,
  SCHEME_TYPES,
  SEC_NOTIONS,
} from '../constants';
import BottomIcon from '../icons/Bottom';
import Comment from '../components/Comment';
import MeasureIcon from '../icons/Measure';
import PropItem from '../components/PropItem';
import TextComment from '../components/TextComment';
import detailLink from '../utils/detailLink';
import linkify from '../utils/linkify';
import queryAll from '../utils/queryAll';
import romanCat from '../utils/romanCat';

const propTypes = {
  db: PropTypes.shape({
    prepare: PropTypes.func.isRequired,
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      schemeId: PropTypes.string.isRequired,
      flavorId: PropTypes.string.isRequired,
    }),
  }).isRequired,
};

class FlavorDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scheme: null,
      flavor: undefined,
      paramsets: undefined,
      implementations: undefined,
      links: undefined,
      sources: undefined,
    };
  }

  componentDidMount() {
    const { match: { params: { schemeId, flavorId } }, db } = this.props;

    const scheme = queryAll(db, 'SELECT * FROM scheme WHERE id_text=?', [schemeId])[0];
    const flavor = queryAll(db, 'SELECT * FROM flavor WHERE scheme_id=? AND id_text=?', [scheme.id, flavorId])[0];
    if (scheme === undefined || flavor === undefined) {
      document.title = 'Unknown - Flavor Details - pqdb';
      this.setState({ scheme });
    } else {
      document.title = `${flavor.name} - Flavor Details - pqdb`;
      const paramsets = queryAll(db, 'SELECT * FROM paramset WHERE flavor_id=? ORDER BY security_level_nist_category ASC, security_level_quantum ASC', [flavor.id]);
      const implementations = queryAll(db, 'SELECT * FROM implementation WHERE flavor_id=? ORDER BY type DESC', [flavor.id]); // reference before optimized
      const links = queryAll(db, 'SELECT * FROM flavor_link WHERE flavor_id=?', [flavor.id]);
      const sources = queryAll(db, 'SELECT * FROM flavor_source WHERE flavor_id=?', [flavor.id]);
      this.setState({
        scheme,
        flavor,
        paramsets,
        implementations,
        links,
        sources,
      });
    }
  }

  render() {
    const { db } = this.props;
    const {
      scheme,
      flavor,
      paramsets,
      implementations,
      links,
      sources,
    } = this.state;

    if (scheme === null) return null;

    if (scheme === undefined) {
      return <Container><Paper>No such scheme.</Paper></Container>;
    }
    if (flavor === undefined) {
      return <Container><Paper>No such flavor.</Paper></Container>;
    }

    const TypeIcon = SCHEME_TYPES[scheme.type].icon;
    return (
      <Container maxWidth="md">
        <Paper>
          <Box>
            <List>
              <ListItem key="scheme-head" alignItems="flex-start">
                <ListItemText>
                  <Typography variant="h6">
                    <Link component={RouterLink} to={detailLink(scheme.id_text)}>
                      <ArrowBackIcon fontSize="inherit" />
                      {[' ']}
                      {scheme.name}
                    </Link>
                    {' '}
                    <Tooltip title={SCHEME_TYPES[scheme.type].name} arrow>
                      <TypeIcon fontSize="inherit" aria-hidden={false} role="img" aria-label={SCHEME_TYPES[scheme.type].name} aria-describedby={null} />
                    </Tooltip>
                    {' '}
                    <span style={{ fontWeight: 'normal', marginLeft: '.4em' }}>
                      {scheme.category}
                      {' '}
                      <Comment title={scheme.category_comment} />
                      {(scheme.stateful === true)
                      && (
                      <>
                        {' \u2022'}
                        {' '}
                        stateful
                        {' '}
                        <Comment title={scheme.stateful_comment} />
                      </>
                      )}
                      {(scheme.nist_round !== 'none')
                      && (
                      <>
                        {' \u2022'}
                        {' '}
                        {NIST_ROUNDS[scheme.nist_round].short}
                        <Comment title={scheme.nist_round_comment} />
                      </>
                      )}
                    </span>
                  </Typography>
                </ListItemText>
              </ListItem>

              <ListItem key="flavor-head" alignItems="flex-start">
                <ListItemText>
                  <Typography variant="h3">
                    {flavor.name}
                  </Typography>
                  {flavor.description && <div>{flavor.description}</div>}
                  {flavor.comment && <div><TextComment>{flavor.comment}</TextComment></div>}
                </ListItemText>
              </ListItem>

              <PropItem key="type" title="API Type" Icon={CategoryIcon}>
                {flavor.type}
                {' '}
                <Comment title={flavor.type_comment} />
              </PropItem>

              <PropItem key="securitynotion" title="Security Notion" Icon={SecurityIcon}>
                <Tooltip title={SEC_NOTIONS[flavor.security_notion]}>
                  <span>{flavor.security_notion}</span>
                </Tooltip>
                <Comment title={flavor.security_notion_comment} />
              </PropItem>

              {flavor.dh_ness
              && (
              <PropItem key="dhness" title="Diffie-Hellman-Ness" Icon={DiffieHellmanIcon}>
                <strong>Diffie-Hellman-Ness: </strong>
                {flavor.dh_ness}
              </PropItem>
              )}

              {links.length > 0
              && (
              <PropItem key="links" title="Links" Icon={LinkIcon}>
                {links.map((l) => <div key={l.url}>{linkify(l.url)}</div>)}
              </PropItem>
              )}

              {sources.length > 0
              && (
              <PropItem key="sources" title="Sources" Icon={MenuBookIcon}>
                {sources.map((s) => <div key={s.url}>{linkify(s.url)}</div>)}
              </PropItem>
              )}

              <ListItem key="paramsets">
                <Typography component="h3" variant="h4">Parameter Sets</Typography>
              </ListItem>

              {paramsets.map((p) => {
                const paramsetLinks = queryAll(db, 'SELECT * FROM paramset_link WHERE paramset_id=?', [p.id]);
                const paramsetSources = queryAll(db, 'SELECT * FROM paramset_source WHERE paramset_id=?', [p.id]);
                return (
                  <div key={`p-${p.id}`}>
                    <ListItem key="head" style={{ display: 'block' }}>
                      <Typography component="h4" variant="h5">
                        {p.name}
                      </Typography>
                      {p.comment && <div><TextComment>{p.comment}</TextComment></div>}
                    </ListItem>

                    <PropItem key="seclevel" title="Security Level" Icon={SecurityIcon}>
                      <div>
                        {(p.security_level_nist_category ?? 0) > 0 && (
                        <>
                          <Tooltip title={`NIST Category ${p.security_level_nist_category}`}>
                            <span>{romanCat(p.security_level_nist_category)}</span>
                          </Tooltip>
                          {' \u2022 '}
                        </>
                        )}
                        {p.security_level_quantum}
                        {' '}
                        <span style={{ opacity: 0.5 }}> (quantum)</span>
                        {p.security_level_classical && (
                        <>
                          {` \u2022 ${p.security_level_classical}`}
                          <span style={{ opacity: 0.5 }}> (classical)</span>
                        </>
                        )}
                      </div>
                      {p.security_level_comment
                      && <div><TextComment>{p.security_level_comment}</TextComment></div>}
                    </PropItem>

                    {(scheme.type === 'enc' || p.failure_probability !== 0 || p.failure_probability_comment)
                    && (
                    <PropItem key="failureprob" title="Failure Probability" Icon={BottomIcon}>
                      {p.failure_probability === 0
                        ? '0'
                        : (
                          <>
                            2
                            <sup>{p.failure_probability}</sup>
                          </>
                        )}
                      <Comment title={p.failure_probability_comment} />
                    </PropItem>
                    )}

                    <PropItem key="numop" title="Number of operations" Icon={AutoModeIcon}>
                      {p.number_of_operations === 'inf'
                        ? 'unlimited'
                        : p.number_of_operations}
                    </PropItem>

                    <PropItem key="sizes" title="Sizes" Icon={MeasureIcon}>
                      <div>
                        sk:
                        {' '}
                        {p.sizes_sk}
                        {' '}
                        {' \u2022 '}
                        pk:
                        {' '}
                        {p.sizes_pk}
                        {' '}
                        {' \u2022 '}
                        {SCHEME_TYPES[scheme.type].ctsig}
                        {': '}
                        {p.sizes_ct_sig}
                      </div>
                      {p.sizes_comment && <div><TextComment>{p.sizes_comment}</TextComment></div>}
                    </PropItem>

                    {paramsetLinks.length > 0
                    && (
                    <PropItem key="links" title="Links" Icon={LinkIcon}>
                      {paramsetLinks.map((l) => <div key={l.url}>{linkify(l.url)}</div>)}
                    </PropItem>
                    )}

                    {paramsetSources.length > 0
                    && (
                    <PropItem key="sources" title="Sources" Icon={MenuBookIcon}>
                      {paramsetSources.map((s) => <div key={s.url}>{linkify(s.url)}</div>)}
                    </PropItem>
                    )}
                  </div>
                );
              })}

              <ListItem key="implementations">
                <Typography component="h3" variant="h4">Implementations</Typography>
              </ListItem>

              {implementations.map((i) => {
                const implLinks = queryAll(db, 'SELECT * FROM implementation_link WHERE implementation_id=?', [i.id]);
                const implSources = queryAll(db, 'SELECT * FROM implementation_source WHERE implementation_id=?', [i.id]);
                const implHardware = queryAll(db, 'SELECT * FROM implementation_hardware_feature WHERE implementation_id=?', [i.id]);
                const implDependencies = queryAll(db, 'SELECT * FROM implementation_dependency WHERE implementation_id=?', [i.id]);
                let implSideChannelGuarding = [
                  i.side_channel_guarding_branching && 'branching',
                  i.side_channel_guarding_timing && 'timing',
                ].filter(Boolean);
                if (implSideChannelGuarding.length === 0) implSideChannelGuarding = ['none'];
                const sideChannelInfo = { 0: 'no', 1: 'yes', null: 'unknown' };

                return (
                  <div key={`i-${i.id}`}>
                    <ListItem key={`i-${i.id}-head`} style={{ display: 'block' }}>
                      <Typography component="h4" variant="h5">
                        {i.name}
                      </Typography>
                      {i.comment && <div><TextComment>{i.comment}</TextComment></div>}
                    </ListItem>

                    <PropItem key={`i-${i.id}-platform`} title="Platform" Icon={LanguageIcon}>
                      {i.platform}
                    </PropItem>

                    <PropItem key={`i-${i.id}-type`} title="Type of Implementation" Icon={CategoryIcon}>
                      {i.type}
                    </PropItem>

                    {implHardware.length > 0
                    && (
                    <PropItem key={`i-${i.id}-hardware`} title="Required Hardware Features" Icon={ChipIcon}>
                      {implHardware.map((h) => <div key={h.feature}>{h.feature}</div>)}
                    </PropItem>
                    )}

                    {implDependencies.length > 0
                    && (
                    <PropItem key={`i-${i.id}-deps`} title="Code Dependencies" Icon={CodeIcon}>
                      {implDependencies.map((d) => <div key={d.dependency}>{d.dependency}</div>)}
                    </PropItem>
                    )}

                    <PropItem key={`i-${i.id}-sidechannel`} title="Side Channel Guarding" Icon={FortIcon}>
                      <div>
                        branching:
                        {' '}
                        {sideChannelInfo[i.side_channel_guarding_branching]}
                        <Comment title={i.side_channel_guarding_branching_comment} />
                      </div>
                      <div>
                        timing:
                        {' '}
                        {sideChannelInfo[i.side_channel_guarding_timing]}
                        <Comment title={i.side_channel_guarding_timing_comment} />
                      </div>
                    </PropItem>

                    {
                                // TODO code size and randomness missing
                                }

                    {implLinks.length > 0
                    && (
                    <PropItem key={`i-${i.id}-links`} title="Links" Icon={LinkIcon}>
                      {implLinks.map((l) => <div key={l.url}>{linkify(l.url)}</div>)}
                    </PropItem>
                    )}

                    {implSources.length > 0
                    && (
                    <PropItem key={`i-${i.id}-sources`} title="Sources" Icon={MenuBookIcon}>
                      {implSources.map((s) => <div key={s.url}>{linkify(s.url)}</div>)}
                    </PropItem>
                    )}
                  </div>
                );
              })}

              <ListItem key="benchmarks">
                <ListItemText>
                  <Typography component="h3" variant="h4">Benchmarks</Typography>
                  <div><Link component={RouterLink} to={`/raw_sql?query=SELECT p.name AS 'Parameter Set'%2C i.name AS Implementation%2C b.platform AS Platform%2C b.comment AS '🛈'%2C b.timings_unit%2C b.timings_gen%2C b.timings_enc_sign%2C b.timings_dec_vrfy%2C b.timings_comment AS '🛈'%2C b.memory_requirements_gen%2C b.memory_requirements_enc_sign%2C b.memory_requirements_dec_vrfy%2C b.memory_requirements_comment AS '🛈' FROM benchmark b%2C paramset p%2C implementation i WHERE p.id%3Db.paramset_id AND i.id%3Db.implementation_id AND p.flavor_id%3D${flavor.id}`}>Show all benchmarks for this flavor</Link></div>
                  {' '}
                  {/* TODO: include this right here as a table */}
                </ListItemText>
              </ListItem>
            </List>
          </Box>
        </Paper>
      </Container>
    );
  }
}

FlavorDetail.propTypes = propTypes;

export default FlavorDetail;
