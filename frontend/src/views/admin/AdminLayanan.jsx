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
  useMediaQuery,
  useTheme,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Card elevation={9} sx={{ mb: { xs: 2, sm: 3 } }}>
        <CardHeader 
          title="📊 Daftar Layanan (Services)" 
          subheader="Kelola dan monitor semua layanan dari upstream provider"
          sx={{ 
            '& .MuiCardHeader-title': { fontSize: { xs: '1.1rem', sm: '1.25rem' } },
            '& .MuiCardHeader-subheader': { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
          }} 
        />
        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
          <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Pilih Negara"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(Number(e.target.value))}
                select
                fullWidth
                disabled={loading}
                size={isMobile ? 'small' : 'medium'}
                sx={{ '& .MuiInputBase-input': { fontSize: { xs: '0.875rem', sm: '1rem' } } }}
              >
                {countries.map((country) => (
                  <MenuItem key={country.id} value={country.id} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
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
                startIcon={<IconRefresh size={isMobile ? 16 : 18} />}
                sx={{ height: { xs: '40px', sm: '56px' }, fontSize: { xs: '0.875rem', sm: '1rem' } }}
                size={isMobile ? 'small' : 'medium'}
              >
                {syncing ? 'Syncing...' : 'Sync Cache'}
              </Button>
            </Grid>
          </Grid>

          {error && <Alert severity="error" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{error}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: { xs: 2, sm: 3 } }}>
              <CircularProgress size={isMobile ? 32 : 40} />
            </Box>
          ) : (
            <>
              <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  Total Layanan: <strong>{layanan.length}</strong>
                </Typography>
              </Box>

              {isMobile ? (
                /* Mobile View - Card List */
                <Stack spacing={1.5}>
                  {layanan.length > 0 ? (
                    layanan.slice(0, 30).map((item, idx) => {
                      const providerPrice = Number(item.harga_provider || 0);
                      const finalPrice = Number(item.harga || 0);
                      const profit = finalPrice - providerPrice;

                      return (
                        <Paper key={`${item.code}-${idx}`} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Stack spacing={0.75}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" fontWeight={600} fontSize="0.875rem">
                                {item.layanan}
                              </Typography>
                              <Chip label={item.code} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary" fontSize="0.7rem">Provider</Typography>
                              <Typography variant="body2" fontSize="0.75rem">Rp {providerPrice.toLocaleString('id-ID')}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary" fontSize="0.7rem">Markup</Typography>
                              <Stack direction="row" spacing={0.5}>
                                {item.markup_percentage > 0 && (
                                  <Chip label={`${item.markup_percentage}%`} size="small" color="success" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
                                )}
                                {item.markup_fixed > 0 && (
                                  <Chip label={`+Rp ${item.markup_fixed}`} size="small" color="success" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
                                )}
                                {item.markup_percentage === 0 && item.markup_fixed === 0 && (
                                  <Chip label="No markup" size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
                                )}
                              </Stack>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary" fontSize="0.7rem">Harga Jual</Typography>
                              <Typography variant="body2" fontWeight={600} color="primary.main" fontSize="0.8rem">
                                Rp {finalPrice.toLocaleString('id-ID')}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary" fontSize="0.7rem">Profit</Typography>
                              <Chip label={`Rp ${profit.toLocaleString('id-ID')}`} size="small" color="success" sx={{ fontSize: '0.6rem', height: 18 }} />
                            </Box>
                          </Stack>
                        </Paper>
                      );
                    })
                  ) : (
                    <Typography color="text.secondary" align="center" py={3} fontSize="0.875rem">
                      Tidak ada layanan. Klik Sync Cache untuk memuat.
                    </Typography>
                  )}
                  {layanan.length > 30 && (
                    <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                      Menampilkan 30 dari {layanan.length} layanan
                    </Typography>
                  )}
                </Stack>
              ) : (
                /* Desktop/Tablet View - Table */
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0', overflowX: 'auto' }}>
                  <Table size={isTablet ? 'small' : 'medium'}>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }, py: { xs: 1, sm: 1.5 } }}>No</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }, py: { xs: 1, sm: 1.5 } }}>Code</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }, py: { xs: 1, sm: 1.5 } }}>Nama Layanan</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }, py: { xs: 1, sm: 1.5 } }}>Harga Provider</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }, py: { xs: 1, sm: 1.5 } }}>Markup</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }, py: { xs: 1, sm: 1.5 } }}>Harga Final</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }, py: { xs: 1, sm: 1.5 } }}>Profit</TableCell>
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
                              <TableCell sx={{ py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{idx + 1}</TableCell>
                              <TableCell sx={{ py: { xs: 0.75, sm: 1 } }}>
                                <Chip label={item.code} size="small" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }} />
                              </TableCell>
                              <TableCell sx={{ py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{item.layanan}</TableCell>
                              <TableCell align="right" sx={{ py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                Rp {providerPrice.toLocaleString('id-ID')}
                              </TableCell>
                              <TableCell align="right" sx={{ py: { xs: 0.75, sm: 1 } }}>
                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                  {item.markup_percentage > 0 && (
                                    <Chip label={`${item.markup_percentage}%`} size="small" color="success" variant="outlined" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }} />
                                  )}
                                  {item.markup_fixed > 0 && (
                                    <Chip label={`+Rp ${item.markup_fixed}`} size="small" color="success" variant="outlined" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }} />
                                  )}
                                  {item.markup_percentage === 0 && item.markup_fixed === 0 && (
                                    <Chip label="No markup" size="small" variant="outlined" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }} />
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell align="right" sx={{ py: { xs: 0.75, sm: 1 } }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                  Rp {finalPrice.toLocaleString('id-ID')}
                                </Typography>
                              </TableCell>
                              <TableCell align="center" sx={{ py: { xs: 0.75, sm: 1 } }}>
                                <Chip label={`Rp ${profit.toLocaleString('id-ID')}`} size="small" color="success" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }} />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: { xs: 2, sm: 3 } }}>
                            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Tidak ada layanan. Klik Sync Cache untuk memuat.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {layanan.length > 50 && !isMobile && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
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
