import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if (!form.username || !form.password) { setErr('Please enter username and password'); return; }
    setLoading(true); setErr('');
    try {
      await login(form);
    } catch (e) {
      setErr(e.response?.data?.error || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: '2.5rem',
        width: '100%',
        maxWidth: 400,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: 28, boxShadow: '0 8px 24px rgba(124,58,237,0.4)'
          }}>🏨</div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: 0 }}>PSK Hotels</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4 }}>HR Management System</p>
        </div>

        <form onSubmit={submit}>
          {/* Username */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
              Username
            </label>
            <input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="Enter username"
              autoFocus
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 9, background: 'rgba(255,255,255,0.07)',
                color: '#fff', fontSize: 14,
                outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.8)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Enter password"
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 9, background: 'rgba(255,255,255,0.07)',
                color: '#fff', fontSize: 14,
                outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.8)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
          </div>

          {err && (
            <div style={{ padding: '9px 12px', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)', borderRadius: 8, color: '#fca5a5', fontSize: 13, marginBottom: 14 }}>
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              border: 'none', borderRadius: 10,
              background: loading ? 'rgba(124,58,237,0.5)' : 'var(--accent)',
              color: '#fff', fontSize: 15, fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s',
              marginBottom: 16
            }}
          >
            {loading ? <><div className="spinner" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        {/* Demo accounts */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '10px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Demo Accounts</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
            <div><span style={{ color: '#c4b5fd' }}>admin</span> / admin123 <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>(Super Admin)</span></div>
            <div><span style={{ color: '#c4b5fd' }}>hr_manager</span> / hrm2026 <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>(HR Manager)</span></div>
            <div><span style={{ color: '#c4b5fd' }}>accounts</span> / acc2026 <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>(Accounts)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
