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
