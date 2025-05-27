import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import PIDashboard from './pages/PIDashboard';
import UserDashboard from './pages/UserDashboard';
import NewPIRequestPage from './pages/NewPIRequestPage';
import NotRegisteredPage from './pages/NotRegisteredPage';

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'pi') return <PIDashboard />;
  return <UserDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/request/new-pi" element={<NewPIRequestPage />} />
          <Route path="/not-registered" element={<NotRegisteredPage />} />
          <Route path="/*" element={<DashboardRouter />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 