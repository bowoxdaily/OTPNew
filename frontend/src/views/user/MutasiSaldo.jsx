import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { IconRefresh, IconArrowUpRight, IconArrowDownLeft } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

const MutasiSaldo = () => {
  const [mutations, setMutations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMutations();
  }, []);

  const fetchMutations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/mutations');
      const data = await readJsonSafe(res);
      if (res.ok && data.success) {
        setMutations(data.data);
      } else {
        throw new Error(data.message || 'Gagal mengambil mutasi saldo');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Mutasi Saldo" description="Riwayat transaksi dan mutasi saldo akun Anda">
      <Box mb={4}>
        <Typography variant="h3" fontWeight="700" mb={1}>Mutasi Saldo 💸</Typography>
        <Typography variant="body1" color="text.secondary">
          Pantau riwayat penambahan dan pengurangan saldo Anda.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Box p={3} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>Riwayat Transaksi</Typography>
          <Button 
            variant="outlined" 
            startIcon={loading ? <IconRefresh className="spin-icon" size={18} /> : <IconRefresh size={18} />} 
            onClick={fetchMutations}
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
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Jenis Mutasi</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Keterangan</Typography></TableCell>
                <TableCell align="right"><Typography variant="subtitle2" fontWeight={600}>Nominal</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && mutations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : mutations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">Belum ada riwayat mutasi saldo.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                mutations.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2">{new Date(item.created_at).toLocaleString('id-ID')}</Typography>
                    </TableCell>
                    <TableCell>
                      {item.type === 'CREDIT' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main', gap: 1 }}>
                          <IconArrowUpRight size={18} />
                          <Typography variant="body2" fontWeight={600}>UANG MASUK</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main', gap: 1 }}>
                          <IconArrowDownLeft size={18} />
                          <Typography variant="body2" fontWeight={600}>UANG KELUAR</Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{item.description}</Typography>
                      <Typography variant="caption" color="text.secondary">Ref: {item.reference || '-'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body1" 
                        fontWeight={700}
                        color={item.type === 'CREDIT' ? 'success.main' : 'error.main'}
                      >
                        {item.type === 'CREDIT' ? '+' : '-'} Rp {Number(item.amount).toLocaleString('id-ID')}
                      </Typography>
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

export default MutasiSaldo;
