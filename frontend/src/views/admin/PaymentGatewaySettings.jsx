import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { IconDeviceFloppy, IconRefresh } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

const defaultForm = {
  mode: 'sandbox',
  api_key: '',
  private_key: '',
  merchant_code: '',
  callback_url: '',
  is_enabled: false,
};

export default function PaymentGatewaySettings() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await apiFetch('/api/admin/payment-gateway');
      const data = await readJsonSafe(res);
      if (res.ok && data.success && data.data) {
        setForm({ ...defaultForm, ...data.data });
      } else {
        throw new Error(data.message || 'Gagal memuat setting gateway');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await apiFetch('/api/admin/payment-gateway', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await readJsonSafe(res);
      if (res.ok && data.success) {
        setMessage('Pengaturan Tripay berhasil disimpan');
      } else {
        throw new Error(data.message || 'Gagal menyimpan setting');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="Pengaturan Payment Gateway" description="Konfigurasi Tripay tanpa hardcode">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Pengaturan Payment Gateway</Typography>
            <Typography variant="body2" color="text.secondary">Set API key Tripay dari panel admin.</Typography>
          </Box>
          <Button variant="outlined" onClick={fetchSettings} disabled={loading || saving} startIcon={<IconRefresh size={16} />}>
            Refresh
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Mode"
                  value={form.mode}
                  onChange={(e) => setForm((prev) => ({ ...prev, mode: e.target.value }))}
                  disabled={loading || saving}
                >
                  <MenuItem value="sandbox">Sandbox</MenuItem>
                  <MenuItem value="production">Production</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={8}>
                <FormControlLabel
                  control={(
                    <Switch
                      checked={Boolean(form.is_enabled)}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_enabled: e.target.checked }))}
                      disabled={loading || saving}
                    />
                  )}
                  label="Aktifkan Tripay"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="API Key"
                  value={form.api_key}
                  onChange={(e) => setForm((prev) => ({ ...prev, api_key: e.target.value }))}
                  disabled={loading || saving}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Private Key"
                  value={form.private_key}
                  onChange={(e) => setForm((prev) => ({ ...prev, private_key: e.target.value }))}
                  disabled={loading || saving}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Merchant Code"
                  value={form.merchant_code}
                  onChange={(e) => setForm((prev) => ({ ...prev, merchant_code: e.target.value }))}
                  disabled={loading || saving}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Callback URL (opsional)"
                  value={form.callback_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, callback_url: e.target.value }))}
                  disabled={loading || saving}
                  placeholder="https://domainanda.com/webhooks/tripay"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={saveSettings}
                  disabled={loading || saving}
                  startIcon={<IconDeviceFloppy size={16} />}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
