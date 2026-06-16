import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Button, Paper, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab,
} from '@mui/material';
import WesternLayout from '../components/WesternLayout';
import { getAllRequests, approveRequest, denyRequest, getAllPIs, getAllSponsoredUsers } from '../api/requests';

const STATUS_COLOR = { pending: 'warning', approved: 'success', denied: 'error' };
const REQUEST_TYPE_LABEL = {
  new_pi: 'New PI Account',
  new_user: 'New Sponsored User',
  user_update: 'User Update',
  pi_update: 'PI Update',
};

function RequestRow({ req, onApprove, onDeny }) {
  const data = req.data || {};
  return (
    <TableRow>
      <TableCell>{REQUEST_TYPE_LABEL[req.request_type] || req.request_type}</TableCell>
      <TableCell>{data.first_name} {data.last_name}<br /><small>{data.uwo_email}</small></TableCell>
      <TableCell>{data.department || '—'}</TableCell>
      <TableCell><Chip label={req.status} color={STATUS_COLOR[req.status] || 'default'} size="small" /></TableCell>
      <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
      <TableCell>
        {req.status === 'pending' ? (
          <Box display="flex" gap={1}>
            <Button size="small" variant="contained" color="success" onClick={() => onApprove(req)}>Approve</Button>
            <Button size="small" variant="outlined" color="error" onClick={() => onDeny(req)}>Deny</Button>
          </Box>
        ) : (
          <Typography variant="caption">{req.admin_notes || '—'}</Typography>
        )}
      </TableCell>
    </TableRow>
  );
}

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [tab, setTab] = useState(0);
  const [requests, setRequests] = useState([]);
  const [pis, setPIs] = useState([]);
  const [sponsoredUsers, setSponsoredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reqs, piList, suList] = await Promise.all([
        getAllRequests(),
        getAllPIs(),
        getAllSponsoredUsers(),
      ]);
      setRequests(Array.isArray(reqs) ? reqs : reqs.results || []);
      setPIs(Array.isArray(piList) ? piList : piList.results || []);
      setSponsoredUsers(Array.isArray(suList) ? suList : suList.results || []);
    } catch (e) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleConfirm = async () => {
    if (!dialog) return;
    setActionLoading(true);
    try {
      if (dialog.action === 'approve') await approveRequest(dialog.req.id, adminNotes);
      else await denyRequest(dialog.req.id, adminNotes);
      setDialog(null);
      fetchData();
    } catch (e) {
      setError('Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const pending = requests.filter(r => r.status === 'pending');

  return (
    <WesternLayout boxWidth={1200}>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight={700}>Admin Dashboard</Typography>
          <Button variant="outlined" color="secondary" onClick={logout}>Logout</Button>
        </Box>

        {error && <Typography color="error" mb={2}>{error}</Typography>}

        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Total PIs', value: pis.length },
            { label: 'Sponsored Users', value: sponsoredUsers.length },
            { label: 'Pending Requests', value: pending.length },
            { label: 'Total Requests', value: requests.length },
          ].map(({ label, value }) => (
            <Grid item xs={6} sm={3} key={label}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700}>{loading ? '—' : value}</Typography>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label={`Pending (${loading ? '…' : pending.length})`} />
          <Tab label={`All Requests (${loading ? '…' : requests.length})`} />
          <Tab label={`PIs (${loading ? '…' : pis.length})`} />
          <Tab label={`Sponsored Users (${loading ? '…' : sponsoredUsers.length})`} />
        </Tabs>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
        ) : (
          <>
            {(tab === 0 || tab === 1) && (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Requestor</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions / Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(tab === 0 ? pending : requests).length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center">
                        {tab === 0 ? 'No pending requests' : 'No requests found'}
                      </TableCell></TableRow>
                    ) : (tab === 0 ? pending : requests).map(req => (
                      <RequestRow
                        key={req.id}
                        req={req}
                        onApprove={r => { setDialog({ req: r, action: 'approve' }); setAdminNotes(''); }}
                        onDeny={r => { setDialog({ req: r, action: 'deny' }); setAdminNotes(''); }}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {tab === 2 && (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Employee ID</TableCell>
                      <TableCell>Speedcode</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pis.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center">No PIs found</TableCell></TableRow>
                    ) : pis.map(pi => (
                      <TableRow key={pi.id}>
                        <TableCell>{pi.user?.first_name} {pi.user?.last_name}</TableCell>
                        <TableCell>{pi.employee_id}</TableCell>
                        <TableCell>{pi.speedcode}</TableCell>
                        <TableCell>{pi.department?.name || '—'}</TableCell>
                        <TableCell>{pi.start_date}</TableCell>
                        <TableCell>{pi.end_date || 'Active'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {tab === 3 && (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Sponsor (PI)</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sponsoredUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center">No sponsored users found</TableCell></TableRow>
                    ) : sponsoredUsers.map(su => (
                      <TableRow key={su.id}>
                        <TableCell>{su.user?.first_name} {su.user?.last_name}</TableCell>
                        <TableCell>{su.user?.email}</TableCell>
                        <TableCell>{su.user_type}</TableCell>
                        <TableCell>{su.user_role}</TableCell>
                        <TableCell>{su.sponsor?.user?.first_name} {su.sponsor?.user?.last_name}</TableCell>
                        <TableCell><Chip label={su.status} color={STATUS_COLOR[su.status] || 'default'} size="small" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Box>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog?.action === 'approve' ? 'Approve' : 'Deny'} Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>
            {dialog && (
              <>{REQUEST_TYPE_LABEL[dialog.req.request_type]} for{' '}
              <strong>{dialog.req.data?.first_name} {dialog.req.data?.last_name}</strong></>
            )}
          </Typography>
          <TextField
            label="Admin Notes (optional)"
            multiline rows={3} fullWidth
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={dialog?.action === 'approve' ? 'success' : 'error'}
            onClick={handleConfirm}
            disabled={actionLoading}
          >
            {actionLoading ? 'Saving…' : dialog?.action === 'approve' ? 'Approve' : 'Deny'}
          </Button>
        </DialogActions>
      </Dialog>
    </WesternLayout>
  );
};

export default AdminDashboard;
