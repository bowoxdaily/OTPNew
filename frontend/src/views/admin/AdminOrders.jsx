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
  Chip,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { IconRefresh } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/admin/orders');
      const data = await readJsonSafe(res);
      if (res.ok && data.success) {
        setOrders(data.data);
      } else {
        throw new Error(data.message || 'Gagal mengambil riwayat order admin');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Manajemen Order" description="Daftar semua pesanan pengguna">
      <Box mb={4}>
        <Typography variant="h3" fontWeight="700" mb={1}>Riwayat Order (Admin) 📋</Typography>
        <Typography variant="body1" color="text.secondary">
          Pantau seluruh pesanan OTP dari semua pengguna.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Box p={3} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>Semua Pesanan</Typography>
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
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Tanggal & Waktu</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>User</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Order ID</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Layanan / Negara</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Nomor HP</Typography></TableCell>
                <TableCell align="right"><Typography variant="subtitle2" fontWeight={600}>Harga Jual (Rp)</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle2" fontWeight={600}>Status</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">Belum ada pesanan.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2">{new Date(item.created_at).toLocaleString('id-ID')}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary.main">@{item.users?.username || item.user_id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">{item.provider_order_id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{(item.layanan || '').toUpperCase()}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.negara}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight={600}>+{item.number}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>Rp {Number(item.price || 0).toLocaleString('id-ID')}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={(item.status || '').toUpperCase()} 
                        size="small" 
                        color={item.status === 'completed' ? 'success' : item.status === 'canceled' ? 'error' : 'warning'} 
                        variant="outlined" 
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <style>
        {`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          .spin-icon { animation: spin 1s linear infinite; }
        `}
      </style>
    </PageContainer>
  );
};

export default AdminOrders;
