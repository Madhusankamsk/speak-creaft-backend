const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const { UPLOAD_CONFIG, CLOUDINARY_CONFIG } = require('../utils/constants');

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CONFIG.CLOUD_NAME,
  api_key: CLOUDINARY_CONFIG.API_KEY,
  api_secret: CLOUDINARY_CONFIG.API_SECRET
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file type is allowed
  if (UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${UPLOAD_CONFIG.ALLOWED_TYPES.join(', ')} are allowed.`), false);
  }
};

// Cloudinary storage configuration for tips
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'speakcraft/tips', // Folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [
      { width: 800, height: 600, crop: 'limit' }, // Resize large images
      { quality: 'auto' } // Optimize quality
    ]
  }
});

// Cloudinary storage configuration for avatars
const cloudinaryAvatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'speakcraft/avatars', // Folder in Cloudinary for avatars
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' }, // Square crop focused on face
      { quality: 'auto' } // Optimize quality
    ]
  }
});

// Local storage configuration (fallback)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_CONFIG.UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Choose storage based on Cloudinary configuration
const getStorage = (storageType = 'tips') => {
  const hasCloudinary = CLOUDINARY_CONFIG.CLOUD_NAME && CLOUDINARY_CONFIG.API_KEY && CLOUDINARY_CONFIG.API_SECRET;
  
  if (!hasCloudinary) {
    return localStorage;
  }
  
  return storageType === 'avatar' ? cloudinaryAvatarStorage : cloudinaryStorage;
};

// Create multer upload middleware with dynamic storage
const createUpload = (storageType = 'tips') => {
  return multer({
    storage: getStorage(storageType),
    limits: {
      fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE
    },
    fileFilter: fileFilter
  });
};

// Single file upload middleware
const uploadSingle = (fieldName = 'image', storageType = 'tips') => {
  return (req, res, next) => {
    const upload = createUpload(storageType);
    const uploadSingleFile = upload.single(fieldName);
    
    uploadSingleFile(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 5MB.'
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

// Multiple files upload middleware
const uploadMultiple = (fieldName = 'images', maxCount = 5) => {
  return (req, res, next) => {
    const uploadMultipleFiles = upload.array(fieldName, maxCount);
    
    uploadMultipleFiles(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 5MB.'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Too many files. Maximum ${maxCount} files allowed.`
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

module.exports = {
  createUpload,
  uploadSingle,
  uploadMultiple,
  cloudinary
};