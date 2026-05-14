const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { dbFind, dbFindOne, dbInsert, dbUpdate, dbRemove, UPLOADS_DIR } = require('./db');
const { requireAuth, requireRole } = require('./middleware');

const BRANCH_CODES = {
  'MOJIDI':'MOJ','ALADE':'ALD','BANK A':'BKA','GRA':'GRA','AIRPORT':'APT',
  'RELIANCE':'REL','ONIRU':'ONR','RESIDENCE':'RES','FREEDOM':'FRD',
  'SIGNATURE':'SIG','V-ISLAND':'VIL','CASTLE':'CST','B-ISLAND':'BIS',
  'FAJODD-4':'FJD','WHITE HOUSE':'WHT','WATERS':'WTR','IKOYI':'IKY',
  'KURAMO':'KRM','AWOLOWO':'AWL','WUSE-2':'WS2','JABI':'JAB','HEAD OFFICE':'HQO'
};

// Multer setup for photo uploads
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `photo_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

async function addAudit(userId, username, action, details) {
  await dbInsert('audit', {
    userId, username, action, details,
    timestamp: new Date().toISOString()
  });
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await dbFindOne('users', { username });
    if (!user || !user.active) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.userId = user._id;
    await dbUpdate('users', { _id: user._id }, { $set: { lastLogin: new Date().toISOString() } });
    await addAudit(user._id, user.username, 'LOGIN', `${user.name} signed in`);

    const { password: _, ...safe } = user;
    res.json({ user: safe });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/auth/logout', requireAuth, async (req, res) => {
  await addAudit(req.session.userId, '', 'LOGOUT', 'User logged out');
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/auth/me', requireAuth, async (req, res) => {
  const user = await dbFindOne('users', { _id: req.session.userId });
  if (!user) return res.status(401).json({ error: 'Not found' });
  const { password: _, ...safe } = user;
  res.json({ user: safe });
});

router.post('/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await dbFindOne('users', { _id: req.session.userId });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ error: 'Current password incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await dbUpdate('users', { _id: req.session.userId }, { $set: { password: hashed } });
    await addAudit(user._id, user.username, 'CHANGE_PASSWORD', 'Password changed');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── STAFF ────────────────────────────────────────────────────────────────────
router.get('/staff', requireAuth, async (req, res) => {
  try {
    const user = await dbFindOne('users', { _id: req.session.userId });
    let query = {};
    if (user.role === 'branch_manager' && user.branch !== 'ALL') {
      query.branch = user.branch;
    }
    const staff = await dbFind('staff', query, { branch: 1, name: 1 });
    res.json(staff);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/staff/:id', requireAuth, async (req, res) => {
  try {
    const s = await dbFindOne('staff', { _id: req.params.id });
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function nextEmpId(branch, existingStaff) {
  const code = BRANCH_CODES[branch] || branch.slice(0,3).toUpperCase();
  const prefix = `PSK/${code}/`;
  const existing = await dbFind('staff', { branch });
  const nums = existing
    .filter(s => s.empId?.startsWith(prefix))
    .map(s => parseInt(s.empId.split('/')[2] || 0))
    .filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

router.post('/staff', requireAuth, requireRole('superadmin','hr'), async (req, res) => {
  try {
    const user = await dbFindOne('users', { _id: req.session.userId });
    const data = req.body;
    const empId = await nextEmpId(data.branch);
    data.net = Math.max(0, (data.gross||0) - (data.paye||0) - (data.vaccine||0) - (data.loan||0) - (data.otherDeductions||0));
    const now = new Date().toISOString();
    const s = await dbInsert('staff', { ...data, empId, createdAt: now, updatedAt: now });
    await addAudit(user._id, user.username, 'ADD_STAFF', `Added ${data.name} (${empId})`);
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/staff/:id', requireAuth, requireRole('superadmin','hr'), async (req, res) => {
  try {
    const user = await dbFindOne('users', { _id: req.session.userId });
    const orig = await dbFindOne('staff', { _id: req.params.id });
    if (!orig) return res.status(404).json({ error: 'Not found' });

    const data = req.body;
    let empId = orig.empId;

    // Auto-change EmpID on branch transfer
    if (data.branch && data.branch !== orig.branch) {
      empId = await nextEmpId(data.branch);
      await addAudit(user._id, user.username, 'TRANSFER',
        `${data.name}: ${orig.branch} → ${data.branch}. New ID: ${empId}`);
    }

    data.net = Math.max(0, (data.gross||0) - (data.paye||0) - (data.vaccine||0) - (data.loan||0) - (data.otherDeductions||0));
    data.empId = empId;
    data.updatedAt = new Date().toISOString();

    await dbUpdate('staff', { _id: req.params.id }, { $set: data });
    const updated = await dbFindOne('staff', { _id: req.params.id });
    await addAudit(user._id, user.username, 'EDIT_STAFF', `Updated ${data.name} (${empId})`);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/staff/:id', requireAuth, requireRole('superadmin','hr'), async (req, res) => {
  try {
    const user = await dbFindOne('users', { _id: req.session.userId });
    const s = await dbFindOne('staff', { _id: req.params.id });
    if (!s) return res.status(404).json({ error: 'Not found' });
    await dbRemove('staff', { _id: req.params.id });
    await addAudit(user._id, user.username, 'DELETE_STAFF', `Deleted ${s.name} (${s.empId})`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Photo upload
router.post('/staff/:id/photo', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const user = await dbFindOne('users', { _id: req.session.userId });
    const s = await dbFindOne('staff', { _id: req.params.id });
    if (!s) return res.status(404).json({ error: 'Not found' });

    // Delete old photo
    if (s.photoFile && fs.existsSync(path.join(UPLOADS_DIR, s.photoFile))) {
      fs.unlinkSync(path.join(UPLOADS_DIR, s.photoFile));
    }

    const photoFile = req.file.filename;
    await dbUpdate('staff', { _id: req.params.id }, { $set: { photoFile, updatedAt: new Date().toISOString() } });
    await addAudit(user._id, user.username, 'PHOTO_UPLOAD', `Photo uploaded for ${s.name}`);
    res.json({ photoFile, url: `/uploads/${photoFile}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── LOANS ────────────────────────────────────────────────────────────────────
router.get('/loans', requireAuth, async (req, res) => {
  try {
    const loans = await dbFind('loans', {}, { branch: 1, name: 1 });
    res.json(loans);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/loans', requireAuth, requireRole('superadmin','hr'), async (req, res) => {
  try {
    const user = await dbFindOne('users', { _id: req.session.userId });
    const now = new Date().toISOString();
    const loan = await dbInsert('loans', { ...req.body, createdAt: now, updatedAt: now });
    await addAudit(user._id, user.username, 'ADD_LOAN', `Added loan for ${req.body.name}`);
    res.json(loan);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/loans/:id', requireAuth, requireRole('superadmin','hr','accounts'), async (req, res) => {
  try {
    const user = await dbFindOne('users', { _id: req.session.userId });
    await dbUpdate('loans', { _id: req.params.id }, { $set: { ...req.body, updatedAt: new Date().toISOString() } });
    const updated = await dbFindOne('loans', { _id: req.params.id });
    await addAudit(user._id, user.username, 'EDIT_LOAN', `Updated loan for ${req.body.name}`);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/loans/:id', requireAuth, requireRole('superadmin','hr'), async (req, res) => {
  try {
    const user = await dbFindOne('users', { _id: req.session.userId });
    const l = await dbFindOne('loans', { _id: req.params.id });
    if (!l) return res.status(404).json({ error: 'Not found' });
    await dbRemove('loans', { _id: req.params.id });
    await addAudit(user._id, user.username, 'DELETE_LOAN', `Deleted loan for ${l.name}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PAYROLL ──────────────────────────────────────────────────────────────────
router.get('/payroll', requireAuth, async (req, res) => {
  try {
    const records = await dbFind('payroll', {}, { period: -1 });
    res.json(records);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/payroll/:period', requireAuth, async (req, res) => {
  try {
    const record = await dbFindOne('payroll', { period: req.params.period });
    res.json(record || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/payroll/run', requireAuth, requireRole('superadmin','hr','accounts'), async (req, res) => {
  try {
    const user = await dbFindOne('users', { _id: req.session.userId });
    const { month, year } = req.body;
    const period = `${year}-${String(month).padStart(2,'0')}`;

    // Check if locked
    const existing = await dbFindOne('payroll', { period });
    if (existing?.locked) return res.status(400).json({ error: 'Payroll is locked for this period' });

    const daysInMonth = new Date(year, month, 0).getDate();
    const allStaff = await dbFind('staff', { status: 'active' });
    const allAttendance = await dbFind('attendance', { period });

    const records = allStaff.map(s => {
      const att = allAttendance.find(a => a.staffId === s._id);
      const daysAbsent = att?.daysAbsent || 0;
      const daysWorked = daysInMonth - daysAbsent;
      const proRata = daysAbsent > 0
        ? Math.round((s.gross / daysInMonth) * daysWorked)
        : s.gross;
      const net = Math.max(0, proRata - (s.paye||0) - (s.vaccine||0) - (s.loan||0) - (s.otherDeductions||0));
      return {
        staffId: s._id, empId: s.empId, name: s.name,
        branch: s.branch, dept: s.dept, department: s.department,
        gross: s.gross, proRata, daysInMonth, daysAbsent,
        daysWorked, paye: s.paye||0, vaccine: s.vaccine||0,
        loan: s.loan||0, otherDeductions: s.otherDeductions||0, net
      };
    });

    const now = new Date().toISOString();
    if (existing) {
      await dbUpdate('payroll', { period }, { $set: { records, generatedAt: now, locked: false } });
    } else {
      await dbInsert('payroll', { period, month, year, daysInMonth, records, locked: false, generatedAt: now });
    }

    await addAudit(user._id, user.username, 'PAYROLL_RUN', `Payroll ${period}: ${records.length} staff`);
    const result = await dbFindOne('payroll', { period });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/payroll/:period/lock', requireAuth, requireRole('superadmin','hr','accounts'), async (req, res) => {
  try {
    const user = await dbFindOne('users', { _id: req.session.userId });
    await dbUpdate('payroll', { period: req.params.period }, { $set: { locked: true, lockedAt: new Date().toISOString(), lockedBy: user.name } });
    await addAudit(user._id, user.username, 'PAYROLL_LOCK', `Locked payroll ${req.params.period}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────
router.get('/attendance/:period', requireAuth, async (req, res) => {
  try {
    const records = await dbFind('attendance', { period: req.params.period });
    res.json(records);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/attendance', requireAuth, async (req, res) => {
  try {
    const user = await dbFindOne('users', { _id: req.session.userId });
    const { period, staffId, daysAbsent } = req.body;
    const existing = await dbFindOne('attendance', { period, staffId });
    const now = new Date().toISOString();
    if (existing) {
      await dbUpdate('attendance', { period, staffId }, { $set: { daysAbsent, updatedAt: now } });
    } else {
      await dbInsert('attendance', { period, staffId, daysAbsent, createdAt: now, updatedAt: now });
    }
    await addAudit(user._id, user.username, 'ATTENDANCE', `Set absence for staff ${staffId}: ${daysAbsent} days (${period})`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Bulk attendance save
router.post('/attendance/bulk', requireAuth, async (req, res) => {
  try {
    const user = await dbFindOne('users', { _id: req.session.userId });
    const { period, records } = req.body; // [{staffId, daysAbsent}]
    const now = new Date().toISOString();
    for (const r of records) {
      const existing = await dbFindOne('attendance', { period, staffId: r.staffId });
      if (existing) {
        await dbUpdate('attendance', { period, staffId: r.staffId }, { $set: { daysAbsent: r.daysAbsent, updatedAt: now } });
      } else {
        await dbInsert('attendance', { period, staffId: r.staffId, daysAbsent: r.daysAbsent, createdAt: now, updatedAt: now });
      }
    }
    await addAudit(user._id, user.username, 'ATTENDANCE_BULK', `Saved attendance for ${records.length} staff (${period})`);
    res.json({ ok: true, count: records.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── USERS ────────────────────────────────────────────────────────────────────
router.get('/users', requireAuth, requireRole('superadmin','hr'), async (req, res) => {
  try {
    const users = await dbFind('users', {});
    res.json(users.map(({ password: _, ...u }) => u));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/users', requireAuth, requireRole('superadmin'), async (req, res) => {
  try {
    const caller = await dbFindOne('users', { _id: req.session.userId });
    const { username, password, name, role, branch, active } = req.body;
    const existing = await dbFindOne('users', { username });
    if (existing) return res.status(400).json({ error: 'Username already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await dbInsert('users', { username, password: hashed, name, role, branch, active: active !== false, createdAt: new Date().toISOString() });
    await addAudit(caller._id, caller.username, 'ADD_USER', `Created user ${username} (${role})`);
    const { password: _, ...safe } = user;
    res.json(safe);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/users/:id', requireAuth, requireRole('superadmin'), async (req, res) => {
  try {
    const caller = await dbFindOne('users', { _id: req.session.userId });
    const update = { ...req.body };
    if (update.password) {
      update.password = await bcrypt.hash(update.password, 10);
    } else {
      delete update.password;
    }
    update.updatedAt = new Date().toISOString();
    await dbUpdate('users', { _id: req.params.id }, { $set: update });
    const updated = await dbFindOne('users', { _id: req.params.id });
    await addAudit(caller._id, caller.username, 'EDIT_USER', `Updated user ${updated.username}`);
    const { password: _, ...safe } = updated;
    res.json(safe);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/users/:id', requireAuth, requireRole('superadmin'), async (req, res) => {
  try {
    const caller = await dbFindOne('users', { _id: req.session.userId });
    if (req.params.id === caller._id) return res.status(400).json({ error: 'Cannot delete yourself' });
    const u = await dbFindOne('users', { _id: req.params.id });
    await dbRemove('users', { _id: req.params.id });
    await addAudit(caller._id, caller.username, 'DELETE_USER', `Deleted user ${u?.username}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────
router.get('/audit', requireAuth, requireRole('superadmin','hr'), async (req, res) => {
  try {
    const logs = await dbFind('audit', {}, { timestamp: -1 });
    res.json(logs.slice(0, 500));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
router.get('/analytics/summary', requireAuth, async (req, res) => {
  try {
    const staff = await dbFind('staff', {});
    const loans = await dbFind('loans', {});
    const payroll = await dbFind('payroll', {}, { period: -1 });

    const active = staff.filter(s => s.status === 'active');
    const totalPayroll = active.reduce((a, s) => a + (s.net||0), 0);
    const totalLoanBalance = loans.reduce((a, l) => a + (l.balance||0), 0);

    const branches = {};
    active.forEach(s => {
      if (!branches[s.branch]) branches[s.branch] = { count: 0, payroll: 0 };
      branches[s.branch].count++;
      branches[s.branch].payroll += s.net||0;
    });

    const depts = {};
    active.forEach(s => {
      const d = s.department || s.dept || 'Other';
      if (!depts[d]) depts[d] = { count: 0, payroll: 0 };
      depts[d].count++;
      depts[d].payroll += s.net||0;
    });

    res.json({
      totalStaff: active.length,
      inactiveStaff: staff.filter(s => s.status !== 'active').length,
      totalBranches: Object.keys(branches).length,
      totalPayroll,
      totalLoanBalance,
      totalLoans: loans.length,
      byBranch: branches,
      byDept: depts,
      payrollHistory: payroll.slice(0, 12).map(p => ({
        period: p.period,
        totalNet: p.records?.reduce((a, r) => a + r.net, 0) || 0,
        staffCount: p.records?.length || 0,
        locked: p.locked
      }))
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── BACKUP / EXPORT ──────────────────────────────────────────────────────────
router.get('/backup/export', requireAuth, requireRole('superadmin'), async (req, res) => {
  try {
    const user = await dbFindOne('users', { _id: req.session.userId });
    const [staff, loans, users, audit, payroll, attendance] = await Promise.all([
      dbFind('staff', {}), dbFind('loans', {}), dbFind('users', {}),
      dbFind('audit', {}), dbFind('payroll', {}), dbFind('attendance', {})
    ]);
    const backup = { staff, loans, users: users.map(({password:_,...u})=>u), audit, payroll, attendance, exportedAt: new Date().toISOString(), exportedBy: user.name };
    await addAudit(user._id, user.username, 'BACKUP_EXPORT', 'Full database exported');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="PSK_HRM_Backup_${new Date().toISOString().split('T')[0]}.json"`);
    res.json(backup);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
