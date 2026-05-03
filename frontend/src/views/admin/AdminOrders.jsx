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
  Button,
  useMediaQuery,
  Stack,
  Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconRefresh } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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
      <Box mb={{ xs: 2, sm: 3, md: 4 }}>
        <Typography variant="h3" fontWeight="700" mb={1} sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          Riwayat Order (Admin) 📋
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Pantau seluruh pesanan OTP dari semua pengguna.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: { xs: 2, sm: 3 } }}>
        <Box p={{ xs: 2, sm: 3 }} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Semua Pesanan</Typography>
          <Button 
            variant="outlined" 
            startIcon={loading ? <IconRefresh className="spin-icon" size={isMobile ? 16 : 18} /> : <IconRefresh size={isMobile ? 16 : 18} />} 
            onClick={fetchOrders}
            disabled={loading}
            size="small"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Refresh
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mx: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{error}</Alert>}

        {/* Mobile View - Card List */}
        {isMobile ? (
          <Box px={2} pb={2}>
            {loading && orders.length === 0 ? (
              <Box py={4} textAlign="center"><CircularProgress size={32} /></Box>
            ) : orders.length === 0 ? (
              <Box py={4} textAlign="center">
                <Typography color="text.secondary" fontSize="0.875rem">Belum ada pesanan.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {orders.map((item) => (
                  <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="caption" color="text.secondary">
                          {new Date(item.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        <Chip 
                          label={(item.status || '').toUpperCase()} 
                          size="small" 
                          color={item.status === 'completed' ? 'success' : item.status === 'canceled' ? 'error' : 'warning'} 
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight={600} color="primary.main">@{item.users?.username || item.user_id}</Typography>
                      <Typography variant="body2" fontWeight={600} fontSize="0.8rem">{(item.layanan || '').toUpperCase()}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.negara}</Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center" pt={0.5}>
                        <Typography variant="body1" fontWeight={600} fontSize="0.875rem">+{item.number}</Typography>
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          Rp {Number(item.price || 0).toLocaleString('id-ID')}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>
        ) : (
          /* Desktop/Tablet View - Table */
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size={isTablet ? 'small' : 'medium'} sx={{ minWidth: { sm: 600, md: 800 } }}>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ py: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>Tanggal</Typography>
                  </TableCell>
                  <TableCell sx={{ py: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>User</Typography>
                  </TableCell>
                  <TableCell sx={{ py: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>Order ID</Typography>
                  </TableCell>
                  <TableCell sx={{ py: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>Layanan</Typography>
                  </TableCell>
                  <TableCell sx={{ py: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>Nomor HP</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>Harga</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ py: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>Status</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: { xs: 3, sm: 5 } }}>
                      <CircularProgress size={isTablet ? 32 : 40} />
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: { xs: 3, sm: 5 } }}>
                      <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Belum ada pesanan.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          {new Date(item.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                        <Typography variant="body2" fontWeight={600} color="primary.main" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>@{item.users?.username || item.user_id}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                        <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>{item.provider_order_id}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>{(item.layanan || '').toUpperCase()}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.75rem' } }}>{item.negara}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                        <Typography variant="body1" fontWeight={600} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}>+{item.number}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>Rp {Number(item.price || 0).toLocaleString('id-ID')}</Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                        <Chip 
                          label={(item.status || '').toUpperCase()} 
                          size="small" 
                          color={item.status === 'completed' ? 'success' : item.status === 'canceled' ? 'error' : 'warning'} 
                          variant="outlined"
                          sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
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
