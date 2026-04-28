import React from 'react';
import { Grid, Box, Card, Typography, Stack, useTheme, useMediaQuery } from '@mui/material';
import { Link } from 'react-router-dom';
import { IconUserPlus, IconRocket, IconCoin } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import Logo from 'src/layouts/full/shared/logo/Logo';
import AuthRegister from './auth/AuthRegister';
import { useBranding } from 'src/contexts/BrandingContext';

const Register2 = () => {
  const { branding } = useBranding();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const primaryColor = branding.primary_color || '#5D87FF';

  const steps = [
    { icon: IconUserPlus, title: 'Buat Akun', desc: 'Daftar gratis hanya dalam hitungan detik' },
    { icon: IconCoin, title: 'Isi Saldo', desc: 'Top-up saldo via QRIS — otomatis terverifikasi' },
    { icon: IconRocket, title: 'Mulai Jualan', desc: 'Langsung beli & jual nomor OTP dengan mudah' },
  ];

  return (
    <PageContainer title="Register" description="Halaman pendaftaran">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          background: `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}15 50%, #f8fafc 100%)`,
        }}
      >
        {/* Left Panel — Branding & Steps (desktop only) */}
        {!isMobile && (
          <Box
            sx={{
              flex: '0 0 45%',
              background: `linear-gradient(160deg, ${primaryColor}dd 0%, ${primaryColor} 50%, ${primaryColor}ee 100%)`,
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
                top: '10%',
                right: '-8%',
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-10%',
                left: '5%',
                width: '250px',
                height: '250px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h3" fontWeight="800" color="#fff" mb={1} sx={{ lineHeight: 1.2 }}>
                Mulai dalam 3 Langkah
              </Typography>
              <Typography variant="body1" color="rgba(255,255,255,0.8)" mb={5} fontWeight="400">
                Bergabung bersama {branding.brand_name || 'OTP Reseller'} dan mulai raih keuntungan hari ini
              </Typography>

              <Stack spacing={3}>
                {steps.map((item, i) => (
                  <Stack key={i} direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '16px',
                        background: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        position: 'relative',
                      }}
                    >
                      <item.icon size={24} color="#fff" />
                      {/* Step number badge */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          color: primaryColor,
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {i + 1}
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="700" color="#fff">
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="rgba(255,255,255,0.7)">
                        {item.desc}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>
        )}

        {/* Right Panel — Register Form */}
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

            {/* Title */}
            <Typography variant="h4" fontWeight="700" textAlign="center" mb={0.5}>
              Buat Akun Baru 🚀
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
              Daftar gratis dan mulai gunakan layanan {branding.brand_name || 'OTP Reseller'}
            </Typography>

            {/* Register Form */}
            <AuthRegister
              subtitle={
                <Stack direction="row" spacing={0.5} justifyContent="center" mt={3}>
                  <Typography color="text.secondary" variant="body2">
                    Sudah punya akun?
                  </Typography>
                  <Typography
                    component={Link}
                    to="/auth/login"
                    fontWeight="600"
                    variant="body2"
                    sx={{
                      textDecoration: 'none',
                      color: 'primary.main',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Masuk di sini
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

export default Register2;
