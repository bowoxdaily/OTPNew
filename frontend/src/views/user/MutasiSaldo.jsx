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
  CircularProgress,
  Alert,
  Button,
  Stack,
  TablePagination
} from '@mui/material';
import { IconRefresh, IconArrowUpRight, IconArrowDownLeft } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

const MutasiSaldo = () => {
  const [mutations, setMutations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedMutations = mutations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
        <Typography variant="h3" fontWeight="700" mb={1} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Mutasi Saldo 💸</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Pantau riwayat penambahan dan pengurangan saldo Anda.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box p={{ xs: 2, sm: 3 }} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
          <Typography variant="h6" fontWeight={600}>Riwayat Transaksi</Typography>
          <Button 
            variant="outlined" 
            startIcon={loading ? <IconRefresh className="spin-icon" size={18} /> : <IconRefresh size={18} />} 
            onClick={fetchMutations}
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
                paginatedMutations.map((item) => (
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

        {/* Mobile View */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {loading && mutations.length === 0 ? (
            <Box textAlign="center" py={5}><CircularProgress /></Box>
          ) : mutations.length === 0 ? (
            <Box textAlign="center" py={5}><Typography color="text.secondary">Belum ada riwayat mutasi saldo.</Typography></Box>
          ) : (
            <Stack spacing={2} p={2} sx={{ bgcolor: 'grey.50' }}>
              {paginatedMutations.map((item) => (
                <Card key={item.id} variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.paper' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box display="flex" justifyContent="space-between" mb={1.5}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.created_at).toLocaleString('id-ID')}
                      </Typography>
                      {item.type === 'CREDIT' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main', gap: 0.5 }}>
                          <IconArrowUpRight size={14} />
                          <Typography variant="caption" fontWeight={700}>MASUK</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main', gap: 0.5 }}>
                          <IconArrowDownLeft size={14} />
                          <Typography variant="caption" fontWeight={700}>KELUAR</Typography>
                        </Box>
                      )}
                    </Box>
                    <Typography variant="body2" fontWeight={600} mb={0.5}>{item.description}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>Ref: {item.reference || '-'}</Typography>
                    
                    <Typography 
                      variant="h6" 
                      fontWeight={700}
                      color={item.type === 'CREDIT' ? 'success.main' : 'error.main'}
                      textAlign="right"
                    >
                      {item.type === 'CREDIT' ? '+' : '-'} Rp {Number(item.amount).toLocaleString('id-ID')}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>

        {mutations.length > 0 && (
          <TablePagination
            component="div"
            count={mutations.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Per halaman:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`}
          />
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

export default MutasiSaldo;
