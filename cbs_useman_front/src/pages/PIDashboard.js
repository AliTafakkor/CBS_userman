import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Button, Paper, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl,
} from '@mui/material';
import WesternLayout from '../components/WesternLayout';
import { getAllProjects, getMySponsoredUsers, getStorageAllocations, getMyRequests, submitSponsoredUserRequest } from '../api/requests';

const EMPTY_SU_FORM = {
  first_name: '', last_name: '', uwo_email: '',
  user_type: 'basic', user_role: 'student',
  start_date: '', end_date: '',
};

const STATUS_COLOR = { active: 'success', pending: 'warning', inactive: 'default' };

const PIDashboard = () => {
  const { logout, user } = useAuth();
  const [tab, setTab] = useState(0);
  const [piProfile, setPiProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sponsoredUsers, setSponsoredUsers] = useState([]);
  const [storageAllocations, setStorageAllocations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addSUDialog, setAddSUDialog] = useState(false);
  const [suForm, setSUForm] = useState(EMPTY_SU_FORM);
  const [suSaving, setSUSaving] = useState(false);
  const [suSuccess, setSUSuccess] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch PI's profile (the PI whose user matches current user)
      const piRes = await fetch('/api/accounts/principal-investigators/', {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      });
      const piData = await piRes.json();
      const piList = Array.isArray(piData) ? piData : piData.results || [];
      const currentPI = piList.find(pi => pi.user?.id === user?.id || pi.user?.username === user?.username);
      setPiProfile(currentPI || null);

      const [projData, reqData] = await Promise.all([
        getAllProjects(),
        getMyRequests(),
      ]);

      const projList = Array.isArray(projData) ? projData : projData.results || [];
      // Filter projects owned by this PI
      const myProjects = currentPI
        ? projList.filter(p => p.owner === currentPI.id)
        : projList;
      setProjects(myProjects);
      setMyRequests(Array.isArray(reqData) ? reqData : reqData.results || []);

      if (currentPI) {
        const [suData, storData] = await Promise.all([
          getMySponsoredUsers(currentPI.id),
          getStorageAllocations(),
        ]);
        setSponsoredUsers(Array.isArray(suData) ? suData : suData.results || []);
        const storList = Array.isArray(storData) ? storData : storData.results || [];
        // Filter storage for this PI's projects
        const myProjectIds = new Set(myProjects.map(p => p.id));
        setStorageAllocations(storList.filter(s => myProjectIds.has(s.project)));
      }
    } catch (e) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalStorageTB = storageAllocations.reduce((sum, s) => sum + parseFloat(s.allocated_tb || 0), 0);

  const handleAddSU = async () => {
    setSUSaving(true);
    setError('');
    try {
      await submitSponsoredUserRequest({
        ...suForm,
        pi_id: piProfile?.id,
        pi_name: piProfile ? `${piProfile.user?.first_name} ${piProfile.user?.last_name}` : '',
      });
      setSUSuccess('Request submitted — pending admin approval.');
      setSUForm(EMPTY_SU_FORM);
      setAddSUDialog(false);
      fetchData();
    } catch (e) {
      setError('Failed to submit sponsored user request.');
    } finally {
      setSUSaving(false);
    }
  };

  return (
    <WesternLayout boxWidth={1100}>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight={700}>PI Dashboard</Typography>
            {piProfile && (
              <Typography variant="body2" color="text.secondary">
                {piProfile.user?.first_name} {piProfile.user?.last_name} — Speedcode: <strong>{piProfile.speedcode}</strong>
                {piProfile.department && ` — ${piProfile.department.name}`}
              </Typography>
            )}
          </Box>
          <Button variant="outlined" color="secondary" onClick={logout}>Logout</Button>
        </Box>

        {error && <Typography color="error" mb={2}>{error}</Typography>}
        {suSuccess && <Typography color="success.main" mb={2}>{suSuccess}</Typography>}

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Projects', value: projects.length },
            { label: 'Sponsored Users', value: sponsoredUsers.length },
            { label: 'Storage Allocated', value: `${totalStorageTB.toFixed(2)} TB` },
            { label: 'Pending Requests', value: myRequests.filter(r => r.status === 'pending').length },
          ].map(({ label, value }) => (
            <Grid item xs={6} sm={3} key={label}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={700}>{loading ? '—' : value}</Typography>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Projects" />
          <Tab label="Sponsored Users" />
          <Tab label="Storage Allocations" />
          <Tab label="My Requests" />
        </Tabs>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
        ) : (
          <>
            {/* Projects */}
            {tab === 0 && (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Project Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Default</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects.length === 0 ? (
                      <TableRow><TableCell colSpan={4} align="center">No projects found</TableCell></TableRow>
                    ) : projects.map(p => (
                      <TableRow key={p.id}>
                        <TableCell><strong>{p.name}</strong></TableCell>
                        <TableCell>{p.description || '—'}</TableCell>
                        <TableCell>{p.created_date}</TableCell>
                        <TableCell>{p.is_default ? <Chip label="Default" size="small" color="primary" /> : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Sponsored Users */}
            {tab === 1 && (
              <>
                <Box display="flex" justifyContent="flex-end" mb={1}>
                  <Button variant="contained" size="small" onClick={() => { setSUForm(EMPTY_SU_FORM); setSUSuccess(''); setAddSUDialog(true); }}>
                    + Add Sponsored User
                  </Button>
                </Box>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Project</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sponsoredUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={8} align="center">No sponsored users</TableCell></TableRow>
                    ) : sponsoredUsers.map(su => (
                      <TableRow key={su.id}>
                        <TableCell>{su.user?.first_name} {su.user?.last_name}</TableCell>
                        <TableCell>{su.user?.email}</TableCell>
                        <TableCell>{su.user_role}</TableCell>
                        <TableCell>{su.user_type}</TableCell>
                        <TableCell>{su.project?.name || '—'}</TableCell>
                        <TableCell><Chip label={su.status} color={STATUS_COLOR[su.status] || 'default'} size="small" /></TableCell>
                        <TableCell>{su.start_date}</TableCell>
                        <TableCell>{su.end_date || 'Ongoing'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              </>
            )}

            {/* Storage Allocations */}
            {tab === 2 && (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Storage Type</TableCell>
                      <TableCell>Allocated (TB)</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {storageAllocations.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center">No storage allocations</TableCell></TableRow>
                    ) : storageAllocations.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{projects.find(p => p.id === s.project)?.name || s.project}</TableCell>
                        <TableCell>{s.storage_type_name || s.storage_type}</TableCell>
                        <TableCell>{s.allocated_tb}</TableCell>
                        <TableCell>{s.start_date}</TableCell>
                        <TableCell>{s.end_date || 'Ongoing'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* My Requests */}
            {tab === 3 && (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myRequests.length === 0 ? (
                      <TableRow><TableCell colSpan={4} align="center">No requests</TableCell></TableRow>
                    ) : myRequests.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.request_type}</TableCell>
                        <TableCell><Chip label={r.status} color={STATUS_COLOR[r.status] || 'default'} size="small" /></TableCell>
                        <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{r.admin_notes || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Box>

      <Dialog open={addSUDialog} onClose={() => setAddSUDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Sponsored User</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            This will submit a request for admin approval.
          </Typography>
          <Box display="flex" gap={2}>
            <TextField label="First Name" fullWidth value={suForm.first_name} onChange={e => setSUForm(f => ({ ...f, first_name: e.target.value }))} />
            <TextField label="Last Name" fullWidth value={suForm.last_name} onChange={e => setSUForm(f => ({ ...f, last_name: e.target.value }))} />
          </Box>
          <TextField label="UWO Email" fullWidth value={suForm.uwo_email} onChange={e => setSUForm(f => ({ ...f, uwo_email: e.target.value }))} />
          <FormControl fullWidth>
            <InputLabel>Account Type</InputLabel>
            <Select value={suForm.user_type} label="Account Type" onChange={e => setSUForm(f => ({ ...f, user_type: e.target.value }))}>
              <MenuItem value="basic">Basic</MenuItem>
              <MenuItem value="poweruser">Power User</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select value={suForm.user_role} label="Role" onChange={e => setSUForm(f => ({ ...f, user_role: e.target.value }))}>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
              <MenuItem value="faculty">Faculty</MenuItem>
              <MenuItem value="external">External Collaborator</MenuItem>
            </Select>
          </FormControl>
          <Box display="flex" gap={2}>
            <TextField label="Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={suForm.start_date} onChange={e => setSUForm(f => ({ ...f, start_date: e.target.value }))} />
            <TextField label="End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={suForm.end_date} onChange={e => setSUForm(f => ({ ...f, end_date: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSUDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddSU}
            disabled={suSaving || !suForm.first_name || !suForm.last_name || !suForm.uwo_email || !suForm.start_date}
          >
            {suSaving ? 'Submitting…' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </WesternLayout>
  );
};

export default PIDashboard;
