import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authService from '../services/authService';
import { setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    const hadToken = !!localStorage.getItem('tpc_token');
    localStorage.removeItem('tpc_token');
    if (hadToken) authService.logout().catch(() => {});
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    const token = localStorage.getItem('tpc_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .me()
      .then((res) => setUser(res.data?.user || res.user))
      .catch(() => localStorage.removeItem('tpc_token'))
      .finally(() => setLoading(false));
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password);
    const { token, user: u } = res.data;
    localStorage.setItem('tpc_token', token);
    setUser(u);
    return u;
  }, []);

  const homeFor = useCallback((u = user) => {
    if (!u) return '/login';
    return u.role === 'STUDENT' ? '/student/dashboard' : '/tpc/dashboard';
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, homeFor }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
