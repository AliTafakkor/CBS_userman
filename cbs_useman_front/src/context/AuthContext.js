import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/accounts/test-login/', { username, password });
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const setUserStatus = (status, role) => {
    setUser(prev => {
      const updated = { ...prev, status, role };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.post('/api/accounts/test-logout/', {}, {
          headers: { Authorization: `Token ${token}` },
        });
      } catch (_) {}
    }
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setUserStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
