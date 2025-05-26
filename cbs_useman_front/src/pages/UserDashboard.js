import React from 'react';
import { useAuth } from '../context/AuthContext';

const UserDashboard = () => {
  const { logout } = useAuth();
  return (
    <div style={{ padding: 32 }}>
      <h2>User Dashboard</h2>
      <button onClick={logout} style={{ float: 'right' }}>Logout</button>
      <p>View your account details and accesses. Submit requests for changes here.</p>
      {/* Add user info and request form here */}
    </div>
  );
};

export default UserDashboard; 