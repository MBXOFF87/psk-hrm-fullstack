require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// ─── SECURITY MIDDLEWARE ─────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:5173',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many login attempts. Try again in 15 minutes.' } });
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });

// ─── STATIC FILES (uploads) ──────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use('/api/auth',   authLimiter, require('./routes/auth'));
app.use('/api/staff',  apiLimiter,  require('./routes/staff'));
app.use('/api/loans',  apiLimiter,  require('./routes/loans'));
app.use('/api/payroll',apiLimiter,  require('./routes/payroll'));
app.use('/api/attendance', apiLimiter, require('./routes/attendance'));
app.use('/api/users',  apiLimiter,  require('./routes/users'));
app.use('/api/audit',  apiLimiter,  require('./routes/audit'));
app.use('/api/backup', apiLimiter,  require('./routes/backup'));

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString(), env: process.env.NODE_ENV }));

// ─── SERVE FRONTEND (production) ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')));
}

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ PSK HRM Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`));

module.exports = app;
