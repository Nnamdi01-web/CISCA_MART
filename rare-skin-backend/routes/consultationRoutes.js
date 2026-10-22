const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Ensure uploads directory exists locally
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per photo
});

// Shared handler for submitting consultations with multi-file support
const handleConsultationSubmit = async (req, res) => {
  try {
    console.log("--- INCOMING CONSULTATION SUBMISSION ---");
    console.log("req.body keys:", Object.keys(req.body));
    console.log("req.files received:", req.files ? req.files.length : "No files object found");

    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        console.log(`-> File field '${file.fieldname}' uploaded filename:`, file.filename);
      });
    }

    const { answers } = req.body;
    // Parse answers if they are sent as a JSON string from FormData
    const parsedAnswers = typeof answers === 'string' ? JSON.parse(answers || '{}') : (answers || req.body);

    // Robust fallback mapping for all possible frontend key naming conventions
    const skin_type = parsedAnswers?.skin_type || parsedAnswers?.skinType || req.body.skin_type || null;
    
    const primary_concerns = parsedAnswers?.primary_concerns || 
                           parsedAnswers?.primaryConcerns || 
                           parsedAnswers?.skinConcerns || 
                           req.body.primary_concerns || 
                           req.body.primary_concern || 
                           req.body.skin_concern || null;

    const current_routine = parsedAnswers?.current_routine || 
                            parsedAnswers?.routineComplexity || 
                            parsedAnswers?.currentRoutine || 
                            req.body.current_routine || null;

    const sun_exposure = parsedAnswers?.sun_exposure || 
                       parsedAnswers?.sunExposure || 
                       parsedAnswers?.concern_duration || 
                       req.body.sun_exposure || 
                       req.body.concern_duration || null;

    const sensitivity_level = parsedAnswers?.sensitivity_level || 
                            parsedAnswers?.sensitivityLevel || 
                            parsedAnswers?.allergies || 
                            req.body.sensitivity_level || 
                            req.body.allergies || null;

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
    
    // Explicitly extract fields using expanded name checking from req.files array
    let frontPhoto = req.body.front_photo_url || req.body.image_url || null;
    let leftPhoto = req.body.left_photo_url || null;
    let rightPhoto = req.body.right_photo_url || null;

    if (req.files && Array.isArray(req.files)) {
      const getFileUrlByFields = (fieldNames) => {
        const found = req.files.find(f => fieldNames.includes(f.fieldname));
        return found ? baseUrl + found.filename : null;
      };

      // Fallback to any generic file upload if specific names match
      frontPhoto = getFileUrlByFields(['front_photo', 'frontPhoto', 'frontImage', 'photo', 'image', 'file']) || frontPhoto;
      
      // If upload.any() caught a file but it didn't match standard names, grab the first available file
      if (!frontPhoto && req.files.length > 0) {
        frontPhoto = baseUrl + req.files[0].filename;
      }
      
      leftPhoto = getFileUrlByFields(['left_photo', 'leftPhoto']) || leftPhoto;
      rightPhoto = getFileUrlByFields(['right_photo', 'rightPhoto']) || rightPhoto;
    }

    console.log("Resolved Photo URLs to save ->", { frontPhoto, leftPhoto, rightPhoto });
    
    const user_id = req.user?.id || req.body.user_id || 1;

    const newConsultation = await db.query(
      `INSERT INTO consultations (user_id, skin_type, skin_concern, concern_duration, current_routine, allergies, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Under Review')
       RETURNING *`,
      [
        user_id, 
        skin_type, 
        Array.isArray(primary_concerns) ? primary_concerns.join(', ') : primary_concerns, 
        sun_exposure, 
        current_routine, 
        sensitivity_level
      ]
    );

    const consultationId = newConsultation.rows[0].id;

    if (frontPhoto || leftPhoto || rightPhoto) {
      await db.query(
        `INSERT INTO consultation_photos (consultation_id, front_photo_url, left_photo_url, right_photo_url)
         VALUES ($1, $2, $3, $4)`,
        [consultationId, frontPhoto, leftPhoto, rightPhoto]
      );
    }

    res.status(201).json({
      message: 'Consultation submitted successfully!',
      status: 'Under Review',
      consultation: newConsultation.rows[0]
    });
  } catch (err) {
    console.error('Consultation Submission Error:', err);
    res.status(500).json({ error: 'Failed to submit consultation details: ' + err.message });
  }
};

// Use upload.any() to universally accept any file stream from FormData without triggering multer field mapping bounds error
const cpUpload = upload.any();

// Include authenticateToken middleware here so req.user is properly populated
router.post('/', authenticateToken, cpUpload, handleConsultationSubmit);
router.post('/consultation', authenticateToken, cpUpload, handleConsultationSubmit);

// @route   GET /api/consultations/admin/pending
router.get('/admin/pending', authenticateToken, async (req, res) => {
  try {
    const pendingConsults = await db.query(
      `SELECT c.*, u.full_name, u.email, u.phone, 
              p.front_photo_url, p.left_photo_url, p.right_photo_url
       FROM consultations c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN consultation_photos p ON c.id = p.consultation_id
       WHERE c.status = 'Under Review'
       ORDER BY c.created_at DESC`
    );

    res.json({
      count: pendingConsults.rows.length,
      consultations: pendingConsults.rows
    });
  } catch (err) {
    console.error('Fetch Pending Consultations Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve pending consultations.' });
  }
});

// GET /api/consultations/:id/routine
router.get('/:id/routine', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM routines WHERE consultation_id = $1 ORDER BY created_at DESC LIMIT 1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Routine not ready yet' });
    }

    res.json({ success: true, routine: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;