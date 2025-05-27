import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserStatus } from '../api/requests';

const LoginPage = () => {
  const { login, setUserStatus } = useAuth();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('user');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(username, role); // test login
    try {
      const statusResp = await getUserStatus();
      setUserStatus(statusResp.status, statusResp.role);
      if (statusResp.status === 'active') {
        navigate('/');
      } else {
        navigate('/not-registered');
      }
    } catch (err) {
      setError('Login succeeded, but failed to check user status.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 32 }}>
      <h2>Login (Test Auth)</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 12 }}
          />
        </div>
        <div>
          <label>Role:</label>
          <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', marginBottom: 12 }}>
            <option value="admin">Admin</option>
            <option value="pi">PI</option>
            <option value="user">User</option>
          </select>
        </div>
        <button type="submit" style={{ width: '100%' }}>Login</button>
      </form>
    </div>
  );
};

export default LoginPage; 