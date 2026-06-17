import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Keep a ref so the interceptor always calls the latest logout without
  // needing to re-register on every render.
  const logoutRef = useRef();

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

  // Sync ref on every render so the interceptor always has the latest function.
  logoutRef.current = logout;

  // Register a single axios response interceptor: auto-logout on 401.
  // Skips the auth endpoints themselves to avoid logout loops.
  useEffect(() => {
    const AUTH_PATHS = ['/api/accounts/test-login/', '/api/accounts/test-logout/'];
    const id = axios.interceptors.response.use(
      res => res,
      err => {
        const url = err.config?.url ?? '';
        if (err.response?.status === 401 && !AUTH_PATHS.some(p => url.includes(p))) {
          logoutRef.current?.();
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, setUserStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
