import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  IconUsers,
  IconShoppingCart,
  IconWallet,
  IconChartPie,
  IconServer,
  IconActivity,
  IconTrendingUp,
  IconRefresh
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from 'src/components/shared/DashboardCard';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

const initialProviderStatus = [
  { name: 'Provider A', status: 'Online', response: '320ms' },
  { name: 'Provider B', status: 'Online', response: '410ms' },
  { name: 'Provider C', status: 'Maintenance', response: '-' },
];

const initialTopReseller = [
  { username: 'reseller_utama', order: 138, omzet: 1684000 },
  { username: 'agen_jakarta', order: 102, omzet: 1239000 },
  { username: 'fastotp_store', order: 87, omzet: 1007000 },
];

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [selectedNegara, setSelectedNegara] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchSummary() {
      setLoading(true);
      setError('');
      try {
        const response = await apiFetch('/api/admin/summary');
        const data = await readJsonSafe(response);
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Gagal mengambil data dashboard admin');
        }
        if (active) {
          setSummary(data.data || null);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError.message || 'Gagal mengambil data dashboard admin');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchSummary();
    return () => {
      active = false;
    };
  }, []);

  async function fetchCatalog() {
    setCatalogLoading(true);
    setCatalogError('');
    try {
      const negaraResponse = await apiFetch('/api/catalog/negara');
      const negaraData = await readJsonSafe(negaraResponse);
      if (!negaraResponse.ok || !negaraData?.success || !Array.isArray(negaraData?.data) || negaraData.data.length === 0) {
        throw new Error(negaraData?.message || 'Gagal mengambil daftar negara');
      }

      const negara = negaraData.data[0];
      setSelectedNegara(negara);

      const layananResponse = await apiFetch(`/api/catalog/layanan?negara=${negara.id}`);
      const layananData = await readJsonSafe(layananResponse);
      if (!layananResponse.ok || !layananData?.success || !Array.isArray(layananData?.data)) {
        throw new Error(layananData?.message || 'Gagal mengambil katalog layanan');
      }
      setCatalog(layananData.data);
    } catch (fetchError) {
      setCatalogError(fetchError.message || 'Gagal mengambil katalog layanan');
    } finally {
      setCatalogLoading(false);
    }
  }

  useEffect(() => {
    fetchCatalog();
  }, []);

  const providerStatus = useMemo(() => summary?.providerStatus || initialProviderStatus, [summary]);
  const topReseller = useMemo(() => summary?.topReseller || initialTopReseller, [summary]);
  const upstreamBalance = summary?.upstreamBalance ?? 0;
  const totalOrderHariIni = summary?.totalOrderHariIni ?? 729;
  const omzetPlatform = summary?.omzetPlatform ?? 8950000;
  const estimasiProfit = summary?.estimasiProfit ?? 1342500;

  return (
    <PageContainer title="Admin Control Center" description="Panel admin untuk kontrol operasional OTP reseller">
      <Box>
        {/* Hero Section */}
        <Box mb={{ xs: 2, sm: 3, md: 4 }}>
          <Typography variant="h3" fontWeight="700" mb={1} sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
            Admin Control Center ⚡
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Pantau performa platform, ketersediaan layanan, dan saldo upstream (VirtuSIM) Anda secara real-time.
          </Typography>
        </Box>

        {error && <Alert severity="warning" sx={{ mb: { xs: 2, sm: 3 }, borderRadius: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>{error}. Menampilkan data dummy sebagai cadangan.</Alert>}

        {/* KPI Cards */}
        <Grid container spacing={{ xs: 2, sm: 3 }} mb={{ xs: 2, sm: 3, md: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <Card elevation={0} sx={{ backgroundColor: 'primary.light', borderRadius: { xs: 2, sm: 3 } }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography color="primary.main" variant="subtitle2" fontWeight={600} mb={0.5} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Saldo Provider (VirtuSIM)
                    </Typography>
                    <Typography variant="h4" fontWeight="700" color="primary.dark" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }, wordBreak: 'break-word' }}>
                      {loading ? <LinearProgress sx={{ mt: 1, mb: 0.5, width: { xs: 40, sm: 60 } }} /> : 
                        (upstreamBalance === 'Offline' ? 'Offline' : `Rp ${Number(upstreamBalance).toLocaleString('id-ID')}`)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main', width: { xs: 36, sm: 40, md: 48 }, height: { xs: 36, sm: 40, md: 48 }, flexShrink: 0 }}>
                    <IconServer size={20} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Card elevation={0} sx={{ backgroundColor: 'secondary.light', borderRadius: { xs: 2, sm: 3 } }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography color="secondary.main" variant="subtitle2" fontWeight={600} mb={0.5} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Total Order Hari Ini
                    </Typography>
                    <Typography variant="h4" fontWeight="700" color="secondary.dark" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}>
                      {loading ? <LinearProgress color="secondary" sx={{ mt: 1, mb: 0.5, width: { xs: 40, sm: 60 } }} /> : totalOrderHariIni}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: { xs: 36, sm: 40, md: 48 }, height: { xs: 36, sm: 40, md: 48 }, flexShrink: 0 }}>
                    <IconShoppingCart size={20} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card elevation={0} sx={{ backgroundColor: 'success.light', borderRadius: { xs: 2, sm: 3 } }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography color="success.main" variant="subtitle2" fontWeight={600} mb={0.5} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Omzet Platform
                    </Typography>
                    <Typography variant="h4" fontWeight="700" color="success.dark" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }, wordBreak: 'break-word' }}>
                      {loading ? <LinearProgress color="success" sx={{ mt: 1, mb: 0.5, width: { xs: 40, sm: 60 } }} /> : `Rp ${Number(omzetPlatform).toLocaleString('id-ID')}`}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main', width: { xs: 36, sm: 40, md: 48 }, height: { xs: 36, sm: 40, md: 48 }, flexShrink: 0 }}>
                    <IconWallet size={20} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card elevation={0} sx={{ backgroundColor: 'warning.light', borderRadius: { xs: 2, sm: 3 } }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography color="warning.main" variant="subtitle2" fontWeight={600} mb={0.5} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Estimasi Profit Kotor
                    </Typography>
                    <Typography variant="h4" fontWeight="700" color="warning.dark" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }, wordBreak: 'break-word' }}>
                      {loading ? <LinearProgress color="warning" sx={{ mt: 1, mb: 0.5, width: { xs: 40, sm: 60 } }} /> : `Rp ${Number(estimasiProfit).toLocaleString('id-ID')}`}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main', width: { xs: 36, sm: 40, md: 48 }, height: { xs: 36, sm: 40, md: 48 }, flexShrink: 0 }}>
                    <IconChartPie size={20} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Status Provider (Left, 7 columns on desktop) */}
          <Grid item xs={12} lg={7}>
            <Stack spacing={{ xs: 2, sm: 3 }}>
              <DashboardCard 
                title="Status Provider OTP" 
                subtitle="Ketersediaan layanan & response time"
                action={<IconActivity color="#5D87FF" />}
              >
                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: { xs: 1.5, sm: 2 }, whiteSpace: 'nowrap', overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, py: { xs: 1, sm: 1.5 } }}><Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Nama Provider</Typography></TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, py: { xs: 1, sm: 1.5 } }}><Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Status</Typography></TableCell>
                        <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, py: { xs: 1, sm: 1.5 } }}><Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Response</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {providerStatus.map((provider) => (
                        <TableRow key={provider.name}>
                          <TableCell sx={{ py: { xs: 0.75, sm: 1 } }}>
                            <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1 }}>
                              <IconServer size={16} color="#7C8FAC" />
                              <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{provider.name}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ py: { xs: 0.75, sm: 1 } }}>
                            <Chip 
                              label={provider.status} 
                              size="small" 
                              color={provider.status === 'Online' ? 'success' : 'error'}
                              variant={provider.status === 'Online' ? 'contained' : 'outlined'}
                              sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ py: { xs: 0.75, sm: 1 } }}>
                            <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{provider.response}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </DashboardCard>

              <DashboardCard 
                title="Top Reseller Hari Ini" 
                subtitle="Kontributor omzet terbesar"
                action={<IconTrendingUp color="#13DEB9" />}
              >
                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: { xs: 1.5, sm: 2 }, whiteSpace: 'nowrap', overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, py: { xs: 1, sm: 1.5 } }}><Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Reseller</Typography></TableCell>
                        <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, py: { xs: 1, sm: 1.5 } }}><Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Order</Typography></TableCell>
                        <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, py: { xs: 1, sm: 1.5 } }}><Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Omzet</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topReseller.map((reseller, index) => (
                        <TableRow key={reseller.username}>
                          <TableCell sx={{ py: { xs: 0.75, sm: 1 } }}>
                            <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }}>
                              <Avatar sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, bgcolor: index === 0 ? 'warning.main' : 'primary.main', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {reseller.username.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>@{reseller.username}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="center" sx={{ py: { xs: 0.75, sm: 1 } }}>
                            <Chip label={reseller.order} size="small" sx={{ backgroundColor: 'grey.100', fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }} />
                          </TableCell>
                          <TableCell align="right" sx={{ py: { xs: 0.75, sm: 1 } }}>
                            <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              Rp {reseller.omzet.toLocaleString('id-ID')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </DashboardCard>
            </Stack>
          </Grid>

          {/* Right Column (5 columns on desktop) */}
          <Grid item xs={12} lg={5}>
            <Stack spacing={{ xs: 2, sm: 3 }}>
              <DashboardCard title="Katalog Layanan (Upstream)" subtitle="Data langsung dari provider utama">
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      {selectedNegara?.name || 'Indonesia'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      Total {catalog.length} layanan aktif
                    </Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={fetchCatalog} 
                    disabled={catalogLoading}
                    startIcon={catalogLoading ? <IconRefresh className="spin-icon" size={16} /> : <IconRefresh size={16} />}
                    sx={{ borderRadius: 2, flexShrink: 0, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Refresh
                  </Button>
                </Stack>
                
                {catalogError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{catalogError}</Alert>}
                
                <Box sx={{ 
                  maxHeight: { xs: 300, sm: 350, md: 400 }, 
                  overflow: 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: { xs: 1.5, sm: 2 },
                  bgcolor: 'grey.50'
                }}>
                  {catalog.length === 0 && !catalogLoading ? (
                    <Box p={3} textAlign="center">
                      <Typography color="text.secondary" variant="body2">Belum ada layanan tersedia.</Typography>
                    </Box>
                  ) : (
                    <Table size="small" stickyHeader>
                      <TableBody>
                        {catalog.slice(0, 50).map((item, index) => (
                          <TableRow key={`${item.code}-${index}`} sx={{ '&:last-child td': { border: 0 } }}>
                            <TableCell sx={{ bgcolor: 'transparent', py: { xs: 0.75, sm: 1 } }}>
                              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: { xs: 120, sm: 150 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {item.layanan}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                                Code: {item.code} • Stok: {item.stok ?? 0}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: 'transparent', py: { xs: 0.75, sm: 1 } }}>
                              <Typography variant="body2" fontWeight={700} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                Rp {Number(item.harga || 0).toLocaleString('id-ID')}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Box>
              </DashboardCard>

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'primary.light', bgcolor: 'primary.light', borderRadius: { xs: 2, sm: 3 } }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                  <Typography variant="h6" color="primary.main" mb={{ xs: 1.5, sm: 2 }} fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Aksi Cepat Admin
                  </Typography>
                  <Stack spacing={{ xs: 1, sm: 1.5 }}>
                    <Button variant="contained" color="primary" fullWidth sx={{ justifyContent: 'flex-start', py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Manajemen Markup Harga
                    </Button>
                    <Button variant="outlined" color="primary" fullWidth sx={{ justifyContent: 'flex-start', py: { xs: 0.75, sm: 1 }, bgcolor: '#fff', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Lihat Daftar Pengguna
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <style>
          {`
            @keyframes spin { 100% { transform: rotate(360deg); } }
            .spin-icon { animation: spin 1s linear infinite; }
          `}
        </style>
      </Box>
    </PageContainer>
  );
};

export default AdminDashboard;
