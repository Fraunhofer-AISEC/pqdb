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
  Stack,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';

import {
  NIST_ROUNDS,
  SCHEME_TYPES,
} from '../constants';
import ExternalLinkIcon from '../icons/ExternalLink';
import StatusBadge from './StatusBadge';
import detailLink from '../utils/detailLink';
import queryAll from '../utils/queryAll';

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
                    key="website"
                    href={s.website}
                    target="_blank"
                    rel="noopener"
                    title="Website"
                  >
                    <ExternalLinkIcon style={{ fontSize: '.8em', marginBottom: -2, marginLeft: '.2em' }} />
                  </Link>,
                ]}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
                <StatusBadge kind="categories" value={s.category} title={s.category_comment} />
                {s.nist_round !== 'none' && (
                  <StatusBadge
                    kind="rounds"
                    value={s.nist_round}
                    label={NIST_ROUNDS[s.nist_round].short}
                    title={s.nist_round_comment}
                  />
                )}
                {s.stateful === 1 && (
                  <StatusBadge
                    kind="statefulness"
                    value={1}
                    label="stateful"
                    title={s.stateful_comment}
                  />
                )}
              </Stack>
              {s.description && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  <em>{s.description}</em>
                </Typography>
              )}
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
