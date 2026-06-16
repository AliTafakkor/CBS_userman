import React, { useEffect, useState } from 'react';
import { Button, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getMyRequests } from '../api/requests';
import WesternLayout from '../components/WesternLayout';

export default function NotRegisteredPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRequests() {
      try {
        const data = await getMyRequests();
        setRequests(data);
      } catch (e) {
        setError('Failed to load your requests.');
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  return (
    <WesternLayout boxWidth={700}>
      <Box textAlign="center">
        <Typography variant="h5" gutterBottom>
          You are not registered or your account is inactive.
        </Typography>
        <Typography gutterBottom>
          Please choose one of the following options to request access:
        </Typography>
        <Box mt={3} mb={4}>
          <Button variant="contained" color="primary" onClick={() => navigate('/request/new-pi')} sx={{ m: 1 }}>
            Request New PI Account
          </Button>
          <Button variant="contained" color="secondary" onClick={() => navigate('/request/new-user')} sx={{ m: 1 }}>
            Request Sponsored User Account
          </Button>
        </Box>
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>Your Requests</Typography>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Typography color="error.main">{error}</Typography>
          ) : requests.length === 0 ? (
            <Typography>No requests found.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Last Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>{req.request_type}</TableCell>
                      <TableCell>{req.status}</TableCell>
                      <TableCell>{new Date(req.created_at).toLocaleString()}</TableCell>
                      <TableCell>{new Date(req.updated_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    </WesternLayout>
  );
} 