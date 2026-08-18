/*
 * Side navigation drawer for the app shell.
 *
 * On large screens it renders as a persistent side bar whose width the layout
 * offsets for, and which can collapse to icon-only (`mini`) rows. On smaller
 * screens it renders as a temporary overlay controlled by `open`. The active
 * destination is highlighted from the NAV_ITEMS `isActive` matcher.
 */

import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Link as MuiLink,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Link, NavLink, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

import { DRAWER_MINI_WIDTH, DRAWER_WIDTH, NAV_ITEMS } from '../nav';

function NavDrawer({ open, onClose, mini, onToggleMini }) {
  const theme = useTheme();
  const isLarge = useMediaQuery(theme.breakpoints.up('lg'));
  const variant = isLarge ? 'persistent' : 'temporary';
  const { pathname } = useLocation();

  const width = variant === 'temporary' ? DRAWER_WIDTH : (mini ? DRAWER_MINI_WIDTH : DRAWER_WIDTH);

  // Only the large-screen persistent drawer can collapse to icon-only rows; the
  // temporary (overlay) drawer is always full-width.
  const compact = isLarge && mini;

  const handleItemClick = () => {
    // In the temporary (overlay) mode, navigating via a nav item closes it.
    if (variant === 'temporary') onClose();
  };

  const inner = (
    <>
      <Toolbar variant="dense" />
      <List disablePadding sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.key}
              component={NavLink}
              to={item.path}
              selected={active}
              title={compact ? item.label : undefined}
              onClick={handleItemClick}
              sx={{
                minHeight: 48,
                justifyContent: compact ? 'center' : 'flex-start',
                px: compact ? 0 : 2,
                mx: 1,
                borderRadius: 1.5,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#fff',
                  '&:hover': { bgcolor: 'primary.main' },
                  '& .MuiListItemIcon-root': { color: '#fff' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: compact ? 0 : 2, color: 'text.secondary' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              {!compact && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ noWrap: true, fontWeight: 500 }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      {isLarge && (
        <Box sx={{ p: 1.5 }}>
          <ListItemButton
            onClick={onToggleMini}
            sx={{
              minHeight: 40,
              justifyContent: compact ? 'center' : 'flex-start',
              px: compact ? 0 : 2,
              borderRadius: 1.5,
              color: 'text.secondary',
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: compact ? 0 : 2, color: 'inherit' }}>
              <span style={{ fontSize: '0.95rem' }}>{mini ? '»' : '«'}</span>
            </ListItemIcon>
            {!compact && (
              <ListItemText
                primary={mini ? 'Expand' : 'Collapse'}
                primaryTypographyProps={{ noWrap: true }}
              />
            )}
          </ListItemButton>
        </Box>
      )}
      <Divider />
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', gap: 1 }}>
        <MuiLink href="https://www.aisec.fraunhofer.de/en/imprint.html">Imprint</MuiLink>
        <MuiLink component={Link} to="/privacy_policy">Privacy Policy</MuiLink>
      </Box>
    </>
  );

  return (
    <Drawer
      variant={variant}
      anchor="left"
      open={isLarge ? true : open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        },
      }}
    >
      {inner}
    </Drawer>
  );
}

NavDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mini: PropTypes.bool.isRequired,
  onToggleMini: PropTypes.func.isRequired,
};

export default NavDrawer;
