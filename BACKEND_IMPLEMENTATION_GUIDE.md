# 🚀 CitizenVoice Backend Implementation Guide

**Quick Start Guide for Backend Developers**

---

## 📦 What You Need to Implement

### ✅ Already Done (Existing Backend Folder)
- Authentication system (signup, login, Google OAuth)
- User model & controller
- JWT authentication middleware
- Basic Express server setup

### ⚠️ What You Need to Add

1. **Issue Management System** (Priority: HIGH)
2. **File Upload Handling** (Priority: HIGH)
3. **Notification System** (Priority: MEDIUM)
4. **Geocoding Service** (Priority: MEDIUM)
5. **WebSocket for Real-time Updates** (Priority: LOW)

---

## 🎯 Step-by-Step Implementation

### Step 1: Install Required Packages

```bash
cd Backend
npm install multer cloudinary socket.io node-geocoder
```

**Package Purposes:**
- `multer` - Handle multipart/form-data (image uploads)
- `cloudinary` (or AWS S3) - Store uploaded images
- `socket.io` - Real-time notifications
- `node-geocoder` - Reverse geocoding (lat/lng to address)

---

### Step 2: Create Issue Model

**File:** `Backend/src/models/Issue.js`

```javascript
import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  issueId: {
    type: String,
    unique: true,
    required: true,
    default: () => `ISS-${Date.now()}`
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: ['pothole', 'streetlight', 'graffiti', 'garbage', 'water', 'traffic', 'parks', 'other']
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    required: true,
    enum: ['reported', 'acknowledged', 'in-progress', 'resolved', 'rejected'],
    default: 'reported'
  },
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    city: String,
    state: String
  },
  images: [{
    type: String  // URLs to uploaded images
  }],
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for geospatial queries
issueSchema.index({ 'location.lat': 1, 'location.lng': 1 });

export default mongoose.model('Issue', issueSchema);
```

---

### Step 3: Set Up File Upload Middleware

**File:** `Backend/src/middleware/uploadMiddleware.js`

```javascript
import multer from 'multer';
import path from 'path';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/issues/');  // Create this folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'issue-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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
```

**Alternative: Cloudinary Setup**

```javascript
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'citizenvoice/issues',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

export const upload = multer({ storage: storage });
```

---

### Step 4: Create Issue Controller

**File:** `Backend/src/controllers/issueController.js`

```javascript
import Issue from '../models/Issue.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AsyncHandler } from '../utils/AsyncHandler.js';

// Create Issue
export const createIssue = AsyncHandler(async (req, res) => {
  const { title, description, category, priority, location } = req.body;
  
  // Parse location JSON string
  const locationData = typeof location === 'string' ? JSON.parse(location) : location;
  
  // Validate required fields
  if (!title || !description || !category || !locationData) {
    throw new ApiError(400, 'Missing required fields');
  }
  
  // Validate location coordinates
  if (!locationData.lat || !locationData.lng) {
    throw new ApiError(400, 'GPS coordinates required');
  }
  
  // Get uploaded image URLs
  const imageUrls = req.files ? req.files.map(file => {
    // For local storage
    return `${req.protocol}://${req.get('host')}/uploads/issues/${file.filename}`;
    // For Cloudinary
    // return file.path;
  }) : [];
  
  // Create issue
  const issue = await Issue.create({
    title,
    description,
    category,
    priority: priority || 'medium',
    location: locationData,
    images: imageUrls,
    reportedBy: req.user._id
  });
  
  // Populate user details
  await issue.populate('reportedBy', 'username email avatar');
  
  res.status(201).json(
    new ApiResponse(201, issue, 'Issue created successfully')
  );
});

// Get User's Issues
export const getMyIssues = AsyncHandler(async (req, res) => {
  const { status, category } = req.query;
  
  const query = { reportedBy: req.user._id };
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  if (category && category !== 'all') {
    query.category = category;
  }
  
  const issues = await Issue.find(query)
    .populate('reportedBy', 'username avatar')
    .populate('assignedTo', 'username')
    .sort({ createdAt: -1 });
  
  res.json(
    new ApiResponse(200, { issues, total: issues.length }, 'Issues fetched successfully')
  );
});

// Get Recent Issues
export const getRecentIssues = AsyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  
  const issues = await Issue.find()
    .populate('reportedBy', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(limit);
  
  res.json(
    new ApiResponse(200, { issues, total: issues.length })
  );
});

// Get Issues for Map
export const getMapIssues = AsyncHandler(async (req, res) => {
  const { bounds, status, category } = req.query;
  
  const query = {};
  
  // Parse bounds (minLat,minLng,maxLat,maxLng)
  if (bounds) {
    const [minLat, minLng, maxLat, maxLng] = bounds.split(',').map(Number);
    query['location.lat'] = { $gte: minLat, $lte: maxLat };
    query['location.lng'] = { $gte: minLng, $lte: maxLng };
  }
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  if (category && category !== 'all') {
    query.category = category;
  }
  
  const issues = await Issue.find(query)
    .select('issueId title category status location createdAt')
    .lean();
  
  res.json(
    new ApiResponse(200, { issues, total: issues.length })
  );
});

// Get Nearby Issues
export const getNearbyIssues = AsyncHandler(async (req, res) => {
  const { lat, lng, radius } = req.query;
  
  if (!lat || !lng) {
    throw new ApiError(400, 'Latitude and longitude required');
  }
  
  const radiusInMeters = parseInt(radius) || 2000;
  const radiusInDegrees = radiusInMeters / 111000; // Approximate conversion
  
  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  
  const issues = await Issue.find({
    'location.lat': {
      $gte: userLat - radiusInDegrees,
      $lte: userLat + radiusInDegrees
    },
    'location.lng': {
      $gte: userLng - radiusInDegrees,
      $lte: userLng + radiusInDegrees
    }
  })
  .select('issueId title category status location')
  .lean();
  
  // Calculate exact distances
  const issuesWithDistance = issues.map(issue => {
    const distance = calculateDistance(
      userLat, userLng,
      issue.location.lat, issue.location.lng
    );
    
    return {
      ...issue,
      distance: `${(distance / 1000).toFixed(1)} km`
    };
  });
  
  // Filter by exact radius and sort by distance
  const nearbyIssues = issuesWithDistance
    .filter(issue => parseFloat(issue.distance) * 1000 <= radiusInMeters)
    .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
    .slice(0, 10);
  
  res.json(
    new ApiResponse(200, { issues: nearbyIssues, total: nearbyIssues.length })
  );
});

// Upvote Issue
export const upvoteIssue = AsyncHandler(async (req, res) => {
  const { issueId } = req.params;
  
  const issue = await Issue.findById(issueId);
  
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  
  // Toggle upvote
  const userId = req.user._id;
  const upvoteIndex = issue.upvotes.indexOf(userId);
  
  if (upvoteIndex > -1) {
    // Remove upvote
    issue.upvotes.splice(upvoteIndex, 1);
  } else {
    // Add upvote
    issue.upvotes.push(userId);
  }
  
  await issue.save();
  
  res.json(
    new ApiResponse(200, { upvotes: issue.upvotes.length }, 'Upvote updated')
  );
});

// Delete Issue
export const deleteIssue = AsyncHandler(async (req, res) => {
  const { issueId } = req.params;
  
  const issue = await Issue.findById(issueId);
  
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  
  // Check ownership
  if (issue.reportedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to delete this issue');
  }
  
  await issue.deleteOne();
  
  res.json(
    new ApiResponse(200, null, 'Issue deleted successfully')
  );
});

// Helper: Calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}
```

---

### Step 5: Create Issue Routes

**File:** `Backend/src/routes/issueRoutes.js`

```javascript
import express from 'express';
import {
  createIssue,
  getMyIssues,
  getRecentIssues,
  getMapIssues,
  getNearbyIssues,
  upvoteIssue,
  deleteIssue
} from '../controllers/issueController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadIssueImages } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Issue CRUD
router.post('/create', uploadIssueImages, createIssue);
router.get('/my-issues', getMyIssues);
router.get('/recent', getRecentIssues);
router.get('/map', getMapIssues);
router.get('/nearby', getNearbyIssues);

// Issue actions
router.post('/:issueId/upvote', upvoteIssue);
router.delete('/:issueId', deleteIssue);

export default router;
```

---

### Step 6: Register Routes in Main Server

**File:** `Backend/index.js`

```javascript
import issueRoutes from './src/routes/issueRoutes.js';

// ... existing code ...

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);  // ← ADD THIS

// Serve uploaded files
app.use('/uploads', express.static('uploads'));  // ← ADD THIS

// ... rest of server code ...
```

---

### Step 7: Create Uploads Directory

```bash
mkdir -p Backend/uploads/issues
```

Add to `.gitignore`:
```
uploads/
*.jpg
*.png
*.jpeg
```

---

## 🧪 Testing Your Backend

### Test 1: Create Issue with Postman

```http
POST http://localhost:5000/api/issues/create
Content-Type: multipart/form-data
Cookie: token=YOUR_JWT_TOKEN

Body (form-data):
- title: "Test Pothole"
- description: "Testing issue creation"
- category: "pothole"
- priority: "high"
- location: {"address":"123 Main St","lat":40.7128,"lng":-74.0060,"city":"NYC","state":"NY"}
- images: [Upload 1-5 image files]
```

### Test 2: Get My Issues

```http
GET http://localhost:5000/api/issues/my-issues?status=all&category=all
Cookie: token=YOUR_JWT_TOKEN
```

### Test 3: Upvote Issue

```http
POST http://localhost:5000/api/issues/ISSUE_ID_HERE/upvote
Cookie: token=YOUR_JWT_TOKEN
```

---

## 🔧 Environment Variables

Add to `Backend/.env`:

```env
# Existing
PORT=5000
MONGODB_URI=mongodb://localhost:27017/citizenvoice
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
CLIENT_URL=http://localhost:5173

# Add these for image upload
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 📍 Frontend Integration Points

### Where Frontend Calls These APIs:

1. **Create Issue:**
   - File: `CitizenVoice/src/components/Dashboard/Citizen/reportissue.jsx`
   - Line: ~400-450
   - Search for: `// BACKEND API CALL: Create Issue`

2. **Get My Issues:**
   - File: `CitizenVoice/src/components/Dashboard/Citizen/myissue.jsx`
   - Line: ~80-120
   - Search for: `// BACKEND API CALL: Get User's Issues`

3. **Map Issues:**
   - File: `CitizenVoice/src/components/Dashboard/Citizen/IssueMap.jsx`
   - Line: ~150-180
   - Search for: `// BACKEND API CALL: Get All Issues with Location`

4. **Nearby Issues:**
   - File: `CitizenVoice/src/components/Dashboard/Shared/NearbyIssuesMap.jsx`
   - Line: ~65-100
   - Search for: `// BACKEND API CALL: Get Nearby Issues`

---

## ✅ Quick Checklist

- [ ] Install packages: `multer`, `cloudinary`, `socket.io`, `node-geocoder`
- [ ] Create `Issue` model with geospatial indexing
- [ ] Set up file upload middleware (multer)
- [ ] Create issue controller with all CRUD functions
- [ ] Create issue routes
- [ ] Register routes in main server
- [ ] Create uploads directory
- [ ] Add environment variables
- [ ] Test with Postman
- [ ] Replace frontend mock data with API calls

---

## 🚀 Next Steps

After implementing Issue APIs:
1. Add Notification system
2. Implement Official Dashboard APIs (assign issues, team management)
3. Implement Community Dashboard APIs (verification, stats)
4. Add WebSocket for real-time updates
5. Set up reverse geocoding service

---

## 📞 Need Help?

All frontend API calls have comments like:
```javascript
/**
 * BACKEND API CALL: Description
 * Endpoint: POST /api/endpoint
 * Body: {...}
 * Returns: {...}
 */
```

Search for "BACKEND API CALL" in the codebase to find all integration points!

---

**Backend team: Start with Step 1 and work through each step. All frontend code is ready and waiting for your APIs!** 🎉
