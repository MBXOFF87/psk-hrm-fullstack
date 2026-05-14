import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES, getInitials, avatarColor } from '../utils/constants';
import { ChangePasswordModal } from './UI';

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',       icon: '📊' },
  { id: 'staff',       label: 'Staff Directory',  icon: '👥' },
  { id: 'payroll',     label: 'Payroll',          icon: '💰' },
  { id: 'attendance',  label: 'Attendance',       icon: '📅' },
  { id: 'loans',       label: 'Loans',            icon: '💳' },
  { id: 'analytics',   label: 'Analytics',        icon: '📈' },
  { id: 'reports',     label: 'Reports',          icon: '📄' },
  { id: 'users',       label: 'User Management',  icon: '🔐', adminOnly: true },
  { id: 'audit',       label: 'Audit Log',        icon: '🔍', adminOnly: true },
  { id: 'backup',      label: 'Backup',           icon: '☁️', adminOnly: true },
];

export default function Layout({ page, setPage, dark, setDark, search, setSearch, children }) {
  const { user, logout, can } = useAuth();
  const [showPwModal, setShowPwModal] = useState(false);

  const navItems = NAV.filter(n => !n.adminOnly || can() || ['superadmin','hr'].includes(user?.role));
  const color = avatarColor(user?.name || '');

  return (
    <div className={`app-layout ${dark ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar no-print">
        {/* Logo */}
        <div style={{ padding: '1.2rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>🏨</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>PSK Hotels</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 1 }}>HR System</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search staff..."
            style={{
              width: '100%', padding: '6px 10px', borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.8)', fontSize: 12
            }}
          />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '6px 0' }}>
          {navItems.map(n => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => setPage(n.id)}
            >
              <span style={{ fontSize: 15 }}>{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {getInitials(user?.name)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{ROLES[user?.role]?.label}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => setDark(d => !d)} style={{ flex: 1, padding: '5px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 11 }}>
              {dark ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setShowPwModal(true)} style={{ flex: 1, padding: '5px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 11 }}>
              🔑
            </button>
            <button onClick={logout} style={{ flex: 1, padding: '5px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 11 }}>
              🚪
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>

      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
    </div>
  );
}
