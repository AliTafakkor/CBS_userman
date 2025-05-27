import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotRegisteredPage() {
  const navigate = useNavigate();
  return (
    <Box maxWidth={500} mx="auto" mt={6} textAlign="center">
      <Typography variant="h5" gutterBottom>
        You are not registered or your account is inactive.
      </Typography>
      <Typography gutterBottom>
        Please choose one of the following options to request access:
      </Typography>
      <Box mt={3}>
        <Button variant="contained" color="primary" onClick={() => navigate('/request/new-pi')} sx={{ m: 1 }}>
          Request New PI Account
        </Button>
        <Button variant="contained" color="secondary" onClick={() => navigate('/request/new-user')} sx={{ m: 1 }}>
          Request Sponsored User Account
        </Button>
      </Box>
    </Box>
  );
} 