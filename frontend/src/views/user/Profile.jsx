import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Stack, Button, Alert, Divider,
  InputAdornment, IconButton, CircularProgress, Avatar,
  Chip, LinearProgress, Grid, Fade,
} from '@mui/material';
import {
  IconUser, IconMail, IconPhone, IconLock, IconEye, IconEyeOff,
  IconPencil, IconCheck, IconId, IconShieldLock, IconDeviceFloppy,
  IconKey, IconInfoCircle,
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';
import { getUserSession, setUserSession } from 'src/utils/authSession';
import { useBranding } from 'src/contexts/BrandingContext';

/* ─────────────────────────────────────────────
   Password strength helper
───────────────────────────────────────────── */
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score: 20, label: 'Sangat Lemah', color: '#f44336' };
  if (score === 2) return { score: 40, label: 'Lemah', color: '#ff9800' };
  if (score === 3) return { score: 60, label: 'Cukup', color: '#ffc107' };
  if (score === 4) return { score: 80, label: 'Kuat', color: '#4caf50' };
  return { score: 100, label: 'Sangat Kuat', color: '#2e7d32' };
}

/* ─────────────────────────────────────────────
   Reusable field component
───────────────────────────────────────────── */
const FieldLabel = ({ children }) => (
  <Typography variant="subtitle2" fontWeight={600} mb="6px" display="block" color="text.primary">
    {children}
  </Typography>
);

const styledInput = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: '#f8faff',
    transition: 'all 0.2s',
    '&:hover': { backgroundColor: '#f0f4ff' },
    '&.Mui-focused': { backgroundColor: '#fff' },
    '&.Mui-disabled': { backgroundColor: '#f5f5f5' },
  },
};

/* ─────────────────────────────────────────────
   Section Card wrapper
───────────────────────────────────────────── */
const SectionCard = ({ icon: Icon, title, subtitle, iconColor = 'primary.main', children }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: '20px',
      border: '1px solid',
      borderColor: 'grey.200',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.07)' },
    }}
  >
    {/* Card Header */}
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      sx={{
        px: 3,
        py: 2.5,
        borderBottom: '1px solid',
        borderColor: 'grey.100',
        background: 'linear-gradient(to right, #f8faff, #fff)',
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: '12px',
          backgroundColor: `${iconColor}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={22} color={iconColor === 'primary.main' ? '#5d87ff' : '#f57c00'} />
      </Box>
      <Box>
        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
    <Box sx={{ p: 3 }}>{children}</Box>
  </Card>
);

/* ─────────────────────────────────────────────
   Main Profile Component
───────────────────────────────────────────── */
const Profile = () => {
  const session = getUserSession();
  const { branding } = useBranding();
  const primaryColor = branding?.primary_color || '#5d87ff';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  const strength = getPasswordStrength(newPw);
  const avatarLetter = (session?.name || session?.username || 'U').charAt(0).toUpperCase();
  const isAdmin = session?.role === 'admin';

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((r) => readJsonSafe(r))
      .then((d) => {
        if (d?.success && d?.data) {
          setName(d.data.name || '');
          setEmail(d.data.email || '');
          setPhone(d.data.phone || '');
        }
      })
      .catch(() => {});
  }, []);

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setProfileLoading(true);
    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name, email, phone }),
      });
      const data = await readJsonSafe(res);
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal memperbarui profil');
      const s = getUserSession();
      setUserSession({ ...s, name: data.data?.name || s.name });
      setProfileMsg({ type: 'success', text: '✅ Profil berhasil diperbarui!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    if (!currentPw || !newPw || !confirmPw) {
      setPwMsg({ type: 'error', text: 'Semua field password wajib diisi' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'Konfirmasi password tidak cocok' });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ type: 'error', text: 'Password baru minimal 8 karakter' });
      return;
    }
    setPwLoading(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      const data = await readJsonSafe(res);
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mengganti password');
      setPwMsg({ type: 'success', text: '🔐 Password berhasil diperbarui!' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message });
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <PageContainer title="Profil Saya" description="Pengaturan akun Anda">
      <Fade in timeout={400}>
        <Box sx={{ maxWidth: 780, mx: 'auto' }}>

          {/* ── Hero Banner ── */}
          <Box
            sx={{
              borderRadius: '24px',
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
              p: { xs: 3, sm: 4 },
              mb: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -40,
                right: -40,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -60,
                right: 80,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
              },
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'center', sm: 'flex-start' }}>
              {/* Avatar */}
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Avatar
                  sx={{
                    width: 88,
                    height: 88,
                    fontSize: '2.2rem',
                    fontWeight: 800,
                    bgcolor: 'rgba(255,255,255,0.25)',
                    color: '#fff',
                    border: '3px solid rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {avatarLetter}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#4caf50',
                    border: '2px solid rgba(255,255,255,0.8)',
                  }}
                />
              </Box>

              {/* Info */}
              <Box sx={{ position: 'relative', zIndex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography variant="h4" fontWeight={800} color="#fff" mb={0.5}>
                  {session?.name || session?.username}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.8)" mb={1.5}>
                  @{session?.username} · {email || 'Email belum diset'}
                </Typography>
                <Stack direction="row" spacing={1} justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                  <Chip
                    label={isAdmin ? '👑 Administrator' : '🛍️ Reseller'}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontWeight: 700,
                      backdropFilter: 'blur(4px)',
                      fontSize: '0.75rem',
                    }}
                  />
                  {phone && (
                    <Chip
                      icon={<IconPhone size={14} color="#fff" />}
                      label={phone}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.15)',
                        color: '#fff',
                        fontSize: '0.72rem',
                      }}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Box>

          {/* ── Two-column grid ── */}
          <Grid container spacing={3}>

            {/* ── LEFT: Info Profil ── */}
            <Grid item xs={12} md={7}>
              <SectionCard
                icon={IconPencil}
                title="Informasi Profil"
                subtitle="Perbarui nama, email, dan nomor HP Anda"
              >
                <Box component="form" onSubmit={handleProfileSave}>
                  <Stack spacing={2.5}>
                    <Box>
                      <FieldLabel>Nama Lengkap</FieldLabel>
                      <CustomTextField
                        id="profile-name"
                        placeholder="Masukkan nama lengkap"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <IconId size={20} color="#5d87ff" />
                            </InputAdornment>
                          ),
                        }}
                        sx={styledInput}
                      />
                    </Box>

                    <Box>
                      <FieldLabel>Email</FieldLabel>
                      <CustomTextField
                        id="profile-email"
                        placeholder="contoh@email.com"
                        type="email"
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <IconMail size={20} color="#5d87ff" />
                            </InputAdornment>
                          ),
                        }}
                        sx={styledInput}
                      />
                    </Box>

                    <Box>
                      <FieldLabel>Nomor HP</FieldLabel>
                      <CustomTextField
                        id="profile-phone"
                        placeholder="08xxxxxxxxxx"
                        type="tel"
                        fullWidth
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <IconPhone size={20} color="#5d87ff" />
                            </InputAdornment>
                          ),
                        }}
                        sx={styledInput}
                      />
                    </Box>

                    {/* Username (read-only) */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: '#f8faff',
                        border: '1px dashed',
                        borderColor: 'grey.300',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                        <IconUser size={16} color="#aaa" />
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Username (tidak dapat diubah)
                        </Typography>
                      </Stack>
                      <Typography variant="body1" fontWeight={700} color="text.primary">
                        @{session?.username}
                      </Typography>
                    </Box>
                  </Stack>

                  {profileMsg.text && (
                    <Alert
                      severity={profileMsg.type}
                      sx={{ mt: 2.5, borderRadius: '12px' }}
                      onClose={() => setProfileMsg({ type: '', text: '' })}
                    >
                      {profileMsg.text}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={profileLoading}
                    startIcon={
                      profileLoading
                        ? <CircularProgress size={18} color="inherit" />
                        : <IconDeviceFloppy size={20} />
                    }
                    sx={{
                      mt: 3,
                      py: 1.4,
                      borderRadius: '12px',
                      fontWeight: 700,
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      boxShadow: '0 4px 14px rgba(93,135,255,0.35)',
                      transition: 'all 0.2s',
                      '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 6px 20px rgba(93,135,255,0.45)' },
                    }}
                  >
                    {profileLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </Box>
              </SectionCard>
            </Grid>

            {/* ── RIGHT: Change Password + Info ── */}
            <Grid item xs={12} md={5}>
              <Stack spacing={3}>

                {/* Account Info Card */}
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: 'grey.200',
                    p: 2.5,
                    background: 'linear-gradient(135deg, #f0f7ff 0%, #f8faff 100%)',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                    <IconInfoCircle size={20} color="#5d87ff" />
                    <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                      Info Akun
                    </Typography>
                  </Stack>
                  <Stack spacing={1.5}>
                    {[
                      { label: 'Role', value: isAdmin ? 'Administrator' : 'Reseller' },
                      { label: 'Username', value: `@${session?.username}` },
                      { label: 'Status', value: 'Aktif ✅' },
                    ].map((item) => (
                      <Stack key={item.label} direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {item.label}
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="text.primary">
                          {item.value}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Card>

                {/* Change Password Card */}
                <SectionCard
                  icon={IconKey}
                  title="Ubah Password"
                  subtitle="Ganti password secara berkala"
                  iconColor="warning.main"
                >
                  <Box component="form" onSubmit={handlePasswordChange}>
                    <Stack spacing={2}>
                      <Box>
                        <FieldLabel>Password Saat Ini</FieldLabel>
                        <CustomTextField
                          id="current-password"
                          type={showCurrent ? 'text' : 'password'}
                          placeholder="Password lama"
                          fullWidth
                          value={currentPw}
                          onChange={(e) => setCurrentPw(e.target.value)}
                          autoComplete="current-password"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <IconLock size={18} color="#f57c00" />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowCurrent(!showCurrent)} size="small">
                                  {showCurrent ? <IconEyeOff size={17} /> : <IconEye size={17} />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={styledInput}
                        />
                      </Box>

                      <Divider sx={{ borderStyle: 'dashed' }} />

                      <Box>
                        <FieldLabel>Password Baru</FieldLabel>
                        <CustomTextField
                          id="new-password"
                          type={showNew ? 'text' : 'password'}
                          placeholder="Min. 8 karakter"
                          fullWidth
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          autoComplete="new-password"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <IconShieldLock size={18} color="#f57c00" />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowNew(!showNew)} size="small">
                                  {showNew ? <IconEyeOff size={17} /> : <IconEye size={17} />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={styledInput}
                        />
                        {newPw && (
                          <Box mt={1}>
                            <LinearProgress
                              variant="determinate"
                              value={strength.score}
                              sx={{
                                height: 5,
                                borderRadius: 4,
                                bgcolor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 4,
                                  bgcolor: strength.color,
                                  transition: 'all 0.3s',
                                },
                              }}
                            />
                            <Typography variant="caption" sx={{ color: strength.color, fontWeight: 700, mt: 0.3, display: 'block' }}>
                              {strength.label}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Box>
                        <FieldLabel>Konfirmasi Password Baru</FieldLabel>
                        <CustomTextField
                          id="confirm-password"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Ulangi password baru"
                          fullWidth
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                          error={confirmPw.length > 0 && confirmPw !== newPw}
                          helperText={confirmPw.length > 0 && confirmPw !== newPw ? '⚠️ Password tidak cocok' : ''}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <IconCheck size={18} color={confirmPw && confirmPw === newPw ? '#4caf50' : '#f57c00'} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowConfirm(!showConfirm)} size="small">
                                  {showConfirm ? <IconEyeOff size={17} /> : <IconEye size={17} />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={styledInput}
                        />
                      </Box>
                    </Stack>

                    {pwMsg.text && (
                      <Alert
                        severity={pwMsg.type}
                        sx={{ mt: 2, borderRadius: '12px' }}
                        onClose={() => setPwMsg({ type: '', text: '' })}
                      >
                        {pwMsg.text}
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      variant="contained"
                      color="warning"
                      size="large"
                      fullWidth
                      disabled={pwLoading}
                      startIcon={
                        pwLoading
                          ? <CircularProgress size={18} color="inherit" />
                          : <IconKey size={20} />
                      }
                      sx={{
                        mt: 2.5,
                        py: 1.3,
                        borderRadius: '12px',
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        '&:hover': { transform: 'translateY(-1px)' },
                      }}
                    >
                      {pwLoading ? 'Memproses...' : 'Ganti Password'}
                    </Button>
                  </Box>
                </SectionCard>

              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </PageContainer>
  );
};

export default Profile;
