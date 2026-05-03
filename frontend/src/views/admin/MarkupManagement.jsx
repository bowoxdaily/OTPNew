import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Box,
  Switch,
  FormControlLabel,
  Alert,
  Stack,
  IconButton,
  TableContainer,
  Paper,
  Grid,
  Chip,
  MenuItem,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { IconPlus, IconPencil, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

export default function MarkupManagement() {
  const [markups, setMarkups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [formData, setFormData] = useState({
    service_id: '',
    service_name: '',
    markup_percentage: 0,
    markup_fixed: 0,
  });

  useEffect(() => {
    fetchMarkups();
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const response = await apiFetch('/api/catalog/layanan?negara=7');
      const data = await readJsonSafe(response);
      
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setServices(data.data);
      } else {
        // Cache kosong, trigger sync
        console.log('Cache empty, triggering auto-sync...');
        await syncCacheAndFetch();
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  const syncCacheAndFetch = async () => {
    try {
      // Sync cache first
      const syncRes = await apiFetch('/api/admin/cache/sync/7', {
        method: 'POST',
      });
      const syncData = await readJsonSafe(syncRes);
      
      if (syncData.success) {
        console.log('✅ Cache synced, fetching services...');
        // Then fetch services
        const layananRes = await apiFetch('/api/catalog/layanan?negara=7');
        const layananData = await readJsonSafe(layananRes);
        
        if (layananData.success && Array.isArray(layananData.data)) {
          setServices(layananData.data);
        }
      }
    } catch (err) {
      console.error('Error in syncCacheAndFetch:', err);
    }
  };

  const fetchMarkups = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/admin/markups');
      const data = await readJsonSafe(response);
      if (data.success) {
        setMarkups(data.data);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Gagal mengambil data markup');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (markup = null) => {
    if (markup) {
      // Editing existing
      setEditingId(markup.id);
      setFormData({
        service_id: markup.service_id || '',
        service_name: markup.service_name || '',
        markup_percentage: markup.markup_percentage || 0,
        markup_fixed: markup.markup_fixed || 0,
      });
    } else {
      // Creating new
      setEditingId(null);
      setFormData({
        service_id: '',
        service_name: '',
        markup_percentage: 0,
        markup_fixed: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleServiceSelect = (e) => {
    const serviceCode = e.target.value;
    const selected = services.find((s) => s.code === serviceCode);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        service_id: selected.code,
        service_name: selected.layanan,
      }));
    }
  };

  const handleSave = async () => {
    try {
      const response = await apiFetch('/api/admin/markups', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await readJsonSafe(response);
      if (data.success) {
        setOpenDialog(false);
        fetchMarkups();
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Gagal menyimpan markup');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus?')) return;

    try {
      const response = await apiFetch(`/api/admin/markups/${id}`, {
        method: 'DELETE',
      });

      const data = await readJsonSafe(response);
      if (data.success) {
        fetchMarkups();
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Gagal menghapus markup');
    }
  };

  const handleToggle = async (id, isActive) => {
    try {
      const response = await apiFetch(`/api/admin/markups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !isActive }),
      });

      const data = await readJsonSafe(response);
      if (data.success) {
        fetchMarkups();
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Gagal mengubah status');
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const calculateExample = (percentage, fixed, basePrice = 10000) => {
    const markupFromPerc = basePrice * (percentage / 100);
    const total = basePrice + markupFromPerc + fixed;
    return Math.round(total);
  };

  return (
    <Box sx={{ width: '100%', px: { xs: 1, sm: 2, md: 3 } }}>
      <Stack spacing={{ xs: 2, sm: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Manajemen Markup
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Atur markup untuk semua service atau per service
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<IconPlus size={isMobile ? 16 : 18} />}
            onClick={() => handleOpenDialog()}
            size={isMobile ? 'small' : 'medium'}
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Tambah Markup
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            <IconAlertCircle size={isMobile ? 18 : 20} />
            {error}
          </Alert>
        )}

        {/* Markup Table / Mobile Cards */}
        <Card>
          <CardHeader title="Daftar Markup" sx={{ '& .MuiCardHeader-title': { fontSize: { xs: '1rem', sm: '1.25rem' } } }} />
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            {loading ? (
              <Typography align="center" sx={{ py: 4, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Memuat...
              </Typography>
            ) : markups.length === 0 ? (
              <Typography align="center" sx={{ py: 4, color: 'textSecondary', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Tidak ada markup
              </Typography>
            ) : isMobile ? (
              /* Mobile View - Card List */
              <Stack spacing={1.5}>
                {markups.map((markup) => (
                  <Paper key={markup.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {markup.service_name || 'GLOBAL'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" fontSize="0.7rem">
                            {markup.service_id ? `ID: ${markup.service_id}` : 'Berlaku untuk semua'}
                          </Typography>
                        </Box>
                        <Switch
                          checked={markup.is_active}
                          onChange={() => handleToggle(markup.id, markup.is_active)}
                          size="small"
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontSize="0.75rem">
                          {markup.markup_percentage}% + Rp {markup.markup_fixed.toLocaleString('id-ID')}
                        </Typography>
                        <Chip
                          label={`Rp ${calculateExample(markup.markup_percentage, markup.markup_fixed).toLocaleString('id-ID')}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      </Box>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton size="small" onClick={() => handleOpenDialog(markup)} sx={{ color: 'primary.main' }}>
                          <IconPencil size={16} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(markup.id)} sx={{ color: 'error.main' }}>
                          <IconTrash size={16} />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              /* Desktop/Tablet View - Table */
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0', overflowX: 'auto' }}>
                <Table size={isTablet ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>Service</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }} align="right">Persentase</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }} align="right">Fixed</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }} align="center">Contoh Harga</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }} align="center">Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }} align="right">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {markups.map((markup) => (
                      <TableRow key={markup.id} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                        <TableCell sx={{ py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {markup.service_name || 'GLOBAL'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                              {markup.service_id ? `ID: ${markup.service_id}` : 'Berlaku untuk semua'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{markup.markup_percentage}%</TableCell>
                        <TableCell align="right" sx={{ py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          Rp {markup.markup_fixed.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell align="center" sx={{ py: { xs: 0.75, sm: 1 } }}>
                          <Chip label={`Rp ${calculateExample(markup.markup_percentage, markup.markup_fixed).toLocaleString('id-ID')}`} size="small" variant="outlined" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }} />
                        </TableCell>
                        <TableCell align="center" sx={{ py: { xs: 0.75, sm: 1 } }}>
                          <Switch checked={markup.is_active} onChange={() => handleToggle(markup.id, markup.is_active)} size="small" />
                        </TableCell>
                        <TableCell align="right" sx={{ py: { xs: 0.75, sm: 1 } }}>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton size="small" onClick={() => handleOpenDialog(markup)} sx={{ color: 'primary.main' }}>
                              <IconPencil size={16} />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(markup.id)} sx={{ color: 'error.main' }}>
                              <IconTrash size={16} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit' : 'Tambah'} Markup</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            {/* Service Selector */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Pilih Service (atau kosongkan untuk GLOBAL)
              </Typography>
              {loadingServices ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, gap: 1 }}>
                  <CircularProgress size={24} />
                  <Typography variant="caption" color="textSecondary">
                    Loading & syncing services...
                  </Typography>
                </Box>
              ) : services.length === 0 ? (
                <Box sx={{ p: 2, backgroundColor: '#fff3cd', borderRadius: 1, border: '1px solid #ffc107' }}>
                  <Typography variant="body2" color="textSecondary">
                    ⚠️ Services belum tersedia. Silakan sync cache dari "Daftar Layanan" terlebih dahulu.
                  </Typography>
                </Box>
              ) : (
                <TextField
                  select
                  fullWidth
                  value={formData.service_id}
                  onChange={handleServiceSelect}
                  variant="outlined"
                >
                  <MenuItem value="">
                    <em>GLOBAL (Semua Service)</em>
                  </MenuItem>
                  {services.map((service) => (
                    <MenuItem key={service.code} value={service.code}>
                      {service.layanan} ({service.code})
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Selected: {formData.service_id ? `${formData.service_name} (${formData.service_id})` : 'GLOBAL'}
              </Typography>
            </Box>

            <TextField
              label="Markup Persentase (%)"
              type="number"
              fullWidth
              value={formData.markup_percentage}
              onChange={(e) => setFormData({ ...formData, markup_percentage: Number(e.target.value) })}
              placeholder="Contoh: 15"
              variant="outlined"
            />

            <TextField
              label="Markup Fixed (Rp)"
              type="number"
              fullWidth
              value={formData.markup_fixed}
              onChange={(e) => setFormData({ ...formData, markup_fixed: Number(e.target.value) })}
              placeholder="Contoh: 5000"
              variant="outlined"
            />

            {/* Example Calculation */}
            <Box sx={{ backgroundColor: '#e3f2fd', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Contoh Perhitungan:
              </Typography>
              <Typography variant="body2">
                Harga Provider: Rp 10.000 → Harga Jual: Rp{' '}
                {calculateExample(
                  formData.markup_percentage,
                  formData.markup_fixed
                ).toLocaleString('id-ID')}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                (Rp 10.000 × {formData.markup_percentage}% + Rp {formData.markup_fixed})
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2}>
              <Button onClick={handleSave} variant="contained" fullWidth>
                Simpan
              </Button>
              <Button onClick={() => setOpenDialog(false)} variant="outlined" fullWidth>
                Batal
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
