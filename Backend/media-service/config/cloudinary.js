const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET
});

// Profile images storage
const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chat-app/profile-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  }
});

// Chat media storage
const chatMediaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    let folder = 'chat-app/chat-media';
    let transformation = [];

    // Determine folder and transformations based on file type
    if (file.mimetype.startsWith('image/')) {
      folder = 'chat-app/chat-images';
      transformation = [
        { quality: 'auto', fetch_format: 'auto' },
        { width: 1200, height: 1200, crop: 'limit' }
      ];
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'chat-app/chat-videos';
      transformation = [
        { quality: 'auto', fetch_format: 'auto' },
        { width: 1920, height: 1080, crop: 'limit' }
      ];
    } else {
      folder = 'chat-app/chat-files';
    }

    return {
      folder: folder,
      resource_type: file.mimetype.startsWith('video/') ? 'video' : 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx', 'txt'],
      transformation: transformation
    };
  }
});

// Helper functions
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    ...options,
    quality: 'auto',
    fetch_format: 'auto'
  });
};

module.exports = {
  cloudinary,
  profileImageStorage,
  chatMediaStorage,
  deleteFromCloudinary,
  getOptimizedUrl
};
