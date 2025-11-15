const express = require('express');
const multer = require('multer');
const backupService = require('../services/backupService');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(auth);

// Create backup
router.post('/create', [
  body('type').isIn(['full', 'school']).withMessage('Backup type must be full or school')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, description } = req.body;
    const schoolId = type === 'school' ? req.schoolId : null;

    const backup = await backupService.createBackup(schoolId);

    // Log backup activity
    await require('../models/AuditLog').create({
      action: 'BACKUP_CREATE',
      userId: req.userId,
      schoolId: req.schoolId,
      details: {
        type,
        description,
        filename: backup.filename
      },
      ip: req.ip
    });

    res.json({
      message: 'Backup created successfully',
      backup: {
        filename: backup.filename,
        size: backup.metadata.recordCounts,
        timestamp: backup.metadata.timestamp
      }
    });
  } catch (error) {
    console.error('Backup creation error:', error);
    res.status(500).json({ message: 'Error creating backup' });
  }
});

// Restore backup
router.post('/restore', upload.single('backupFile'), [
  body('type').isIn(['full', 'school']).withMessage('Restore type must be full or school')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Backup file is required' });
    }

    const { type } = req.body;
    const schoolId = type === 'school' ? req.schoolId : null;

    const result = await backupService.restoreBackup(req.file.path, schoolId);

    // Log restore activity
    await require('../models/AuditLog').create({
      action: 'BACKUP_RESTORE',
      userId: req.userId,
      schoolId: req.schoolId,
      details: {
        type,
        filename: req.file.originalname,
        metadata: result.metadata
      },
      ip: req.ip
    });

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ message: 'Backup restored successfully', metadata: result.metadata });
  } catch (error) {
    console.error('Backup restore error:', error);
    res.status(500).json({ message: 'Error restoring backup' });
  }
});

// List backups
router.get('/list', async (req, res) => {
  try {
    const { type } = req.query;
    const schoolId = type === 'school' ? req.schoolId : null;

    const backups = await backupService.listBackups(schoolId);
    
    res.json({ backups });
  } catch (error) {
    console.error('Backup list error:', error);
    res.status(500).json({ message: 'Error listing backups' });
  }
});

// Download backup
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../backups', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Backup file not found' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Backup download error:', error);
    res.status(500).json({ message: 'Error downloading backup' });
  }
});

module.exports = router;