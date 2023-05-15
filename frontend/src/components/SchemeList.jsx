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
  Link,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  NIST_ROUNDS,
  SCHEME_TYPES,
} from '../constants';
import ExternalLinkIcon from '../icons/ExternalLink';
import detailLink from '../utils/detailLink';
import queryAll from '../utils/queryAll';

function MaybeTooltip({ title, children }) {
  return (title && title !== '') ? <Tooltip title={title}>{children}</Tooltip> : children;
}

MaybeTooltip.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
};

MaybeTooltip.defaultProps = {
  title: '',
};

function SchemeList(props) {
  const { typeKey, db } = props;
  const stmt = 'SELECT * FROM scheme WHERE type=? ORDER BY nist_round DESC, name ASC;';
  const type = SCHEME_TYPES[typeKey];

  return (
    <>
      <Typography component="h2" variant="h5">
        {type.name}
        s
        {'  '}
        <type.icon fontSize="inherit" style={{ marginBottom: -3 }} />
      </Typography>
      <List>
        {queryAll(db, stmt, [typeKey]).map((s) => (
          <ListItem key={`${typeKey}-${s.id_text}`} style={{ paddingLeft: 0 }}>
            <ListItemText>
              <Typography variant="h6">
                <Link component={RouterLink} to={detailLink(s.id_text)}>
                  {s.name}
                </Link>
                { s.website && [
                  ' ',
                  <Link
                    href={s.website}
                    target="_blank"
                    rel="noopener"
                    title="Website"
                  >
                    <ExternalLinkIcon style={{ fontSize: '.8em', marginBottom: -2, marginLeft: '.2em' }} />
                  </Link>,
                ]}
              </Typography>
              <small style={{ lineHeight: 1 }}>
                <MaybeTooltip title={s.category_comment}>
                  <span>{s.category}</span>
                </MaybeTooltip>
                {s.nist_round !== 'none' && (
                <>
                  {' \u2022 '}
                  <MaybeTooltip title={s.nist_round_comment}>
                    <span>{NIST_ROUNDS[s.nist_round].short}</span>
                  </MaybeTooltip>
                </>
                )}
                {s.description && ' \u2022 '}
                <em>{s.description}</em>
              </small>
            </ListItemText>
          </ListItem>
        ))}
      </List>
    </>
  );
}
SchemeList.propTypes = {
  typeKey: PropTypes.oneOf(['sig', 'enc']).isRequired,
  db: PropTypes.shape({
    prepare: PropTypes.func.isRequired,
  }).isRequired,
};

export default SchemeList;
