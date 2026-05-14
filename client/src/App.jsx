import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import {
  DashboardPage, StaffPage, PayrollPage, AttendancePage,
  LoansPage, AnalyticsPage, ReportsPage, UsersPage, AuditPage, BackupPage
} from './pages/Pages';
import './index.css';

function AppInner() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('hrm_dark') === 'true'; } catch { return false; }
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (user) { import('./api').then(api => api.logout().catch(() => {})); window.location.reload(); }
      }, 30 * 60 * 1000);
    };
    reset();
    window.addEventListener('click', reset);
    window.addEventListener('keydown', reset);
    return () => { clearTimeout(timer); window.removeEventListener('click', reset); window.removeEventListener('keydown', reset); };
  }, [user]);

  useEffect(() => {
    try { localStorage.setItem('hrm_dark', dark); } catch {}
    document.documentElement.className = dark ? 'dark' : '';
  }, [dark]);

  if (loading) {
    return (
      <div className={dark ? 'dark' : ''} style={{ minHeight:'100vh', background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14 }}>
        <div style={{ width:56, height:56, borderRadius:14, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>🏨</div>
        <div className="spinner" style={{ width:28, height:28 }} />
        <p style={{ color:'var(--text-muted)', fontSize:14 }}>Loading PSK HR System...</p>
      </div>
    );
  }

  if (!user) return <div className={dark ? 'dark' : ''}><LoginPage /></div>;

  const pages = {
    dashboard: <DashboardPage />, staff: <StaffPage search={search} />,
    payroll: <PayrollPage />, attendance: <AttendancePage />,
    loans: <LoansPage />, analytics: <AnalyticsPage />,
    reports: <ReportsPage />, users: <UsersPage />,
    audit: <AuditPage />, backup: <BackupPage />,
  };

  return (
    <div className={dark ? 'dark' : ''}>
      <Layout page={page} setPage={setPage} dark={dark} setDark={setDark} search={search} setSearch={setSearch}>
        {pages[page] || <DashboardPage />}
      </Layout>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        duration: 3200,
        style: { background:'var(--bg)', color:'var(--text)', border:'1px solid var(--border)', fontSize:13, fontWeight:600 },
        success: { iconTheme: { primary:'#059669', secondary:'#fff' } },
        error:   { iconTheme: { primary:'#dc2626', secondary:'#fff' } },
      }} />
      <AppInner />
    </AuthProvider>
  );
}
