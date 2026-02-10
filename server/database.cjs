const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, 'deepsea.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

const DEFAULT_ADMIN = {
  id: 'OCEAN_MASTER',
  password: 'POSEIDON_KEY',
  role: 'admin',
  credit: 0,
  totalBet: 0,
  totalWin: 0
};

function initDb() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    credit INTEGER DEFAULT 0,
    totalBet INTEGER DEFAULT 0,
    totalWin INTEGER DEFAULT 0
  )`, (err) => {
    if (err) {
      console.error('Error creating table', err.message);
    } else {
      // Check if admin exists
      db.get("SELECT id FROM users WHERE id = ?", [DEFAULT_ADMIN.id], (err, row) => {
        if (!row) {
          const insert = 'INSERT INTO users (id, password, role, credit, totalBet, totalWin) VALUES (?,?,?,?,?,?)';
          db.run(insert, Object.values(DEFAULT_ADMIN), (err) => {
            if (err) console.error('Error creating admin', err.message);
            else console.log('Default admin created.');
          });
        }
      });
    }
  });
}

module.exports = db;
