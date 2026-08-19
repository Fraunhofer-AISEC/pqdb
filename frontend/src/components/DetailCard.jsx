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
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';

/*
 * DetailCard — a typed section card used by the scheme and flavor detail views.
 * It groups a set of `PropItem` key-value rows under one header (icon + title).
 * All styling comes from theme tokens via `sx` (no inline `style` props), so it
 * renders correctly in light and dark mode.
 */

const propTypes = {
  title: PropTypes.string.isRequired,
  Icon: PropTypes.elementType,
  children: PropTypes.node,
};

const defaultProps = {
  Icon: undefined,
  children: null,
};

function DetailCard({ title, Icon, children }) {
  return (
    <Paper variant="outlined">
      <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          {Icon && <Icon color="primary" fontSize="inherit" />}
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {children}
        </Box>
      </Box>
    </Paper>
  );
}

DetailCard.propTypes = propTypes;
DetailCard.defaultProps = defaultProps;

export default DetailCard;
