const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/pages — list all pages (public)
router.get('/', async (req, res) => {
  try {
    const [pages] = await db.query('SELECT id, slug, title, meta_description, nav_order FROM pages ORDER BY nav_order');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.json(pages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pages — create a new page (admin)
router.post('/', auth, async (req, res) => {
  const { slug, title, meta_description } = req.body;
  if (!slug || !title) return res.status(400).json({ error: 'slug and title are required' });
  if (!/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: 'slug must be lowercase letters, numbers, hyphens only' });
  try {
    const [existing] = await db.query('SELECT id FROM pages WHERE slug = ?', [slug]);
    if (existing.length) return res.status(409).json({ error: 'A page with this slug already exists' });

    const [maxOrder] = await db.query('SELECT MAX(nav_order) as m FROM pages');
    const nav_order = (maxOrder[0].m || 0) + 1;

    const [result] = await db.query(
      'INSERT INTO pages (slug, title, meta_description, nav_order) VALUES (?, ?, ?, ?)',
      [slug, title, meta_description || '', nav_order]
    );
    const [rows] = await db.query('SELECT * FROM pages WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/pages/:id — update page metadata (admin)
router.patch('/:id', auth, async (req, res) => {
  const { title, meta_description } = req.body;
  try {
    await db.query('UPDATE pages SET title = ?, meta_description = ? WHERE id = ?',
      [title, meta_description, req.params.id]);
    const [rows] = await db.query('SELECT * FROM pages WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/pages/:id (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM pages WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pages/:slug — full page with sections (public) — must be last
router.get('/:slug', async (req, res) => {
  try {
    const [pages] = await db.query('SELECT * FROM pages WHERE slug = ?', [req.params.slug]);
    if (!pages.length) return res.status(404).json({ error: 'Page not found' });

    const page = pages[0];
    const [sections] = await db.query(
      'SELECT * FROM sections WHERE page_id = ? ORDER BY section_order',
      [page.id]
    );
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.json({ ...page, sections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
