import { useEffect, useRef, useState } from 'react';
import { getInitials, avatarColor } from '../utils/constants';

// ─── MODAL ────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ─── FORM HELPERS ─────────────────────────────────────────────────────────────
export function Field({ label, children, half, full }) {
  return (
    <div className={`form-field ${half ? 'half' : ''} ${full ? 'full' : ''}`}>
      {label && <label className="form-label">{label}</label>}
      {children}
    </div>
  );
}

export function Input({ value, onChange, type = 'text', placeholder = '', disabled, style }) {
  return (
    <input
      className="form-input"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      style={style}
    />
  );
}

export function Select({ value, onChange, options, placeholder = 'Select...', disabled }) {
  return (
    <select
      className="form-input"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
export function Badge({ color = '#64748b', children }) {
  return (
    <span
      className="badge"
      style={{ background: color + '22', color }}
    >
      {children}
    </span>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = '#7c3aed', icon }) {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        {icon && <span style={{ fontSize: 20, opacity: 0.5 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
export function Avatar({ staff, size = 36, onClick }) {
  const [err, setErr] = useState(false);
  const color = avatarColor(staff.name);
  const photoUrl = staff.photoFile ? `/uploads/${staff.photoFile}` : staff.photo;

  if (photoUrl && !err) {
    return (
      <img
        src={photoUrl}
        alt={staff.name}
        onClick={onClick}
        onError={() => setErr(true)}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', cursor: onClick ? 'pointer' : 'default', flexShrink: 0
        }}
      />
    );
  }
  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: '50%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.36, fontWeight: 700, color: '#fff',
        cursor: onClick ? 'pointer' : 'default', flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {getInitials(staff.name)}
    </div>
  );
}

// ─── PHOTO LIGHTBOX ───────────────────────────────────────────────────────────
export function PhotoLightbox({ staff, onClose }) {
  const photoUrl = staff.photoFile ? `/uploads/${staff.photoFile}` : staff.photo;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14
      }}
    >
      {photoUrl
        ? <img src={photoUrl} alt={staff.name} style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 12 }} />
        : <div style={{ width: 200, height: 200, borderRadius: '50%', background: avatarColor(staff.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, fontWeight: 700, color: '#fff' }}>{getInitials(staff.name)}</div>
      }
      <div style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>{staff.name}</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{staff.empId} · {staff.branch}</div>
      <button onClick={onClose} style={{ padding: '8px 22px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13 }}>Close</button>
    </div>
  );
}

// ─── LOADING SPINNER ─────────────────────────────────────────────────────────
export function Spinner({ text = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '3rem', color: 'var(--text-muted)', fontSize: 14 }}>
      <div className="spinner" />
      {text}
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
export function Empty({ icon = '📭', title, sub, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
      {title && <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{title}</h3>}
      {sub && <p style={{ fontSize: 13, marginBottom: action ? 16 : 0 }}>{sub}</p>}
      {action}
    </div>
  );
}

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = '#059669' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 28 }}>{pct}%</span>
    </div>
  );
}

// ─── NET DISPLAY ─────────────────────────────────────────────────────────────
export function NetDisplay({ gross, paye, vaccine, loan, otherDeductions }) {
  const net = Math.max(0, (gross || 0) - (paye || 0) - (vaccine || 0) - (loan || 0) - (otherDeductions || 0));
  const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');
  return (
    <div style={{ padding: '10px 12px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>NET SALARY</span>
      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{fmt(net)}</span>
    </div>
  );
}

// ─── CONFIRM DIALOG ──────────────────────────────────────────────────────────
export function ConfirmDialog({ title, message, onConfirm, onCancel, danger }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400, marginTop: '15vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>{message}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
            <button
              className={`btn btn-sm ${danger ? '' : 'btn-primary'}`}
              style={danger ? { background: 'var(--danger)', color: '#fff' } : {}}
              onClick={onConfirm}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SECTION DIVIDER ─────────────────────────────────────────────────────────
export function SectionTitle({ children }) {
  return <div className="form-section">{children}</div>;
}

// ─── CHANGE PASSWORD MODAL ────────────────────────────────────────────────────
export function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (form.newPassword !== form.confirmPassword) { setErr('Passwords do not match'); return; }
    if (form.newPassword.length < 6) { setErr('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { changePassword } = await import('../api');
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setDone(true);
    } catch (e) {
      setErr(e.response?.data?.error || 'Error changing password');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Change Password" onClose={onClose}>
      {done
        ? <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h3 style={{ marginBottom: 8 }}>Password changed!</h3>
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        : <>
            {err && <div className="alert-error">{err}</div>}
            <div className="form-grid">
              <Field label="Current Password" full><Input value={form.currentPassword} onChange={v => s('currentPassword', v)} type="password" /></Field>
              <Field label="New Password" full><Input value={form.newPassword} onChange={v => s('newPassword', v)} type="password" placeholder="Min 6 characters" /></Field>
              <Field label="Confirm New Password" full><Input value={form.confirmPassword} onChange={v => s('confirmPassword', v)} type="password" /></Field>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={loading}>
                {loading ? <><div className="spinner" /> Saving...</> : 'Change Password'}
              </button>
            </div>
          </>
      }
    </Modal>
  );
}
