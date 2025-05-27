import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Button, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import WesternLayout from '../components/WesternLayout';

const AdminDashboard = () => {
  const { logout } = useAuth();

  // Placeholder data
  const pendingProjects = [];
  const pendingStorage = [];
  const users = [];

  return (
    <WesternLayout boxWidth={1100}>
      <Box sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Admin Dashboard</Typography>
          <Button variant="outlined" color="secondary" onClick={logout}>Logout</Button>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={2} sx={{ my: 2 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2 }}><Typography>Total Users: TODO</Typography></Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2 }}><Typography>Total Projects: TODO</Typography></Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2 }}><Typography>Total Storage: TODO</Typography></Paper>
          </Grid>
        </Grid>

        {/* Pending Project Requests */}
        <Box sx={{ my: 3 }}>
          <Typography variant="h6">Pending Project Requests</Typography>
          <TableContainer component={Paper} sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project Name</TableCell>
                  <TableCell>PI</TableCell>
                  <TableCell>Requested On</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* TODO: Map pendingProjects here */}
                <TableRow>
                  <TableCell colSpan={4} align="center">No pending requests</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Pending Storage Requests */}
        <Box sx={{ my: 3 }}>
          <Typography variant="h6">Pending Storage Requests</Typography>
          <TableContainer component={Paper} sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Requested By</TableCell>
                  <TableCell>Amount (GB)</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* TODO: Map pendingStorage here */}
                <TableRow>
                  <TableCell colSpan={4} align="center">No pending requests</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* User Management */}
        <Box sx={{ my: 3 }}>
          <Typography variant="h6">User Management</Typography>
          <TableContainer component={Paper} sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* TODO: Map users here */}
                <TableRow>
                  <TableCell colSpan={5} align="center">No users found</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </WesternLayout>
  );
};

export default AdminDashboard; 