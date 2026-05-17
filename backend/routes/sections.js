const express  = require('express');
const db       = require('../db');
const auth     = require('../middleware/auth');
const router   = express.Router();

// Default data templates for each section type
const DEFAULTS = {
  hero:            { conference_name: 'AegisAI 2027', tagline: 'Enter tagline here', dates: 'TBA', institution: 'Shiv Nadar University Chennai', location: 'Chennai, India', badge: 'Coming Soon' },
  key_dates:       { heading: 'Key Dates', dates: [{ label: 'New Date', date: 'TBA' }] },
  text_block:      { heading: 'New Section', body: 'Enter content here.' },
  logo_bar:        { heading: 'Sponsors', logos: [{ name: 'Sponsor Name', placeholder: true }] },
  university_info: { heading: 'About Our Host Institution', body: 'Enter description here.', logo_text: 'SHIV NADAR\nUNIVERSITY\nCHENNAI', location: 'Chennai, Tamil Nadu, India', website_url: '#' },
  topics_list:     { heading: 'Topics of Interest', intro: 'Topics include:', topics: ['Topic 1', 'Topic 2'] },
  dates_table:     { heading: 'Important Dates', rows: [{ event: 'New Event', date: 'TBA', note: '' }] },
  submit_button:   { heading: 'Submit Your Paper', note: 'Submission details here.', label: 'Submit Now', url: '#' },
  speaker_grid:    { heading: 'Keynote Speakers', speakers: [{ name: 'To Be Announced', affiliation: 'TBA', photo_url: '', bio: '' }] },
  committee_group: { groups: [{ role: 'New Role', members: [{ name: 'To Be Announced', affiliation: 'TBA' }] }] },
  map_embed:       { address: 'Enter address here', map_url: '', travel_info: 'Travel information here.' },
  contact_info:    { email: 'contact@example.com', phone: '', address: '', socials: [] },
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
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
