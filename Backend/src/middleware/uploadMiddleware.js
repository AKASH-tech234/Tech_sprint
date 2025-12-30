import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('☁️ [Cloudinary] Configuration:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Not Set',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Not Set',
  USE_CLOUDINARY: process.env.USE_CLOUDINARY
});

// Choose storage based on environment
const useCloudinary = process.env.USE_CLOUDINARY === 'true';

console.log(`📦 [Storage] Mode: ${useCloudinary ? 'Cloudinary ☁️' : 'Local Storage 💾'}`);

let storage;

if (useCloudinary) {
  // Cloudinary storage
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      return {
        folder: 'citizenvoice/issues',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        public_id: `issue-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
        resource_type: 'auto'
      };
    }
  });
  console.log('✅ [Cloudinary] Storage initialized successfully');
} else {
  // Local storage (fallback)
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/issues/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'issue-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  console.log('✅ [Local Storage] Storage initialized successfully');
}

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
  }
};

// Multer configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB max
  }
});

// Middleware to handle multiple files
export const uploadIssueImages = upload.array('images', 5);  // Max 5 images

// Export cloudinary for direct use if needed
export { cloudinary };