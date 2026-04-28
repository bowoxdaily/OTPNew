import React from 'react';
import { Link } from 'react-router-dom';
import { Grid, Box, Card, Stack, Typography, useTheme, useMediaQuery } from '@mui/material';
import { IconShieldCheck, IconDeviceMobile, IconBolt } from '@tabler/icons-react';

import PageContainer from 'src/components/container/PageContainer';
import Logo from 'src/layouts/full/shared/logo/Logo';
import AuthLogin from './auth/AuthLogin';
import { useBranding } from 'src/contexts/BrandingContext';

const Login2 = () => {
  const { branding } = useBranding();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const primaryColor = branding.primary_color || '#5D87FF';

  const features = [
    { icon: IconBolt, title: 'Instan & Otomatis', desc: 'Nomor OTP langsung aktif setelah pembelian' },
    { icon: IconShieldCheck, title: 'Aman & Terpercaya', desc: 'Transaksi terenkripsi dan terverifikasi' },
    { icon: IconDeviceMobile, title: 'Multi Platform', desc: 'Mendukung berbagai layanan verifikasi' },
  ];

  return (
    <PageContainer title="Login" description="Halaman login">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          background: `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}15 50%, #f8fafc 100%)`,
        }}
      >
        {/* Left Panel — Branding & Features (desktop only) */}
        {!isMobile && (
          <Box
            sx={{
              flex: '0 0 45%',
              background: `linear-gradient(160deg, ${primaryColor} 0%, ${primaryColor}dd 50%, ${primaryColor}bb 100%)`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              px: 6,
              py: 4,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-20%',
                right: '-10%',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-15%',
                left: '-5%',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h2" fontWeight="800" color="#fff" mb={1.5} sx={{ lineHeight: 1.2 }}>
                {branding.brand_name || 'OTP Reseller'}
              </Typography>
              <Typography variant="h6" color="rgba(255,255,255,0.85)" mb={5} fontWeight="400">
                {branding.brand_tagline || 'Platform Reseller OTP Terpercaya'}
              </Typography>

              <Stack spacing={3.5}>
                {features.map((item, i) => (
                  <Stack key={i} direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '14px',
                        background: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <item.icon size={24} color="#fff" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="700" color="#fff">
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="rgba(255,255,255,0.75)">
                        {item.desc}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>
        )}

        {/* Right Panel — Login Form */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 2, sm: 4 },
          }}
        >
          <Card
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              width: '100%',
              maxWidth: '460px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: 'grey.200',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            {/* Logo */}
            <Box display="flex" justifyContent="center" mb={1}>
              <Logo />
            </Box>

            {/* Welcome Text */}
            <Typography variant="h4" fontWeight="700" textAlign="center" mb={0.5}>
              Selamat Datang 👋
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
              {branding.brand_tagline || 'Masuk ke akun Anda untuk melanjutkan'}
            </Typography>

            {/* Login Form */}
            <AuthLogin
              subtitle={
                <Stack direction="row" spacing={0.5} justifyContent="center" mt={3}>
                  <Typography color="text.secondary" variant="body2">
                    Belum punya akun?
                  </Typography>
                  <Typography
                    component={Link}
                    to="/auth/register"
                    fontWeight="600"
                    variant="body2"
                    sx={{
                      textDecoration: 'none',
                      color: 'primary.main',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Daftar Gratis
                  </Typography>
                </Stack>
              }
            />
          </Card>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default Login2;
