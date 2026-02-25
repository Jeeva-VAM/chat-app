const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { body, validationResult } = require('express-validator');
const { 
  profileImageStorage, 
  chatMediaStorage, 
  deleteFromCloudinary, 
  getOptimizedUrl,
  cloudinary 
} = require('../config/cloudinary');
const { authMiddleware } = require('../../shared/auth');

const router = express.Router();

// File size limits
const limits = {
  fileSize: 50 * 1024 * 1024, // 50MB
  files: 5 // Max 5 files per request
};

// Multer configurations
const profileUpload = multer({
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for profile images
  fileFilter: (req, file, cb) => {
    // Only allow image files for profiles
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures'), false);
    }
  }
});

const chatMediaUpload = multer({
  storage: chatMediaStorage,
  limits: limits,
  fileFilter: (req, file, cb) => {
    // Allow images, videos, and documents
    const allowedTypes = [
      'image/', 'video/', 'application/pdf', 
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/zip', 'application/rar'
    ];
    
    const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
    
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Auth middleware for all routes
router.use(authMiddleware);

// Upload profile image
router.post('/upload/profile', profileUpload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Delete old profile image if provided
    if (req.body.oldPublicId) {
      try {
        await deleteFromCloudinary(req.body.oldPublicId);
      } catch (error) {
        console.warn('Failed to delete old profile image:', error);
      }
    }

    const result = {
      url: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    };

    res.json({
      message: 'Profile image uploaded successfully',
      image: result
    });
  } catch (error) {
    console.error('Upload profile error:', error);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
});

// Upload chat media (images, videos, files)
router.post('/upload/chat', chatMediaUpload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      type: file.mimetype.startsWith('image/') ? 'image' : 
            file.mimetype.startsWith('video/') ? 'video' : 'file'
    }));

    res.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Upload chat media error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Upload single image with compression options
router.post('/upload/image', 
  chatMediaUpload.single('image'),
  [
    body('quality').optional().isInt({ min: 1, max: 100 }).withMessage('Quality must be between 1-100'),
    body('width').optional().isInt({ min: 1, max: 4000 }).withMessage('Width must be between 1-4000'),
    body('height').optional().isInt({ min: 1, max: 4000 }).withMessage('Height must be between 1-4000')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
      }

      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'Only image files are allowed' });
      }

      const { quality, width, height } = req.body;
      
      let optimizedUrl = req.file.path;
      
      // Apply additional optimizations if requested
      if (quality || width || height) {
        const transformations = {};
        if (quality) transformations.quality = quality;
        if (width) transformations.width = parseInt(width);
        if (height) transformations.height = parseInt(height);
        if (width && height) transformations.crop = 'fit';
        
        optimizedUrl = getOptimizedUrl(req.file.filename, transformations);
      }

      const result = {
        url: optimizedUrl,
        originalUrl: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      };

      res.json({
        message: 'Image uploaded successfully',
        image: result
      });
    } catch (error) {
      console.error('Upload image error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

// Delete media file
router.delete('/delete/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({ error: 'Public ID is required' });
    }

    const result = await deleteFromCloudinary(publicId);
    
    if (result.result === 'ok') {
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found or already deleted' });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get optimized image URL
router.post('/optimize',
  [
    body('publicId').notEmpty().withMessage('Public ID is required'),
    body('transformations').optional().isObject().withMessage('Transformations must be an object')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { publicId, transformations = {} } = req.body;
      
      const optimizedUrl = getOptimizedUrl(publicId, transformations);
      
      res.json({
        originalPublicId: publicId,
        optimizedUrl,
        transformations
      });
    } catch (error) {
      console.error('Optimize image error:', error);
      res.status(500).json({ error: 'Failed to optimize image' });
    }
  }
);

// Get media file info
router.get('/info/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    
    const result = await cloudinary.api.resource(publicId);
    
    const fileInfo = {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height,
      createdAt: result.created_at,
      resourceType: result.resource_type
    };

    res.json({ fileInfo });
  } catch (error) {
    if (error.http_code === 404) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    console.error('Get file info error:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

// Generate signed URL for secure uploads (for frontend direct upload)
router.post('/signature',
  [
    body('folder').notEmpty().withMessage('Folder is required'),
    body('resourceType').optional().isIn(['image', 'video', 'raw', 'auto']).withMessage('Invalid resource type')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { folder, resourceType = 'auto' } = req.body;
      
      const timestamp = Math.round(new Date().getTime() / 1000);
      const params = {
        timestamp,
        folder: `chat-app/${folder}`,
        resource_type: resourceType
      };

      const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_SECRET);

      res.json({
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API,
        cloudName: process.env.CLOUD_NAME,
        folder: params.folder
      });
    } catch (error) {
      console.error('Generate signature error:', error);
      res.status(500).json({ error: 'Failed to generate signature' });
    }
  }
);

// Health check for media service
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    cloudinary: {
      connected: !!process.env.CLOUDINARY_API,
      cloudName: process.env.CLOUD_NAME
    },
    limits: {
      maxFileSize: '50MB',
      maxFiles: 5,
      profileImageSize: '5MB'
    },
    supportedFormats: {
      images: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      videos: ['mp4', 'mov', 'avi'],
      documents: ['pdf', 'doc', 'docx', 'txt']
    }
  });
});

module.exports = router;
