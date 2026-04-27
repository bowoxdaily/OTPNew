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
        <Box mb={4}>
          <Typography variant="h3" fontWeight="700" mb={1}>
            Admin Control Center ⚡
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Pantau performa platform, ketersediaan layanan, dan saldo upstream (VirtuSIM) Anda secara real-time.
          </Typography>
        </Box>

        {error && <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>{error}. Menampilkan data dummy sebagai cadangan.</Alert>}

        {/* KPI Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} lg={3}>
            <Card elevation={0} sx={{ backgroundColor: 'primary.light', borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography color="primary.main" variant="subtitle2" fontWeight={600} mb={1}>
                      Saldo Provider (VirtuSIM)
                    </Typography>
                    <Typography variant="h4" fontWeight="700" color="primary.dark">
                      {loading ? <LinearProgress sx={{ mt: 2, mb: 1, width: 60 }} /> : 
                        (upstreamBalance === 'Offline' ? 'Offline' : `Rp ${Number(upstreamBalance).toLocaleString('id-ID')}`)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                    <IconServer size={24} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Card elevation={0} sx={{ backgroundColor: 'secondary.light', borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography color="secondary.main" variant="subtitle2" fontWeight={600} mb={1}>
                      Total Order Hari Ini
                    </Typography>
                    <Typography variant="h4" fontWeight="700" color="secondary.dark">
                      {loading ? <LinearProgress color="secondary" sx={{ mt: 2, mb: 1, width: 60 }} /> : totalOrderHariIni}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                    <IconShoppingCart size={24} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card elevation={0} sx={{ backgroundColor: 'success.light', borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography color="success.main" variant="subtitle2" fontWeight={600} mb={1}>
                      Omzet Platform
                    </Typography>
                    <Typography variant="h4" fontWeight="700" color="success.dark" sx={{ fontSize: '1.75rem' }}>
                      {loading ? <LinearProgress color="success" sx={{ mt: 2, mb: 1, width: 100 }} /> : `Rp ${Number(omzetPlatform).toLocaleString('id-ID')}`}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                    <IconWallet size={24} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card elevation={0} sx={{ backgroundColor: 'warning.light', borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography color="warning.main" variant="subtitle2" fontWeight={600} mb={1}>
                      Estimasi Profit Kotor
                    </Typography>
                    <Typography variant="h4" fontWeight="700" color="warning.dark" sx={{ fontSize: '1.75rem' }}>
                      {loading ? <LinearProgress color="warning" sx={{ mt: 2, mb: 1, width: 100 }} /> : `Rp ${Number(estimasiProfit).toLocaleString('id-ID')}`}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                    <IconChartPie size={24} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Status Provider (Left, 7 columns) */}
          <Grid item xs={12} lg={7}>
            <Stack spacing={3}>
              <DashboardCard 
                title="Status Provider OTP" 
                subtitle="Ketersediaan layanan & response time"
                action={<IconActivity color="#5D87FF" />}
              >
                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2, whiteSpace: 'nowrap', overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: 'grey.50' }}>
                      <TableRow>
                        <TableCell><Typography variant="subtitle2" fontWeight={600}>Nama Provider</Typography></TableCell>
                        <TableCell><Typography variant="subtitle2" fontWeight={600}>Status</Typography></TableCell>
                        <TableCell align="right"><Typography variant="subtitle2" fontWeight={600}>Response Time</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {providerStatus.map((provider) => (
                        <TableRow key={provider.name}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <IconServer size={18} color="#7C8FAC" />
                              <Typography variant="body2" fontWeight={500}>{provider.name}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={provider.status} 
                              size="small" 
                              color={provider.status === 'Online' ? 'success' : 'error'}
                              variant={provider.status === 'Online' ? 'contained' : 'outlined'}
                              sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={500} color="text.secondary">{provider.response}</Typography>
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
                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2, whiteSpace: 'nowrap', overflowX: 'auto' }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: 'grey.50' }}>
                      <TableRow>
                        <TableCell><Typography variant="subtitle2" fontWeight={600}>Reseller</Typography></TableCell>
                        <TableCell align="center"><Typography variant="subtitle2" fontWeight={600}>Order</Typography></TableCell>
                        <TableCell align="right"><Typography variant="subtitle2" fontWeight={600}>Total Omzet</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topReseller.map((reseller, index) => (
                        <TableRow key={reseller.username}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: index === 0 ? 'warning.main' : 'primary.main', fontSize: '0.875rem' }}>
                                {reseller.username.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" fontWeight={600}>@{reseller.username}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={reseller.order} size="small" sx={{ backgroundColor: 'grey.100', fontWeight: 600 }} />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" fontWeight={700} color="primary.main">
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

          {/* Right Column (5 columns) */}
          <Grid item xs={12} lg={5}>
            <Stack spacing={3}>
              <DashboardCard title="Katalog Layanan (Upstream)" subtitle="Data langsung dari provider utama">
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {selectedNegara?.name || 'Indonesia'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total {catalog.length} layanan aktif
                    </Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={fetchCatalog} 
                    disabled={catalogLoading}
                    startIcon={catalogLoading ? <IconRefresh className="spin-icon" size={16} /> : <IconRefresh size={16} />}
                    sx={{ borderRadius: 2 }}
                  >
                    Refresh
                  </Button>
                </Stack>
                
                {catalogError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{catalogError}</Alert>}
                
                <Box sx={{ 
                  maxHeight: 400, 
                  overflow: 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
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
                            <TableCell sx={{ bgcolor: 'transparent' }}>
                              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 150 }}>
                                {item.layanan}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Code: {item.code} • Stok: {item.stok ?? 0}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: 'transparent' }}>
                              <Typography variant="body2" fontWeight={700}>
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

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'primary.light', bgcolor: 'primary.light', borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" color="primary.main" mb={1} fontWeight={600}>Aksi Cepat Admin</Typography>
                  <Stack spacing={1}>
                    <Button variant="contained" color="primary" fullWidth sx={{ justifyContent: 'flex-start', py: 1 }}>
                      Manajemen Markup Harga
                    </Button>
                    <Button variant="outlined" color="primary" fullWidth sx={{ justifyContent: 'flex-start', py: 1, bgcolor: '#fff' }}>
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
