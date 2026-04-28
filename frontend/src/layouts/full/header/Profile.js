import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar, Box, Menu, IconButton, MenuItem,
  ListItemIcon, ListItemText, Typography, Stack,
  Divider, Chip,
} from '@mui/material';
import {
  IconUser, IconLogout, IconUserCircle, IconShieldLock,
} from '@tabler/icons-react';
import { clearUserSession, getUserSession } from 'src/utils/authSession';
import { useBranding } from 'src/contexts/BrandingContext';

const Profile = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const session = getUserSession();
  const { branding } = useBranding();
  const primaryColor = branding?.primary_color || '#5d87ff';

  const open = Boolean(anchorEl);
  const avatarLetter = (session?.name || session?.username || 'U').charAt(0).toUpperCase();
  const isAdmin = session?.role === 'admin';

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    clearUserSession();
    handleClose();
    navigate('/auth/login');
  };

  const handleGoProfile = () => {
    handleClose();
    navigate('/profile');
  };

  return (
    <Box>
      {/* Avatar trigger */}
      <IconButton
        onClick={handleOpen}
        size="small"
        aria-controls={open ? 'profile-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{ p: 0.5 }}
      >
        <Avatar
          sx={{
            width: 38,
            height: 38,
            fontWeight: 800,
            fontSize: '1rem',
            bgcolor: primaryColor,
            color: '#fff',
            border: '2px solid',
            borderColor: `${primaryColor}40`,
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: `0 0 0 3px ${primaryColor}30`,
            },
          }}
        >
          {avatarLetter}
        </Avatar>
      </IconButton>

      {/* Dropdown Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        PaperProps={{
          elevation: 0,
          sx: {
            width: 240,
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'grey.200',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            mt: 1,
            overflow: 'visible',
            // Arrow tip
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: -6,
              right: 18,
              width: 12,
              height: 12,
              bgcolor: 'background.paper',
              transform: 'rotate(45deg)',
              border: '1px solid',
              borderColor: 'grey.200',
              borderBottom: 'none',
              borderRight: 'none',
            },
          },
        }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                width: 44,
                height: 44,
                fontWeight: 800,
                fontSize: '1.1rem',
                bgcolor: primaryColor,
                color: '#fff',
              }}
            >
              {avatarLetter}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {session?.name || session?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                @{session?.username}
              </Typography>
              <Chip
                label={isAdmin ? '👑 Admin' : '🛍️ Reseller'}
                size="small"
                sx={{
                  mt: 0.5,
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: isAdmin ? '#fff3e0' : '#e8f4fd',
                  color: isAdmin ? '#e65100' : '#0277bd',
                  borderRadius: '6px',
                }}
              />
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ mx: 1.5 }} />

        {/* Menu items */}
        <Box sx={{ py: 1 }}>
          <MenuItem
            onClick={handleGoProfile}
            sx={{
              mx: 1,
              borderRadius: '10px',
              py: 1,
              '&:hover': { bgcolor: `${primaryColor}10` },
            }}
          >
            <ListItemIcon>
              <IconUserCircle size={20} color={primaryColor} />
            </ListItemIcon>
            <ListItemText
              primary={<Typography variant="body2" fontWeight={600}>Profil Saya</Typography>}
              secondary={<Typography variant="caption" color="text.secondary">Edit info & password</Typography>}
            />
          </MenuItem>

          <MenuItem
            onClick={() => { handleClose(); navigate('/profile'); }}
            sx={{
              mx: 1,
              borderRadius: '10px',
              py: 1,
              '&:hover': { bgcolor: `${primaryColor}10` },
            }}
          >
            <ListItemIcon>
              <IconShieldLock size={20} color={primaryColor} />
            </ListItemIcon>
            <ListItemText
              primary={<Typography variant="body2" fontWeight={600}>Keamanan</Typography>}
              secondary={<Typography variant="caption" color="text.secondary">Ganti password</Typography>}
            />
          </MenuItem>
        </Box>

        <Divider sx={{ mx: 1.5 }} />

        {/* Logout */}
        <Box sx={{ p: 1, pt: 0.5 }}>
          <MenuItem
            onClick={handleLogout}
            sx={{
              mx: 0,
              borderRadius: '10px',
              py: 1,
              color: 'error.main',
              '&:hover': { bgcolor: 'error.lighter', color: 'error.main' },
            }}
          >
            <ListItemIcon>
              <IconLogout size={20} color="#f44336" />
            </ListItemIcon>
            <ListItemText
              primary={<Typography variant="body2" fontWeight={700} color="error.main">Keluar</Typography>}
            />
          </MenuItem>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
