const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const auth = require('../middleware/auth');

// Ensure the images directory exists
const imagesDir = path.join(__dirname, '../images');
if (!fsSync.existsSync(imagesDir)) {
  fsSync.mkdirSync(imagesDir, { recursive: true });
}

// Set up Multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename using timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// GET /api/images - List all uploaded images (Admin)
router.get('/', auth, async (req, res) => {
  try {
    const files = await fs.readdir(imagesDir);
    // Filter out non-image files if necessary, but we assume only images are uploaded
    const images = [];
    for (const file of files) {
      if (file === '.gitkeep' || file.startsWith('.')) continue; // skip hidden files
      
      const stats = await fs.stat(path.join(imagesDir, file));
      images.push({
        filename: file,
        url: `/images/${file}`,
        size: stats.size,
        created_at: stats.mtime
      });
    }
    
    // Sort by newest first
    images.sort((a, b) => b.created_at - a.created_at);
    
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/images - Upload a new image (Admin)
router.post('/', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  
  res.json({
    success: true,
    filename: req.file.filename,
    url: `/images/${req.file.filename}`
  });
});

// DELETE /api/images/:filename - Delete an image (Admin)
router.delete('/:filename', auth, async (req, res) => {
  const { filename } = req.params;
  
  // Prevent directory traversal attacks
  if (filename.includes('/') || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  try {
    const filePath = path.join(imagesDir, filename);
    await fs.unlink(filePath);
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
