import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Box, Typography, Button, Snackbar, Alert } from '@mui/material';
import { IconCheck } from '@tabler/icons-react';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

const GlobalTopupListener = () => {
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const pendingIdsRef = useRef(new Set());

  useEffect(() => {
    const checkTopups = async () => {
      try {
        const res = await apiFetch('/api/topup');
        const data = await readJsonSafe(res);
        if (!res.ok || !data.success || !Array.isArray(data.data)) return;

        const currentPendingIds = new Set();
        let newlySucceeded = null;
        let newlyFailed = false;

        data.data.forEach(item => {
          if (item.status === 'pending') {
            currentPendingIds.add(item.id);
          } else if (item.status === 'success' && pendingIdsRef.current.has(item.id)) {
            newlySucceeded = item;
          } else if (item.status === 'failed' && pendingIdsRef.current.has(item.id)) {
             newlyFailed = true;
          }
        });

        if (newlySucceeded) {
          setSuccessAmount(newlySucceeded.amount);
          setSuccessDialogOpen(true);
        } else if (newlyFailed) {
          setSnackbar({ open: true, message: 'Tagihan Top Up Anda gagal atau kadaluarsa.', severity: 'error' });
        }

        // Update tracking reference
        pendingIdsRef.current = currentPendingIds;

      } catch (err) {
        // Silent error
      }
    };

    // Initialize tracking
    checkTopups();

    // Poll every 5 seconds
    const intervalId = setInterval(checkTopups, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <Dialog open={successDialogOpen} onClose={() => setSuccessDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box textAlign="center" p={4}>
          <Box 
            sx={{ 
              width: 80, height: 80, borderRadius: '50%', 
              bgcolor: 'success.light', color: 'success.main', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2
            }}
          >
            <IconCheck size={48} stroke={3} />
          </Box>
          <Typography variant="h4" fontWeight={800} mb={1}>Top Up Berhasil!</Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Pembayaran Anda sebesar <Typography component="span" fontWeight={700} color="primary">Rp {Number(successAmount).toLocaleString('id-ID')}</Typography> telah berhasil dikonfirmasi. Saldo akun Anda sudah bertambah.
          </Typography>
          <Button variant="contained" color="success" size="large" fullWidth onClick={() => setSuccessDialogOpen(false)} sx={{ borderRadius: 2 }}>
            Selesai
          </Button>
        </Box>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ zIndex: 9999 }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GlobalTopupListener;
