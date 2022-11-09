import {
  Bolt as BoltIcon,
  Category as CategoryIcon,
  Code as CodeIcon,
  SyncAlt as DiffieHellmanIcon,
  Event as EventIcon,
  Leaderboard as LeaderboardIcon,
  Link as LinkIcon,
  MenuBook as MenuBookIcon,
  Tune as ParamSetIcon,
  PendingActions as PendingActionsIcon,
  PeopleAlt as PeopleIcon,
  Save as SaveIcon,
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
import Comment from '../components/Comment';
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
    }),
  }).isRequired,
};

class SchemeDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scheme: null,
      authors: undefined,
      problems: undefined,
      sources: undefined,
      links: undefined,
      attacks: undefined,
      flavors: undefined,
      patentslink: undefined,
    };
  }

  componentDidMount() {
    const { match: { params: { schemeId } }, db } = this.props;
    const scheme = queryAll(db, 'SELECT * FROM scheme WHERE id_text=?', [schemeId])[0];
    if (scheme === undefined) {
      document.title = 'Unknown - Scheme Details - pqdb';
      this.setState({ scheme: undefined });
    } else {
      document.title = `${scheme.name} - Scheme Details - pqdb`;
      const authors = queryAll(db, 'SELECT * FROM scheme_author WHERE scheme_id=?', [scheme.id]);
      const problems = queryAll(db, 'SELECT * FROM scheme_problem WHERE scheme_id=?', [scheme.id]);
      const links = queryAll(db, 'SELECT * FROM scheme_link WHERE scheme_id=?', [scheme.id]);
      const sources = queryAll(db, 'SELECT * FROM scheme_source WHERE scheme_id=?', [scheme.id]);
      const attacks = queryAll(db, 'SELECT * FROM scheme_attack WHERE scheme_id=?', [scheme.id]);
      const flavors = queryAll(db, 'SELECT * FROM flavor WHERE scheme_id=?', [scheme.id]);
      const patentslink = queryAll(db, 'SELECT * FROM scheme_patents_source WHERE scheme_id=?', [scheme.id]);
      this.setState({
        scheme, authors, problems, links, sources, attacks, flavors, patentslink,
      });
    }
  }

  render() {
    const { db } = this.props;
    const {
      scheme, authors, problems, links, sources, attacks, flavors, patentslink,
    } = this.state;

    if (scheme === null) return null;

    if (scheme === undefined) {
      return <Container><Paper>No such scheme.</Paper></Container>;
    }

    const TypeIcon = SCHEME_TYPES[scheme.type].icon;

    const exp = new RegExp('([[0-9]+])');
    const patentString = scheme.patents?.split(exp);
    return (
      <Container maxWidth="md">
        <Paper>
          <Box>
            <List>
              <ListItem key="head" alignItems="flex-start">
                <ListItemText>
                  <Typography component="h1" variant="h2">
                    {scheme.name}
                    {'  '}
                    <Tooltip title={SCHEME_TYPES[scheme.type].name} arrow>
                      <TypeIcon fontSize="large" aria-hidden={false} role="img" aria-label={SCHEME_TYPES[scheme.type].name} aria-describedby={null} />
                    </Tooltip>
                  </Typography>
                  {scheme.description && <div>{scheme.description}</div>}
                  {scheme.comment && <div><TextComment>{scheme.comment}</TextComment></div>}
                </ListItemText>
              </ListItem>

              <PropItem key="category" title="Category" Icon={CategoryIcon}>
                {scheme.category}
                {' '}
                based
                <Comment title={scheme.category_comment} />
              </PropItem>

              {(scheme.stateful || scheme.stateful_comment) && (
              <PropItem key="stateful" title="Statefulness" Icon={SaveIcon}>
                {scheme.stateful ? 'stateful' : 'stateless' /* stateless only shown if there's a comment */}
                <Comment title={scheme.stateful_comment} />
              </PropItem>
              )}
              <PropItem key="nist_round" title="NIST standardization" Icon={LeaderboardIcon}>
                {NIST_ROUNDS[scheme.nist_round].long}
              </PropItem>

              {attacks.length > 0
                && (
                <PropItem key="attacks" title="Attacks" Icon={BoltIcon}>
                  {attacks.map((a) => <div key={a.url}>{linkify(a.url)}</div>)}
                </PropItem>
                )}

              <PropItem key="year" title="Year" Icon={EventIcon}>
                {
                [
                  scheme.year_paper
                    ? [scheme.year_paper, <span key="pap" style={{ opacity: 0.5 }}> (paper)</span>] : [],
                  scheme.year_candidate
                    ? [scheme.year_candidate, <span key="cand" style={{ opacity: 0.5 }}> (NIST candidate)</span>] : [],
                  scheme.year_standardization
                    ? [scheme.year_standardization, <span key="sdt" style={{ opacity: 0.5 }}> (standardization)</span>] : [],
                  scheme.year_comment
                    ? [<em key="comment">{scheme.year_comment}</em>] : [],
                ].reduce((accu, elem) => {
                  // join(), but skipping empty entries
                  if (!elem.length) return accu;
                  if (!accu.length) return [elem];
                  return [...accu, ' \u2022 ', elem];
                }, [])
              }
              </PropItem>

              <PropItem key="problems_trust" title="Security Properties" Icon={SecurityIcon}>
                {scheme.trust_comment
                  && (
                  <>
                    <div><strong>Trust: </strong></div>
                    <div style={{ marginBottom: '.6em' }}>{scheme.trust_comment}</div>
                  </>
                  )}
                {(problems.length > 0 || scheme.problems_comment)
                  && (
                  <>
                    <div><strong>Problems:</strong></div>
                    {scheme.problems_comment
                     && <div><TextComment>{scheme.problems_comment}</TextComment></div>}
                    {problems.map((p) => (
                      <div key={p.assumption}>
                        {p.assumption}
                        {' '}
                        <Comment title={p.comment} />
                      </div>
                    ))}
                  </>
                  )}
              </PropItem>

              <PropItem key="authors" title="Authors" Icon={PeopleIcon}>
                {authors.map((a) => <div key={a.name}>{a.name}</div>)}
              </PropItem>

              {(scheme.website || links.length > 0)
                && (
                <PropItem key="links" title="Links" Icon={LinkIcon}>
                  {
                    scheme.website
                    && (
                    <div key={scheme.website}>
                      <Link href={scheme.website}>
                        Website (
                        {scheme.website}
                        )
                      </Link>
                    </div>
                    )
                  }
                  {links.map((l) => <div key={l.url}>{linkify(l.url)}</div>)}
                </PropItem>
                )}

              {sources.length > 0
                && (
                <PropItem key="sources" title="Sources" Icon={MenuBookIcon}>
                  {sources.map((s) => <div key={s.url}>{linkify(s.url)}</div>)}
                </PropItem>
                )}

              {scheme.patents
                && (
                <PropItem key="patents" title="Patents" Icon={PendingActionsIcon}>
                  <div key={patentString}>
                    {patentString.map((ps) => {
                      if (exp.test(ps)) {
                        const xs = ps.replace('[', '');
                        const x = xs.replace(']', '');
                        const plElement = patentslink[x - 1];
                        const plUrl = plElement.url;
                        return (
                          <Link href={plUrl}>
                            {ps}
                          </Link>
                        );
                      }
                      return ps;
                    })}
                  </div>
                </PropItem>
                )}

              <ListItem key="flavors">
                <Typography component="h2" variant="h4">Flavors</Typography>
              </ListItem>

              {flavors.map((f) => {
                const flavorParamsets = queryAll(db, 'SELECT * FROM paramset WHERE flavor_id=? ORDER BY security_level_nist_category ASC, security_level_quantum ASC', [f.id]);
                const flavorImplementations = queryAll(db, 'SELECT name FROM implementation WHERE flavor_id=? ORDER BY type DESC', [f.id]);

                return (
                  <div key={`flavor-${f.id}`}>
                    <ListItem key="head" style={{ display: 'block' }}>
                      <Typography component="h3" variant="h5">
                        <Link component={RouterLink} to={detailLink(scheme.id_text, f.id_text)}>
                          {f.name}
                        </Link>
                      </Typography>
                      {f.description && <div>{f.description}</div>}
                      {f.comment && <div><TextComment>{f.comment}</TextComment></div>}
                    </ListItem>

                    {f.type !== 'SIG' && !f.type_comment // there's just one type for signatures, not worth showing this here
                      && (
                      <PropItem key="type" title="API Type" Icon={CategoryIcon}>
                        {f.type}
                        {' '}
                        <Comment title={f.type_comment} />
                      </PropItem>
                      )}

                    <PropItem key="securitynotion" title="Security Notion" Icon={SecurityIcon}>
                      <Tooltip title={SEC_NOTIONS[f.security_notion]}>
                        <span>{f.security_notion}</span>
                      </Tooltip>
                      <Comment title={f.security_notion_comment} />
                    </PropItem>

                    {f.dh_ness && (
                    <PropItem key="dhness" title="Diffie-Hellman-Ness" Icon={DiffieHellmanIcon}>
                      <strong>Diffie-Hellman-Ness: </strong>
                      {f.dh_ness}
                    </PropItem>
                    )}

                    <PropItem key="paramsets" title="Parameter sets" Icon={ParamSetIcon}>
                      {flavorParamsets.map((p) => (
                        <div key={p.name}>
                          {p.name}
                          {' '}
                          {(p.security_level_nist_category ?? 0) > 0 && (

                            <Tooltip title={`NIST Category ${p.security_level_nist_category}`}>
                              <span>
                                (
                                {romanCat(p.security_level_nist_category)}
                                )
                              </span>
                            </Tooltip>
                          )}
                        </div>
                      ))}
                    </PropItem>

                    <PropItem key="implementations" title="Implementations" Icon={CodeIcon}>
                      {flavorImplementations.map((i) => <div key={i.name}>{i.name}</div>)}
                    </PropItem>
                  </div>
                );
              })}
            </List>
          </Box>
        </Paper>
      </Container>
    );
  }
}

SchemeDetail.propTypes = propTypes;

export default SchemeDetail;
