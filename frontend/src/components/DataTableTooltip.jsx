/*
 * Copyright (c) 2026, Fraunhofer AISEC.
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

/*
 * DataTableTooltip — AG Grid custom tooltip for DataTable.
 *
 * AG Grid truncates cell and header text that overflows its column with an
 * ellipsis ("…"). DataTable enables the grid's `tooltipShowMode: 'whenTruncated'`
 * option, so AG Grid only mounts this tooltip when the hovered cell/header value
 * is actually truncated. This component therefore simply renders the full,
 * untruncated value in a card styled to match the MUI popovers used elsewhere in
 * the app, in both light and dark mode.
 */
import { Box, useTheme } from '@mui/material';
import PropTypes from 'prop-types';

function tooltipSx(theme) {
  return {
    px: 1.5,
    py: 1,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 1,
    boxShadow: theme.shadows[3],
    maxWidth: 360,
    fontSize: '0.8rem',
    lineHeight: 1.4,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
  };
}

function DataTableTooltip(props) {
  const theme = useTheme();
  // Prefer the formatted value (already display-ready) but fall back to the raw
  // value when no formatter is configured for the column.
  const text = props.valueFormatted ?? props.value;
  return <Box sx={tooltipSx(theme)}>{text}</Box>;
}

DataTableTooltip.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  valueFormatted: PropTypes.string,
};

export default DataTableTooltip;
