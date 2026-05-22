/**
 * AuthContext — React Context for global auth state
 *
 * Context is React's way of sharing state between components
 * without passing props through every level of the tree.
 * Think of it like a "global variable" that React components can subscribe to.
 *
 * Usage:
 *   const { user, login, logout } = useAuth();
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/services';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);   // True while checking if already logged in

  // On app load: check if we have tokens in localStorage → fetch user profile
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authAPI.getProfile()
        .then(res => setUser(res.data))
        .catch(() => {
          // Token is invalid/expired — clear storage
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { access, refresh, user: userData } = res.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) await authAPI.logout(refreshToken);
    } catch {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const register = async (data) => {
    await authAPI.register(data);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading, isAdmin: user?.role === 'admin' || user?.is_staff }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — components call useAuth() instead of useContext(AuthContext)
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
