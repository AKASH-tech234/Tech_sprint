import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

// MUST BE BEFORE STORAGE
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// LOG CONFIG
console.log("☁️ Cloudinary configured")

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'citizenvoice/issues',
    format: file.mimetype.split('/')[1],
    public_id: `issue-${Date.now()}`
  })
})

export const uploadIssueImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
}).array('images', 5)
