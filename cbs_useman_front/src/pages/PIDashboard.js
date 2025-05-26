import React from 'react';
import { useAuth } from '../context/AuthContext';

const PIDashboard = () => {
  const { logout } = useAuth();
  return (
    <div style={{ padding: 32 }}>
      <h2>PI Dashboard</h2>
      <button onClick={logout} style={{ float: 'right' }}>Logout</button>
      <p>View your projects, storage allocations, and speedcodes for charges here.</p>
      {/* Add PI-specific info here */}
    </div>
  );
};

export default PIDashboard; 