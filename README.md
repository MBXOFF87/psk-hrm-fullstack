# 🏨 PSK Hotels — HR Management System

A full-stack HR Management System built with Node.js/Express backend and React frontend.

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+ 
- npm 8+

### 1. Install & Seed

```bash
# Install backend deps
npm install

# Install frontend deps
cd client && npm install && cd ..

# Seed initial data (staff, loans, users)
npm run seed
```

### 2. Run in Development

Open **two terminals**:

```bash
# Terminal 1 — Backend (port 5000)
npm run server

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Open: **http://localhost:5173**

### 3. Build for Production

```bash
cd client && npm run build && cd ..
NODE_ENV=production node server/index.js
```

Open: **http://localhost:5000**

---

## 🔐 Default Login Credentials

| Username      | Password    | Role           |
|---------------|-------------|----------------|
| `admin`       | `admin123`  | Super Admin    |
| `hr_manager`  | `hrm2026`   | HR Manager     |
| `branch_head` | `branch123` | Branch Manager |
| `accounts`    | `acc2026`   | Accounts       |

> ⚠️ **Change all passwords immediately in production!**

---

## 🌐 Deploy to Render.com (Free Hosting)

1. Push this project to **GitHub**

2. Go to [render.com](https://render.com) → **New Web Service**

3. Connect your GitHub repo

4. Configure:
   - **Build Command:** `npm install && cd client && npm install && npm run build`
   - **Start Command:** `NODE_ENV=production node server/index.js`

5. Add **Environment Variables** in Render dashboard:
   ```
   SESSION_SECRET=your-very-long-random-secret-here
   NODE_ENV=production
   PORT=5000
   ```

6. Click **Deploy** — your app will be live at `https://your-app.onrender.com`

7. After first deploy, run the seed: go to Render Shell tab and run:
   ```bash
   node server/seed.js
   ```

---

## 🐳 Deploy with Docker

```bash
# Build image
docker build -t psk-hrm .

# Run container
docker run -d \
  -p 5000:5000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  -e SESSION_SECRET=your-secret-here \
  -e NODE_ENV=production \
  --name psk-hrm \
  psk-hrm

# Seed data
docker exec psk-hrm node server/seed.js
```

---

## ☁️ Deploy to Railway.app

1. Install Railway CLI: `npm install -g @railway/cli`
2. `railway login`
3. `railway init`
4. `railway up`
5. Set env vars: `railway variables set SESSION_SECRET=your-secret NODE_ENV=production`
6. Open shell and seed: `railway run node server/seed.js`

---

## 📁 Project Structure

```
psk-hrm/
├── server/
│   ├── index.js       # Express server
│   ├── routes.js      # All API routes
│   ├── db.js          # NeDB database setup
│   ├── middleware.js  # Auth middleware
│   └── seed.js        # Initial data seed
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js             # API client
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx     # Sidebar + shell
│   │   │   ├── StaffForm.jsx  # Add/edit staff form
│   │   │   └── UI.jsx         # Reusable components
│   │   ├── pages/
│   │   │   ├── Pages.jsx      # All page components
│   │   │   └── LoginPage.jsx
│   │   └── utils/
│   │       └── constants.js
│   └── dist/          # Built frontend (after npm run build)
├── data/              # NeDB database files (auto-created)
│   ├── staff.db
│   ├── loans.db
│   ├── payroll.db
│   ├── users.db
│   ├── audit.db
│   └── attendance.db
├── uploads/           # Staff photos (auto-created)
├── Dockerfile
├── .env.example
└── README.md
```

---

## 🔒 Environment Variables

Copy `.env.example` to `.env`:

```env
PORT=5000
NODE_ENV=development
SESSION_SECRET=change-this-to-a-long-random-string
CLIENT_URL=http://localhost:5173
```

---

## 💾 Backup & Restore

### Export (via UI)
- Login as **Super Admin** → Backup page → Download Backup

### Manual file backup
```bash
# Copy data files
cp -r data/ backup/data-$(date +%Y%m%d)/
cp -r uploads/ backup/uploads-$(date +%Y%m%d)/
```

### Restore
```bash
# Stop server, replace data files, restart
cp -r backup/data-20260514/ data/
node server/index.js
```

---

## ✨ Features

- **Staff Management** — Add, edit, delete staff with full profiles
- **Auto Employee IDs** — `PSK/MOJ/001` format, auto-changes on branch transfer
- **22 Branches** — All PSK Hotels locations
- **Payroll Engine** — Pro-rata calculation, PAYE/vaccine/loan deductions
- **Attendance** — Mark days absent, auto-deducted from salary
- **Loan Tracking** — Full loan lifecycle with repayment progress
- **Analytics** — Branch & department payroll breakdown, trend charts
- **Reports** — Printable salary schedules ordered by department
- **Role-based Access** — Super Admin, HR, Branch Manager, Accounts, Viewer
- **Audit Log** — Every action tracked
- **Dark/Light Mode**
- **Photo Upload** — Staff profile photos with lightbox
- **Session Timeout** — Auto-logout after 30 min inactivity

---

## 🛠 Tech Stack

| Layer     | Tech                          |
|-----------|-------------------------------|
| Backend   | Node.js, Express              |
| Database  | NeDB (embedded, file-based)   |
| Auth      | express-session + bcryptjs    |
| Frontend  | React 18 + Vite               |
| Styling   | Pure CSS (no framework)       |
| Charts    | Custom SVG bars               |
