require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../db');

async function initDb() {
  console.log('🔧 Initializing database schema...');
  try {
    const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
    await db.query(schema);
    console.log('✅ Schema created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Schema error:', err.message);
    process.exit(1);
  }
}

initDb();
