import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin, logout as apiLogout } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(r => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (creds) => {
    const r = await apiLogin(creds);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const can = (...perms) => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    const rolePerms = {
      hr: ['view_staff','edit_staff','view_payroll','run_payroll','view_reports','view_loans','edit_loans'],
      branch_manager: ['view_staff','view_payroll'],
      accounts: ['view_payroll','run_payroll','view_reports','view_loans','edit_loans'],
      viewer: ['view_staff','view_payroll'],
    };
    const myPerms = rolePerms[user.role] || [];
    return perms.every(p => myPerms.includes(p));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
