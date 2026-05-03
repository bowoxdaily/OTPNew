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
  Alert,
  Stack,
  TablePagination
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedOrders = orders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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

  const hasValidSms = (result) => {
    if (!result || !result.sms) return false;
    const text = String(result.sms).trim().toLowerCase();
    // Jika provider merespon dengan text waiting, berarti SMS belum masuk
    if (text === 'waiting sms code' || text === 'waiting') return false;
    return true;
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
        setSelectedOrder(prev => ({ ...prev, status: 'waiting' }));
        fetchOrders(); // refresh table in background
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

  const handleResendOrder = async (orderId) => {
    setOtpChecking(true);
    setOtpError('');
    try {
      const res = await apiFetch(`/api/orders/${orderId}/resend`, { method: 'POST' });
      const data = await readJsonSafe(res);
      if (res.ok && data.success) {
        setOtpResult(data.data);
        if (data.data.sms) {
          alert('SMS berhasil diambil ulang!');
        } else {
          alert('SMS belum tersedia, silakan coba lagi nanti.');
        }
      } else {
        throw new Error(data.message || 'Gagal mengambil ulang SMS');
      }
    } catch (err) {
      setOtpError(err.message);
      alert(err.message);
    } finally {
      setOtpChecking(false);
    }
  };

  const handleReactiveOrder = async (orderId) => {
    if (!window.confirm('Aktifkan kembali nomor ini untuk menerima OTP baru? Saldo tidak akan dikenakan biaya tambahan.')) return;

    setOtpChecking(true);
    setOtpError('');
    try {
      const res = await apiFetch(`/api/orders/${orderId}/reactive`, { method: 'POST' });
      const data = await readJsonSafe(res);
      if (res.ok && data.success) {
        alert(data.message);
        setSelectedOrder(prev => ({ ...prev, status: 'waiting' }));
        fetchOrders();
        checkOtpSms(orderId);
      } else {
        throw new Error(data.message || 'Gagal mengaktifkan kembali nomor');
      }
    } catch (err) {
      setOtpError(err.message);
      alert(err.message);
    } finally {
      setOtpChecking(false);
    }
  };

  return (
    <PageContainer title="Cek OTP & Riwayat Order | OTP Reseller" description="Cek status pesanan nomor OTP dan lihat pesan masuk secara real-time. Pantau riwayat pembelian nomor virtual Anda.">
      <Box mb={4}>
        <Typography variant="h3" fontWeight="700" mb={1} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Riwayat & Cek OTP 📩</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Pantau status pesanan nomor Anda dan terima SMS (OTP) secara langsung di sini.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box p={{ xs: 2, sm: 3 }} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
          <Typography variant="h6" fontWeight={600}>Daftar Pesanan Terakhir</Typography>
          <Button 
            variant="outlined" 
            startIcon={loading ? <IconRefresh className="spin-icon" size={18} /> : <IconRefresh size={18} />} 
            onClick={fetchOrders}
            disabled={loading}
            size="small"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Refresh
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mx: 3, mb: 3 }}>{error}</Alert>}

        {/* Desktop View */}
        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
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
                paginatedOrders.map((item) => (
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

        {/* Mobile View */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {loading && orders.length === 0 ? (
            <Box textAlign="center" py={5}><CircularProgress /></Box>
          ) : orders.length === 0 ? (
            <Box textAlign="center" py={5}><Typography color="text.secondary">Belum ada pesanan nomor.</Typography></Box>
          ) : (
            <Stack spacing={2} p={2} sx={{ bgcolor: 'grey.50' }}>
              {paginatedOrders.map((item) => (
                <Card key={item.id} variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.paper' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.created_at).toLocaleString('id-ID')}
                      </Typography>
                      <Chip 
                        label={(item.status || '').toUpperCase()} 
                        size="small" 
                        color={item.status === 'completed' ? 'success' : item.status === 'canceled' ? 'error' : 'warning'} 
                        variant="outlined" 
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    </Box>
                    <Typography variant="body2" fontFamily="monospace" color="text.secondary" mb={1}>
                      ID: {item.provider_order_id}
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography variant="h6" fontWeight={700}>
                        +{item.number}
                        <IconButton size="small" onClick={() => copyToClipboard(item.number)} sx={{ ml: 0.5 }}>
                          <IconCopy size={16} />
                        </IconButton>
                      </Typography>
                      <Chip label={(item.layanan || '').toUpperCase()} size="small" color="primary" variant="outlined" />
                    </Box>
                    
                    {(item.status === 'pending' || item.status === 'waiting') && (
                      <Box mb={2}>
                        {!isOrderExpired(item.created_at) ? (
                          <Typography variant="caption" color="warning.main" fontWeight={600}>
                            Sisa Waktu: {getOrderRemainingTime(item.created_at)}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="error.main" fontWeight={600}>
                            Expired
                          </Typography>
                        )}
                      </Box>
                    )}

                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      startIcon={<IconMessage2 size={16} />}
                      onClick={() => handleOpenDialog(item)}
                      sx={{ borderRadius: 2 }}
                    >
                      Cek SMS
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
        
        {orders.length > 0 && (
          <TablePagination
            component="div"
            count={orders.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Per halaman:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`}
          />
        )}
      </Card>

      {/* Dialog Cek OTP */}
      <Dialog open={!!selectedOrder} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>Detail Order & SMS</Typography>
          <IconButton onClick={handleCloseDialog} size="small"><IconX /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
          {selectedOrder && (
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary">Order ID</Typography>
              <Typography variant="body1" fontWeight={500} mb={1} sx={{ wordBreak: 'break-all' }}>{selectedOrder.provider_order_id}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">Nomor Handphone</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main" mb={2} sx={{ wordBreak: 'break-all' }}>+{selectedOrder.number}</Typography>
            </Box>
          )}

          <Typography variant="subtitle2" color="text.secondary" mb={1}>Status SMS / Pesan Masuk</Typography>
          <Card variant="outlined" sx={{ bgcolor: 'grey.50', minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CardContent sx={{ width: '100%', textAlign: 'center' }}>
              {otpChecking ? (
                <Box>
                  <CircularProgress size={24} sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Mengecek Server...</Typography>
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
                  ) : hasValidSms(otpResult) ? (
                    <Box sx={{ p: 2, backgroundColor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="body1" fontWeight={600} color="success.dark">
                          💬 {otpResult.sms}
                        </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ p: 2, backgroundColor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="body1" fontWeight={600} color="warning.dark">
                          ⏳ Menunggu SMS masuk...
                        </Typography>
                    </Box>
                  )}
                </Box>
              ) : null}
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              • Jika OTP tidak muncul, Anda dapat mengklik tombol <strong>"Batalkan Pesanan"</strong> sebelum waktu habis. Saldo akan otomatis <strong>DIKEMBALIKAN</strong> ke saldo Anda.<br />
              • Jika sudah selesai, Anda cukup menekan tombol <strong>"Tutup"</strong> untuk menyelesaikannya.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2 }}>
          {selectedOrder && (!hasValidSms(otpResult) && selectedOrder?.status !== 'completed') ? (
            <Button 
              onClick={() => handleCancelOrder(selectedOrder.provider_order_id)} 
              color="error" 
              variant="text"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              disabled={otpChecking || selectedOrder?.status === 'canceled' || getCancelWaitTime(selectedOrder.created_at) !== 0}
            >
              {getCancelWaitTime(selectedOrder.created_at) !== 0 
                ? `Batalkan (${getCancelWaitTime(selectedOrder.created_at)})` 
                : 'Batalkan Pesanan'}
            </Button>
          ) : <Box sx={{ display: { xs: 'none', sm: 'block' } }} />}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            <Button onClick={handleCloseDialog} color="inherit" sx={{ width: { xs: '100%', sm: 'auto' } }}>Tutup</Button>
            {(!hasValidSms(otpResult)) && selectedOrder?.status === 'pending' && otpResult?.status !== 'READY' && otpResult?.status !== 'WAITING' && (
              <Button
                onClick={() => handleSetReady(selectedOrder.provider_order_id)}
                variant="outlined"
                color="info"
                disabled={otpChecking || selectedOrder?.status === 'canceled'}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Set Ready
              </Button>
            )}
            {hasValidSms(otpResult) && selectedOrder && selectedOrder.status !== 'canceled' && selectedOrder.status !== 'completed' && (
              <Button
                onClick={() => handleResendOrder(selectedOrder.provider_order_id)}
                variant="outlined"
                color="success"
                disabled={otpChecking}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Ambil Ulang SMS
              </Button>
            )}
            {selectedOrder?.status === 'completed' && (
              <Button
                onClick={() => handleReactiveOrder(selectedOrder.provider_order_id)}
                variant="outlined"
                color="warning"
                disabled={otpChecking}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Aktifkan Kembali
              </Button>
            )}
            {selectedOrder && (
              <Button
                onClick={() => checkOtpSms(selectedOrder.provider_order_id)}
                variant="contained"
                color="primary"
                disabled={otpChecking || selectedOrder?.status === 'canceled'}
                startIcon={otpChecking && <IconRefresh className="spin-icon" />}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
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
