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
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';

/*
 * PropItem — a single key-value row used inside a `DetailCard`. It shows a
 * labelled icon on the left (with an accessible tooltip) and its content on the
 * right. Styling is theme-token based via `sx`, so it renders correctly in both
 * light and dark modes.
 */

const defaultProps = {
  children: null,
};

const propTypes = {
  Icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function PropItem({ children, Icon, title }) {
  return (
    <Box sx={{
      display: 'flex',
      gap: 1.5,
      alignItems: 'flex-start',
      py: 1,
    }}
    >
      <Box sx={{ mt: 0.4, color: 'text.secondary', display: 'flex' }}>
        <Tooltip title={title} arrow>
          {/* overwrite some properties <Tooltip> sets */}
          <Icon role="img" aria-hidden={false} aria-label={title} aria-describedby={null} fontSize="small" />
        </Tooltip>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexGrow: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 500, color: 'text.secondary', flexShrink: 0, width: 190, whiteSpace: 'nowrap' }}>
          {title}
        </Typography>
        <Stack spacing={0.5} sx={{ flexGrow: 1, minWidth: 0, alignItems: 'flex-start' }}>
          {children}
        </Stack>
      </Box>
    </Box>
  );
}

PropItem.defaultProps = defaultProps;
PropItem.propTypes = propTypes;

export default PropItem;
