import React from 'react';
import {
  Box, AppBar, Toolbar, styled, Stack,
  IconButton, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconMenu2 } from '@tabler/icons-react';

import Profile from './Profile';
import { useBranding } from 'src/contexts/BrandingContext';
import { getUserSession } from 'src/utils/authSession';

// Map path → judul halaman
const PAGE_TITLES = {
  '/dashboard/user':    { title: 'Dashboard',            subtitle: 'Ringkasan aktivitas akun Anda' },
  '/dashboard/admin':   { title: 'Dashboard Admin',       subtitle: 'Pantau & kelola seluruh platform' },
  '/otp/beli-nomor':    { title: 'Beli Nomor OTP',        subtitle: 'Pilih layanan dan beli nomor verifikasi' },
  '/otp/cek-otp':       { title: 'Cek Kode OTP',          subtitle: 'Cek kode OTP yang diterima' },
  '/user/topup':        { title: 'Top Up Saldo',          subtitle: 'Isi saldo akun Anda via QRIS' },
  '/otp/mutasi-saldo':  { title: 'Mutasi Saldo',          subtitle: 'Riwayat keluar masuk saldo' },
  '/admin/markups':     { title: 'Manajemen Markup',      subtitle: 'Atur harga markup layanan OTP' },
  '/admin/layanan':     { title: 'Daftar Layanan',        subtitle: 'Kelola layanan yang tersedia' },
  '/admin/branding':    { title: 'Manajemen Branding',    subtitle: 'Atur tampilan dan identitas platform' },
  '/admin/topup':       { title: 'Konfirmasi Top Up',     subtitle: 'Verifikasi top up dari pengguna' },
  '/admin/orders':      { title: 'Riwayat Order',         subtitle: 'Semua transaksi order pengguna' },
  '/admin/payment-gateway': { title: 'Payment Gateway',  subtitle: 'Pengaturan metode pembayaran' },
  '/profile':           { title: 'Profil Saya',           subtitle: 'Kelola informasi akun Anda' },
};

const Header = (props) => {
  const { branding } = useBranding();
  const session = getUserSession();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'OTP Reseller', subtitle: '' };
  const primaryColor = branding?.primary_color || '#5d87ff';

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: 'none',
    background: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.grey[100]}`,
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
    [theme.breakpoints.up('lg')]: {
      minHeight: '70px',
    },
  }));

  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: '100%',
    color: theme.palette.text.secondary,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  }));

  return (
    <AppBarStyled position="sticky" color="default">
      <ToolbarStyled>
        {/* Mobile menu toggle */}
        {isMobile && (
          <Tooltip title="Buka menu">
            <IconButton
              color="inherit"
              aria-label="toggle sidebar"
              onClick={props.toggleMobileSidebar}
              sx={{
                mr: 1.5,
                width: 38,
                height: 38,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'grey.200',
                '&:hover': { backgroundColor: `${primaryColor}10` },
              }}
            >
              <IconMenu2 size={20} />
            </IconButton>
          </Tooltip>
        )}

        {/* Page Title */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            fontWeight={700}
            noWrap
            sx={{
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              color: 'text.primary',
              lineHeight: 1.2,
            }}
          >
            {pageInfo.title}
          </Typography>
          {pageInfo.subtitle && !isMobile && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {pageInfo.subtitle}
            </Typography>
          )}
        </Box>

        {/* Right section */}
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Greeting — desktop only */}
          {!isMobile && (
            <Box
              sx={{
                px: 2,
                py: 0.8,
                borderRadius: '10px',
                backgroundColor: `${primaryColor}10`,
                border: '1px solid',
                borderColor: `${primaryColor}25`,
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.1}>
                Selamat datang,
              </Typography>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                noWrap
                sx={{ color: primaryColor, maxWidth: 140 }}
              >
                {session?.name || session?.username}
              </Typography>
            </Box>
          )}

          {/* Avatar / Profile dropdown */}
          <Profile />
        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
  );
};

Header.propTypes = {
  sx: PropTypes.object,
  toggleMobileSidebar: PropTypes.func,
};

export default Header;
