import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import { Stack } from '@mui/system';
import { apiFetch, readJsonSafe } from 'src/utils/apiClient';

const AuthRegister = ({ title, subtitle, subtext }) => {
    const navigate = useNavigate();
    const [name, setName] = React.useState('');
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    async function handleRegister(event) {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await apiFetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, username, password }),
            });
            const data = await readJsonSafe(response);
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Register gagal');
            }
            navigate('/auth/login');
        } catch (registerError) {
            setError(registerError.message || 'Register gagal');
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

        <Box>
            <Stack mb={3}>
                <Typography variant="subtitle1"
                    fontWeight={600} component="label" htmlFor='name' mb="5px">Name</Typography>
                <CustomTextField id="name" variant="outlined" fullWidth value={name} onChange={(event) => setName(event.target.value)} />

                <Typography variant="subtitle1"
                    fontWeight={600} component="label" htmlFor='username' mb="5px" mt="25px">Username</Typography>
                <CustomTextField id="username" variant="outlined" fullWidth value={username} onChange={(event) => setUsername(event.target.value)} />

                <Typography variant="subtitle1"
                    fontWeight={600} component="label" htmlFor='password' mb="5px" mt="25px">Password</Typography>
                <CustomTextField id="password" type="password" variant="outlined" fullWidth value={password} onChange={(event) => setPassword(event.target.value)} />
            </Stack>
            {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
            <Button color="primary" variant="contained" size="large" fullWidth onClick={handleRegister} disabled={loading}>
                {loading ? 'Mendaftar...' : 'Daftar'}
            </Button>
        </Box>
        {subtitle}
    </>
    );
};

export default AuthRegister;
