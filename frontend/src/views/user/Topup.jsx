import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton
} from '@mui/material';
import { IconWallet, IconRefresh } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

const Topup = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState('');
  const [paidNotified, setPaidNotified] = useState(false);
  const [topupCreatedAt, setTopupCreatedAt] = useState(null);
  const [countdown, setCountdown] = useState(null); // seconds remaining

  const EXPIRY_SECONDS = 20 * 60; // 20 menit

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await apiFetch('/api/topup');
      const data = await readJsonSafe(res);
      if (res.ok && data.success) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setPaymentUrl('');
    setActiveOrderId('');
    setPaidNotified(false);

    try {
      const res = await apiFetch('/api/topup', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      const data = await readJsonSafe(res);

      if (res.ok && data.success) {
        setSuccessMsg(`Rp ${data.data.amount}`);
        setActiveOrderId(data.data.order_id || data.data.id || '');
        setTopupCreatedAt(new Date().toISOString());
        setCountdown(EXPIRY_SECONDS);

        const url = data.data.actions?.find(a => a.name === 'generate-qr-code')?.url;
        if (url) setPaymentUrl(url);

        setAmount('');
        fetchHistory();
      } else {
        throw new Error(data.message || 'Gagal membuat tagihan topup');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResumePayment = (item) => {
    setActiveOrderId(item.id);
    setPaymentUrl(item.qr_code || item.payment_url || '');
    setSuccessMsg(`Rp ${item.amount}`);
    setPaidNotified(false);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!activeOrderId || paidNotified) return undefined;

    const timer = setInterval(async () => {
      try {
        const res = await apiFetch('/api/topup');
        const data = await readJsonSafe(res);
        if (!res.ok || !data.success || !Array.isArray(data.data)) return;

        setHistory(data.data);

        const activeTopup = data.data.find((item) => item.id === activeOrderId);
        if (!activeTopup) return;

        if (activeTopup.status === 'success') {
          setPaidNotified(true);
          setPaymentUrl('');
          setCountdown(null);
        } else if (activeTopup.status === 'failed' || activeTopup.status === 'expired') {
          setPaidNotified(true);
          setPaymentUrl('');
          setActiveOrderId('');
          setCountdown(null);
          if (activeTopup.status === 'expired') {
            setError('Topup kadaluarsa (lebih dari 20 menit). Silakan buat tagihan baru.');
          }
        }
      } catch (err) {
        // Silent polling error; keep interval alive.
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [activeOrderId, paidNotified]);

  const hasPending = history.some(item => item.status === 'pending');

  // ── Countdown Timer ──
  useEffect(() => {
    if (!countdown && countdown !== 0) return;
    if (countdown <= 0) {
      setPaymentUrl('');
      setActiveOrderId('');
      setError('Waktu pembayaran habis (20 menit). Silakan buat tagihan baru.');
      setCountdown(null);
      fetchHistory();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const countdownColor = countdown !== null && countdown < 60 ? 'error.main' : countdown < 300 ? 'warning.main' : 'success.main';

  return (
    <PageContainer title="Top Up Saldo" description="Isi ulang saldo via GoPay">
      <Box mb={4}>
        <Typography variant="h3" fontWeight="700" mb={1}>Isi Saldo (Top Up) 💰</Typography>
        <Typography variant="body1" color="text.secondary">
          Top up saldo Anda secara otomatis menggunakan GoPay atau QRIS. Minimal Rp 5.000.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Nominal Top Up</Typography>
              
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {successMsg && !paidNotified && <Alert severity="success" sx={{ mb: 2 }}>Tagihan berhasil dibuat. Silakan scan QRIS di bawah ini.</Alert>}
              
              {!paymentUrl && (
                <form onSubmit={handleTopup}>
                  <TextField
                    fullWidth
                    label="Jumlah (Rp)"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="5000"
                    InputProps={{ inputProps: { min: 5000 } }}
                    sx={{ mb: 2 }}
                    required
                    disabled={hasPending}
                  />
                  
                  {hasPending && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Anda masih memiliki tagihan pending di riwayat. Selesaikan pembayaran tersebut sebelum membuat tagihan baru.
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    disabled={loading || hasPending}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <IconWallet />}
                  >
                    {loading ? 'Memproses...' : 'Buat Tagihan Pembayaran'}
                  </Button>
                </form>
              )}

              {paymentUrl && (
                <Box textAlign="center" p={3} sx={{ bgcolor: 'grey.50', borderRadius: 2, border: '2px dashed #4caf50' }}>
                  <Typography variant="h6" color="success.main" mb={1}>Scan QRIS GoPay Ini</Typography>
                  <img src={paymentUrl} alt="QRIS" style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }} />
                  
                  <Box mt={2} p={2} sx={{ bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="warning.dark" fontWeight={700}>
                      PENTING! Transfer TEPAT sesuai nominal berikut:
                    </Typography>
                    <Typography variant="h4" color="error.main" fontWeight={800} mt={1}>
                      Rp {Number(successMsg.replace(/\D/g, '') || 0).toLocaleString('id-ID')}
                    </Typography>
                    {countdown !== null && (
                      <Box mt={1.5} p={1} sx={{ bgcolor: 'white', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">⏳ Batas waktu pembayaran:</Typography>
                        <Typography variant="subtitle2" color={countdownColor} fontWeight={800} fontFamily="monospace" fontSize="1.1rem">
                          {formatCountdown(countdown)}
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="caption" display="block" mt={1} color="warning.dark">
                      Pembayaran diverifikasi otomatis. Saldo akan masuk setelah status transaksi PAID. Sedang menunggu... <CircularProgress size={12} />
                    </Typography>
                  </Box>
                  <Button variant="outlined" color="primary" sx={{ mt: 2 }} onClick={() => setPaymentUrl('')} fullWidth>
                    Tutup / Buat Tagihan Baru
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Riwayat Top Up Terakhir</Typography>
                <IconButton onClick={fetchHistory} size="small" disabled={historyLoading}>
                  <IconRefresh size={20} />
                </IconButton>
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell>Tanggal</TableCell>
                      <TableCell align="right">Nominal</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center"><CircularProgress size={24} sx={{ my: 2 }} /></TableCell>
                      </TableRow>
                    ) : history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center"><Typography color="text.secondary" my={2}>Belum ada riwayat top up.</Typography></TableCell>
                      </TableRow>
                    ) : (
                      history.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Typography variant="body2">{new Date(item.created_at).toLocaleString('id-ID')}</Typography>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">{String(item.id).substring(0, 15)}...</Typography>
                          </TableCell>
                          <TableCell align="right"><Typography variant="body2" fontWeight={600}>Rp {Number(item.amount).toLocaleString('id-ID')}</Typography></TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={item.status === 'expired' ? 'EXPIRED' : item.status.toUpperCase()} 
                              size="small" 
                              color={
                                item.status === 'success' ? 'success' 
                                : item.status === 'pending' ? 'warning' 
                                : 'error'
                              }
                              sx={item.status === 'expired' ? { bgcolor: 'grey.400', color: 'white' } : {}}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {item.status === 'pending' && (
                              <Button 
                                variant="outlined" 
                                size="small" 
                                color="primary" 
                                onClick={() => handleResumePayment(item)}
                                disabled={activeOrderId === item.id}
                              >
                                {activeOrderId === item.id ? 'Menunggu...' : 'Bayar'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default Topup;
