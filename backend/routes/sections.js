const express  = require('express');
const db       = require('../db');
const auth     = require('../middleware/auth');
const router   = express.Router();

// Default data templates for each section type
const DEFAULTS = {
  hero:            { conference_name: 'AegisAI 2027', tagline: 'Enter tagline here', dates: 'TBA', institution: 'Shiv Nadar University Chennai', location: 'Chennai, India', badge: 'Coming Soon', ifip_event_id: '' },
  key_dates:       { heading: 'Key Dates', dates: [{ label: 'New Date', date: 'TBA' }] },
  text_block:      { heading: 'New Section', body: 'Enter content here.' },
  logo_bar:        { heading: 'Sponsors', logos: [{ name: 'Sponsor Name', placeholder: true }] },
  university_info: { heading: 'About Our Host Institution', body: 'Enter description here.', logo_text: 'SHIV NADAR\nUNIVERSITY\nCHENNAI', location: 'Chennai, Tamil Nadu, India', website_url: '#' },
  topics_list:     { heading: 'Topics of Interest', intro: 'Topics include:', topics: ['Topic 1', 'Topic 2'] },
  dates_table:     { heading: 'Important Dates', col1_heading: 'Event', col2_heading: 'Date', col3_heading: 'Note', rows: [{ event: 'New Event', date: 'TBA', note: '' }] },
  submit_button:   { heading: 'Submit Your Paper', note: 'Submission details here.', label: 'Submit Now', url: '#' },
  speaker_grid:    { heading: 'Keynote Speakers', speakers: [{ name: 'To Be Announced', affiliation: 'TBA', photo_url: '', bio: '' }] },
  committee_group: { groups: [{ role: 'New Role', members: [{ name: 'To Be Announced', affiliation: 'TBA' }] }] },
  map_embed:       { address: 'Enter address here', map_url: '', travel_info: 'Travel information here.' },
  contact_info:    { email: 'contact@example.com', phone: '', address: '', socials: [] },
  program_schedule: {
    heading: 'Conference Program',
    rooms: ['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5'],
    days: [
      {
        label: 'Day 1',
        full_label: 'Day 1 — Conference Program',
        slots: [
          { start: '08:00', end: '09:00', duration: '1:00', is_break: true, break_label: 'Registration', sessions: [] },
          { start: '09:00', end: '10:30', duration: '1:30', is_break: false, sessions: [
            { room: 'Room 1', title: 'Tutorial Title', speaker: 'Speaker Name', affiliation: 'University' }
          ]},
          { start: '10:30', end: '11:00', duration: '0:30', is_break: true, break_label: 'Tea Break', sessions: [] }
        ]
      }
    ]
  },
};

// POST /api/sections — create a new section (admin)
router.post('/', auth, async (req, res) => {
  const { page_id, type } = req.body;
  if (!page_id || !type) return res.status(400).json({ error: 'page_id and type are required' });
  if (!DEFAULTS[type]) return res.status(400).json({ error: `Unknown section type: ${type}` });
  try {
    const [maxOrder] = await db.query(
      'SELECT MAX(section_order) as m FROM sections WHERE page_id = ?', [page_id]
    );
    const section_order = (maxOrder[0].m || 0) + 1;
    const data = JSON.stringify(DEFAULTS[type]);

    const [result] = await db.query(
      'INSERT INTO sections (page_id, type, section_order, data) VALUES (?, ?, ?, ?)',
      [page_id, type, section_order, data]
    );
    const [rows] = await db.query('SELECT * FROM sections WHERE id = ?', [result.insertId]);
    if (typeof rows[0].data === 'string') {
      try { rows[0].data = JSON.parse(rows[0].data); } catch(e) {}
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sections/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sections WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Section not found' });
    if (typeof rows[0].data === 'string') {
      try { rows[0].data = JSON.parse(rows[0].data); } catch(e) {}
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/sections/:id — update section data
router.patch('/:id', auth, async (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'data field required' });
  try {
    await db.query('UPDATE sections SET data = ? WHERE id = ?', [JSON.stringify(data), req.params.id]);
    const [rows] = await db.query('SELECT * FROM sections WHERE id = ?', [req.params.id]);
    if (typeof rows[0].data === 'string') {
      try { rows[0].data = JSON.parse(rows[0].data); } catch(e) {}
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/sections/:id/move — reorder (direction: up | down)
router.patch('/:id/move', auth, async (req, res) => {
  const { direction } = req.body;
  if (!['up', 'down'].includes(direction)) return res.status(400).json({ error: 'direction must be up or down' });
  try {
    const [rows] = await db.query('SELECT * FROM sections WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Section not found' });
    const s = rows[0];

    const op = direction === 'up' ? '<' : '>';
    const ord = direction === 'up' ? 'DESC' : 'ASC';
    const [siblings] = await db.query(
      `SELECT * FROM sections WHERE page_id = ? AND section_order ${op} ? ORDER BY section_order ${ord} LIMIT 1`,
      [s.page_id, s.section_order]
    );
    if (!siblings.length) return res.json({ message: 'Already at edge' });

    const sibling = siblings[0];
    await db.query('UPDATE sections SET section_order = ? WHERE id = ?', [sibling.section_order, s.id]);
    await db.query('UPDATE sections SET section_order = ? WHERE id = ?', [s.section_order, sibling.id]);
    res.json({ message: 'Moved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sections/:id (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM sections WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sections/page/:pageId — all sections for a page (admin)
router.get('/page/:pageId', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM sections WHERE page_id = ? ORDER BY section_order',
      [req.params.pageId]
    );
    rows.forEach(s => {
      if (typeof s.data === 'string') {
        try { s.data = JSON.parse(s.data); } catch(e) {}
      }
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
