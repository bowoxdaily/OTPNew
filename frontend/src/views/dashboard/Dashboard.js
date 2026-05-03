import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  Switch,
  MenuItem,
  TextField,
  Typography,
  Stack,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  IconButton,
  Tooltip,
  Autocomplete
} from '@mui/material';
import {
  IconWallet,
  IconShoppingCart,
  IconChartBar,
  IconTrendingUp,
  IconRefresh,
  IconCopy,
  IconBrandWhatsapp,
  IconBrandTelegram,
  IconBrandGoogle,
  IconDeviceMobile
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from 'src/components/shared/DashboardCard';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';
import { getUserSession } from 'src/utils/authSession';
import { useBranding } from 'src/contexts/BrandingContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const presetCatalog = [
  { label: 'WA Indonesia', layanan: 'whatsapp', operator: 'any', negaraId: 7, icon: <IconBrandWhatsapp size={18} /> },
  { label: 'Telegram ID', layanan: 'telegram', operator: 'any', negaraId: 7, icon: <IconBrandTelegram size={18} /> },
  { label: 'Google ID', layanan: 'google', operator: 'any', negaraId: 7, icon: <IconBrandGoogle size={18} /> },
];

const initialOrderForm = {
  user_id: 'user_1',
  negara: 7,
  layanan: '716',
  operator: 'any',
  price: 10000,
};

const fallbackNegaraOptions = [{ id: 7, name: 'Indonesia' }];
const fallbackOperatorOptions = ['any'];
const fallbackLayananOptions = [{ code: '716', layanan: 'whatsapp', harga: 10000, harga_provider: 10000, markup_percentage: 0, markup_fixed: 0, stok: 0 }];

const getServiceIcon = (serviceCode) => {
  const code = serviceCode.toLowerCase();
  if (code.includes('wa') || code.includes('whatsapp')) return <IconBrandWhatsapp size={20} color="#25D366" />;
  if (code.includes('tele')) return <IconBrandTelegram size={20} color="#0088cc" />;
  if (code.includes('google')) return <IconBrandGoogle size={20} color="#DB4437" />;
  return <IconDeviceMobile size={20} color="#757575" />;
};

const Dashboard = () => {
  const session = getUserSession();
  const { branding } = useBranding();
  
  const [orderForm, setOrderForm] = useState({
    ...initialOrderForm,
    user_id: session?.userId || initialOrderForm.user_id,
  });
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [orderError, setOrderError] = useState('');

  const [otpId, setOtpId] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResult, setOtpResult] = useState(null);
  const [otpError, setOtpError] = useState('');
  const [autoRefreshOtp, setAutoRefreshOtp] = useState(false);
  const [lastOtpCheckAt, setLastOtpCheckAt] = useState('');

  const [recentOrders, setRecentOrders] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [negaraOptions, setNegaraOptions] = useState(fallbackNegaraOptions);
  const [operatorOptions, setOperatorOptions] = useState(fallbackOperatorOptions);
  const [layananOptions, setLayananOptions] = useState(fallbackLayananOptions);

  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Fetch profile user to get actual balance
    const fetchProfile = async () => {
      try {
        const res = await apiFetch('/api/auth/me');
        const data = await readJsonSafe(res);
        if (res.ok && data.success) {
          setUserProfile(data.data);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    let active = true;
    async function fetchOrders() {
      try {
        const res = await apiFetch('/api/orders');
        const data = await readJsonSafe(res);
        if (res.ok && data.success && Array.isArray(data.data) && active) {
          const mappedOrders = data.data.slice(0, 10).map(item => ({
            orderId: item.provider_order_id || '-',
            number: item.number || '-',
            service: item.layanan || 'Unknown',
            operator: item.operator || 'any',
            price: item.price || item.reseller_price || 0,
            at: new Date(item.created_at).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }));
          setRecentOrders(mappedOrders);
        }
      } catch (err) {
        console.error('Failed to load recent orders:', err);
      }
    }
    fetchOrders();
    return () => { active = false; };
  }, []);

  const canCheckOtp = useMemo(() => otpId.trim().length > 0, [otpId]);

  const omzet = recentOrders.reduce((sum, item) => sum + Number(item.price), 0);
  const totalOrder = recentOrders.length;
  const estimasiProfit = Math.round(omzet * 0.15);
  // Prioritaskan sisa saldo dari transaksi terakhir, atau saldo dari profile, atau 0
  const saldoTersedia = orderResult?.remaining_balance ?? userProfile?.balance ?? 0;

  function handleOrderFieldChange(event) {
    const { name, value } = event.target;
    if (name === 'layanan') {
      const selected = layananOptions.find((item) => item.code === value);
      setOrderForm((prev) => ({
        ...prev,
        layanan: value,
        price: selected?.harga || prev.price,
      }));
      return;
    }
    setOrderForm((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'negara' ? Number(value) : value,
    }));
  }

  function handleResetOrderForm() {
    setOrderForm((prev) => ({
      ...prev,
      negara: negaraOptions[0]?.id ?? initialOrderForm.negara,
      layanan: layananOptions[0]?.code || initialOrderForm.layanan,
      operator: operatorOptions[0] || initialOrderForm.operator,
      price: layananOptions[0]?.harga || initialOrderForm.price,
    }));
  }

  function applyPreset(preset) {
    const keyword = preset.layanan.toLowerCase();
    const selected = layananOptions.find(
      (item) => item.code === preset.layanan || item.layanan.toLowerCase().includes(keyword)
    );
    if (selected) {
      setOrderForm((prev) => ({
        ...prev,
        negara: preset.negaraId || prev.negara,
        layanan: selected.code,
        operator: preset.operator,
        price: selected.harga,
      }));
    } else {
      setOrderForm((prev) => ({
        ...prev,
        negara: preset.negaraId || prev.negara,
        layanan: preset.layanan,
        operator: preset.operator,
      }));
    }
  }

  async function handleBuyNumber(event) {
    event.preventDefault();
    setOrderLoading(true);
    setOrderError('');
    setOrderResult(null);

    try {
      const response = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderForm),
      });

      const data = await readJsonSafe(response);
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal memproses order');
      }

      setOrderResult(data.data || null);
      if (data?.data?.order_id) {
        setOtpId(String(data.data.order_id));
      }

      MySwal.fire({
        title: 'Sukses!',
        text: 'Order berhasil dibuat.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      setRecentOrders((prev) => [
        {
          orderId: data?.data?.order_id || '-',
          number: data?.data?.number || '-',
          service: orderForm.layanan,
          operator: orderForm.operator,
          price: orderForm.price,
          at: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...prev,
      ].slice(0, 8));
    } catch (error) {
      const msg = error.message || 'Terjadi kesalahan saat order nomor';
      setOrderError(msg);
      MySwal.fire({
        title: 'Oops!',
        text: msg,
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Tutup'
      });
    } finally {
      setOrderLoading(false);
    }
  }

  async function fetchOtpById(id, { reset = false } = {}) {
    setOtpLoading(true);
    setOtpError('');
    if (reset) {
      setOtpResult(null);
    }

    try {
      const response = await apiFetch(`/api/orders/${encodeURIComponent(id)}/otp`);
      const data = await readJsonSafe(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal cek OTP');
      }

      setOtpResult(data.data || null);
      setLastOtpCheckAt(
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (error) {
      const msg = error.message || 'Terjadi kesalahan saat cek OTP';
      setOtpError(msg);
      MySwal.fire({
        title: 'Gagal Cek OTP',
        text: msg,
        icon: 'warning',
        confirmButtonColor: '#f39c12',
        confirmButtonText: 'Oke'
      });
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleCheckOtp(event) {
    event.preventDefault();
    await fetchOtpById(otpId, { reset: true });
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    if (session?.userId) {
      setOrderForm((prev) => ({ ...prev, user_id: session.userId }));
    }
  }, [session?.userId]);

  useEffect(() => {
    let active = true;
    async function fetchCountries() {
      setCatalogLoading(true);
      setCatalogError('');
      try {
        const response = await apiFetch('/api/catalog/negara');
        const data = await readJsonSafe(response);
        if (!response.ok || !data?.success || !Array.isArray(data?.data)) {
          throw new Error(data?.message || 'Gagal mengambil daftar negara');
        }
        if (!active) return;
        if (data.data.length > 0) {
          setNegaraOptions(data.data);
          const indonesiaOption = data.data.find(item => item.id === 7);
          setOrderForm((prev) => ({ ...prev, negara: indonesiaOption?.id || data.data[0].id }));
        }
      } catch (error) {
        if (active) setCatalogError(error.message || 'Gagal memuat katalog dari upstream');
      } finally {
        if (active) setCatalogLoading(false);
      }
    }
    fetchCountries();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function fetchDependentCatalog() {
      if (!Number.isFinite(Number(orderForm.negara))) return;
      setCatalogLoading(true);
      setCatalogError('');
      try {
        const [operatorRes, layananRes] = await Promise.all([
          apiFetch(`/api/catalog/operator?negara=${orderForm.negara}`),
          apiFetch(`/api/catalog/layanan?negara=${orderForm.negara}`),
        ]);
        const operatorData = await readJsonSafe(operatorRes);
        const layananData = await readJsonSafe(layananRes);
        if (!operatorRes.ok || !operatorData?.success) {
          throw new Error(operatorData?.message || 'Gagal mengambil operator');
        }
        if (!layananRes.ok || !layananData?.success || !Array.isArray(layananData?.data)) {
          throw new Error(layananData?.message || 'Gagal mengambil layanan');
        }

        if (!active) return;
        const nextOperators = operatorData.data?.length ? operatorData.data : fallbackOperatorOptions;
        const nextLayanan = layananData.data?.length ? layananData.data : fallbackLayananOptions;
        setOperatorOptions(nextOperators);
        setLayananOptions(nextLayanan);
        setOrderForm((prev) => ({
          ...prev,
          operator: nextOperators[0] || prev.operator,
          layanan: nextLayanan[0]?.code || prev.layanan,
          price: nextLayanan[0]?.harga || prev.price,
        }));
      } catch (error) {
        if (active) setCatalogError(error.message || 'Gagal memuat katalog dari upstream');
      } finally {
        if (active) setCatalogLoading(false);
      }
    }
    fetchDependentCatalog();
    return () => { active = false; };
  }, [orderForm.negara]);

  useEffect(() => {
    if (!autoRefreshOtp || !otpId.trim()) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      fetchOtpById(otpId);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [autoRefreshOtp, otpId]);

  return (
    <PageContainer title="Dashboard | OTP Reseller" description="Dashboard user OTP Reseller. Pantau saldo, pesanan aktif, dan akses layanan beli nomor OTP dengan mudah.">
      <Box>
        {/* Hero Section */}
        <Box mb={4}>
          <Typography variant="h3" fontWeight="700" mb={1}>
            Selamat datang, {session?.name || session?.username || 'Reseller'}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Berikut adalah ringkasan transaksi dan performa Anda hari ini di {branding?.brand_name || 'OTP Reseller'}.
          </Typography>
        </Box>

        {/* KPI Cards */}
        <Grid container spacing={3} mb={4}>
          {/* Card 1: Saldo */}
          <Grid item xs={12} sm={6} lg={6}>
            <Card elevation={0} sx={{ backgroundColor: 'primary.light', borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography color="primary.main" variant="subtitle2" fontWeight={600} mb={1}>
                      Saldo Tersedia
                    </Typography>
                    <Typography variant="h4" fontWeight="700" color="primary.dark">
                      Rp {saldoTersedia.toLocaleString('id-ID')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                    <IconWallet size={24} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Card 2: Order */}
          <Grid item xs={12} sm={6} lg={6}>
            <Card elevation={0} sx={{ backgroundColor: 'secondary.light', borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography color="secondary.main" variant="subtitle2" fontWeight={600} mb={1}>
                      Order Berhasil
                    </Typography>
                    <Typography variant="h4" fontWeight="700" color="secondary.dark">
                      {totalOrder} <Typography component="span" variant="body2" color="text.secondary">hari ini</Typography>
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                    <IconShoppingCart size={24} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

        </Grid>

        <Grid container spacing={3}>
          {/* Left Column: Order Form */}
          <Grid item xs={12} lg={7}>
            <DashboardCard title="Beli Nomor Baru" subtitle="Pesan OTP instan dari berbagai layanan">
              {catalogLoading && <Alert severity="info" sx={{ mb: 2 }}>Memperbarui katalog layanan...</Alert>}
              {catalogError && <Alert severity="error" sx={{ mb: 2 }}>{catalogError} Menggunakan data default.</Alert>}
              
              <Box mb={3}>
                <Typography variant="subtitle2" mb={1} color="text.secondary">Quick Access (Preset Populer)</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {presetCatalog.map((preset) => (
                    <Chip
                      key={preset.label}
                      icon={preset.icon}
                      label={preset.label}
                      clickable
                      color="primary"
                      variant="outlined"
                      onClick={() => applyPreset(preset)}
                      sx={{ borderRadius: 2, px: 1, py: 2.5, fontWeight: 500 }}
                    />
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box component="form" onSubmit={handleBuyNumber} sx={{ backgroundColor: 'grey.50', p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={negaraOptions}
                      getOptionLabel={(option) => option.name}
                      value={negaraOptions.find((o) => o.id === orderForm.negara) || null}
                      onChange={(event, newValue) => {
                        handleOrderFieldChange({ target: { name: 'negara', value: newValue ? newValue.id : '' } });
                      }}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderInput={(params) => (
                        <TextField {...params} label="Negara" required fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#fff' } }} />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={layananOptions}
                      getOptionLabel={(option) => `${option.layanan} (Rp ${Number(option.harga).toLocaleString('id-ID')})`}
                      value={layananOptions.find((o) => o.code === orderForm.layanan) || null}
                      onChange={(event, newValue) => {
                        handleOrderFieldChange({ target: { name: 'layanan', value: newValue ? newValue.code : '' } });
                      }}
                      isOptionEqualToValue={(option, value) => option.code === value.code}
                      renderOption={(props, option) => (
                        <li {...props} key={option.code}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography>{option.layanan}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              (Rp {Number(option.harga).toLocaleString('id-ID')})
                            </Typography>
                          </Stack>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField {...params} label="Layanan" required fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#fff' } }} />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={operatorOptions}
                      getOptionLabel={(option) => option.charAt(0).toUpperCase() + option.slice(1)}
                      value={orderForm.operator || null}
                      onChange={(event, newValue) => {
                        handleOrderFieldChange({ target: { name: 'operator', value: newValue || '' } });
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Operator" required fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#fff' } }} />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      label="Harga (Potongan Saldo)" 
                      name="price" 
                      type="text" 
                      value={`Rp ${Number(orderForm.price).toLocaleString('id-ID')}`} 
                      fullWidth 
                      disabled 
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#eef2f6' }, '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'text.primary', fontWeight: 600 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={1}>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary" 
                        disabled={orderLoading} 
                        size="large"
                        sx={{ px: 4, py: 1.5, borderRadius: 2, boxShadow: 2 }}
                        startIcon={orderLoading && <IconRefresh className="spin-icon" />}
                      >
                        {orderLoading ? 'Memproses...' : 'Beli Nomor Sekarang'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outlined" 
                        color="inherit"
                        onClick={handleResetOrderForm} 
                        disabled={orderLoading}
                        size="large"
                        sx={{ px: 3, py: 1.5, borderRadius: 2, backgroundColor: '#fff' }}
                      >
                        Reset Form
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>

              {/* {orderError && <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>{orderError}</Alert>} */}
              {orderResult && (
                <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }} icon={false}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>✅ Order Berhasil Dibuat!</Typography>
                  <Grid container spacing={2} mt={1}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary" display="block">Order ID</Typography>
                      <Typography variant="body1" fontWeight={500}>{orderResult.order_id}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary" display="block">Nomor HP</Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body1" fontWeight={600} color="primary.main">{orderResult.number}</Typography>
                        <Tooltip title="Copy">
                          <IconButton size="small" onClick={() => copyToClipboard(orderResult.number)}><IconCopy size={16} /></IconButton>
                        </Tooltip>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary" display="block">Sisa Saldo</Typography>
                      <Typography variant="body1" fontWeight={500}>Rp {Number(orderResult.remaining_balance).toLocaleString('id-ID')}</Typography>
                    </Grid>
                  </Grid>
                </Alert>
              )}
            </DashboardCard>
          </Grid>

          {/* Right Column: OTP Checker & Recent */}
          <Grid item xs={12} lg={5}>
            <Stack spacing={3}>
              <DashboardCard title="Cek Status OTP" subtitle="Pantau SMS masuk secara otomatis">
                <Box component="form" onSubmit={handleCheckOtp}>
                  <TextField
                    label="Masukkan Order ID"
                    value={otpId}
                    onChange={(event) => setOtpId(event.target.value)}
                    fullWidth
                    required
                    size="medium"
                    sx={{ mb: 2 }}
                  />
                  
                  <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, backgroundColor: 'grey.50' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" spacing={2}>
                      <FormControlLabel
                        control={<Switch checked={autoRefreshOtp} onChange={(event) => setAutoRefreshOtp(event.target.checked)} color="primary" />}
                        label={<Typography variant="body2" fontWeight={500}>Auto-refresh (10s)</Typography>}
                      />
                      <Button 
                        type="submit" 
                        variant="contained" 
                        color="secondary"
                        disabled={otpLoading || !canCheckOtp}
                        startIcon={otpLoading && <IconRefresh className="spin-icon" />}
                        sx={{ borderRadius: 2 }}
                      >
                        {otpLoading ? 'Mengecek...' : 'Cek Sekarang'}
                      </Button>
                    </Stack>
                  </Paper>
                </Box>

                {lastOtpCheckAt && (
                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    Cek terakhir: {lastOtpCheckAt}
                  </Typography>
                )}

                {/* {otpError && <Alert severity="error" sx={{ borderRadius: 2 }}>{otpError}</Alert>} */}
                
                {otpResult && (
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Response SMS / OTP</Typography>
                      {otpResult.sms || otpResult.status === 'PENDING' ? (
                        <Box sx={{ p: 2, backgroundColor: otpResult.status === 'PENDING' ? 'warning.light' : 'success.light', borderRadius: 1 }}>
                           <Typography variant="body1" fontWeight={otpResult.sms ? 600 : 400} color={otpResult.status === 'PENDING' ? 'warning.dark' : 'success.dark'}>
                             {otpResult.sms ? `💬 ${otpResult.sms}` : '⏳ Menunggu SMS masuk...'}
                           </Typography>
                        </Box>
                      ) : (
                         <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{JSON.stringify(otpResult, null, 2)}</pre>
                      )}
                    </CardContent>
                  </Card>
                )}
              </DashboardCard>

              {/* Minimalist Recent Orders */}
              <DashboardCard title="Riwayat Terakhir" subtitle="Aktivitas order terbaru Anda">
                {recentOrders.length === 0 ? (
                  <Box py={3} textAlign="center">
                    <Typography color="text.secondary" variant="body2">Belum ada aktivitas. Mulai beli nomor!</Typography>
                  </Box>
                ) : (
                  <TableContainer sx={{ whiteSpace: 'nowrap', overflowX: 'auto' }}>
                    <Table size="small">
                      <TableBody>
                        {recentOrders.map((item) => (
                          <TableRow key={`${item.orderId}-${item.at}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ pl: 0, py: 1.5 }}>
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.100' }}>
                                  {getServiceIcon(item.service)}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={600}>+{item.number}</Typography>
                                  <Typography variant="caption" color="text.secondary">{item.service.toUpperCase()} • {item.operator}</Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell align="right" sx={{ pr: 0, py: 1.5 }}>
                              <Typography variant="subtitle2" fontWeight={600}>Rp {Number(item.price).toLocaleString('id-ID')}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.at}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </DashboardCard>
            </Stack>
          </Grid>
        </Grid>
        
        {/* Simple global CSS for spinning icon */}
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

export default Dashboard;
