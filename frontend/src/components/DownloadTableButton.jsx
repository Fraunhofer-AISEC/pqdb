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
  Button,
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useRef, useState } from 'react';

const propTypes = {
  onExportCsv: PropTypes.func.isRequired,
  queryResult: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    values: PropTypes.arrayOf(PropTypes.array.isRequired).isRequired,
  }).isRequired,
};

function startDownload(content, filename) {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function stringifyCells(queryResult) {
  return queryResult.values.map(
    (row) => row.map((val) => {
      // JSON export uses raw values (rendered links are produced by a cell
      // renderer in DataTable, not by values in the data itself).
      return val;
    }),
  );
}

function DownloadTableButton(props) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleMenuItemClick = (index) => {
    const { queryResult, onExportCsv } = props;
    if (index === 0) {
      onExportCsv();
    } else {
      startDownload(JSON.stringify(stringifyCells(queryResult), null, 2), 'data.json');
    }
    setOpen(false);
  };

  return (
    <Box>
      <Button variant="outlined" ref={anchorRef} onClick={handleToggle}>
        Download as ...
      </Button>
      <Popper open={open} anchorEl={anchorRef.current} transition disablePortal>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            sx={{
              transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList>
                  <MenuItem onClick={() => handleMenuItemClick(0)}>
                    .csv
                  </MenuItem>
                  <MenuItem onClick={() => handleMenuItemClick(1)}>
                    .json
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  );
}
DownloadTableButton.propTypes = propTypes;

export default DownloadTableButton;
