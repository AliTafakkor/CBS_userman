import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Try to load user from localStorage for persistence
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (username, role, status = 'active') => {
    // For test auth, just set user and role
    const userData = { username, role, status };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
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
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setUserStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 