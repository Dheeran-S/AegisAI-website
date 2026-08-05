const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// POST /api/contact — public form submission
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'All fields required' });
  if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: 'Invalid email' });
  try {
    await db.query('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)', [name, email, message]);
    res.json({ success: true, message: 'Message received. Thank you!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contact — admin: list submissions
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/contact/:id/read — mark as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    await db.query('UPDATE contacts SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
