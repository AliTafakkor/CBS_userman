import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Button, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import WesternLayout from '../components/WesternLayout';

const PIDashboard = () => {
  const { logout } = useAuth();

  // Placeholder data
  const projects = [];
  const storageAllocations = [];
  const sponsoredUsers = [];

  return (
    <WesternLayout boxWidth={900}>
      <Box sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">PI Dashboard</Typography>
          <Button variant="outlined" color="secondary" onClick={logout}>Logout</Button>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={2} sx={{ my: 2 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2 }}><Typography>Total Projects: TODO</Typography></Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2 }}><Typography>Total Storage: TODO</Typography></Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2 }}><Typography>Sponsored Users: TODO</Typography></Paper>
          </Grid>
        </Grid>

        {/* Owned Projects */}
        <Box sx={{ my: 3 }}>
          <Typography variant="h6">Owned Projects</Typography>
          <TableContainer component={Paper} sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project Name</TableCell>
                  <TableCell>Speedcode</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* TODO: Map projects here */}
                <TableRow>
                  <TableCell colSpan={3} align="center">No projects found</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Storage Allocations */}
        <Box sx={{ my: 3 }}>
          <Typography variant="h6">Storage Allocations</Typography>
          <TableContainer component={Paper} sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Storage (GB)</TableCell>
                  <TableCell>Users with Access</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* TODO: Map storageAllocations here */}
                <TableRow>
                  <TableCell colSpan={3} align="center">No storage allocations</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Sponsored Users */}
        <Box sx={{ my: 3 }}>
          <Typography variant="h6">Sponsored Users</Typography>
          <TableContainer component={Paper} sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* TODO: Map sponsoredUsers here */}
                <TableRow>
                  <TableCell colSpan={3} align="center">No sponsored users</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </WesternLayout>
  );
};

export default PIDashboard; 