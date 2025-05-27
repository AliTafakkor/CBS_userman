import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Button, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import WesternLayout from '../components/WesternLayout';

const UserDashboard = () => {
  const { logout, user } = useAuth();

  // Placeholder data
  const accesses = [];
  const requests = [];

  return (
    <WesternLayout boxWidth={900}>
      <Box sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">User Dashboard</Typography>
          <Button variant="outlined" color="secondary" onClick={logout}>Logout</Button>
        </Box>

        {/* Account Details */}
        <Paper sx={{ p: 2, my: 2 }}>
          <Typography variant="h6">Account Details</Typography>
          <Typography>Name: {user?.username}</Typography>
          <Typography>Role: {user?.role}</Typography>
          {/* TODO: Add more account details from API */}
        </Paper>

        {/* Accesses */}
        <Box sx={{ my: 3 }}>
          <Typography variant="h6">Accesses</Typography>
          <TableContainer component={Paper} sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Storage (GB)</TableCell>
                  <TableCell>Access Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* TODO: Map accesses here */}
                <TableRow>
                  <TableCell colSpan={3} align="center">No accesses found</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Request Form */}
        <Box sx={{ my: 3 }}>
          <Typography variant="h6">Submit Request for Account Change</Typography>
          <Paper sx={{ p: 2, mt: 1 }}>
            {/* TODO: Implement request form */}
            <TextField label="Request Details" fullWidth multiline rows={3} sx={{ mb: 2 }} />
            <Button variant="contained" color="primary">Submit Request</Button>
          </Paper>
        </Box>

        {/* Request Status */}
        <Box sx={{ my: 3 }}>
          <Typography variant="h6">Status of Submitted Requests</Typography>
          <TableContainer component={Paper} sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Request</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted On</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* TODO: Map requests here */}
                <TableRow>
                  <TableCell colSpan={3} align="center">No requests submitted</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </WesternLayout>
  );
};

export default UserDashboard; 