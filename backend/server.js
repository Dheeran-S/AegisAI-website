require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/', express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/sections', require('./routes/sections'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/images', require('./routes/images'));

// SPA fallbacks — admin
app.get('/admin', (_, res) => res.sendFile(path.join(__dirname, '../admin/dashboard.html')));
app.get('/admin/login', (_, res) => res.sendFile(path.join(__dirname, '../admin/login.html')));
app.get('/admin/editor', (_, res) => res.sendFile(path.join(__dirname, '../admin/editor.html')));

// Catch-all: serve page.html for any /:slug.html or /:slug not already handled
// This makes custom pages created from the admin panel work automatically
app.get('/:slug(.+)', async (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/page.html'));
});


//remove this for final
const PORT = process.env.PORT || 3000;
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`\n🚀 AegisAI server running at http://localhost:${PORT}`);
    console.log(`   Admin panel → http://localhost:${PORT}/admin/login.html`);
  });
}

// Export for Vercel serverless
module.exports = app;
