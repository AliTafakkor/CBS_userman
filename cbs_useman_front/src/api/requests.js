import axios from 'axios';

function authHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Token ${token}` };
}

export async function submitRequest(payload) {
  const res = await axios.post('/api/accounts/requests/', payload, { headers: authHeaders() });
  return res.data;
}

export async function getUserStatus() {
  const res = await axios.get('/api/accounts/user-status/', { headers: authHeaders() });
  return res.data;
}

export async function getUserEmail() {
  const res = await axios.get('/api/accounts/me/email/', { headers: authHeaders() });
  return res.data.email;
}

export async function getAllProjects() {
  const res = await axios.get('/api/accounts/projects/', { headers: authHeaders() });
  return res.data;
}

export async function getMyRequests() {
  const res = await axios.get('/api/accounts/requests/', { headers: authHeaders() });
  return res.data;
}

export async function getAllRequests(status = null) {
  const params = status ? `?status=${status}` : '';
  const res = await axios.get(`/api/accounts/requests/${params}`, { headers: authHeaders() });
  return res.data;
}

export async function approveRequest(id, adminNotes = '') {
  const res = await axios.post(
    `/api/accounts/requests/${id}/approve/`,
    { admin_notes: adminNotes },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function denyRequest(id, adminNotes = '') {
  const res = await axios.post(
    `/api/accounts/requests/${id}/deny/`,
    { admin_notes: adminNotes },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function getAllPIs() {
  const res = await axios.get('/api/accounts/all-pis/', { headers: authHeaders() });
  return res.data;
}

export async function getAllPIsFull() {
  const res = await axios.get('/api/accounts/principal-investigators/', { headers: authHeaders() });
  return res.data;
}

export async function getAllSponsoredUsers() {
  const res = await axios.get('/api/accounts/sponsored-users/', { headers: authHeaders() });
  return res.data;
}

export async function getMyPIProfile() {
  const res = await axios.get('/api/accounts/principal-investigators/', { headers: authHeaders() });
  return res.data;
}

export async function getMySponsoredUsers(piId) {
  const res = await axios.get(`/api/accounts/principal-investigators/${piId}/sponsored_users/`, { headers: authHeaders() });
  return res.data;
}

export async function getMyProjectSpeedcodes(projectId) {
  const res = await axios.get(`/api/accounts/projects/${projectId}/speedcodes/`, { headers: authHeaders() });
  return res.data;
}

export async function getStorageAllocations(projectId = null) {
  const url = projectId
    ? `/api/billing/storage-allocations/?project=${projectId}`
    : '/api/billing/storage-allocations/';
  const res = await axios.get(url, { headers: authHeaders() });
  return res.data;
}

export async function getStorageTypes() {
  const res = await axios.get('/api/billing/storage-types/', { headers: authHeaders() });
  return res.data;
}

export async function createStorageAllocation(payload) {
  const res = await axios.post('/api/billing/storage-allocations/', payload, { headers: authHeaders() });
  return res.data;
}

export async function submitSponsoredUserRequest(payload) {
  const res = await axios.post('/api/accounts/requests/', {
    request_type: 'new_user',
    data: payload,
  }, { headers: authHeaders() });
  return res.data;
}

// ── Billing ──────────────────────────────────────────────────────────────────

export async function getBillingCycles() {
  const res = await axios.get('/api/billing/cycles/', { headers: authHeaders() });
  return res.data;
}

export async function createBillingCycle(payload) {
  const res = await axios.post('/api/billing/cycles/', payload, { headers: authHeaders() });
  return res.data;
}

export async function generateBilling(cycleId) {
  const res = await axios.post(`/api/billing/cycles/${cycleId}/generate_billing/`, {}, { headers: authHeaders() });
  return res.data;
}

export async function regenerateBilling(cycleId) {
  const res = await axios.post(`/api/billing/cycles/${cycleId}/regenerate_billing/`, {}, { headers: authHeaders() });
  return res.data;
}

export async function getBillingReport(cycleId) {
  const res = await axios.get(`/api/billing/cycles/${cycleId}/report/`, { headers: authHeaders() });
  return res.data;
}

export async function getBillingRates() {
  const res = await axios.get('/api/billing/rates/', { headers: authHeaders() });
  return res.data;
}

export async function createBillingRate(payload) {
  const res = await axios.post('/api/billing/rates/', payload, { headers: authHeaders() });
  return res.data;
}
