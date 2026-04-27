import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Paper,
  Divider,
  Avatar,
  Chip,
  AppBar,
  Toolbar,
  Snackbar,
} from '@mui/material';
import { IconUpload, IconCheck, IconRefresh, IconPalette, IconPhoto, IconBrandChrome, IconBuilding, IconMail, IconPhone, IconMapPin } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from 'src/components/shared/DashboardCard';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';
import { getAuthToken } from 'src/utils/authSession';
import { useBranding } from 'src/contexts/BrandingContext';

const BrandingManagement = () => {
  const { refreshBranding, branding: liveBranding } = useBranding();
  const [branding, setBranding] = useState({
    brand_name: '',
    brand_tagline: '',
    primary_color: '#5D87FF',
    secondary_color: '#49BEFF',
    company_email: '',
    company_phone: '',
    company_address: '',
    logo_url: null,
    favicon_url: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchBrandingSettings();
  }, []);

  const fetchBrandingSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiFetch('/api/admin/branding');
      const data = await readJsonSafe(response);

      if (data?.success && data?.data) {
        setBranding((prev) => ({ ...prev, ...data.data }));
        if (data.data.logo_url) setLogoPreview(data.data.logo_url);
        if (data.data.favicon_url) setFaviconPreview(data.data.favicon_url);
      }
    } catch (err) {
      console.error('Error fetching branding:', err);
      setError('Gagal memuat pengaturan branding.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBranding((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleFileUpload = async (e, fileType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showSnackbar('File terlalu besar. Maksimal 2MB.', 'error');
      return;
    }

    const isLogo = fileType === 'logo';
    if (isLogo) setUploadingLogo(true);
    else setUploadingFavicon(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', fileType);

      const token = getAuthToken();
      const response = await fetch('/api/admin/branding/upload', {
        method: 'POST',
        body: formData,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();
      if (data.success) {
        const urlField = isLogo ? 'logo_url' : 'favicon_url';
        setBranding((prev) => ({ ...prev, [urlField]: data.data.url }));

        if (isLogo) setLogoPreview(data.data.url);
        else setFaviconPreview(data.data.url);

        await refreshBranding();
        showSnackbar(`${isLogo ? 'Logo' : 'Favicon'} berhasil diupload!`);
      } else {
        showSnackbar(data.message || 'Gagal upload file', 'error');
      }
    } catch (err) {
      showSnackbar('Terjadi kesalahan saat upload.', 'error');
    } finally {
      if (isLogo) setUploadingLogo(false);
      else setUploadingFavicon(false);
    }
  };

  const handleSaveBranding = async () => {
    try {
      setSaving(true);
      setError('');

      const response = await apiFetch('/api/admin/branding', {
        method: 'POST',
        body: JSON.stringify(branding),
      });

      const data = await readJsonSafe(response);
      if (data?.success) {
        await refreshBranding();
        setHasChanges(false);
        showSnackbar('Pengaturan branding berhasil disimpan!');
      } else {
        showSnackbar(data?.message || 'Gagal menyimpan pengaturan', 'error');
      }
    } catch (err) {
      showSnackbar('Terjadi kesalahan saat menyimpan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Manajemen Branding" description="Atur identitas brand">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography color="text.secondary">Memuat pengaturan branding...</Typography>
          </Stack>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Manajemen Branding" description="Atur logo, favicon, warna, dan identitas brand">
      <Box>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="700">
              Manajemen Branding
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Atur identitas visual platform Anda — logo, warna, dan informasi perusahaan
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<IconRefresh size={18} />}
              onClick={fetchBrandingSettings}
              disabled={saving}
              size="small"
            >
              Reset
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <IconCheck size={18} />}
              onClick={handleSaveBranding}
              disabled={saving || !hasChanges}
              size="small"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {hasChanges && (
          <Alert severity="info" sx={{ mb: 2 }} icon={<IconPalette size={20} />}>
            Ada perubahan yang belum disimpan. Klik <strong>Simpan Perubahan</strong> untuk menerapkan.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* ── Logo & Favicon ── */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <IconPhoto size={22} color="#5D87FF" />
                  <Typography variant="h6" fontWeight="600">Logo Perusahaan</Typography>
                </Stack>

                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Box
                    sx={{
                      width: 140,
                      height: 140,
                      mx: 'auto',
                      mb: 2,
                      borderRadius: 2,
                      border: '2px dashed',
                      borderColor: logoPreview ? 'transparent' : 'grey.300',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: logoPreview ? 'transparent' : 'grey.50',
                      overflow: 'hidden',
                    }}
                  >
                    {logoPreview ? (
                      <Box component="img" src={logoPreview} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Stack alignItems="center" spacing={0.5}>
                        <IconPhoto size={40} color="#ccc" />
                        <Typography variant="caption" color="text.secondary">Belum ada logo</Typography>
                      </Stack>
                    )}
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    PNG, JPG • Maks 2MB • Rasio 1:1 disarankan
                  </Typography>

                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={uploadingLogo ? <CircularProgress size={16} /> : <IconUpload size={18} />}
                    disabled={uploadingLogo}
                    size="small"
                  >
                    {uploadingLogo ? 'Mengupload...' : 'Upload Logo'}
                    <input
                      hidden
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                    />
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <IconBrandChrome size={22} color="#49BEFF" />
                  <Typography variant="h6" fontWeight="600">Favicon</Typography>
                </Stack>

                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                      borderRadius: 1,
                      border: '2px dashed',
                      borderColor: faviconPreview ? 'transparent' : 'grey.300',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: faviconPreview ? 'grey.100' : 'grey.50',
                      overflow: 'hidden',
                      p: 1,
                    }}
                  >
                    {faviconPreview ? (
                      <Box component="img" src={faviconPreview} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <IconBrandChrome size={32} color="#ccc" />
                    )}
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    ICO, PNG • 32×32px atau 64×64px • Maks 2MB
                  </Typography>

                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={uploadingFavicon ? <CircularProgress size={16} /> : <IconUpload size={18} />}
                    disabled={uploadingFavicon}
                    size="small"
                  >
                    {uploadingFavicon ? 'Mengupload...' : 'Upload Favicon'}
                    <input
                      hidden
                      type="file"
                      accept="image/x-icon,.ico,image/png"
                      onChange={(e) => handleFileUpload(e, 'favicon')}
                    />
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ── Brand Info ── */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <IconBuilding size={22} color="#5D87FF" />
                  <Typography variant="h6" fontWeight="600">Informasi Brand</Typography>
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Nama Brand"
                      name="brand_name"
                      value={branding.brand_name}
                      onChange={handleInputChange}
                      fullWidth
                      placeholder="Contoh: OTP Reseller Pro"
                      helperText="Tampil di sidebar, header, dan footer"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Tagline / Slogan"
                      name="brand_tagline"
                      value={branding.brand_tagline}
                      onChange={handleInputChange}
                      fullWidth
                      placeholder="Contoh: Platform Reseller OTP Terpercaya"
                      helperText="Tampil di halaman login"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* ── Warna ── */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <IconPalette size={22} color="#5D87FF" />
                  <Typography variant="h6" fontWeight="600">Warna Brand</Typography>
                </Stack>

                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" mb={1}>Warna Utama (Primary)</Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          backgroundColor: branding.primary_color,
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: 'grey.200',
                          boxShadow: 1,
                          flexShrink: 0,
                        }}
                      />
                      <TextField
                        type="color"
                        name="primary_color"
                        value={branding.primary_color}
                        onChange={handleInputChange}
                        sx={{ flex: 1 }}
                        size="small"
                      />
                      <Chip label={branding.primary_color} size="small" variant="outlined" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                      Digunakan untuk tombol, link, dan elemen utama
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" mb={1}>Warna Sekunder (Secondary)</Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          backgroundColor: branding.secondary_color,
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: 'grey.200',
                          boxShadow: 1,
                          flexShrink: 0,
                        }}
                      />
                      <TextField
                        type="color"
                        name="secondary_color"
                        value={branding.secondary_color}
                        onChange={handleInputChange}
                        sx={{ flex: 1 }}
                        size="small"
                      />
                      <Chip label={branding.secondary_color} size="small" variant="outlined" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                      Digunakan untuk aksen dan highlight
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* ── Kontak ── */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <IconMail size={22} color="#49BEFF" />
                  <Typography variant="h6" fontWeight="600">Informasi Kontak</Typography>
                </Stack>

                <Stack spacing={2}>
                  <TextField
                    label="Email Perusahaan"
                    name="company_email"
                    type="email"
                    value={branding.company_email}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <IconMail size={18} style={{ marginRight: 8, color: '#888' }} />,
                    }}
                  />
                  <TextField
                    label="No. Telepon"
                    name="company_phone"
                    value={branding.company_phone}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <IconPhone size={18} style={{ marginRight: 8, color: '#888' }} />,
                    }}
                  />
                  <TextField
                    label="Alamat Perusahaan"
                    name="company_address"
                    value={branding.company_address}
                    onChange={handleInputChange}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    InputProps={{
                      startAdornment: <IconMapPin size={18} style={{ marginRight: 8, color: '#888', alignSelf: 'flex-start', marginTop: 8 }} />,
                    }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* ── Live Preview ── */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" mb={2}>
                  Pratinjau Tampilan
                </Typography>

                {/* Simulated App Bar */}
                <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <AppBar
                    position="static"
                    sx={{
                      backgroundColor: branding.primary_color,
                      boxShadow: 1,
                    }}
                  >
                    <Toolbar>
                      {logoPreview && (
                        <Avatar
                          src={logoPreview}
                          sx={{ width: 36, height: 36, mr: 1.5, bgcolor: 'rgba(255,255,255,0.2)' }}
                        />
                      )}
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, flexGrow: 1 }}>
                        {branding.brand_name || 'Nama Brand'}
                      </Typography>
                      <Chip
                        label="Admin"
                        size="small"
                        sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
                        variant="outlined"
                      />
                    </Toolbar>
                  </AppBar>

                  <Box sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
                    <Stack spacing={2}>
                      <Typography variant="body1" color="text.primary">
                        {branding.brand_tagline || 'Tagline brand Anda'}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button variant="contained" size="small" sx={{ backgroundColor: branding.primary_color }}>
                          Tombol Primary
                        </Button>
                        <Button variant="contained" size="small" sx={{ backgroundColor: branding.secondary_color }}>
                          Tombol Secondary
                        </Button>
                        <Button variant="outlined" size="small" sx={{ borderColor: branding.primary_color, color: branding.primary_color }}>
                          Outlined
                        </Button>
                      </Stack>
                      <Divider />
                      <Stack direction="row" spacing={3} flexWrap="wrap">
                        {branding.company_email && (
                          <Typography variant="caption" color="text.secondary">
                            📧 {branding.company_email}
                          </Typography>
                        )}
                        {branding.company_phone && (
                          <Typography variant="caption" color="text.secondary">
                            📞 {branding.company_phone}
                          </Typography>
                        )}
                      </Stack>
                      {branding.company_address && (
                        <Typography variant="caption" color="text.secondary">
                          📍 {branding.company_address}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={snackbar.severity}
            variant="filled"
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
};

export default BrandingManagement;
