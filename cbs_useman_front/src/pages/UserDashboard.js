import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Button, Paper, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
} from '@mui/material';
import WesternLayout from '../components/WesternLayout';
import { getMyRequests, getStorageAllocations } from '../api/requests';

const STATUS_COLOR = { active: 'success', pending: 'warning', inactive: 'default', approved: 'success', denied: 'error' };

const UserDashboard = () => {
  const { logout, user } = useAuth();
  const [sponsoredProfile, setSponsoredProfile] = useState(null);
  const [storageAllocations, setStorageAllocations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch sponsored user profile
      const suRes = await fetch('/api/accounts/sponsored-users/', {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      });
      const suData = await suRes.json();
      const suList = Array.isArray(suData) ? suData : suData.results || [];
      const myProfile = suList.find(
        su => su.user?.id === user?.id || su.user?.username === user?.username
      );
      setSponsoredProfile(myProfile || null);

      const [reqData, storData] = await Promise.all([
        getMyRequests(),
        myProfile ? getStorageAllocations(myProfile.project?.id) : Promise.resolve([]),
      ]);

      setMyRequests(Array.isArray(reqData) ? reqData : reqData.results || []);
      setStorageAllocations(Array.isArray(storData) ? storData : storData.results || []);
    } catch (e) {
      setError('Failed to load your account information.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalStorageTB = storageAllocations.reduce((sum, s) => sum + parseFloat(s.allocated_tb || 0), 0);

  return (
    <WesternLayout boxWidth={900}>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight={700}>My Account</Typography>
          <Button variant="outlined" color="secondary" onClick={logout}>Logout</Button>
        </Box>

        {error && <Typography color="error" mb={2}>{error}</Typography>}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
        ) : (
          <>
            {/* Profile Card */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Account Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Name:</strong> {user?.first_name} {user?.last_name}</Typography>
                  <Typography><strong>Username:</strong> {user?.username}</Typography>
                  <Typography><strong>Email:</strong> {user?.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  {sponsoredProfile ? (
                    <>
                      <Typography><strong>Role:</strong> {sponsoredProfile.user_role}</Typography>
                      <Typography><strong>Account Type:</strong> {sponsoredProfile.user_type}</Typography>
                      <Typography>
                        <strong>Status:</strong>{' '}
                        <Chip label={sponsoredProfile.status} color={STATUS_COLOR[sponsoredProfile.status] || 'default'} size="small" />
                      </Typography>
                      <Typography><strong>Sponsor (PI):</strong> {sponsoredProfile.sponsor?.user?.first_name} {sponsoredProfile.sponsor?.user?.last_name}</Typography>
                      <Typography><strong>Project:</strong> {sponsoredProfile.project?.name}</Typography>
                      <Typography><strong>Contract:</strong> {sponsoredProfile.start_date} – {sponsoredProfile.end_date || 'Ongoing'}</Typography>
                    </>
                  ) : (
                    <Typography color="text.secondary">No sponsored profile found.</Typography>
                  )}
                </Grid>
              </Grid>
            </Paper>

            {/* Stats */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>{storageAllocations.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Storage Allocations</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>{totalStorageTB.toFixed(2)} TB</Typography>
                  <Typography variant="body2" color="text.secondary">Total Storage</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>{myRequests.length}</Typography>
                  <Typography variant="body2" color="text.secondary">My Requests</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>
                    {myRequests.filter(r => r.status === 'pending').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Pending Requests</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Storage Allocations */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>Storage Allocations</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Storage Type</TableCell>
                      <TableCell>Allocated (TB)</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {storageAllocations.length === 0 ? (
                      <TableRow><TableCell colSpan={4} align="center">No storage allocations</TableCell></TableRow>
                    ) : storageAllocations.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{s.storage_type_name || s.storage_type}</TableCell>
                        <TableCell>{s.allocated_tb}</TableCell>
                        <TableCell>{s.start_date}</TableCell>
                        <TableCell>{s.end_date || 'Ongoing'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* My Requests */}
            <Box>
              <Typography variant="h6" gutterBottom>My Requests</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Last Updated</TableCell>
                      <TableCell>Admin Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myRequests.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center">No requests submitted</TableCell></TableRow>
                    ) : myRequests.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.request_type}</TableCell>
                        <TableCell><Chip label={r.status} color={STATUS_COLOR[r.status] || 'default'} size="small" /></TableCell>
                        <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(r.updated_at).toLocaleDateString()}</TableCell>
                        <TableCell>{r.admin_notes || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}
      </Box>
    </WesternLayout>
  );
};

export default UserDashboard;
