import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Button, Paper, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab,
  MenuItem, Select, InputLabel, FormControl,
} from '@mui/material';
import WesternLayout from '../components/WesternLayout';
import {
  getAllRequests, approveRequest, denyRequest, getAllPIsFull, getAllSponsoredUsers,
  getStorageAllocations, getStorageTypes, createStorageAllocation, getAllProjects,
  getBillingCycles, createBillingCycle, generateBilling, regenerateBilling, getBillingReport,
  getBillingRates, createBillingRate,
} from '../api/requests';

const EMPTY_CYCLE = { name: '', start_date: '', end_date: '' };
const EMPTY_RATE = { user_type: 'basic', rate_per_month: '', effective_from: '' };

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

const EMPTY_ALLOC = { project_id: '', storage_type_id: '', allocated_tb: '', start_date: '', notes: '' };

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [tab, setTab] = useState(0);
  const [requests, setRequests] = useState([]);
  const [pis, setPIs] = useState([]);
  const [sponsoredUsers, setSponsoredUsers] = useState([]);
  const [storageAllocations, setStorageAllocations] = useState([]);
  const [storageTypes, setStorageTypes] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [allocDialog, setAllocDialog] = useState(false);
  const [allocForm, setAllocForm] = useState(EMPTY_ALLOC);
  const [allocSaving, setAllocSaving] = useState(false);

  // Billing state
  const [billingCycles, setBillingCycles] = useState([]);
  const [billingRates, setBillingRates] = useState([]);
  const [cycleDialog, setCycleDialog] = useState(false);
  const [cycleForm, setCycleForm] = useState(EMPTY_CYCLE);
  const [cycleSaving, setCycleSaving] = useState(false);
  const [rateDialog, setRateDialog] = useState(false);
  const [rateForm, setRateForm] = useState(EMPTY_RATE);
  const [rateSaving, setRateSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [reportDialog, setReportDialog] = useState(null); // { cycle, data }
  const [reportLoading, setReportLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reqs, piList, suList, storList, stTypes, projList, cycles, rates] = await Promise.all([
        getAllRequests(),
        getAllPIsFull(),
        getAllSponsoredUsers(),
        getStorageAllocations(),
        getStorageTypes(),
        getAllProjects(),
        getBillingCycles(),
        getBillingRates(),
      ]);
      setRequests(Array.isArray(reqs) ? reqs : reqs.results || []);
      setPIs(Array.isArray(piList) ? piList : piList.results || []);
      setSponsoredUsers(Array.isArray(suList) ? suList : suList.results || []);
      setStorageAllocations(Array.isArray(storList) ? storList : storList.results || []);
      setStorageTypes(Array.isArray(stTypes) ? stTypes : stTypes.results || []);
      setAllProjects(Array.isArray(projList) ? projList : projList.results || []);
      setBillingCycles(Array.isArray(cycles) ? cycles : cycles.results || []);
      setBillingRates(Array.isArray(rates) ? rates : rates.results || []);
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

  const handleCreateCycle = async () => {
    setCycleSaving(true);
    try {
      await createBillingCycle(cycleForm);
      setCycleDialog(false);
      setCycleForm(EMPTY_CYCLE);
      fetchData();
    } catch (e) {
      setError('Failed to create billing cycle.');
    } finally {
      setCycleSaving(false);
    }
  };

  const handleCreateRate = async () => {
    setRateSaving(true);
    try {
      await createBillingRate(rateForm);
      setRateDialog(false);
      setRateForm(EMPTY_RATE);
      fetchData();
    } catch (e) {
      setError('Failed to create billing rate.');
    } finally {
      setRateSaving(false);
    }
  };

  const handleGenerate = async (cycle) => {
    const fn = cycle.is_processed ? regenerateBilling : generateBilling;
    const label = cycle.is_processed ? 'Regenerate' : 'Generate';
    if (!window.confirm(`${label} billing for "${cycle.name}"? ${cycle.is_processed ? 'This will overwrite existing records.' : ''}`)) return;
    setGeneratingId(cycle.id);
    setError('');
    try {
      const result = await fn(cycle.id);
      alert(`Done: ${result.message}${result.skipped?.length ? '\n\nSkipped:\n' + result.skipped.join('\n') : ''}`);
      fetchData();
    } catch (e) {
      setError(e.response?.data?.error || 'Billing generation failed.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleViewReport = async (cycle) => {
    setReportLoading(true);
    setReportDialog({ cycle, data: null });
    try {
      const data = await getBillingReport(cycle.id);
      setReportDialog({ cycle, data });
    } catch (e) {
      setError('Failed to load billing report.');
      setReportDialog(null);
    } finally {
      setReportLoading(false);
    }
  };

  const handleCreateAllocation = async () => {
    setAllocSaving(true);
    try {
      await createStorageAllocation({
        project_id: parseInt(allocForm.project_id),
        storage_type_id: parseInt(allocForm.storage_type_id),
        allocated_tb: parseFloat(allocForm.allocated_tb),
        start_date: allocForm.start_date,
        notes: allocForm.notes,
      });
      setAllocDialog(false);
      setAllocForm(EMPTY_ALLOC);
      fetchData();
    } catch (e) {
      setError('Failed to create storage allocation.');
    } finally {
      setAllocSaving(false);
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
          <Tab label={`Storage (${loading ? '…' : storageAllocations.length})`} />
          <Tab label={`Billing (${loading ? '…' : billingCycles.length})`} />
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

            {tab === 5 && (
              <>
                {/* Billing Rates */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1" fontWeight={600}>Billing Rates</Typography>
                  <Button variant="outlined" size="small" onClick={() => { setRateForm(EMPTY_RATE); setRateDialog(true); }}>
                    + Add Rate
                  </Button>
                </Box>
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>User Type</TableCell>
                        <TableCell>Rate / Month</TableCell>
                        <TableCell>Effective From</TableCell>
                        <TableCell>Effective To</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {billingRates.length === 0 ? (
                        <TableRow><TableCell colSpan={4} align="center">No rates configured — add one to enable billing generation</TableCell></TableRow>
                      ) : billingRates.map(r => (
                        <TableRow key={r.id}>
                          <TableCell>{r.user_type_display || r.user_type}</TableCell>
                          <TableCell>${r.rate_per_month}</TableCell>
                          <TableCell>{r.effective_from}</TableCell>
                          <TableCell>{r.effective_to || 'Open'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Billing Cycles */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1" fontWeight={600}>Billing Cycles</Typography>
                  <Button variant="contained" size="small" onClick={() => { setCycleForm(EMPTY_CYCLE); setCycleDialog(true); }}>
                    + New Cycle
                  </Button>
                </Box>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>User Records</TableCell>
                        <TableCell>Storage Records</TableCell>
                        <TableCell>Grand Total</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {billingCycles.length === 0 ? (
                        <TableRow><TableCell colSpan={7} align="center">No billing cycles yet</TableCell></TableRow>
                      ) : billingCycles.map(c => (
                        <TableRow key={c.id}>
                          <TableCell><strong>{c.name}</strong></TableCell>
                          <TableCell>{c.start_date} → {c.end_date}</TableCell>
                          <TableCell>
                            <Chip
                              label={c.is_processed ? 'Processed' : 'Pending'}
                              color={c.is_processed ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{c.user_record_count ?? '—'}</TableCell>
                          <TableCell>{c.storage_record_count ?? '—'}</TableCell>
                          <TableCell>${c.grand_total ?? '—'}</TableCell>
                          <TableCell>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              <Button
                                size="small"
                                variant="contained"
                                color={c.is_processed ? 'warning' : 'primary'}
                                disabled={generatingId === c.id}
                                onClick={() => handleGenerate(c)}
                              >
                                {generatingId === c.id ? 'Generating…' : c.is_processed ? 'Regenerate' : 'Generate'}
                              </Button>
                              {c.is_processed && (
                                <Button size="small" variant="outlined" onClick={() => handleViewReport(c)}>
                                  Report
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {tab === 4 && (
              <>
                <Box display="flex" justifyContent="flex-end" mb={1}>
                  <Button variant="contained" size="small" onClick={() => { setAllocForm(EMPTY_ALLOC); setAllocDialog(true); }}>
                    + New Allocation
                  </Button>
                </Box>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Project</TableCell>
                        <TableCell>Storage Type</TableCell>
                        <TableCell>Allocated (TB)</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {storageAllocations.length === 0 ? (
                        <TableRow><TableCell colSpan={6} align="center">No storage allocations found</TableCell></TableRow>
                      ) : storageAllocations.map(s => (
                        <TableRow key={s.id}>
                          <TableCell>{s.project?.name || s.project}</TableCell>
                          <TableCell>{s.storage_type?.name || s.storage_type}</TableCell>
                          <TableCell>{s.allocated_tb}</TableCell>
                          <TableCell>{s.start_date}</TableCell>
                          <TableCell>{s.end_date || 'Ongoing'}</TableCell>
                          <TableCell>{s.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
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

      {/* New Billing Cycle */}
      <Dialog open={cycleDialog} onClose={() => setCycleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Billing Cycle</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Cycle Name (e.g. May 2026)"
            fullWidth value={cycleForm.name}
            onChange={e => setCycleForm(f => ({ ...f, name: e.target.value }))}
          />
          <TextField
            label="Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }}
            value={cycleForm.start_date}
            onChange={e => setCycleForm(f => ({ ...f, start_date: e.target.value }))}
          />
          <TextField
            label="End Date" type="date" fullWidth InputLabelProps={{ shrink: true }}
            value={cycleForm.end_date}
            onChange={e => setCycleForm(f => ({ ...f, end_date: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCycleDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateCycle}
            disabled={cycleSaving || !cycleForm.name || !cycleForm.start_date || !cycleForm.end_date}
          >
            {cycleSaving ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Billing Rate */}
      <Dialog open={rateDialog} onClose={() => setRateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Billing Rate</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>User Type</InputLabel>
            <Select value={rateForm.user_type} label="User Type" onChange={e => setRateForm(f => ({ ...f, user_type: e.target.value }))}>
              <MenuItem value="basic">Basic</MenuItem>
              <MenuItem value="poweruser">Power User</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Rate per Month ($)" type="number" fullWidth
            value={rateForm.rate_per_month}
            onChange={e => setRateForm(f => ({ ...f, rate_per_month: e.target.value }))}
            inputProps={{ min: 0, step: 0.01 }}
          />
          <TextField
            label="Effective From" type="date" fullWidth InputLabelProps={{ shrink: true }}
            value={rateForm.effective_from}
            onChange={e => setRateForm(f => ({ ...f, effective_from: e.target.value }))}
          />
          <TextField
            label="Effective To (leave blank = open-ended)" type="date" fullWidth InputLabelProps={{ shrink: true }}
            value={rateForm.effective_to || ''}
            onChange={e => setRateForm(f => ({ ...f, effective_to: e.target.value || null }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateRate}
            disabled={rateSaving || !rateForm.rate_per_month || !rateForm.effective_from}
          >
            {rateSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Billing Report */}
      <Dialog open={!!reportDialog} onClose={() => setReportDialog(null)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Billing Report — {reportDialog?.cycle?.name}
          {reportDialog?.data && (
            <Typography variant="body2" color="text.secondary">
              Grand Total: <strong>${reportDialog.data.grand_total}</strong>
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {reportLoading || !reportDialog?.data ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
          ) : reportDialog.data.report.length === 0 ? (
            <Typography color="text.secondary" py={2}>No billing records for this cycle.</Typography>
          ) : reportDialog.data.report.map(entry => (
            <Paper key={entry.speedcode} variant="outlined" sx={{ mb: 2, p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Box>
                  <Typography fontWeight={700}>{entry.pi_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {entry.department} · Speedcode: <strong>{entry.speedcode}</strong>
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight={700}>${entry.total}</Typography>
              </Box>

              {entry.user_charges.length > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                    User Charges (${entry.subtotal_users})
                  </Typography>
                  <Table size="small" sx={{ mb: 1 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Project</TableCell>
                        <TableCell>Prorated Days</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {entry.user_charges.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell>{c.user}</TableCell>
                          <TableCell>{c.user_type}</TableCell>
                          <TableCell>{c.project}</TableCell>
                          <TableCell>{c.prorated_days || 'Full'}</TableCell>
                          <TableCell align="right">${c.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}

              {entry.storage_charges.length > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                    Storage Charges (${entry.subtotal_storage})
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Project</TableCell>
                        <TableCell>Storage Type</TableCell>
                        <TableCell>Allocated TB</TableCell>
                        <TableCell>Prorated Days</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {entry.storage_charges.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell>{c.project}</TableCell>
                          <TableCell>{c.storage_type}</TableCell>
                          <TableCell>{c.allocated_tb}</TableCell>
                          <TableCell>{c.prorated_days || 'Full'}</TableCell>
                          <TableCell align="right">${c.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </Paper>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={allocDialog} onClose={() => setAllocDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Storage Allocation</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Project</InputLabel>
            <Select
              value={allocForm.project_id}
              label="Project"
              onChange={e => setAllocForm(f => ({ ...f, project_id: e.target.value }))}
            >
              {allProjects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Storage Type</InputLabel>
            <Select
              value={allocForm.storage_type_id}
              label="Storage Type"
              onChange={e => setAllocForm(f => ({ ...f, storage_type_id: e.target.value }))}
            >
              {storageTypes.map(st => <MenuItem key={st.id} value={st.id}>{st.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Allocated (TB)"
            type="number"
            fullWidth
            value={allocForm.allocated_tb}
            onChange={e => setAllocForm(f => ({ ...f, allocated_tb: e.target.value }))}
            inputProps={{ min: 0, step: 0.1 }}
          />
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={allocForm.start_date}
            onChange={e => setAllocForm(f => ({ ...f, start_date: e.target.value }))}
          />
          <TextField
            label="Notes (optional)"
            multiline rows={2} fullWidth
            value={allocForm.notes}
            onChange={e => setAllocForm(f => ({ ...f, notes: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAllocDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateAllocation}
            disabled={allocSaving || !allocForm.project_id || !allocForm.storage_type_id || !allocForm.allocated_tb || !allocForm.start_date}
          >
            {allocSaving ? 'Saving…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </WesternLayout>
  );
};

export default AdminDashboard;
