import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('fsd_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* noop */
    }
    setReady(true);
  }, []);

  async function login(email, password) {
    const data = await api.login({ email, password });
    if (data.accessToken) localStorage.setItem('fsd_token', data.accessToken);
    localStorage.setItem('fsd_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('fsd_token');
    localStorage.removeItem('fsd_user');
    setUser(null);
  }

  const value = {
    user,
    ready,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isTechnician: user?.role === 'TECHNICIAN',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
