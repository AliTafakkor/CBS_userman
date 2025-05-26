import React from 'react';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { logout } = useAuth();
  return (
    <div style={{ padding: 32 }}>
      <h2>Admin Dashboard</h2>
      <button onClick={logout} style={{ float: 'right' }}>Logout</button>
      <p>Approve storage allocations, projects, and manage all users here.</p>
      {/* Add admin controls here */}
    </div>
  );
};

export default AdminDashboard; 