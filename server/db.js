const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const db = {
  staff:   new Datastore({ filename: path.join(DB_DIR, 'staff.db'),   autoload: true }),
  loans:   new Datastore({ filename: path.join(DB_DIR, 'loans.db'),   autoload: true }),
  users:   new Datastore({ filename: path.join(DB_DIR, 'users.db'),   autoload: true }),
  audit:   new Datastore({ filename: path.join(DB_DIR, 'audit.db'),   autoload: true }),
  payroll: new Datastore({ filename: path.join(DB_DIR, 'payroll.db'), autoload: true }),
  attendance: new Datastore({ filename: path.join(DB_DIR, 'attendance.db'), autoload: true }),
};

// Auto-compact daily
Object.values(db).forEach(d => {
  d.persistence.setAutocompactionInterval(86400000);
});

// Promisify helpers
const dbFind  = (col, query, sort) => new Promise((res, rej) => {
  let cursor = db[col].find(query);
  if (sort) cursor = cursor.sort(sort);
  cursor.exec((err, docs) => err ? rej(err) : res(docs));
});
const dbFindOne = (col, query) => new Promise((res, rej) =>
  db[col].findOne(query, (err, doc) => err ? rej(err) : res(doc)));
const dbInsert  = (col, doc)   => new Promise((res, rej) =>
  db[col].insert(doc, (err, d) => err ? rej(err) : res(d)));
const dbUpdate  = (col, query, update, opts = {}) => new Promise((res, rej) =>
  db[col].update(query, update, opts, (err, n) => err ? rej(err) : res(n)));
const dbRemove  = (col, query, opts = {}) => new Promise((res, rej) =>
  db[col].remove(query, opts, (err, n) => err ? rej(err) : res(n)));
const dbCount   = (col, query) => new Promise((res, rej) =>
  db[col].count(query, (err, n) => err ? rej(err) : res(n)));

module.exports = { db, dbFind, dbFindOne, dbInsert, dbUpdate, dbRemove, dbCount, DB_DIR, UPLOADS_DIR };
