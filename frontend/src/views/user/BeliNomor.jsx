import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Stack,
  Alert,
  InputAdornment,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination
} from '@mui/material';
import {
  IconSearch,
  IconShoppingCart,
  IconBrandWhatsapp,
  IconBrandTelegram,
  IconBrandGoogle,
  IconDeviceMobile,
  IconPlus,
  IconMinus,
  IconX,
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';
import { getUserSession } from 'src/utils/authSession';
import { useNavigate } from 'react-router-dom';

const getServiceIcon = (serviceCode) => {
  const code = serviceCode.toLowerCase();
  if (code.includes('wa') || code.includes('whatsapp')) return <IconBrandWhatsapp size={24} color="#25D366" />;
  if (code.includes('tele')) return <IconBrandTelegram size={24} color="#0088cc" />;
  if (code.includes('google')) return <IconBrandGoogle size={24} color="#DB4437" />;
  return <IconDeviceMobile size={24} color="#757575" />;
};

const BeliNomor = () => {
  const session = getUserSession();
  const navigate = useNavigate();

  const [negaraOptions, setNegaraOptions] = useState([{ id: 7, name: 'Indonesia' }]);
  const [selectedNegara, setSelectedNegara] = useState(7);
  
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [orderLoading, setOrderLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalService, setModalService] = useState(null); // the service item user clicked
  const [modalOperator, setModalOperator] = useState('any');
  const [modalSelectedVariant, setModalSelectedVariant] = useState(null); // selected price variant
  const [modalQty, setModalQty] = useState(1);

  // Fetch Negara
  useEffect(() => {
    async function fetchNegara() {
      try {
        const res = await apiFetch('/api/catalog/negara');
        const data = await readJsonSafe(res);
        if (data.success && data.data) {
          setNegaraOptions(data.data);
        }
      } catch (err) {
        console.error('Failed to load negara:', err);
      }
    }
    fetchNegara();
  }, []);

  // Fetch Catalog when Negara changes
  useEffect(() => {
    async function fetchCatalog() {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch(`/api/catalog/layanan?negara=${selectedNegara}`);
        const data = await readJsonSafe(res);
        if (res.ok && data.success) {
          setCatalog(data.data);
        } else {
          throw new Error(data.message || 'Gagal memuat katalog layanan');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, [selectedNegara]);

  const filteredCatalog = catalog.filter(item => 
    item.layanan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset page when search or filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedNegara]);

  const paginatedCatalog = filteredCatalog.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Open modal when user clicks "Beli" on a service
  const openOrderModal = (service) => {
    setModalService(service);
    setModalOperator('any');
    setModalQty(1);
    // Auto-select the first (cheapest) variant, or the main code if no variants
    if (service.variants && service.variants.length > 0) {
      setModalSelectedVariant(service.variants[0]);
    } else {
      setModalSelectedVariant({ 
        code: service.code, 
        harga: service.harga, 
        harga_provider: service.harga_provider,
        stok: service.stok 
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalService(null);
    setModalSelectedVariant(null);
  };

  const handleConfirmOrder = async () => {
    if (!modalService || !modalSelectedVariant) return;

    const serviceCode = modalSelectedVariant.code;
    const serviceName = modalService.layanan;
    const qty = modalQty;

    setOrderLoading(true);
    setOrderMessage(null);

    let successCount = 0;
    let failCount = 0;
    let lastError = '';

    for (let i = 0; i < qty; i++) {
      try {
        const payload = {
          user_id: session?.userId || 'user_1',
          negara: selectedNegara,
          layanan: serviceCode,
          operator: modalOperator,
        };

        const res = await apiFetch('/api/orders', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const data = await readJsonSafe(res);
        
        if (res.ok && data.success) {
          successCount++;
        } else {
          failCount++;
          lastError = data.message || 'Gagal membuat order';
        }
      } catch (err) {
        failCount++;
        lastError = err.message;
      }
    }

    setOrderLoading(false);
    closeModal();

    if (successCount > 0) {
      setOrderMessage({ type: 'success', text: `Berhasil memesan ${successCount} nomor ${serviceName}. ${failCount > 0 ? `(${failCount} gagal)` : ''}` });
      setTimeout(() => navigate('/dashboard/user'), 2000);
    } else {
      setOrderMessage({ type: 'error', text: `Gagal memesan nomor. ${lastError}` });
    }
  };

  // Get all price options for current modal service
  const getVariantsForModal = () => {
    if (!modalService) return [];
    if (modalService.variants && modalService.variants.length > 0) {
      return modalService.variants;
    }
    // Single option
    return [{ 
      code: modalService.code, 
      harga: modalService.harga, 
      harga_provider: modalService.harga_provider,
      stok: modalService.stok 
    }];
  };

  return (
    <PageContainer title="Beli Nomor Lanjutan" description="Katalog lengkap pembelian nomor OTP">
      <Box mb={4}>
        <Typography variant="h3" fontWeight="700" mb={1} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Katalog Layanan Lengkap 🛒</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Cari layanan yang Anda butuhkan, filter berdasarkan negara, dan pesan sekaligus.
        </Typography>
      </Box>

      {orderMessage && (
        <Alert severity={orderMessage.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setOrderMessage(null)}>
          {orderMessage.text}
          {orderMessage.type === 'success' && <Typography variant="body2" mt={1}>Mengalihkan ke Dashboard dalam 2 detik...</Typography>}
        </Alert>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Pilih Negara"
            value={selectedNegara}
            onChange={(e) => setSelectedNegara(e.target.value)}
            sx={{ backgroundColor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          >
            {negaraOptions.map(n => (
              <MenuItem key={n.id} value={n.id}>{n.name.charAt(0).toUpperCase() + n.name.slice(1)}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Cari Layanan (contoh: WhatsApp, Netflix)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={20} />
                </InputAdornment>
              ),
            }}
            sx={{ backgroundColor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        {error && <Alert severity="warning" sx={{ m: 2 }}>{error}</Alert>}
        
        {/* Desktop View */}
        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell><Typography variant="subtitle2" fontWeight={600}>Layanan</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle2" fontWeight={600}>Stok</Typography></TableCell>
                <TableCell align="right"><Typography variant="subtitle2" fontWeight={600}>Mulai Dari</Typography></TableCell>
                <TableCell align="right"><Typography variant="subtitle2" fontWeight={600}>Aksi</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                    <Typography mt={2}>Memuat katalog layanan dari upstream...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredCatalog.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">Layanan tidak ditemukan.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCatalog.map((item) => {
                  const isAvailable = item.stok > 0 || item.stok === undefined || item.stok === null;
                  const hasVariants = item.variants && item.variants.length > 1;
                  
                  return (
                    <TableRow key={item.code} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          {getServiceIcon(item.code)}
                          <Box>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body1" fontWeight={600}>
                                {item.layanan.charAt(0).toUpperCase() + item.layanan.slice(1)}
                              </Typography>
                              {hasVariants && (
                                <Chip 
                                  label={`${item.variants.length} harga`}
                                  size="small"
                                  color="secondary"
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                  }}
                                />
                              )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary">Kode: {item.code.toUpperCase()}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color={isAvailable ? 'success.main' : 'error.main'} fontWeight={500}>
                          {item.stok > 0 ? `${item.stok} pcs` : (item.stok === 0 ? 'Habis' : 'Tersedia')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight={700} color="primary.main">
                          Rp {Number(item.harga).toLocaleString('id-ID')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          variant="contained" 
                          color="primary" 
                          size="small"
                          disabled={!isAvailable || orderLoading}
                          onClick={() => openOrderModal(item)}
                          startIcon={<IconShoppingCart size={16} />}
                          sx={{ borderRadius: 2 }}
                        >
                          Beli
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile View */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {loading ? (
            <Box textAlign="center" py={5}>
              <CircularProgress />
              <Typography mt={2}>Memuat katalog layanan dari upstream...</Typography>
            </Box>
          ) : filteredCatalog.length === 0 ? (
            <Box textAlign="center" py={5}>
              <Typography color="text.secondary">Layanan tidak ditemukan.</Typography>
            </Box>
          ) : (
            <Stack spacing={2} p={2} sx={{ bgcolor: 'grey.50' }}>
              {paginatedCatalog.map((item) => {
                const isAvailable = item.stok > 0 || item.stok === undefined || item.stok === null;
                const hasVariants = item.variants && item.variants.length > 1;

                return (
                  <Card key={item.code} variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.paper' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          {getServiceIcon(item.code)}
                          <Box>
                            <Typography variant="body1" fontWeight={600} sx={{ lineHeight: 1.2, mb: 0.5 }}>
                              {item.layanan.charAt(0).toUpperCase() + item.layanan.slice(1)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Kode: {item.code.toUpperCase()}
                            </Typography>
                          </Box>
                        </Stack>
                        {hasVariants && (
                          <Chip 
                            label={`${item.variants.length} harga`}
                            size="small"
                            color="secondary"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                          />
                        )}
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="caption" color={isAvailable ? 'success.main' : 'error.main'} fontWeight={500}>
                          {item.stok > 0 ? `${item.stok} pcs` : (item.stok === 0 ? 'Habis' : 'Tersedia')}
                        </Typography>
                        <Typography variant="body1" fontWeight={700} color="primary.main">
                          Rp {Number(item.harga).toLocaleString('id-ID')}
                        </Typography>
                      </Box>

                      <Button 
                        variant="contained" 
                        color="primary" 
                        fullWidth
                        disabled={!isAvailable || orderLoading}
                        onClick={() => openOrderModal(item)}
                        startIcon={<IconShoppingCart size={16} />}
                        sx={{ borderRadius: 2 }}
                      >
                        Beli Layanan
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Box>

        {filteredCatalog.length > 0 && (
          <TablePagination
            component="div"
            count={filteredCatalog.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Per halaman:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`}
          />
        )}
      </Card>

      {/* ============ CONFIRM ORDER MODAL ============ */}
      <Dialog 
        open={modalOpen} 
        onClose={closeModal} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Confirm Order</Typography>
            {modalService && (
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {modalService.layanan.charAt(0).toUpperCase() + modalService.layanan.slice(1)}
              </Typography>
            )}
          </Box>
          <IconButton onClick={closeModal} size="small">
            <IconX size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {/* Operator Selection */}
          <Typography variant="subtitle2" fontWeight={600} mb={1}>Operator</Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={modalOperator}
            onChange={(e) => setModalOperator(e.target.value)}
            sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          >
            <MenuItem value="any">Random (Otomatis)</MenuItem>
            <MenuItem value="telkomsel">Telkomsel</MenuItem>
            <MenuItem value="xl">XL / Axis</MenuItem>
            <MenuItem value="indosat">Indosat</MenuItem>
            <MenuItem value="three">Three (Tri)</MenuItem>
          </TextField>

          {/* Price Options */}
          <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Price</Typography>
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 1.5, 
              flexWrap: 'wrap',
              pb: 1,
              mb: 2,
            }}
          >
            {getVariantsForModal().map((variant, idx) => {
              const isSelected = modalSelectedVariant?.code === variant.code;
              const vIsAvailable = variant.stok > 0 || variant.stok === undefined || variant.stok === null;
              
              return (
                <Button
                  key={variant.code}
                  variant={isSelected ? 'contained' : 'outlined'}
                  color={isSelected ? 'primary' : 'inherit'}
                  disabled={!vIsAvailable}
                  onClick={() => setModalSelectedVariant(variant)}
                  sx={{
                    borderRadius: 2,
                    px: 2.5,
                    py: 1.2,
                    minWidth: 'auto',
                    textTransform: 'none',
                    flexShrink: 0,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'primary.main' : 'transparent',
                    color: isSelected ? '#fff' : 'text.primary',
                    boxShadow: isSelected ? 3 : 0,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                      boxShadow: isSelected ? 4 : 1,
                    },
                  }}
                >
                  <Stack alignItems="center" spacing={0.3}>
                    <Typography variant="body2" fontWeight={700} sx={{ color: 'inherit' }}>
                      Rp {Number(variant.harga).toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isSelected ? 'rgba(255,255,255,0.85)' : 'text.secondary', fontSize: '0.65rem' }}>
                      {variant.stok > 0 ? `${variant.stok} pcs` : 'Tersedia'} • ID: {String(variant.code).toUpperCase()}
                    </Typography>
                  </Stack>
                </Button>
              );
            })}
          </Box>

          {/* Quantity */}
          <Typography variant="subtitle2" fontWeight={600} mb={1}>Jumlah</Typography>
          <Stack direction="row" alignItems="center" spacing={2} mb={1}>
            <IconButton 
              size="small" 
              onClick={() => setModalQty(Math.max(1, modalQty - 1))} 
              disabled={modalQty <= 1}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
            >
              <IconMinus size={16} />
            </IconButton>
            <Typography variant="h6" fontWeight={700} sx={{ width: 40, textAlign: 'center' }}>
              {modalQty}
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => setModalQty(Math.min(10, modalQty + 1))} 
              disabled={modalQty >= 10}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
            >
              <IconPlus size={16} />
            </IconButton>
          </Stack>

          {/* Total estimate */}
          {modalSelectedVariant && (
            <Box 
              sx={{ 
                mt: 2, p: 2, borderRadius: 2, 
                bgcolor: 'primary.50', 
                border: '1px dashed', 
                borderColor: 'primary.200' 
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Estimasi Total</Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  Rp {(Number(modalSelectedVariant.harga) * modalQty).toLocaleString('id-ID')}
                </Typography>
              </Stack>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, pt: 1, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <Button onClick={closeModal} color="inherit" sx={{ borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            disabled={!modalSelectedVariant || orderLoading}
            onClick={handleConfirmOrder}
            startIcon={orderLoading ? <CircularProgress size={16} color="inherit" /> : <IconShoppingCart size={18} />}
            sx={{ borderRadius: 2, px: 4, width: { xs: '100%', sm: 'auto' } }}
          >
            {orderLoading ? 'Memproses...' : 'Confirm Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default BeliNomor;
