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