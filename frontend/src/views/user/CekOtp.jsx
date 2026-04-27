import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert
} from '@mui/material';
import { IconCopy, IconRefresh, IconMessage2, IconX } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

const CekOtp = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [otpChecking, setOtpChecking] = useState(false);
  const [otpResult, setOtpResult] = useState(null);
  const [otpError, setOtpError] = useState('');

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const isOrderExpired = (createdAtStr) => {
    const createdTime = new Date(createdAtStr).getTime();
    return now >= createdTime + (20 * 60 * 1000);
  };

  const getOrderRemainingTime = (createdAtStr) => {
    const createdTime = new Date(createdAtStr).getTime();
    const expiryTime = createdTime + (20 * 60 * 1000);
    const diff = expiryTime - now;
    if (diff <= 0) return 'Expired';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCancelWaitTime = (createdAtStr) => {
    const createdTime = new Date(createdAtStr).getTime();
    const cancelTime = createdTime + (3 * 60 * 1000);
    const diff = cancelTime - now;
    if (diff <= 0) return 0;
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/orders');
      const data = await readJsonSafe(res);
      if (res.ok && data.success) {
        setOrders(data.data);
      } else {
        throw new Error(data.message || 'Gagal mengambil riwayat order');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (order) => {
    setSelectedOrder(order);
    setOtpResult(null);
    setOtpError('');
    checkOtpSms(order.provider_order_id);
  };

  const handleCloseDialog = () => {
    setSelectedOrder(null);
  };

  const checkOtpSms = async (orderId) => {
    setOtpChecking(true);
    setOtpError('');
    try {
      const res = await apiFetch(`/api/orders/${orderId}/otp`);
      const data = await readJsonSafe(res);
      if (res.ok && data.success) {
        setOtpResult(data.data);
      } else {
        throw new Error(data.message || 'Gagal mengecek SMS');
      }
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpChecking(false);
    }
  };

  const handleSetReady = async (orderId) => {
    setOtpChecking(true);
    setOtpError('');
    try {
      const res = await apiFetch(`/api/orders/${orderId}/ready`, { method: 'POST' });
      const data = await readJsonSafe(res);
      if (res.ok && data.success) {
        alert('Status berhasil diubah menjadi Ready. Menunggu OTP...');
        checkOtpSms(orderId);
      } else {
        throw new Error(data.message || 'Gagal set ready');
      }
    } catch (err) {
      setOtpError(err.message);
      alert(err.message);
    } finally {
      setOtpChecking(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Yakin ingin membatalkan pesanan ini? Saldo akan dikembalikan jika berhasil dibatalkan.')) return;
    
    setOtpChecking(true);
    setOtpError('');
    try {
      const res = await apiFetch(`/api/orders/${orderId}/cancel`, { method: 'POST' });
      const data = await readJsonSafe(res);
      if (res.ok && data.success) {
        alert(data.message);
        handleCloseDialog();
        fetchOrders(); // refresh table
      } else {
        throw new Error(data.message || 'Gagal membatalkan pesanan');
      }
    } catch (err) {
      setOtpError(err.message);
      alert(err.message);
    } finally {
      setOtpChecking(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <PageContainer title="Cek OTP & Riwayat Order" description="Daftar pesanan nomor dan pesan masuk">
      <Box mb={4}>
        <Typography variant="h3" fontWeight="700" mb={1}>Riwayat & Cek OTP 📩</Typography>
        <Typography variant="body1" color="text.secondary">
          Pantau status pesanan nomor Anda dan terima SMS (OTP) secara langsung di sini.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Box p={3} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>Daftar Pesanan Terakhir</Typography>
          <Button 
            variant="outlined" 
            startIcon={loading ? <IconRefresh className="spin-icon" size={18} /> : <IconRefresh size={18} />} 
            onClick={fetchOrders}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mx: 3, mb: 3 }}>{error}</Alert>}

        <TableContainer>
          <Table sx={{ minWidth: 600 }}>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Tanggal & Jam</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Order ID</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Layanan</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Nomor HP</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle2" fontWeight={600}>Status</Typography></TableCell>
                <TableCell align="right"><Typography variant="subtitle2" fontWeight={600}>Aksi</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">Belum ada pesanan nomor.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2">{new Date(item.created_at).toLocaleString('id-ID')}</Typography>
                      {(item.status === 'pending' || item.status === 'waiting') && !isOrderExpired(item.created_at) && (
                        <Typography variant="caption" color="warning.main" fontWeight={600}>
                          Sisa Waktu: {getOrderRemainingTime(item.created_at)}
                        </Typography>
                      )}
                      {(item.status === 'pending' || item.status === 'waiting') && isOrderExpired(item.created_at) && (
                        <Typography variant="caption" color="error.main" fontWeight={600}>
                          Expired
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">{item.provider_order_id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={(item.layanan || '').toUpperCase()} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight={600}>
                        +{item.number}
                        <IconButton size="small" onClick={() => copyToClipboard(item.number)} sx={{ ml: 1 }}>
                          <IconCopy size={16} />
                        </IconButton>
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={(item.status || '').toUpperCase()} 
                        size="small" 
                        color={item.status === 'completed' ? 'success' : item.status === 'canceled' ? 'error' : 'warning'} 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        startIcon={<IconMessage2 size={16} />}
                        onClick={() => handleOpenDialog(item)}
                        sx={{ borderRadius: 2 }}
                      >
                        Cek SMS
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog Cek OTP */}
      <Dialog open={!!selectedOrder} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>Detail Order & SMS</Typography>
          <IconButton onClick={handleCloseDialog} size="small"><IconX /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary">Order ID</Typography>
              <Typography variant="body1" fontWeight={500} mb={1}>{selectedOrder.provider_order_id}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">Nomor Handphone</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main" mb={2}>+{selectedOrder.number}</Typography>
            </Box>
          )}

          <Typography variant="subtitle2" color="text.secondary" mb={1}>Status SMS / Pesan Masuk</Typography>
          <Card variant="outlined" sx={{ bgcolor: 'grey.50', minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CardContent sx={{ width: '100%', textAlign: 'center' }}>
              {otpChecking ? (
                <Box>
                  <CircularProgress size={24} sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Mengecek server VirtuSIM...</Typography>
                </Box>
              ) : otpError ? (
                <Alert severity="error">{otpError}</Alert>
              ) : otpResult ? (
                <Box>
                  {otpResult.status === 'CANCELED' || selectedOrder?.status === 'canceled' ? (
                    <Box sx={{ p: 2, backgroundColor: 'error.light', borderRadius: 1 }}>
                        <Typography variant="body1" fontWeight={600} color="error.dark">
                          🚫 Pesanan Dibatalkan
                        </Typography>
                    </Box>
                  ) : otpResult.sms || otpResult.status === 'PENDING' ? (
                    <Box sx={{ p: 2, backgroundColor: otpResult.status === 'PENDING' ? 'warning.light' : 'success.light', borderRadius: 1 }}>
                        <Typography variant="body1" fontWeight={otpResult.sms ? 600 : 400} color={otpResult.status === 'PENDING' ? 'warning.dark' : 'success.dark'}>
                          {otpResult.sms ? `💬 ${otpResult.sms}` : '⏳ Menunggu SMS masuk...'}
                        </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Response: {JSON.stringify(otpResult)}</Typography>
                  )}
                </Box>
              ) : null}
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          {selectedOrder && (!otpResult?.sms && selectedOrder?.status !== 'completed') ? (
            <Button 
              onClick={() => handleCancelOrder(selectedOrder.provider_order_id)} 
              color="error" 
              variant="text"
              disabled={otpChecking || selectedOrder?.status === 'canceled' || getCancelWaitTime(selectedOrder.created_at) !== 0}
            >
              {getCancelWaitTime(selectedOrder.created_at) !== 0 
                ? `Batalkan (${getCancelWaitTime(selectedOrder.created_at)})` 
                : 'Batalkan Pesanan'}
            </Button>
          ) : <Box />}
          <Box>
            <Button onClick={handleCloseDialog} color="inherit" sx={{ mr: 1 }}>Tutup</Button>
            {(!otpResult?.sms) && selectedOrder && (
              <Button 
                onClick={() => handleSetReady(selectedOrder.provider_order_id)} 
                variant="outlined" 
                color="info"
                disabled={otpChecking || selectedOrder?.status === 'canceled'}
                sx={{ mr: 1 }}
              >
                Set Ready
              </Button>
            )}
            {selectedOrder && (
              <Button 
                onClick={() => checkOtpSms(selectedOrder.provider_order_id)} 
                variant="contained" 
                color="primary"
                disabled={otpChecking || selectedOrder?.status === 'canceled'}
                startIcon={otpChecking && <IconRefresh className="spin-icon" />}
              >
                {otpChecking ? 'Mengecek...' : 'Refresh SMS'}
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      <style>
        {`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          .spin-icon { animation: spin 1s linear infinite; }
        `}
      </style>
    </PageContainer>
  );
};

export default CekOtp;
