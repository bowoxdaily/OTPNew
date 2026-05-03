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
  Stack,
  Alert,
  CircularProgress,
  useMediaQuery,
  Paper,
  useTheme,
} from '@mui/material';
import { IconCheck, IconX, IconRefresh } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

const AdminTopup = () => {
  const [pendingTopups, setPendingTopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const fetchPending = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/admin/topup/pending');
      const data = await readJsonSafe(res);
      if (res.ok && data.success) {
        setPendingTopups(data.data);
      } else {
        throw new Error(data.message || 'Gagal mengambil data topup pending');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id, action) => {
    if (!window.confirm(`Yakin ingin ${action === 'approve' ? 'MENYETUJUI' : 'MENOLAK'} topup ini?`)) return;
    
    setActionLoading(id);
    try {
      const res = await apiFetch(`/api/admin/topup/${id}/${action}`, { method: 'POST' });
      const data = await readJsonSafe(res);
      if (res.ok && data.success) {
        alert(data.message);
        fetchPending();
      } else {
        throw new Error(data.message || `Gagal melakukan ${action}`);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PageContainer title="Persetujuan Top Up Saldo" description="Panel konfirmasi topup saldo reseller">
      <Box mb={{ xs: 2, sm: 3, md: 4 }} display="flex" justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} flexDirection={{ xs: 'column', sm: 'row' }} gap={{ xs: 1.5, sm: 0 }}>
        <Box>
          <Typography variant="h3" fontWeight="700" mb={1} sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
            Konfirmasi Top Up 💸
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Cek mutasi GoPay Anda, lalu setujui penambahan saldo reseller di sini.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          onClick={fetchPending}
          disabled={loading}
          startIcon={loading ? <IconRefresh className="spin-icon" size={isMobile ? 16 : 18} /> : <IconRefresh size={isMobile ? 16 : 18} />}
          size={isMobile ? 'small' : 'medium'}
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          Refresh Data
        </Button>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
          {error && <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{error}</Alert>}
          
          {isMobile ? (
            /* Mobile View - Card List */
            <Stack spacing={1.5}>
              {loading ? (
                <Box py={4} textAlign="center"><CircularProgress size={32} /></Box>
              ) : pendingTopups.length === 0 ? (
                <Box py={4} textAlign="center">
                  <Typography color="text.secondary" fontSize="0.875rem">Tidak ada top up yang menunggu persetujuan.</Typography>
                </Box>
              ) : (
                pendingTopups.map((item) => (
                  <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="caption" color="text.secondary">
                          {new Date(item.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        <Chip label={`@${item.users?.username || 'Unknown'}`} color="primary" variant="outlined" size="small" sx={{ fontSize: '0.7rem', height: 22 }} />
                      </Box>
                      <Typography variant="caption" fontFamily="monospace" color="text.secondary" fontSize="0.65rem">ID: {item.id}</Typography>
                      <Typography variant="body1" fontWeight={700} color="error.main" fontSize="0.875rem">
                        Rp {Number(item.amount).toLocaleString('id-ID')}
                      </Typography>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button 
                          variant="contained" 
                          color="success" 
                          size="small"
                          onClick={() => handleAction(item.id, 'approve')}
                          disabled={actionLoading === item.id}
                          startIcon={<IconCheck size={14} />}
                          sx={{ fontSize: '0.7rem', py: 0.5 }}
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          size="small"
                          onClick={() => handleAction(item.id, 'reject')}
                          disabled={actionLoading === item.id}
                          startIcon={<IconX size={14} />}
                          sx={{ fontSize: '0.7rem', py: 0.5 }}
                        >
                          Tolak
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          ) : (
            /* Desktop/Tablet View - Table */
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size={isTablet ? 'small' : 'medium'}>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ py: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>Tanggal</Typography>
                    </TableCell>
                    <TableCell sx={{ py: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>Reseller</Typography>
                    </TableCell>
                    <TableCell sx={{ py: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>Order ID</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>Nominal</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>Aksi</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: { xs: 3, sm: 5 } }}>
                        <CircularProgress size={isTablet ? 32 : 40} />
                      </TableCell>
                    </TableRow>
                  ) : pendingTopups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: { xs: 3, sm: 5 } }}>
                        <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Tidak ada top up yang menunggu persetujuan.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingTopups.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {new Date(item.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: { xs: 0.75, sm: 1 } }}>
                          <Chip label={`@${item.users?.username || 'Unknown'}`} color="primary" variant="outlined" size="small" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }} />
                        </TableCell>
                        <TableCell sx={{ py: { xs: 0.75, sm: 1 } }}>
                          <Typography variant="caption" fontFamily="monospace" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>{item.id}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: { xs: 0.75, sm: 1 } }}>
                          <Typography variant="body1" fontWeight={700} color="error.main" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}>
                            Rp {Number(item.amount).toLocaleString('id-ID')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: { xs: 0.75, sm: 1 } }}>
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button 
                              variant="contained" 
                              color="success" 
                              size="small"
                              onClick={() => handleAction(item.id, 'approve')}
                              disabled={actionLoading === item.id}
                              startIcon={<IconCheck size={16} />}
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="outlined" 
                              color="error" 
                              size="small"
                              onClick={() => handleAction(item.id, 'reject')}
                              disabled={actionLoading === item.id}
                              startIcon={<IconX size={16} />}
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            >
                              Tolak
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
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

export default AdminTopup;
