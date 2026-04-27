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
  CircularProgress
} from '@mui/material';
import { IconCheck, IconX, IconRefresh } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

const AdminTopup = () => {
  const [pendingTopups, setPendingTopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // nyimpan ID topup yang sedang di-action

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
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h3" fontWeight="700" mb={1}>Konfirmasi Top Up 💸</Typography>
          <Typography variant="body1" color="text.secondary">
            Cek mutasi GoPay Anda, lalu setujui penambahan saldo reseller di sini.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          onClick={fetchPending}
          disabled={loading}
          startIcon={loading ? <IconRefresh className="spin-icon" /> : <IconRefresh />}
        >
          Refresh Data
        </Button>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Tanggal & Waktu</TableCell>
                  <TableCell>Reseller</TableCell>
                  <TableCell>Order ID</TableCell>
                  <TableCell align="right">Nominal Tagihan</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell>
                  </TableRow>
                ) : pendingTopups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">Tidak ada top up yang menunggu persetujuan.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingTopups.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2">{new Date(item.created_at).toLocaleString('id-ID')}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`@${item.users?.username || 'Unknown'}`} color="primary" variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace">{item.id}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight={700} color="error.main">
                          Rp {Number(item.amount).toLocaleString('id-ID')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button 
                            variant="contained" 
                            color="success" 
                            size="small"
                            onClick={() => handleAction(item.id, 'approve')}
                            disabled={actionLoading === item.id}
                            startIcon={<IconCheck size={16} />}
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
