import React from 'react';
import {
    Box,
    Alert,
    Typography,
    FormGroup,
    FormControlLabel,
    Button,
    Stack,
    Checkbox
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import { setUserSession } from 'src/utils/authSession';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

const AuthLogin = ({ title, subtitle, subtext }) => {
    const navigate = useNavigate();
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    async function handleSignIn(event) {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await apiFetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            const data = await readJsonSafe(response);
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Login gagal');
            }
            const user = data?.data?.user || {};
            setUserSession({
                username: user.username,
                userId: user.id,
                name: user.name,
                role: user.role,
                token: data?.data?.token,
            });
            navigate(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/user');
        } catch (loginError) {
            setError(loginError.message || 'Login gagal');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
        {title ? (
            <Typography fontWeight="700" variant="h2" mb={1}>
                {title}
            </Typography>
        ) : null}

        {subtext}

        <Stack>
            <Box>
                <Typography variant="subtitle1"
                    fontWeight={600} component="label" htmlFor='username' mb="5px">Username</Typography>
                <CustomTextField id="username" variant="outlined" fullWidth value={username} onChange={(event) => setUsername(event.target.value)} />
            </Box>
            <Box mt="25px">
                <Typography variant="subtitle1"
                    fontWeight={600} component="label" htmlFor='password' mb="5px" >Password</Typography>
                <CustomTextField id="password" type="password" variant="outlined" fullWidth value={password} onChange={(event) => setPassword(event.target.value)} />
            </Box>
            <Stack justifyContent="space-between" direction="row" alignItems="center" my={2}>
                <FormGroup>
                    <FormControlLabel
                        control={<Checkbox defaultChecked />}
                        label="Ingat perangkat ini"
                    />
                </FormGroup>
                <Typography
                    component={Link}
                    to="/"
                    fontWeight="500"
                    sx={{
                        textDecoration: 'none',
                        color: 'primary.main',
                    }}
                >
                    Lupa Password?
                </Typography>
            </Stack>
        </Stack>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        <Box>
            <Button
                color="primary"
                variant="contained"
                size="large"
                fullWidth
                onClick={handleSignIn}
                disabled={loading}
                type="submit"
            >
                {loading ? 'Masuk...' : 'Masuk'}
            </Button>
        </Box>
        {subtitle}
    </>
    );
};

export default AuthLogin;
