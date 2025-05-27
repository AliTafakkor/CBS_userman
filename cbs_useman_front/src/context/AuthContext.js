import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Try to load user from localStorage for persistence
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // New: store token in state for convenience
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  // OAuth2 password grant login
  const login = async (username, password) => {
    try {
      const data = new URLSearchParams({
        grant_type: 'password',
        username,
        password,
        client_id: process.env.REACT_APP_OAUTH_CLIENT_ID || 'YOUR_CLIENT_ID',
      });
      const response = await axios.post('/o/token/', data);
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      // Optionally fetch user info here, or set minimal info
      const userData = { username };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error_description || 'Login failed' };
    }
  };

  const setUserStatus = (status, role) => {
    setUser(prev => {
      const updated = { ...prev, status, role };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUserStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 