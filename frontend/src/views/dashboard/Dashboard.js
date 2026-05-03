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
  Autocomplete,
  useMediaQuery,
  useTheme,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
          const mappedOrders = data.data.slice(0, 5).map(item => ({
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
        <Box mb={{ xs: 2, sm: 3, md: 4 }}>
          <Typography variant="h3" fontWeight="700" mb={1} sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
            Selamat datang, {session?.name || session?.username || 'Reseller'}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Berikut adalah ringkasan transaksi dan performa Anda hari ini di {branding?.brand_name || 'OTP Reseller'}.
          </Typography>
        </Box>

        {/* KPI Cards */}
        <Grid container spacing={{ xs: 2, sm: 3 }} mb={{ xs: 2, sm: 3, md: 4 }}>
          {/* Card 1: Saldo */}
          <Grid item xs={12} sm={6}>
            <Card elevation={0} sx={{ backgroundColor: 'primary.light', borderRadius: { xs: 2, sm: 3 } }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography color="primary.main" variant="subtitle2" fontWeight={600} mb={0.5} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Saldo Tersedia
                    </Typography>
                    <Typography variant="h4" fontWeight="700" color="primary.dark" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }, wordBreak: 'break-word' }}>
                      Rp {saldoTersedia.toLocaleString('id-ID')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main', width: { xs: 36, sm: 40, md: 48 }, height: { xs: 36, sm: 40, md: 48 }, flexShrink: 0 }}>
                    <IconWallet size={20} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Card 2: Order */}
          <Grid item xs={12} sm={6}>
            <Card elevation={0} sx={{ backgroundColor: 'secondary.light', borderRadius: { xs: 2, sm: 3 } }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography color="secondary.main" variant="subtitle2" fontWeight={600} mb={0.5} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Order Berhasil
                    </Typography>
                    <Typography variant="h4" fontWeight="700" color="secondary.dark" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}>
                      {totalOrder} <Typography component="span" variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>hari ini</Typography>
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: { xs: 36, sm: 40, md: 48 }, height: { xs: 36, sm: 40, md: 48 }, flexShrink: 0 }}>
                    <IconShoppingCart size={20} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

        </Grid>

        {/* Panduan Penggunaan */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 4 } }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight={700} mb={{ xs: 1.5, sm: 2 }} color="primary.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              📖 Tata Cara Penggunaan
            </Typography>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  Langkah Pembelian:
                </Typography>
                <Box component="ol" sx={{ pl: { xs: 2.5, sm: 3 }, m: 0, fontSize: { xs: '0.8rem', sm: '0.875rem' }, lineHeight: 1.7 }}>
                  <li>Pilih negara dan layanan yang diinginkan</li>
                  <li>Klik <strong>"Beli Nomor"</strong> dan pastikan saldo cukup</li>
                  <li>Setelah mendapat nomor, klik <strong>"Set Ready"</strong> sebelum meminta OTP</li>
                  <li>Masukkan nomor ke aplikasi target dan tunggu SMS masuk</li>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  Tips & Penting:
                </Typography>
                <Box component="ul" sx={{ pl: { xs: 2.5, sm: 3 }, m: 0, fontSize: { xs: '0.8rem', sm: '0.875rem' }, lineHeight: 1.7 }}>
                  <li><strong>Cancel</strong> sebelum waktu habis → saldo kembali</li>
                  <li><strong>Resend</strong> (GRATIS) untuk ambil ulang SMS</li>
                  <li><strong>Reactive</strong> untuk order selesai dipakai lagi</li>
                  <li><Box component="span" sx={{ color: 'error.main', fontWeight: 600 }}>⚠️ OTP tidak masuk & waktu habis = saldo hangus!</Box></li>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Left Column: Order Form */}
          <Grid item xs={12} lg={7}>
            <DashboardCard title="Beli Nomor Baru" subtitle="Pesan OTP instan dari berbagai layanan">
              {catalogLoading && <Alert severity="info" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Memperbarui katalog layanan...</Alert>}
              {catalogError && <Alert severity="error" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{catalogError} Menggunakan data default.</Alert>}
              
              <Box mb={{ xs: 2, sm: 3 }}>
                <Typography variant="subtitle2" mb={1} color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Quick Access (Preset Populer)</Typography>
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
                      sx={{ borderRadius: 2, px: { xs: 0.5, sm: 1 }, py: { xs: 2, sm: 2.5 }, fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    />
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ mb: { xs: 2, sm: 3 } }} />

              <Box component="form" onSubmit={handleBuyNumber} sx={{ backgroundColor: 'grey.50', p: { xs: 2, sm: 3 }, borderRadius: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'grey.200' }}>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
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
                        <TextField {...params} label="Negara" required fullWidth size={isMobile ? 'small' : 'medium'} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#fff', fontSize: { xs: '0.875rem', sm: '1rem' } } }} />
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
                            <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{option.layanan}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                              (Rp {Number(option.harga).toLocaleString('id-ID')})
                            </Typography>
                          </Stack>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField {...params} label="Layanan" required fullWidth size={isMobile ? 'small' : 'medium'} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#fff', fontSize: { xs: '0.875rem', sm: '1rem' } } }} />
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
                        <TextField {...params} label="Operator" required fullWidth size={isMobile ? 'small' : 'medium'} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#fff', fontSize: { xs: '0.875rem', sm: '1rem' } } }} />
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
                      size={isMobile ? 'small' : 'medium'}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#eef2f6' }, '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'text.primary', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 2 }} mt={1}>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary" 
                        disabled={orderLoading} 
                        size={isMobile ? 'medium' : 'large'}
                        sx={{ px: { xs: 3, sm: 4 }, py: { xs: 1, sm: 1.5 }, borderRadius: 2, boxShadow: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        startIcon={orderLoading && <IconRefresh className="spin-icon" size={18} />}
                      >
                        {orderLoading ? 'Memproses...' : 'Beli Nomor Sekarang'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outlined" 
                        color="inherit"
                        onClick={handleResetOrderForm} 
                        disabled={orderLoading}
                        size={isMobile ? 'medium' : 'large'}
                        sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 1.5 }, borderRadius: 2, backgroundColor: '#fff', fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        Reset Form
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>

              {orderResult && (
                <Alert severity="success" sx={{ mt: { xs: 2, sm: 3 }, borderRadius: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }} icon={false}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>✅ Order Berhasil Dibuat!</Typography>
                  <Grid container spacing={{ xs: 1.5, sm: 2 }} mt={1}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Order ID</Typography>
                      <Typography variant="body1" fontWeight={500} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{orderResult.order_id}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Nomor HP</Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body1" fontWeight={600} color="primary.main" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{orderResult.number}</Typography>
                        <Tooltip title="Copy">
                          <IconButton size="small" onClick={() => copyToClipboard(orderResult.number)}><IconCopy size={16} /></IconButton>
                        </Tooltip>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Sisa Saldo</Typography>
                      <Typography variant="body1" fontWeight={500} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Rp {Number(orderResult.remaining_balance).toLocaleString('id-ID')}</Typography>
                    </Grid>
                  </Grid>
                </Alert>
              )}
            </DashboardCard>
          </Grid>

          {/* Right Column: OTP Checker & Recent */}
          <Grid item xs={12} lg={5}>
            <Stack spacing={{ xs: 2, sm: 3 }}>
              <DashboardCard title="Cek Status OTP" subtitle="Pantau SMS masuk secara otomatis">
                <Box component="form" onSubmit={handleCheckOtp}>
                  <TextField
                    label="Masukkan Order ID"
                    value={otpId}
                    onChange={(event) => setOtpId(event.target.value)}
                    fullWidth
                    required
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ mb: { xs: 1.5, sm: 2 }, '& .MuiInputBase-input': { fontSize: { xs: '0.875rem', sm: '1rem' } } }}
                  />
                  
                  <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 }, borderRadius: 2, backgroundColor: 'grey.50' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" spacing={{ xs: 1.5, sm: 2 }}>
                      <FormControlLabel
                        control={<Switch checked={autoRefreshOtp} onChange={(event) => setAutoRefreshOtp(event.target.checked)} color="primary" size={isMobile ? 'small' : 'medium'} />}
                        label={<Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Auto-refresh (10s)</Typography>}
                      />
                      <Button 
                        type="submit" 
                        variant="contained" 
                        color="secondary"
                        disabled={otpLoading || !canCheckOtp}
                        startIcon={otpLoading && <IconRefresh className="spin-icon" size={16} />}
                        size={isMobile ? 'small' : 'medium'}
                        sx={{ borderRadius: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                      >
                        {otpLoading ? 'Mengecek...' : 'Cek Sekarang'}
                      </Button>
                    </Stack>
                  </Paper>
                </Box>

                {lastOtpCheckAt && (
                  <Typography variant="caption" color="text.secondary" display="block" mb={{ xs: 1.5, sm: 2 }} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    Cek terakhir: {lastOtpCheckAt}
                  </Typography>
                )}
                
                {otpResult && (
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Response SMS / OTP</Typography>
                      {otpResult.sms || otpResult.status === 'PENDING' ? (
                        <Box sx={{ p: { xs: 1.5, sm: 2 }, backgroundColor: otpResult.status === 'PENDING' ? 'warning.light' : 'success.light', borderRadius: 1 }}>
                           <Typography variant="body1" fontWeight={otpResult.sms ? 600 : 400} color={otpResult.status === 'PENDING' ? 'warning.dark' : 'success.dark'} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                             {otpResult.sms ? `💬 ${otpResult.sms}` : '⏳ Menunggu SMS masuk...'}
                           </Typography>
                        </Box>
                      ) : (
                         <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>{JSON.stringify(otpResult, null, 2)}</pre>
                      )}
                    </CardContent>
                  </Card>
                )}
              </DashboardCard>

              {/* Minimalist Recent Orders */}
              <DashboardCard title="Riwayat Terakhir" subtitle="Aktivitas order terbaru Anda">
                {recentOrders.length === 0 ? (
                  <Box py={{ xs: 2, sm: 3 }} textAlign="center">
                    <Typography color="text.secondary" variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Belum ada aktivitas. Mulai beli nomor!</Typography>
                  </Box>
                ) : (
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableBody>
                        {recentOrders.map((item) => (
                          <TableRow key={`${item.orderId}-${item.at}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ pl: 0, py: { xs: 1, sm: 1.5 } }}>
                              <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 1.5 }}>
                                <Avatar sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, bgcolor: 'grey.100' }}>
                                  {getServiceIcon(item.service)}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>+{item.number}</Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>{item.service.toUpperCase()} • {item.operator}</Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell align="right" sx={{ pr: 0, py: { xs: 1, sm: 1.5 } }}>
                              <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Rp {Number(item.price).toLocaleString('id-ID')}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>{item.at}</Typography>
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
