import { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { Modal, Field, Input, Select, Badge, StatCard, Avatar, PhotoLightbox, Spinner, Empty, ProgressBar, ConfirmDialog, SectionTitle } from '../components/UI';
import StaffForm from '../components/StaffForm';
import { useAuth } from '../context/AuthContext';
import {
  getStaff, createStaff, updateStaff, deleteStaff, uploadPhoto,
  getLoans, createLoan, updateLoan, deleteLoan,
  getPayroll, runPayroll as apiRunPayroll, lockPayroll as apiLockPayroll,
  getAttendance, saveAttendanceBulk,
  getUsers, createUser, updateUser, deleteUser,
  getAuditLog, getAnalytics, exportBackup,
} from '../api';
import {
  BRANCHES, DEPARTMENTS, ROLES, POSITIONS, NIGERIAN_BANKS, MONTHS,
  fmt, getDaysInMonth, DEPT_ORDER, avatarColor, getInitials
} from '../utils/constants';

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then(r => setAnalytics(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!analytics) return <Empty icon="📊" title="Could not load analytics" />;

  const { totalStaff, inactiveStaff, totalBranches, totalPayroll, totalLoanBalance, totalLoans, byBranch, byDept, payrollHistory } = analytics;
  const branchArr = Object.entries(byBranch || {}).map(([b, v]) => ({ branch: b, ...v })).sort((a, b) => b.payroll - a.payroll);
  const deptArr = Object.entries(byDept || {}).map(([d, v]) => ({ dept: d, ...v })).sort((a, b) => b.payroll - a.payroll);
  const sortedHistory = [...(payrollHistory || [])].sort((a, b) => a.period.localeCompare(b.period)).slice(-6);
  const maxP = Math.max(...sortedHistory.map(h => h.totalNet), 1);

  return (
    <div className="page">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>PSK Hotels Group — HR Overview</p>
      </div>

      <div className="stat-grid">
        <StatCard label="Active Staff" value={totalStaff} sub={`${inactiveStaff} inactive`} color="#7c3aed" icon="👥" />
        <StatCard label="Branches" value={totalBranches} sub="Active branches" color="#0ea5e9" icon="🏨" />
        <StatCard label="Monthly Payroll" value={fmt(totalPayroll)} sub="Net (active staff)" color="#059669" icon="💰" />
        <StatCard label="Loan Balance" value={fmt(totalLoanBalance)} sub={`${totalLoans} loans`} color="#d97706" icon="💳" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card card-body">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Staff & Payroll by Branch</div>
          {branchArr.slice(0, 9).map(({ branch, count, payroll }) => (
            <div key={branch} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: 'var(--text)' }}>{branch} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({count})</span></span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{fmt(payroll)}</span>
              </div>
              <ProgressBar value={payroll} max={branchArr[0]?.payroll || 1} color="var(--accent)" />
            </div>
          ))}
        </div>

        <div className="card card-body">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Payroll by Department</div>
          {deptArr.slice(0, 9).map(({ dept, count, payroll }) => (
            <div key={dept} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
              <span style={{ color: 'var(--text)' }}>{dept} <span style={{ color: 'var(--text-muted)' }}>({count})</span></span>
              <span style={{ fontWeight: 700, color: '#0ea5e9' }}>{fmt(payroll)}</span>
            </div>
          ))}
        </div>
      </div>

      {sortedHistory.length > 0 && (
        <div className="card card-body">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Payroll Trend (Net Pay)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
            {sortedHistory.map((h, i) => {
              const prev = sortedHistory[i - 1];
              const pct = Math.max(6, Math.round((h.totalNet / maxP) * 120));
              const up = !prev || h.totalNet >= prev.totalNet;
              return (
                <div key={h.period} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {prev && <div style={{ fontSize: 9, fontWeight: 700, color: up ? '#059669' : '#dc2626' }}>{up ? '▲' : '▼'}{Math.round(Math.abs((h.totalNet - prev.totalNet) / prev.totalNet * 100))}%</div>}
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>{fmt(h.totalNet)}</div>
                  <div style={{ width: '100%', height: pct, background: 'var(--accent)', borderRadius: '4px 4px 0 0', opacity: 0.82 }} />
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{h.period}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STAFF PAGE ───────────────────────────────────────────────────────────────
export function StaffPage({ search }) {
  const { can } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [photoModal, setPhotoModal] = useState(null);
  const [filterBranch, setFB] = useState('');
  const [filterDept, setFD] = useState('');
  const [filterStatus, setFS] = useState('active');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    getStaff().then(r => setStaff(r.data)).catch(() => toast.error('Failed to load staff')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => staff.filter(s => {
    const q = search.toLowerCase();
    const ms = !q || [s.name, s.empId, s.branch, s.dept, s.department, s.position].some(x => x?.toLowerCase().includes(q));
    const mb = !filterBranch || s.branch === filterBranch;
    const md = !filterDept || s.department === filterDept || s.dept === filterDept;
    const mst = !filterStatus || s.status === filterStatus;
    return ms && mb && md && mst;
  }), [staff, search, filterBranch, filterDept, filterStatus]);

  const handleSave = async (form, photoFile) => {
    setSaving(true);
    try {
      let saved;
      if (modal.staff) {
        const r = await updateStaff(modal.staff._id, form);
        saved = r.data;
        toast.success('Staff updated');
      } else {
        const r = await createStaff(form);
        saved = r.data;
        toast.success(`${saved.name} added (${saved.empId})`);
      }
      if (photoFile) {
        const fd = new FormData();
        fd.append('photo', photoFile);
        await uploadPhoto(saved._id, fd);
      }
      load();
      setModal(null);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error saving staff');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteStaff(id);
      toast.success('Staff removed');
      load();
      setConfirm(null);
      setModal(null);
    } catch (e) { toast.error(e.response?.data?.error || 'Error'); }
  };

  const statusColor = s => s === 'active' ? '#059669' : s === 'suspended' ? '#d97706' : '#dc2626';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Directory</h1>
          <p className="page-sub">{filtered.length} of {staff.length} staff</p>
        </div>
        {can('edit_staff') && (
          <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}>+ Add Staff</button>
        )}
      </div>

      <div className="filters">
        <select className="filter-select" value={filterBranch} onChange={e => setFB(e.target.value)}>
          <option value="">All Branches</option>
          {BRANCHES.map(b => <option key={b}>{b}</option>)}
        </select>
        <select className="filter-select" value={filterDept} onChange={e => setFD(e.target.value)}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFS(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        {(filterBranch || filterDept || filterStatus) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setFB(''); setFD(''); setFS(''); }}>Clear</button>
        )}
      </div>

      {loading ? <Spinner /> : (
        <div className="table-container">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {['', 'Emp ID', 'Name', 'Branch', 'Department', 'Position', 'Gross', 'Net', 'Status', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map(s => (
                  <tr key={s._id}>
                    <td><Avatar staff={s} size={32} onClick={() => setPhotoModal(s)} /></td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>{s.empId}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.branch}</td>
                    <td style={{ fontSize: 12 }}>{s.department || s.dept || '-'}</td>
                    <td style={{ fontSize: 12 }}>{s.position || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(s.gross)}</td>
                    <td style={{ fontWeight: 700, color: '#059669' }}>{fmt(s.net)}</td>
                    <td><Badge color={statusColor(s.status)}>{s.status || 'active'}</Badge></td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal({ type: 'view', staff: s })}>View</button>
                        {can('edit_staff') && <>
                          <button className="btn btn-edit-soft btn-sm" onClick={() => setModal({ type: 'edit', staff: s })}>Edit</button>
                          <button className="btn btn-danger-soft btn-sm" onClick={() => setConfirm(s._id)}>Del</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 200 && (
            <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, borderTop: '1px solid var(--border)' }}>
              Showing 200 of {filtered.length} — use search/filters to narrow results
            </div>
          )}
          {filtered.length === 0 && <Empty icon="👤" title="No staff found" sub="Try adjusting your filters" />}
        </div>
      )}

      {/* Modals */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <Modal title={modal.type === 'edit' ? 'Edit Staff Profile' : 'Add New Staff'} onClose={() => setModal(null)} wide>
          <StaffForm staff={modal.staff} onSave={handleSave} onClose={() => setModal(null)} loading={saving} />
        </Modal>
      )}

      {modal?.type === 'view' && (
        <Modal title="Staff Details" onClose={() => setModal(null)}>
          <StaffDetailView
            staff={modal.staff}
            onEdit={() => setModal({ type: 'edit', staff: modal.staff })}
            onClose={() => setModal(null)}
            onPhotoClick={() => setPhotoModal(modal.staff)}
            canEdit={can('edit_staff')}
          />
        </Modal>
      )}

      {photoModal && <PhotoLightbox staff={photoModal} onClose={() => setPhotoModal(null)} />}

      {confirm && (
        <ConfirmDialog
          title="Delete Staff"
          message="This will permanently delete this staff profile. This cannot be undone."
          danger
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

function StaffDetailView({ staff, onEdit, onClose, onPhotoClick, canEdit }) {
  const net = (staff.gross || 0) - (staff.paye || 0) - (staff.vaccine || 0) - (staff.loan || 0) - (staff.otherDeductions || 0);
  const Row = ({ l, v }) => v ? (
    <div style={{ display: 'flex', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: 155, flexShrink: 0, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{l}</span>
      <span style={{ fontSize: 13, color: 'var(--text)' }}>{v}</span>
    </div>
  ) : null;

  const statusColor = s => s === 'active' ? '#059669' : s === 'suspended' ? '#d97706' : '#dc2626';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <Avatar staff={staff} size={76} onClick={onPhotoClick} />
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{staff.name}</h2>
          <p style={{ margin: '3px 0 6px', color: 'var(--text-muted)', fontSize: 13 }}>{staff.empId} · {staff.branch}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge color={statusColor(staff.status)}>{(staff.status || 'active').toUpperCase()}</Badge>
            {staff.department && <Badge color="#0ea5e9">{staff.department}</Badge>}
            {staff.position && <Badge color="var(--accent)">{staff.position}</Badge>}
          </div>
        </div>
      </div>

      <SectionTitle>Personal Information</SectionTitle>
      <Row l="Resumption Date" v={staff.resumption} />
      <Row l="Date of Birth" v={staff.dob} />
      <Row l="Tel. Number" v={staff.phone} />
      <Row l="NIN" v={staff.nin} />
      <Row l="Address" v={staff.address} />

      {(staff.kin_name || staff.kin_phone) && <>
        <SectionTitle>Next of Kin</SectionTitle>
        <Row l="Name" v={staff.kin_name} />
        <Row l="Tel. Number" v={staff.kin_phone} />
        <Row l="Relationship" v={staff.kin_rel} />
        <Row l="Address" v={staff.kin_address} />
      </>}

      {(staff.accNum || staff.bank) && <>
        <SectionTitle>Bank Account</SectionTitle>
        <Row l="Account Number" v={staff.accNum} />
        <Row l="Bank" v={staff.bank} />
      </>}

      <SectionTitle>Salary</SectionTitle>
      <Row l="Gross Salary" v={fmt(staff.gross)} />
      {(staff.paye || 0) > 0 && <Row l="PAYE" v={fmt(staff.paye)} />}
      {(staff.vaccine || 0) > 0 && <Row l="Vaccine" v={fmt(staff.vaccine)} />}
      {(staff.loan || 0) > 0 && <Row l="Loan Repayment" v={fmt(staff.loan)} />}
      {(staff.otherDeductions || 0) > 0 && <Row l="Other Deductions" v={fmt(staff.otherDeductions)} />}
      <div style={{ display: 'flex', padding: '10px 8px', background: 'rgba(124,58,237,0.08)', borderRadius: 8, marginTop: 4 }}>
        <span style={{ width: 155, flexShrink: 0, fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>Net Salary</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>{fmt(net)}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 14, marginTop: 14, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        {canEdit && <button className="btn btn-primary btn-sm" onClick={onEdit}>Edit Profile</button>}
      </div>
    </div>
  );
}

// ─── PAYROLL PAGE ─────────────────────────────────────────────────────────────
export function PayrollPage() {
  const { can } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payrollList, setPayrollList] = useState([]);
  const [current, setCurrent] = useState(null);
  const [filterBranch, setFB] = useState('');
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const period = `${year}-${String(month).padStart(2, '0')}`;

  useEffect(() => {
    getPayroll().then(r => setPayrollList(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const found = payrollList.find(p => p.period === period);
    setCurrent(found || null);
  }, [payrollList, period]);

  const handleRun = async () => {
    setRunning(true);
    try {
      const r = await apiRunPayroll({ month, year });
      const updated = payrollList.filter(p => p.period !== period);
      setPayrollList([...updated, r.data]);
      setCurrent(r.data);
      toast.success(`Payroll generated for ${period}`);
    } catch (e) { toast.error(e.response?.data?.error || 'Error running payroll'); }
    finally { setRunning(false); }
  };

  const handleLock = async () => {
    if (!window.confirm('Lock this payroll? Records cannot be changed after locking.')) return;
    try {
      await apiLockPayroll(period);
      setCurrent(c => ({ ...c, locked: true }));
      toast.success('Payroll locked');
    } catch (e) { toast.error('Error locking payroll'); }
  };

  const canEdit = can('run_payroll');
  const records = useMemo(() =>
    (current?.records || []).filter(r => !filterBranch || r.branch === filterBranch),
    [current, filterBranch]
  );

  const tg = records.reduce((a, r) => a + (r.proRata || r.gross || 0), 0);
  const tn = records.reduce((a, r) => a + (r.net || 0), 0);
  const tp = records.reduce((a, r) => a + (r.paye || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="page-sub">Generate and manage monthly salary runs</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="filter-select" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input
            className="filter-select"
            type="number"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            style={{ width: 82 }}
          />
          {canEdit && !current?.locked && (
            <button className="btn btn-primary" onClick={handleRun} disabled={running}>
              {running ? <><div className="spinner" /> Running...</> : (current ? '⟳ Re-run' : '▶ Run Payroll')}
            </button>
          )}
          {current && canEdit && !current.locked && (
            <button className="btn btn-success" onClick={handleLock}>🔒 Lock</button>
          )}
          {current && (
            <button className="btn btn-secondary no-print" onClick={() => window.print()}>🖨 Print</button>
          )}
        </div>
      </div>

      {current ? (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            {[['Total Gross', fmt(tg), 'var(--text)'], ['PAYE', fmt(tp), '#dc2626'], ['Net Pay', fmt(tn), '#059669'], ['Staff', records.length, 'var(--accent)']].map(([l, v, c]) => (
              <div key={l} className="card" style={{ padding: '10px 18px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
              </div>
            ))}
            {current.locked && <Badge color="#059669">LOCKED</Badge>}
          </div>

          <div className="filters">
            <select className="filter-select" value={filterBranch} onChange={e => setFB(e.target.value)}>
              <option value="">All Branches</option>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>

          <div className="table-container">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {['Emp ID', 'Name', 'Branch', 'Dept', 'Days', 'Absent', 'Worked', 'Gross', 'Pro-Rata', 'PAYE', 'Vaccine', 'Loan', 'Net'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.empId + i}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>{r.empId}</td>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.branch}</td>
                      <td style={{ fontSize: 12 }}>{r.dept}</td>
                      <td style={{ textAlign: 'center' }}>{r.daysInMonth}</td>
                      <td style={{ textAlign: 'center', color: r.daysAbsent > 0 ? '#dc2626' : 'var(--text-muted)' }}>{r.daysAbsent}</td>
                      <td style={{ textAlign: 'center' }}>{r.daysWorked}</td>
                      <td>{fmt(r.gross)}</td>
                      <td style={{ fontWeight: r.proRata !== r.gross ? 700 : 'normal', color: r.proRata !== r.gross ? '#d97706' : 'var(--text)' }}>{fmt(r.proRata)}</td>
                      <td style={{ color: '#dc2626' }}>{fmt(r.paye)}</td>
                      <td style={{ color: '#d97706' }}>{r.vaccine > 0 ? fmt(r.vaccine) : '-'}</td>
                      <td style={{ color: '#d97706' }}>{r.loan > 0 ? fmt(r.loan) : '-'}</td>
                      <td style={{ fontWeight: 800, color: '#059669', fontSize: 14 }}>{fmt(r.net)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'right', paddingRight: 14 }}>TOTALS</td>
                    <td>{fmt(tg)}</td>
                    <td style={{ color: '#dc2626' }}>{fmt(tp)}</td>
                    <td colSpan={2} />
                    <td style={{ color: '#059669', fontSize: 14 }}>{fmt(tn)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : (
        <Empty icon="💰" title={`No payroll for ${MONTHS[month - 1]} ${year}`}
          sub={canEdit ? 'Click "Run Payroll" to generate salary records for this period.' : 'No payroll has been run for this period yet.'}
          action={canEdit && <button className="btn btn-primary" onClick={handleRun} disabled={running}>▶ Run Payroll</button>}
        />
      )}
    </div>
  );
}

// ─── ATTENDANCE PAGE ──────────────────────────────────────────────────────────
export function AttendancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [staff, setStaff] = useState([]);
  const [absences, setAbsences] = useState({});
  const [saving, setSaving] = useState(false);

  const period = `${year}-${String(month).padStart(2, '0')}`;
  const daysInMonth = getDaysInMonth(year, month);

  useEffect(() => {
    getStaff().then(r => setStaff(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    getAttendance(period).then(r => {
      const map = {};
      r.data.forEach(a => { map[a.staffId] = a.daysAbsent; });
      setAbsences(map);
    }).catch(() => {});
  }, [period]);

  const branchStaff = staff.filter(s => s.branch === branch && s.status === 'active');

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = branchStaff.map(s => ({ staffId: s._id, daysAbsent: absences[s._id] || 0 }));
      await saveAttendanceBulk({ period, records });
      toast.success('Attendance saved');
    } catch (e) { toast.error('Error saving attendance'); }
    finally { setSaving(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-sub">Set days absent per staff member</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><div className="spinner" /> Saving...</> : '💾 Save Attendance'}
        </button>
      </div>

      <div className="filters">
        <select className="filter-select" value={month} onChange={e => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input className="filter-select" type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 82 }} />
        <select className="filter-select" value={branch} onChange={e => setBranch(e.target.value)}>
          {BRANCHES.map(b => <option key={b}>{b}</option>)}
        </select>
      </div>

      <div className="table-container">
        <div style={{ padding: '10px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
          {branch} · {MONTHS[month - 1]} {year} · {daysInMonth} calendar days · {branchStaff.length} staff
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {['Emp ID', 'Name', 'Department', 'Days in Month', 'Days Absent', 'Days Worked', 'Attendance %'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {branchStaff.map(s => {
                const absent = absences[s._id] || 0;
                const worked = daysInMonth - absent;
                const pct = Math.round((worked / daysInMonth) * 100);
                const col = pct === 100 ? '#059669' : pct >= 80 ? '#d97706' : '#dc2626';
                return (
                  <tr key={s._id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>{s.empId}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.department || s.dept || '-'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{daysInMonth}</td>
                    <td>
                      <input
                        type="number" min={0} max={daysInMonth}
                        value={absent}
                        onChange={e => setAbsences(a => ({ ...a, [s._id]: Math.max(0, Math.min(daysInMonth, Number(e.target.value))) }))}
                        style={{
                          width: 65, padding: '5px 8px',
                          border: `1px solid ${absent > 0 ? '#d97706' : 'var(--border)'}`,
                          borderRadius: 6, background: 'var(--bg)', color: absent > 0 ? '#d97706' : 'var(--text)',
                          textAlign: 'center', fontSize: 14, fontWeight: 700
                        }}
                      />
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: absent > 0 ? '#d97706' : 'var(--text)' }}>{worked}</td>
                    <td><ProgressBar value={worked} max={daysInMonth} color={col} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {branchStaff.length === 0 && <Empty icon="📅" title="No active staff in this branch" />}
      </div>
    </div>
  );
}

// ─── LOANS PAGE ───────────────────────────────────────────────────────────────
export function LoansPage() {
  const { can } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLoan, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const empty = { name: '', position: '', branch: '', loanAmount: 0, monthReq: '', monthlyRepayment: 0, balance: 0, monthPaid: '' };
  const [form, setForm] = useState(empty);
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const load = () => {
    setLoading(true);
    getLoans().then(r => setLoans(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editingLoan) { await updateLoan(editingLoan._id, form); toast.success('Loan updated'); }
      else { await createLoan(form); toast.success('Loan added'); }
      load(); setShowForm(false); setEditing(null); setForm(empty);
    } catch (e) { toast.error(e.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteLoan(id); toast.success('Loan deleted'); load(); setConfirm(null); }
    catch (e) { toast.error('Error deleting loan'); }
  };

  const tb = loans.reduce((a, l) => a + (l.balance || 0), 0);
  const tl = loans.reduce((a, l) => a + (l.loanAmount || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Loan Management</h1>
          <p className="page-sub">{loans.length} active loans</p>
        </div>
        {can('edit_loans') && (
          <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}>+ Add Loan</button>
        )}
      </div>

      <div className="stat-grid">
        <StatCard label="Total Loaned" value={fmt(tl)} color="#d97706" />
        <StatCard label="Outstanding Balance" value={fmt(tb)} color="#dc2626" />
        <StatCard label="Total Repaid" value={fmt(tl - tb)} color="#059669" />
        <StatCard label="Active Loans" value={loans.length} color="#7c3aed" />
      </div>

      {showForm && (
        <div className="card card-body" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>{editingLoan ? 'Edit Loan' : 'New Loan'}</div>
          <div className="form-grid">
            <Field label="Staff Name" half><Input value={form.name} onChange={v => s('name', v)} /></Field>
            <Field label="Branch" half><Select value={form.branch} onChange={v => s('branch', v)} options={BRANCHES} /></Field>
            <Field label="Position" half><Input value={form.position} onChange={v => s('position', v)} /></Field>
            <Field label="Month Requested" half><Input value={form.monthReq} onChange={v => s('monthReq', v)} placeholder="e.g. JAN, 2026" /></Field>
            <Field label="Loan Amount (₦)" half><Input value={form.loanAmount} onChange={v => s('loanAmount', Number(v))} type="number" /></Field>
            <Field label="Monthly Repayment (₦)" half><Input value={form.monthlyRepayment} onChange={v => s('monthlyRepayment', Number(v))} type="number" /></Field>
            <Field label="Current Balance (₦)" half><Input value={form.balance} onChange={v => s('balance', Number(v))} type="number" /></Field>
            <Field label="Last Month Paid" half><Input value={form.monthPaid} onChange={v => s('monthPaid', v)} placeholder="APR '26" /></Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <><div className="spinner" /> Saving...</> : (editingLoan ? 'Save' : 'Add Loan')}
            </button>
            <button className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className="table-container">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {['#', 'Name', 'Position', 'Branch', 'Amount', 'Monthly', 'Balance', 'Month Req', 'Last Paid', 'Repaid', ''].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {loans.map((l, i) => {
                  const pct = l.loanAmount ? (l.loanAmount - l.balance) / l.loanAmount * 100 : 0;
                  return (
                    <tr key={l._id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 700 }}>{l.name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{l.position}</td>
                      <td style={{ fontSize: 12 }}>{l.branch}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(l.loanAmount)}</td>
                      <td style={{ color: '#d97706' }}>{fmt(l.monthlyRepayment)}</td>
                      <td style={{ fontWeight: 800, color: l.balance > 0 ? '#dc2626' : '#059669' }}>{fmt(l.balance)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.monthReq || '-'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.monthPaid || '-'}</td>
                      <td style={{ minWidth: 90 }}><ProgressBar value={l.loanAmount - l.balance} max={l.loanAmount} color="#059669" /></td>
                      <td>
                        {can('edit_loans') && (
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button className="btn btn-edit-soft btn-sm" onClick={() => { setEditing(l); setForm({ ...l }); setShowForm(true); }}>Edit</button>
                            <button className="btn btn-danger-soft btn-sm" onClick={() => setConfirm(l._id)}>Del</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {loans.length === 0 && <Empty icon="💳" title="No loans recorded" />}
        </div>
      )}

      {confirm && (
        <ConfirmDialog title="Delete Loan" message="Delete this loan record permanently?" danger
          onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
}

// ─── ANALYTICS PAGE ───────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const [data, setData] = useState(null);
  useEffect(() => { getAnalytics().then(r => setData(r.data)).catch(() => {}); }, []);
  if (!data) return <Spinner />;

  const { byBranch = {}, byDept = {}, payrollHistory = [], totalStaff } = data;
  const branchArr = Object.entries(byBranch).map(([b, v]) => ({ branch: b, ...v })).sort((a, b) => b.payroll - a.payroll);
  const deptArr = Object.entries(byDept).map(([d, v]) => ({ dept: d, ...v })).sort((a, b) => b.payroll - a.payroll);
  const sortedH = [...payrollHistory].sort((a, b) => a.period.localeCompare(b.period)).slice(-8);
  const maxP = Math.max(...sortedH.map(h => h.totalNet), 1);

  const gross = branchArr.reduce((a, b) => a + (b.payroll || 0), 0);

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Analytics</h1>

      {sortedH.length > 0 && (
        <div className="card card-body" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Payroll Trend — Net Pay</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 150 }}>
            {sortedH.map((h, i) => {
              const prev = sortedH[i - 1];
              const ht = Math.max(6, Math.round((h.totalNet / maxP) * 130));
              const up = !prev || h.totalNet >= prev.totalNet;
              return (
                <div key={h.period} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  {prev && <div style={{ fontSize: 9, fontWeight: 700, color: up ? '#059669' : '#dc2626' }}>{up ? '▲' : '▼'}{Math.abs(Math.round((h.totalNet - prev.totalNet) / (prev.totalNet || 1) * 100))}%</div>}
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>{fmt(h.totalNet)}</div>
                  <div style={{ width: '100%', height: ht, background: 'var(--accent)', borderRadius: '4px 4px 0 0', opacity: 0.82 }} />
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{h.period}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card card-body">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Net Payroll by Branch</div>
          {branchArr.map(({ branch, count, payroll }) => (
            <div key={branch} style={{ marginBottom: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12 }}>{branch} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({count})</span></span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{fmt(payroll)}</span>
              </div>
              <ProgressBar value={payroll} max={branchArr[0]?.payroll || 1} color="var(--accent)" />
            </div>
          ))}
        </div>
        <div className="card card-body">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Net Payroll by Department</div>
          {deptArr.map(({ dept, count, payroll }) => (
            <div key={dept} style={{ marginBottom: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12 }}>{dept} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({count})</span></span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0ea5e9' }}>{fmt(payroll)}</span>
              </div>
              <ProgressBar value={payroll} max={deptArr[0]?.payroll || 1} color="#0ea5e9" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── REPORTS PAGE ─────────────────────────────────────────────────────────────
export function ReportsPage() {
  const [allStaff, setAllStaff] = useState([]);
  const [branch, setBranch] = useState(BRANCHES[0]);
  useEffect(() => { getStaff().then(r => setAllStaff(r.data)).catch(() => {}); }, []);

  const branchStaff = allStaff.filter(s => s.branch === branch && s.status === 'active');
  const isHQ = branch === 'HEAD OFFICE';

  const grouped = useMemo(() => {
    const order = isHQ ? DEPARTMENTS : DEPT_ORDER;
    const out = [];
    const added = new Set();
    order.forEach(dept => {
      const ds = branchStaff.filter(s => (s.department === dept || s.dept === dept) && !added.has(s._id));
      if (ds.length) { out.push({ dept, staff: ds }); ds.forEach(s => added.add(s._id)); }
    });
    const others = branchStaff.filter(s => !added.has(s._id));
    if (others.length) {
      DEPARTMENTS.filter(d => !order.includes(d)).forEach(dept => {
        const ds = others.filter(s => (s.department === dept || s.dept === dept) && !added.has(s._id));
        if (ds.length) { out.push({ dept, staff: ds }); ds.forEach(s => added.add(s._id)); }
      });
      const remaining = branchStaff.filter(s => !added.has(s._id));
      if (remaining.length) out.push({ dept: 'Other', staff: remaining });
    }
    return out;
  }, [branchStaff, isHQ]);

  const tg = branchStaff.reduce((a, s) => a + (s.gross || 0), 0);
  const tn = branchStaff.reduce((a, s) => a + (s.net || 0), 0);
  const tp = branchStaff.reduce((a, s) => a + (s.paye || 0), 0);

  return (
    <div className="page">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-sub">Printable salary schedules</p>
        </div>
        <button className="btn btn-secondary" onClick={() => window.print()}>🖨️ Print Report</button>
      </div>

      <div className="filters no-print">
        <select className="filter-select" value={branch} onChange={e => setBranch(e.target.value)}>
          {BRANCHES.map(b => <option key={b}>{b}</option>)}
        </select>
      </div>

      <div className="card card-body">
        <div style={{ textAlign: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{branch}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            SALARY SCHEDULE — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
          </div>
        </div>

        {grouped.map(({ dept, staff }) => (
          <div key={dept} style={{ marginBottom: 20 }}>
            <div style={{ background: 'var(--bg2)', padding: '5px 12px', borderRadius: 6, marginBottom: 6, fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', borderLeft: '3px solid var(--accent)', color: 'var(--text)' }}>
              {dept}
            </div>
            <table style={{ minWidth: 'auto' }}>
              <thead>
                <tr>
                  {['S/N', 'Emp ID', 'Name', 'Dept', 'Gross', 'PAYE', 'Vaccine', 'Loan', 'Net'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {staff.map((s, i) => (
                  <tr key={s._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: 11 }}>{s.empId}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.dept || '-'}</td>
                    <td>{fmt(s.gross)}</td>
                    <td style={{ color: '#dc2626' }}>{s.paye > 0 ? fmt(s.paye) : '-'}</td>
                    <td style={{ color: '#d97706' }}>{s.vaccine > 0 ? fmt(s.vaccine) : '-'}</td>
                    <td style={{ color: '#d97706' }}>{s.loan > 0 ? fmt(s.loan) : '-'}</td>
                    <td style={{ fontWeight: 800, color: '#059669' }}>{fmt(s.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div style={{ borderTop: '2px solid var(--border)', paddingTop: 12, display: 'flex', gap: 20, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>GROSS: <span>{fmt(tg)}</span></div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>PAYE: <span style={{ color: '#dc2626' }}>{fmt(tp)}</span></div>
          <div style={{ fontWeight: 800, fontSize: 14 }}>NET: <span style={{ color: '#059669' }}>{fmt(tn)}</span></div>
        </div>
      </div>

      {/* Bank Transfer List */}
      {branchStaff.filter(s => s.accNum).length > 0 && (
        <div className="card card-body" style={{ marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{branch} — Bank Transfer List</div>
          <table style={{ minWidth: 'auto' }}>
            <thead>
              <tr>{['#', 'Emp ID', 'Name', 'Net Amount', 'Account No.', 'Bank'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {branchStaff.filter(s => s.accNum).map((s, i) => (
                <tr key={s._id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: 11 }}>{s.empId}</td>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td style={{ fontWeight: 800, color: '#059669' }}>{fmt(s.net)}</td>
                  <td style={{ fontFamily: 'monospace' }}>{s.accNum}</td>
                  <td style={{ fontSize: 12 }}>{s.bank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── USERS PAGE ───────────────────────────────────────────────────────────────
export function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const empty = { username: '', password: '', name: '', role: 'viewer', branch: 'ALL', active: true };
  const [form, setForm] = useState(empty);
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const load = () => getUsers().then(r => setUsers(r.data)).catch(() => {});
  useEffect(load, []);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editing) { await updateUser(editing._id, form); toast.success('User updated'); }
      else { await createUser(form); toast.success('User created'); }
      load(); setShowForm(false); setEditing(null); setForm(empty);
    } catch (e) { toast.error(e.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    try { await deleteUser(id); toast.success('User deleted'); load(); setConfirm(null); }
    catch (e) { toast.error(e.response?.data?.error || 'Error'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-sub">Manage system access & roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}>+ Add User</button>
      </div>

      {showForm && (
        <div className="card card-body" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{editing ? 'Edit User' : 'New User'}</div>
          <div className="form-grid">
            <Field label="Full Name" half><Input value={form.name} onChange={v => s('name', v)} /></Field>
            <Field label="Username" half><Input value={form.username} onChange={v => s('username', v)} /></Field>
            <Field label="Password" half><Input value={form.password} onChange={v => s('password', v)} type="password" placeholder={editing ? 'Leave blank to keep current' : 'Set password'} /></Field>
            <Field label="Role" half>
              <Select value={form.role} onChange={v => s('role', v)} options={Object.entries(ROLES).map(([k, v]) => ({ value: k, label: v.label }))} />
            </Field>
            <Field label="Branch Access" half>
              <Select value={form.branch} onChange={v => s('branch', v)} options={[{ value: 'ALL', label: 'All Branches' }, ...BRANCHES.map(b => ({ value: b, label: b }))]} />
            </Field>
            <Field label="Status" half>
              <Select value={form.active ? 'true' : 'false'} onChange={v => s('active', v === 'true')} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Disabled' }]} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <><div className="spinner" /> Saving...</> : (editing ? 'Save' : 'Create User')}
            </button>
            <button className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>{['Name', 'Username', 'Role', 'Branch', 'Status', ''].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 700 }}>{u.name}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{u.username}</td>
                  <td><Badge color={ROLES[u.role]?.color || '#64748b'}>{ROLES[u.role]?.label || u.role}</Badge></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.branch}</td>
                  <td><Badge color={u.active ? '#059669' : '#dc2626'}>{u.active ? 'Active' : 'Disabled'}</Badge></td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-edit-soft btn-sm" onClick={() => { setEditing(u); setForm({ ...u, password: '' }); setShowForm(true); }}>Edit</button>
                      <button className="btn btn-danger-soft btn-sm" disabled={u._id === me?._id} onClick={() => setConfirm(u._id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirm && (
        <ConfirmDialog title="Delete User" message="Delete this user account permanently?" danger
          onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
}

// ─── AUDIT PAGE ───────────────────────────────────────────────────────────────
export function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => { getAuditLog().then(r => setLogs(r.data)).catch(() => {}); }, []);

  const filtered = logs.filter(e => !q || [e.action, e.details, e.username].some(x => x?.toLowerCase().includes(q.toLowerCase())));

  const actionColor = a => {
    if (a?.includes('DELETE') || a?.includes('DEL')) return '#dc2626';
    if (a?.includes('ADD') || a?.includes('CREATE')) return '#059669';
    if (a?.includes('EDIT') || a?.includes('UPDATE')) return '#0ea5e9';
    if (a?.includes('LOGIN') || a?.includes('LOGOUT')) return '#7c3aed';
    return '#d97706';
  };

  return (
    <div className="page">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Audit Log</h1>
        <p className="page-sub">{logs.length} total entries</p>
      </div>
      <div style={{ marginBottom: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search actions, details, users..."
          className="filter-select" style={{ width: '100%', maxWidth: 400 }} />
      </div>
      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>{['Time', 'User', 'Action', 'Details'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.slice(0, 300).map(e => (
                <tr key={e._id}>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(e.timestamp).toLocaleString()}</td>
                  <td style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{e.username || 'system'}</td>
                  <td><Badge color={actionColor(e.action)}>{e.action}</Badge></td>
                  <td style={{ fontSize: 12 }}>{e.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <Empty icon="🔍" title="No entries found" />}
      </div>
    </div>
  );
}

// ─── BACKUP PAGE ──────────────────────────────────────────────────────────────
export function BackupPage() {
  const { user } = useAuth();
  const canExport = user?.role === 'superadmin';
  const importRef = useRef();

  const handleImport = async e => {
    const file = e.target.files[0];
    if (!file) return;
    toast('Import via server restart with new data file — see README for details.', { icon: 'ℹ️' });
  };

  return (
    <div className="page">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Backup & Restore</h1>
        <p className="page-sub">Export or restore your HR database</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card card-body" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💾</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Export Backup</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Download all data as a JSON file including staff, loans, payroll history, audit log</p>
          {canExport
            ? <button className="btn btn-primary" onClick={exportBackup}>Download Backup</button>
            : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Super Admin access required</p>
          }
        </div>

        <div className="card card-body" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔄</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Data Files</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 10 }}>Database files are stored in <code style={{ background: 'var(--bg3)', padding: '2px 6px', borderRadius: 4 }}>/data/</code> on the server</p>
          <p style={{ color: '#d97706', fontSize: 12, marginBottom: 14 }}>📁 staff.db · loans.db · payroll.db · users.db · audit.db · attendance.db</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Copy these files regularly for off-site backup</p>
        </div>
      </div>

      <div className="card card-body">
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Deployment Guide</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <p><strong style={{ color: 'var(--text)' }}>🌐 Deploy to Render.com (Free):</strong></p>
          <ol style={{ paddingLeft: 20, marginTop: 6, marginBottom: 12 }}>
            <li>Push code to GitHub</li>
            <li>Go to <strong>render.com</strong> → New Web Service</li>
            <li>Connect your GitHub repo</li>
            <li>Build Command: <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3 }}>cd client && npm install && npm run build</code></li>
            <li>Start Command: <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3 }}>NODE_ENV=production node server/index.js</code></li>
            <li>Add env vars: <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3 }}>SESSION_SECRET</code>, <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3 }}>NODE_ENV=production</code></li>
          </ol>
          <p><strong style={{ color: 'var(--text)' }}>🐳 Docker:</strong> A <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3 }}>Dockerfile</code> is included in the project root for containerised deployment.</p>
        </div>
      </div>
    </div>
  );
}
