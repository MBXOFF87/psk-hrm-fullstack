require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../db');

const BRANCHES = [
  { name: 'MOJIDI', code: 'MOJ' }, { name: 'ALADE', code: 'ALD' },
  { name: 'BANK A', code: 'BKA' }, { name: 'GRA', code: 'GRA' },
  { name: 'AIRPORT', code: 'APT' }, { name: 'RELIANCE', code: 'REL' },
  { name: 'ONIRU', code: 'ONR' }, { name: 'RESIDENCE', code: 'RES' },
  { name: 'FREEDOM', code: 'FRD' }, { name: 'SIGNATURE', code: 'SIG' },
  { name: 'V-ISLAND', code: 'VIL' }, { name: 'CASTLE', code: 'CST' },
  { name: 'B-ISLAND', code: 'BIS' }, { name: 'FAJODD-4', code: 'FJD' },
  { name: 'WHITE HOUSE', code: 'WHT' }, { name: 'WATERS', code: 'WTR' },
  { name: 'IKOYI', code: 'IKY' }, { name: 'KURAMO', code: 'KRM' },
  { name: 'AWOLOWO', code: 'AWL' }, { name: 'WUSE-2', code: 'WS2' },
  { name: 'JABI', code: 'JAB' }, { name: 'HEAD OFFICE', code: 'HQO' },
];

const DEFAULT_USERS = [
  { username: 'admin', password: 'Admin@PSK2026!', full_name: 'System Administrator', role: 'superadmin', branch_access: 'ALL' },
  { username: 'hr_manager', password: 'HRM@PSK2026!', full_name: 'HR Manager', role: 'hr', branch_access: 'ALL' },
  { username: 'accounts', password: 'Acc@PSK2026!', full_name: 'Accounts Officer', role: 'accounts', branch_access: 'ALL' },
];

async function seed() {
  console.log('🌱 Seeding database...');
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Branches
    console.log('  → Inserting branches...');
    for (const b of BRANCHES) {
      await client.query(
        'INSERT INTO branches(name, code) VALUES($1,$2) ON CONFLICT(name) DO NOTHING',
        [b.name, b.code]
      );
    }
    console.log(`  ✓ ${BRANCHES.length} branches`);

    // Users
    console.log('  → Inserting default users...');
    for (const u of DEFAULT_USERS) {
      const hash = await bcrypt.hash(u.password, 12);
      await client.query(
        `INSERT INTO users(username, password_hash, full_name, role, branch_access)
         VALUES($1,$2,$3,$4,$5) ON CONFLICT(username) DO NOTHING`,
        [u.username, hash, u.full_name, u.role, u.branch_access]
      );
    }
    console.log(`  ✓ ${DEFAULT_USERS.length} users`);

    await client.query('COMMIT');
    console.log('\n✅ Seed complete!');
    console.log('\n🔑 Default login credentials:');
    DEFAULT_USERS.forEach(u => console.log(`   ${u.username} / ${u.password}  [${u.role}]`));
    console.log('\n⚠️  CHANGE THESE PASSWORDS IMMEDIATELY IN PRODUCTION!\n');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
