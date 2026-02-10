const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Get all users (Admin only in real app, but simple here)
app.get('/api/users', (req, res) => {
  const sql = "SELECT * FROM users";
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    const users = {};
    rows.forEach(row => {
      users[row.id] = row;
    });
    res.json(users);
  });
});

// Get single user
app.get('/api/users/:id', (req, res) => {
  const sql = "SELECT * FROM users WHERE id = ?";
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json(row);
  });
});

// Create/Register User OR Login
app.post('/api/login', (req, res) => {
  const { id, password } = req.body;
  const sql = "SELECT * FROM users WHERE id = ?";
  db.get(sql, [id], (err, row) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    if (row) {
      if (row.password === password) {
        res.json(row);
      } else {
        res.status(401).json({ "error": "Invalid password" });
      }
    } else {
      // User doesn't exist, auto-register
      const newUser = {
        id,
        password,
        role: 'user',
        credit: 0,
        totalBet: 0,
        totalWin: 0
      };
      const insert = 'INSERT INTO users (id, password, role, credit, totalBet, totalWin) VALUES (?,?,?,?,?,?)';
      db.run(insert, Object.values(newUser), function (err) {
        if (err) {
          res.status(400).json({ "error": err.message });
          return;
        }
        res.json(newUser);
      });
    }
  });
});

// Update User (Credit, Stats)
app.patch('/api/users/:id', (req, res) => {
  const { credit, totalBet, totalWin } = req.body;
  const id = req.params.id;

  let sql = `UPDATE users SET `;
  const params = [];
  const updates = [];

  if (credit !== undefined) { updates.push('credit = ?'); params.push(credit); }
  if (totalBet !== undefined) { updates.push('totalBet = ?'); params.push(totalBet); }
  if (totalWin !== undefined) { updates.push('totalWin = ?'); params.push(totalWin); }

  if (updates.length === 0) {
    res.json({ message: "No changes" });
    return;
  }

  sql += updates.join(', ') + " WHERE id = ?";
  params.push(id);

  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    // Return updated user
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
      res.json(row);
    });
  });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
