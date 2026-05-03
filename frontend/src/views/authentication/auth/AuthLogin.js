import React, { useState } from 'react';
import {
    Box,
    Alert,
    Typography,
    Button,
    Stack,
    InputAdornment,
    IconButton,
    CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { IconUser, IconLock, IconEye, IconEyeOff } from '@tabler/icons-react';

import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import { setUserSession } from 'src/utils/authSession';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';
import { sanitizeInput, sanitizeApiMessage, escapeHtml } from 'src/utils/securityUtils';

const AuthLogin = ({ title, subtitle, subtext }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSignIn(event) {
        event.preventDefault();
        setError('');

        // Sanitize username input
        const sanitizedUsername = sanitizeInput(username.trim());

        if (!sanitizedUsername) {
            setError('Username tidak boleh kosong');
            return;
        }
        if (!password) {
            setError('Password tidak boleh kosong');
            return;
        }

        // Prevent XSS in username format
        if (sanitizedUsername.length > 50) {
            setError('Username terlalu panjang');
            return;
        }

        setLoading(true);
        try {
            const response = await apiFetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username: sanitizedUsername, password }),
            });
            const data = await readJsonSafe(response);
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Login gagal');
            }
            const user = data?.data?.user || {};
            setUserSession({
                username: sanitizeInput(user.username),
                userId: user.id,
                name: sanitizeInput(user.name),
                role: user.role,
                token: data?.data?.token,
            });
            navigate(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/user');
        } catch (loginError) {
            // Sanitize error message to prevent XSS
            const safeError = sanitizeApiMessage(loginError.message || 'Login gagal. Periksa username dan password Anda.');
            setError(safeError);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSignIn}>
            {title && (
                <Typography fontWeight="700" variant="h2" mb={1}>
                    {title}
                </Typography>
            )}

            {subtext}

            <Stack spacing={2.5}>
                {/* Username Field */}
                <Box>
                    <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        component="label"
                        htmlFor="login-username"
                        mb="6px"
                        display="block"
                        color="text.primary"
                    >
                        Username
                    </Typography>
                    <CustomTextField
                        id="login-username"
                        placeholder="Masukkan username Anda"
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
                        htmlFor="login-password"
                        mb="6px"
                        display="block"
                        color="text.primary"
                    >
                        Password
                    </Typography>
                    <CustomTextField
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Masukkan password"
                        variant="outlined"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
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

            {/* Submit Button */}
            <Button
                color="primary"
                variant="contained"
                size="large"
                fullWidth
                type="submit"
                disabled={loading}
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
                        <span>Memproses...</span>
                    </Stack>
                ) : (
                    'Masuk'
                )}
            </Button>

            {subtitle}
        </form>
    );
};

export default AuthLogin;
