const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/authMiddleware');

// Configure multer to process files in memory (max 5MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed!'));
  }
});

// @route   POST /api/upload
// @desc    Upload single image
router.post('/', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const file = req.file;
    const fileExt = path.extname(file.originalname);
    const userId = req.user?.id || 'user';
    const fileName = `${userId}_${Date.now()}${fileExt}`;

    // Upload to Supabase Storage Bucket 'consultation-photos'
    const { data, error } = await supabase.storage
      .from('consultation-photos')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.error('Supabase Upload Error:', error);
      return res.status(500).json({ error: error.message || error });
    }

    // Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from('consultation-photos')
      .getPublicUrl(fileName);

    res.json({
      message: 'Photo uploaded successfully',
      photoUrl: publicUrlData.publicUrl,
      url: publicUrlData.publicUrl
    });
  } catch (err) {
    console.error('Server Upload Error:', err);
    res.status(500).json({ error: 'Server error processing file upload' });
  }
});

// @route   POST /api/upload/consultation-photos
// @desc    Upload all 3 consultation photos at once (frontView, leftSide, rightSide)
router.post(
  '/consultation-photos',
  authenticateToken,
  upload.fields([
    { name: 'frontView', maxCount: 1 },
    { name: 'leftSide', maxCount: 1 },
    { name: 'rightSide', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const files = req.files;
      if (!files || (!files.frontView && !files.leftSide && !files.rightSide)) {
        return res.status(400).json({ error: 'At least one consultation photo must be uploaded' });
      }

      const uploadedUrls = {};
      const userId = req.user?.id || 'user';

      for (const key of ['frontView', 'leftSide', 'rightSide']) {
        if (files[key] && files[key][0]) {
          const file = files[key][0];
          const fileExt = path.extname(file.originalname);
          const fileName = `${userId}_${key}_${Date.now()}${fileExt}`;

          const { error } = await supabase.storage
            .from('consultation-photos')
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
              upsert: true
            });

          if (error) {
            console.error(`Supabase Error for ${key}:`, error);
            throw error;
          }

          const { data: publicUrlData } = supabase.storage
            .from('consultation-photos')
            .getPublicUrl(fileName);

          uploadedUrls[key] = publicUrlData.publicUrl;
        }
      }

      res.json({
        message: 'Consultation photos uploaded successfully',
        photos: uploadedUrls
      });
    } catch (err) {
      console.error('Consultation Upload Detailed Error:', err);
      res.status(500).json({ error: err.message || 'Internal server error during upload' });
    }
  }
);

module.exports = router;