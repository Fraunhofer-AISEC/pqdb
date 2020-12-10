import {
  Box,
  Button,
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from '@material-ui/core';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import genCSV from 'csv-stringify';

const propTypes = {
  queryResult: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    values: PropTypes.arrayOf(PropTypes.array.isRequired).isRequired,
  }).isRequired,
};

const options = ['.csv', '.json'];

function startDownload(content, filename) {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function DownloadTableButton(props) {
  const [open, setOpen] = useState(false);
  const anchorRef = React.useRef(null);

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleMenuItemClick = (event, index) => {
    if (index === 0) {
      genCSV([props.queryResult.columns, ...props.queryResult.values], (err, output) => {
        startDownload(output, 'data.csv');
      });
    } else if (index === 1) {
      startDownload(JSON.stringify(props.queryResult, null, 2), 'data.json');
    }
    setOpen(false);
  };

  return (
    <Box>
      <Button variant="outlined" ref={anchorRef} onClick={handleToggle}>Download as ...</Button>
      <Popper open={open} anchorEl={anchorRef.current} transition disablePortal>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {option}
                    </MenuItem>
                  ))}
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
