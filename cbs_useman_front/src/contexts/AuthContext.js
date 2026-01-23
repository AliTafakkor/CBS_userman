// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await AuthService.getCurrentUser();
          setCurrentUser(response.data);
        }
      } catch (err) {
        localStorage.removeItem('token');
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await AuthService.login(credentials);
      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } finally {
      localStorage.removeItem('token');
      setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);