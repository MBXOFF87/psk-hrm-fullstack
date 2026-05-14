require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'psk-hrm-super-secret-change-in-production';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── SECURITY ─────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,  // We'll manage CSP ourselves for the SPA
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ─── BODY PARSING ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── LOGGING ──────────────────────────────────────────────────────────────────
if (NODE_ENV !== 'test') app.use(morgan('dev'));

// ─── SESSION ──────────────────────────────────────────────────────────────────
const FileStore = require('session-file-store')(session);
const sessionsDir = path.join(__dirname, '../data/sessions');
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

const sessionConfig = {
  store: new FileStore({ path: sessionsDir, ttl: 28800, retries: 1, logFn: () => {} }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: NODE_ENV === 'production' && process.env.TRUST_PROXY === 'true',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    sameSite: 'lax',
  },
};
app.use(session(sessionConfig));

// ─── STATIC FILES ─────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── SERVE REACT BUILD (production) ──────────────────────────────────────────
const clientBuild = path.join(__dirname, '../client/dist');
if (NODE_ENV === 'production' && fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function autoSeed() {
  const { dbCount, dbInsert } = require('./db');
  const bcrypt = require('bcryptjs');
  try {
    const userCount = await dbCount('users', {});
    if (userCount > 0) return;
    console.log('🌱 First run — seeding initial data...');
    const seed = require('./seed-data');
    const now = new Date().toISOString();
    for (const s of seed.staff) {
      s.net = Math.max(0, (s.gross||0)-(s.paye||0)-(s.vaccine||0)-(s.loan||0)-(s.otherDeductions||0));
      s.createdAt = now; s.updatedAt = now;
      await dbInsert('staff', s);
    }
    for (const l of seed.loans) { l.createdAt = now; l.updatedAt = now; await dbInsert('loans', l); }
    const USERS = [
      { username:'admin',       password: await bcrypt.hash('admin123',10),  name:'System Administrator', role:'superadmin',     branch:'ALL',    active:true },
      { username:'hr_manager',  password: await bcrypt.hash('hrm2026',10),   name:'HR Manager',           role:'hr',             branch:'ALL',    active:true },
      { username:'branch_head', password: await bcrypt.hash('branch123',10), name:'Branch Head',          role:'branch_manager', branch:'MOJIDI', active:true },
      { username:'accounts',    password: await bcrypt.hash('acc2026',10),   name:'Accounts Officer',     role:'accounts',       branch:'ALL',    active:true },
    ];
    for (const u of USERS) await dbInsert('users', { ...u, createdAt: now });
    console.log(`✅ Seeded ${seed.staff.length} staff, ${seed.loans.length} loans, ${USERS.length} users`);
    console.log('🔐 Login: admin / admin123');
  } catch(e) { console.error('Auto-seed error:', e.message); }
}

app.listen(PORT, async () => {
  console.log(`\n🏨 PSK HR Management Server`);
  console.log(`   Port:    ${PORT}`);
  console.log(`   Mode:    ${NODE_ENV}`);
  console.log(`   URL:     http://localhost:${PORT}\n`);
  await autoSeed();
});

module.exports = app;
