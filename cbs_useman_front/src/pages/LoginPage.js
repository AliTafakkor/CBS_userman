import React, { useState } from 'react';
import { Typography, TextField, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserStatus } from '../api/requests';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import WesternLayout from '../components/WesternLayout';

const LoginPage = () => {
  const { login, setUserStatus } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(username, password);
    if (!result.success) {
      setError(result.error);
      return;
    }
    try {
      const statusResp = await getUserStatus();
      setUserStatus(statusResp.status, statusResp.role);
      if (statusResp.status === 'active') {
        navigate('/');
      } else {
        navigate('/not-registered');
      }
    } catch (err) {
      setError('Login succeeded, but failed to check user status.');
    }
  };

  return (
    <WesternLayout boxWidth={350} animationDuration="16s">
      <LockOutlinedIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Sign In
      </Typography>
      {error && (
        <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
          {error}
        </Typography>
      )}
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <TextField
          label="Username"
          variant="outlined"
          value={username}
          onChange={e => setUsername(e.target.value)}
          fullWidth
          margin="normal"
          autoFocus
          InputProps={{
            autoComplete: 'username',
          }}
        />
        <TextField
          label="Password"
          variant="outlined"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          InputProps={{
            autoComplete: 'current-password',
          }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Login
        </Button>
      </form>
    </WesternLayout>
  );
};

export default LoginPage; 