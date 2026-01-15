const express = require('express');
const multer = require('multer');
const path = require('path');
const Project = require('../models/Project');
const File = require('../models/File');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|txt|doc|docx|csv|json/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Upload file to project
router.post('/:projectId/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const projectId = req.params.projectId;
    
    // Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, userId: req.user.userId });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Save file info to database
    const fileDoc = new File({
      projectId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size
    });

    await fileDoc.save();
    res.status(201).json(fileDoc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get files for project
router.get('/:projectId/files', auth, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    
    // Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, userId: req.user.userId });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const files = await File.find({ projectId }).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete file
router.delete('/files/:fileId', auth, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    // Verify file belongs to user's project
    const file = await File.findById(fileId).populate({
      path: 'projectId',
      match: { userId: req.user.userId }
    });
    
    if (!file || !file.projectId) {
      return res.status(404).json({ error: 'File not found' });
    }

    await File.findByIdAndDelete(fileId);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;