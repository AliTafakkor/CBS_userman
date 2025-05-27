import axios from 'axios';

export async function submitRequest(payload) {
  const token = localStorage.getItem('token');
  const res = await axios.post('/api/accounts/requests/', payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
}

export async function getUserStatus() {
  const token = localStorage.getItem('token');
  const res = await axios.get('/api/accounts/user-status/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
}

export async function getUserEmail() {
  const token = localStorage.getItem('token');
  const res = await axios.get('/api/accounts/me/email/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data.email;
}

export async function getAllProjects() {
  const token = localStorage.getItem('token');
  const res = await axios.get('/api/accounts/projects/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
}

export async function getMyRequests() {
  const token = localStorage.getItem('token');
  const res = await axios.get('/api/accounts/requests/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
} 