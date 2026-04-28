import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Alert,
    Stack,
    InputAdornment,
    IconButton,
    CircularProgress,
    LinearProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { IconUser, IconLock, IconEye, IconEyeOff, IconId, IconMail, IconPhone } from '@tabler/icons-react';

import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

/**
 * Simple password strength meter
 */
function getPasswordStrength(password) {
    if (!password) return { score: 0, label: '', color: 'grey.300' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 20, label: 'Sangat Lemah', color: '#f44336' };
    if (score === 2) return { score: 40, label: 'Lemah', color: '#ff9800' };
    if (score === 3) return { score: 60, label: 'Cukup', color: '#ffc107' };
    if (score === 4) return { score: 80, label: 'Kuat', color: '#4caf50' };
    return { score: 100, label: 'Sangat Kuat', color: '#2e7d32' };
}

const AuthRegister = ({ title, subtitle, subtext }) => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const strength = getPasswordStrength(password);

    async function handleRegister(event) {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!name.trim()) {
            setError('Nama lengkap tidak boleh kosong');
            return;
        }
        if (!email.trim()) {
            setError('Email tidak boleh kosong');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Format email tidak valid');
            return;
        }
        if (!phone.trim()) {
            setError('Nomor HP tidak boleh kosong');
            return;
        }
        const digitsOnly = phone.replace(/[^0-9]/g, '');
        if (digitsOnly.length < 10 || digitsOnly.length > 15) {
            setError('Nomor HP tidak valid (10-15 digit)');
            return;
        }
        if (!username.trim()) {
            setError('Username tidak boleh kosong');
            return;
        }
        if (username.trim().length < 3) {
            setError('Username minimal 3 karakter');
            return;
        }
        if (!password) {
            setError('Password tidak boleh kosong');
            return;
        }
        if (password.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        setLoading(true);
        try {
            const response = await apiFetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    username: username.trim(),
                    password,
                }),
            });
            const data = await readJsonSafe(response);
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Register gagal');
            }
            setSuccess('Akun berhasil dibuat! Mengalihkan ke halaman login...');
            setTimeout(() => navigate('/auth/login'), 1500);
        } catch (registerError) {
            setError(registerError.message || 'Pendaftaran gagal. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleRegister}>
            {title && (
                <Typography fontWeight="700" variant="h2" mb={1}>
                    {title}
                </Typography>
            )}

            {subtext}

            <Stack spacing={2.5}>
                {/* Name Field */}
                <Box>
                    <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        component="label"
                        htmlFor="register-name"
                        mb="6px"
                        display="block"
                        color="text.primary"
                    >
                        Nama Lengkap
                    </Typography>
                    <CustomTextField
                        id="register-name"
                        placeholder="Contoh: Budi Santoso"
                        variant="outlined"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconId size={20} color="#888" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                transition: 'all 0.2s ease',
                                '&:hover': { backgroundColor: 'action.hover' },
                            },
                        }}
                    />
                </Box>

                {/* Email Field */}
                <Box>
                    <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        component="label"
                        htmlFor="register-email"
                        mb="6px"
                        display="block"
                        color="text.primary"
                    >
                        Email
                    </Typography>
                    <CustomTextField
                        id="register-email"
                        placeholder="contoh@email.com"
                        variant="outlined"
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        type="email"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconMail size={20} color="#888" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                transition: 'all 0.2s ease',
                                '&:hover': { backgroundColor: 'action.hover' },
                            },
                        }}
                    />
                </Box>

                {/* Phone Field */}
                <Box>
                    <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        component="label"
                        htmlFor="register-phone"
                        mb="6px"
                        display="block"
                        color="text.primary"
                    >
                        Nomor HP
                    </Typography>
                    <CustomTextField
                        id="register-phone"
                        placeholder="08xxxxxxxxxx"
                        variant="outlined"
                        fullWidth
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        type="tel"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconPhone size={20} color="#888" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                transition: 'all 0.2s ease',
                                '&:hover': { backgroundColor: 'action.hover' },
                            },
                        }}
                    />
                </Box>

                {/* Username Field */}
                <Box>
                    <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        component="label"
                        htmlFor="register-username"
                        mb="6px"
                        display="block"
                        color="text.primary"
                    >
                        Username
                    </Typography>
                    <CustomTextField
                        id="register-username"
                        placeholder="Pilih username unik Anda"
                        variant="outlined"
                        fullWidth
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconUser size={20} color="#888" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                transition: 'all 0.2s ease',
                                '&:hover': { backgroundColor: 'action.hover' },
                            },
                        }}
                    />
                </Box>

                {/* Password Field */}
                <Box>
                    <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        component="label"
                        htmlFor="register-password"
                        mb="6px"
                        display="block"
                        color="text.primary"
                    >
                        Password
                    </Typography>
                    <CustomTextField
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimal 6 karakter"
                        variant="outlined"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconLock size={20} color="#888" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        size="small"
                                        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                    >
                                        {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                transition: 'all 0.2s ease',
                                '&:hover': { backgroundColor: 'action.hover' },
                            },
                        }}
                    />

                    {/* Password Strength Meter */}
                    {password && (
                        <Box mt={1}>
                            <LinearProgress
                                variant="determinate"
                                value={strength.score}
                                sx={{
                                    height: 4,
                                    borderRadius: 4,
                                    backgroundColor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 4,
                                        backgroundColor: strength.color,
                                        transition: 'all 0.3s ease',
                                    },
                                }}
                            />
                            <Typography variant="caption" color={strength.color} fontWeight={600} mt={0.5} display="block">
                                {strength.label}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Stack>

            {/* Error Alert */}
            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mt: 2,
                        borderRadius: '12px',
                        '& .MuiAlert-icon': { alignItems: 'center' },
                    }}
                    onClose={() => setError('')}
                >
                    {error}
                </Alert>
            )}

            {/* Success Alert */}
            {success && (
                <Alert
                    severity="success"
                    sx={{
                        mt: 2,
                        borderRadius: '12px',
                        '& .MuiAlert-icon': { alignItems: 'center' },
                    }}
                >
                    {success}
                </Alert>
            )}

            {/* Submit Button */}
            <Button
                color="primary"
                variant="contained"
                size="large"
                fullWidth
                type="submit"
                disabled={loading || !!success}
                sx={{
                    mt: 3,
                    py: 1.4,
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(93,135,255,0.4)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 20px rgba(93,135,255,0.5)',
                    },
                    '&:active': {
                        transform: 'translateY(0)',
                    },
                }}
            >
                {loading ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress size={20} color="inherit" />
                        <span>Mendaftar...</span>
                    </Stack>
                ) : (
                    'Daftar Sekarang'
                )}
            </Button>

            {subtitle}
        </form>
    );
};

export default AuthRegister;
