import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { IconRefresh } from '@tabler/icons-react';
import { getAuthToken } from 'src/utils/authSession';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

const AdminLayanan = () => {
  const [layanan, setLayanan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(7); // Indonesia
  const [syncing, setSyncing] = useState(false);
  const [syncDialog, setSyncDialog] = useState(false);

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch layanan when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchLayanan();
    }
  }, [selectedCountry]);

  const fetchCountries = async () => {
    try {
      const response = await apiFetch('/api/catalog/negara');
      const data = await readJsonSafe(response);
      if (data.success && Array.isArray(data.data)) {
        setCountries(data.data);
      }
    } catch (err) {
      console.error('Error fetching countries:', err);
    }
  };

  const fetchLayanan = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch(`/api/catalog/layanan?negara=${selectedCountry}`);
      const data = await readJsonSafe(response);

      if (data.success && Array.isArray(data.data)) {
        setLayanan(data.data);
      } else {
        setError(data.message || 'Gagal memuat layanan');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat layanan');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await apiFetch(`/api/admin/cache/sync/${selectedCountry}`, {
        method: 'POST',
      });
      const data = await readJsonSafe(response);

      if (data.success) {
        // Refresh layanan after sync
        await fetchLayanan();
        setSyncDialog(false);
        alert('✅ Cache synced successfully!');
      } else {
        alert('❌ Sync failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const selectedCountryName = countries.find((c) => c.id === selectedCountry)?.name || 'Unknown';

  return (
    <Box sx={{ p: 3 }}>
      <Card elevation={9} sx={{ mb: 3 }}>
        <CardHeader title="📊 Daftar Layanan (Services)" subtitle="Kelola dan monitor semua layanan dari upstream provider" />
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Pilih Negara"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(Number(e.target.value))}
                select
                fullWidth
                disabled={loading}
              >
                {countries.map((country) => (
                  <MenuItem key={country.id} value={country.id}>
                    {country.name} (ID: {country.id})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => setSyncDialog(true)}
                disabled={syncing || loading}
                startIcon={<IconRefresh size={18} />}
                sx={{ height: '56px' }}
              >
                {syncing ? 'Syncing...' : 'Sync Cache'}
              </Button>
            </Grid>
          </Grid>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Layanan: <strong>{layanan.length}</strong>
                </Typography>
              </Box>

              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>No</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Nama Layanan</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Harga Provider</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Markup</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Harga Final</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Profit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {layanan.length > 0 ? (
                      layanan.slice(0, 50).map((item, idx) => {
                        const providerPrice = Number(item.harga_provider || 0);
                        const finalPrice = Number(item.harga || 0);
                        const profit = finalPrice - providerPrice;

                        return (
                          <TableRow key={`${item.code}-${idx}`} hover>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>
                              <Chip label={item.code} size="small" />
                            </TableCell>
                            <TableCell>{item.layanan}</TableCell>
                            <TableCell align="right">
                              Rp {providerPrice.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                {item.markup_percentage > 0 && (
                                  <Chip
                                    label={`${item.markup_percentage}%`}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                )}
                                {item.markup_fixed > 0 && (
                                  <Chip
                                    label={`+Rp ${item.markup_fixed}`}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                )}
                                {item.markup_percentage === 0 && item.markup_fixed === 0 && (
                                  <Chip label="No markup" size="small" variant="outlined" />
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                Rp {finalPrice.toLocaleString('id-ID')}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`Rp ${profit.toLocaleString('id-ID')}`}
                                size="small"
                                color="success"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">Tidak ada layanan. Klik Sync Cache untuk memuat.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {layanan.length > 50 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Menampilkan 50 dari {layanan.length} layanan
                  </Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Sync Dialog */}
      <Dialog open={syncDialog} onClose={() => setSyncDialog(false)}>
        <DialogTitle>Sync Cache untuk {selectedCountryName}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography color="text.secondary">
            Ini akan mengambil data layanan terbaru dari VirtuSIM dan menyimpannya di cache memory. Proses ini mungkin memakan waktu beberapa saat.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialog(false)}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleSync}
            disabled={syncing}
            startIcon={syncing && <CircularProgress size={20} />}
          >
            {syncing ? 'Syncing...' : 'Lanjutkan Sync'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminLayanan;
