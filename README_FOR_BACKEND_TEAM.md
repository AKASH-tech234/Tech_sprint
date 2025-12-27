# 👨‍💻 README for Backend Team

**CitizenVoice - Backend Integration Guide**

---

## 🎯 Quick Summary

The **frontend is 100% complete** and ready for backend integration. All API calls are:
- ✅ Commented with endpoint details
- ✅ Wrapped in try-catch for error handling
- ✅ Using mock data that can be easily replaced
- ✅ Located in specific files (see below)

---

## 📂 Project Structure

```
CitizenVoice/
├── Backend/                           # ← YOUR WORK HERE
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js     # ✅ DONE (existing)
│   │   │   ├── issueController.js    # ⚠️ TO CREATE
│   │   │   ├── notificationController.js  # ⚠️ TO CREATE
│   │   │   └── userController.js     # ⚠️ TO CREATE
│   │   ├── models/
│   │   │   ├── userModel.js          # ✅ DONE (existing)
│   │   │   ├── Issue.js              # ⚠️ TO CREATE
│   │   │   └── Notification.js       # ⚠️ TO CREATE
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # ✅ DONE (existing)
│   │   │   ├── issueRoutes.js        # ⚠️ TO CREATE
│   │   │   └── notificationRoutes.js # ⚠️ TO CREATE
│   │   └── middleware/
│   │       ├── authMiddleware.js     # ✅ DONE (existing)
│   │       └── uploadMiddleware.js   # ⚠️ TO CREATE
│   └── index.js                      # ✅ DONE (existing)
│
└── CitizenVoice/                      # Frontend (COMPLETE)
    └── src/
        ├── services/
        │   ├── authservices.js       # 🔌 AUTH API CALLS HERE
        │   └── issueService.js       # 🔌 ISSUE API CALLS HERE
        ├── components/
        │   └── Dashboard/
        │       ├── Citizen/          # 🔌 CITIZEN ENDPOINTS
        │       ├── Official/         # 🔌 OFFICIAL ENDPOINTS
        │       └── Community/        # 🔌 COMMUNITY ENDPOINTS
        └── pages/
            └── Dashboard/            # 🔌 DASHBOARD ENDPOINTS
```

---

## 🔍 Where to Find API Integration Points

### Search Pattern:
In any file, search for:
```
BACKEND API CALL
```

This will show you ALL 50+ places where frontend is calling backend APIs.

### Key Files with API Calls:

| File | API Calls | Line Range |
|------|-----------|-----------|
| `CitizenVoice/src/services/authservices.js` | Login, Signup, Google OAuth, Logout | 40-150 |
| `CitizenVoice/src/services/issueService.js` | All issue operations | 20-200 |
| `CitizenVoice/src/components/Dashboard/Citizen/reportissue.jsx` | Create issue with images | 350-450 |
| `CitizenVoice/src/components/Dashboard/Citizen/myissue.jsx` | Get user's issues, upvote, delete | 80-200 |
| `CitizenVoice/src/components/Dashboard/Citizen/IssueMap.jsx` | Get map issues | 150-180 |
| `CitizenVoice/src/components/Dashboard/Shared/NearbyIssuesMap.jsx` | Get nearby issues | 65-100 |
| `CitizenVoice/src/pages/Dashboard/CitizenDashboard.jsx` | Stats, notifications, profile | 90-800 |

---

## 📚 Documentation Files

We've created 3 comprehensive guides for you:

### 1. **BACKEND_INTEGRATION_GUIDE.md** (Main Reference)
- Complete API endpoint specifications
- Request/Response examples
- Authentication details
- All 50+ endpoints documented

### 2. **BACKEND_API_COMPLETE.md** (API Reference)
- Quick API reference
- Organized by feature
- Frontend file locations
- Line numbers for each endpoint

### 3. **BACKEND_IMPLEMENTATION_GUIDE.md** (Step-by-Step)
- Complete code examples
- Copy-paste ready code
- Issue model schema
- File upload setup
- Testing instructions

---

## 🚀 Quick Start (5 Steps)

### Step 1: Install Packages
```bash
cd Backend
npm install multer cloudinary socket.io node-geocoder
```

### Step 2: Create Issue Model
Copy from: `BACKEND_IMPLEMENTATION_GUIDE.md` → Step 2

### Step 3: Create Upload Middleware
Copy from: `BACKEND_IMPLEMENTATION_GUIDE.md` → Step 3

### Step 4: Create Issue Controller
Copy from: `BACKEND_IMPLEMENTATION_GUIDE.md` → Step 4

### Step 5: Create Issue Routes & Register
Copy from: `BACKEND_IMPLEMENTATION_GUIDE.md` → Step 5-6

---

## 🔗 Priority API Endpoints to Implement

### **HIGH PRIORITY** (Core Features)

#### 1. Issue Management
```
✅ Already in Backend: Authentication APIs
⚠️ TO CREATE:
- POST /api/issues/create (with multipart/form-data)
- GET /api/issues/my-issues
- GET /api/issues/recent
- GET /api/issues/map
- GET /api/issues/nearby
- POST /api/issues/:id/upvote
- DELETE /api/issues/:id
```

**Frontend Ready:** All citizen dashboard features

---

#### 2. File Upload
```
⚠️ TO CREATE:
- Multer middleware for image uploads
- Support for max 5 images, 5MB each
- Store in Cloudinary or local storage
```

**Frontend Ready:** Report Issue form with image upload

---

### **MEDIUM PRIORITY** (Enhanced Features)

#### 3. Notifications
```
⚠️ TO CREATE:
- GET /api/notifications
- PUT /api/notifications/mark-all-read
- PUT /api/notifications/:id/read
- DELETE /api/notifications/:id
```

**Frontend Ready:** Notification page with filters

---

#### 4. User Profile
```
⚠️ TO CREATE:
- PUT /api/users/me (update profile)
- GET /api/users/me/stats
- PUT /api/users/me/settings
```

**Frontend Ready:** Profile and Settings pages

---

### **LOW PRIORITY** (Advanced Features)

#### 5. Official Dashboard
```
⚠️ TO CREATE:
- GET /api/officials/assigned-issues
- PUT /api/issues/:id/assign
- GET /api/officials/team
- GET /api/officials/analytics
```

**Frontend Ready:** Official Dashboard UI

---

#### 6. Community Dashboard
```
⚠️ TO CREATE:
- GET /api/community/area-issues
- GET /api/community/verification-queue
- POST /api/community/verify/:id
- GET /api/community/stats
```

**Frontend Ready:** Community Dashboard UI

---

## 📋 API Endpoint Summary

### Total Endpoints Needed: **35+**

| Category | Endpoints | Status |
|----------|-----------|--------|
| Authentication | 6 | ✅ DONE (existing) |
| Issue Management | 10 | ⚠️ TO CREATE |
| Notifications | 4 | ⚠️ TO CREATE |
| User Profile | 3 | ⚠️ TO CREATE |
| Official Dashboard | 6 | ⚠️ TO CREATE |
| Community Dashboard | 6 | ⚠️ TO CREATE |

---

## 🔐 Authentication System

### Already Implemented (Backend folder)
✅ JWT with HTTP-only cookies  
✅ Google OAuth integration  
✅ Protected routes middleware  
✅ User model with roles (citizen, official, community)  

### How It Works:
1. User logs in → Backend returns JWT in HTTP-only cookie
2. Frontend makes requests with `credentials: 'include'`
3. Backend middleware `protect()` verifies JWT from cookie
4. User object attached to `req.user`

### Frontend Configuration (Already Done):
```javascript
// CitizenVoice/src/services/authservices.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true  // ← Sends cookies
});
```

---

## 📦 Data Models Reference

### User Model (Existing)
```javascript
{
  username: String,
  email: String (unique),
  password: String (hashed),
  role: "citizen" | "official" | "community",
  googleId: String,
  avatar: String,
  phone: String,
  address: String,
  isVerified: Boolean,
  isActive: Boolean
}
```

### Issue Model (To Create)
```javascript
{
  issueId: String (unique, e.g., "ISS-1234567890"),
  title: String,
  description: String,
  category: Enum,
  priority: Enum,
  status: Enum,
  location: {
    address: String,
    lat: Number,
    lng: Number,
    city: String,
    state: String
  },
  images: [String],
  reportedBy: ObjectId (User),
  assignedTo: ObjectId (User),
  upvotes: [ObjectId] (Users who upvoted),
  comments: [{
    user: ObjectId,
    text: String,
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

Full schema in: `BACKEND_IMPLEMENTATION_GUIDE.md` → Step 2

---

## 🧪 Testing Your APIs

### Using Postman:

#### Test 1: Create Issue
```http
POST http://localhost:5000/api/issues/create
Content-Type: multipart/form-data
Cookie: token=YOUR_JWT_TOKEN

Body:
- title: "Test Pothole"
- description: "Testing"
- category: "pothole"
- priority: "high"
- location: {"address":"123 Main St","lat":40.7128,"lng":-74.0060}
- images: [Upload files]
```

#### Test 2: Get Issues
```http
GET http://localhost:5000/api/issues/my-issues
Cookie: token=YOUR_JWT_TOKEN
```

#### Test 3: Upvote
```http
POST http://localhost:5000/api/issues/ISSUE_ID/upvote
Cookie: token=YOUR_JWT_TOKEN
```

---

## 🔄 How to Replace Mock Data

### Current State (Frontend):
```javascript
// Example from myissue.jsx
const mockIssues = [...]; // Temporary data

// API call is commented out:
// const data = await issueService.getMyIssues();
```

### What You Need to Do:
1. Implement the backend endpoint
2. Frontend will automatically work when:
   - API returns same structure as mock data
   - Endpoint URL matches frontend expectation

### Data Structure Must Match:
Frontend expects this response format:
```javascript
{
  success: true,
  issues: [
    {
      id: "ISS-001",
      title: "...",
      description: "...",
      category: "pothole",
      status: "reported",
      location: {lat, lng, address},
      images: ["url1", "url2"],
      upvotes: 0,
      comments: [],
      createdAt: "2024-12-27T10:00:00Z"
    }
  ],
  total: 12
}
```

---

## 🌐 CORS Configuration (Important!)

### Backend CORS Setup (Required):
```javascript
// Backend/index.js
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179'
  ],
  credentials: true,  // ← IMPORTANT for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Network Error" in Frontend
**Cause:** Backend not running or wrong URL  
**Solution:** 
- Ensure backend runs on `http://localhost:5000`
- Check `VITE_API_BASE_URL` in frontend `.env`

### Issue 2: "401 Unauthorized"
**Cause:** Cookie not being sent  
**Solution:**
- Ensure `credentials: true` in CORS
- Frontend using `withCredentials: true`

### Issue 3: "File upload not working"
**Cause:** Missing multer middleware  
**Solution:** Follow Step 3 in Implementation Guide

### Issue 4: Images not displaying
**Cause:** Wrong image URL or not serving static files  
**Solution:**
```javascript
app.use('/uploads', express.static('uploads'));
```

---

## 📞 Frontend Team Contact Points

If you need clarification on:
- **Data structure:** Check mock data in frontend files
- **API behavior:** Check commented API calls
- **Response format:** Check frontend error handling code

**All API expectations are documented in the frontend code comments!**

---

## ✅ Implementation Checklist

### Week 1: Core Features
- [ ] Set up file upload (multer)
- [ ] Create Issue model
- [ ] Implement POST /api/issues/create
- [ ] Implement GET /api/issues/my-issues
- [ ] Implement GET /api/issues/recent
- [ ] Test with Postman
- [ ] Frontend integration test

### Week 2: Map Features
- [ ] Implement GET /api/issues/map
- [ ] Implement GET /api/issues/nearby
- [ ] Add geospatial indexing
- [ ] Implement POST /api/issues/:id/upvote
- [ ] Implement DELETE /api/issues/:id
- [ ] Test map functionality

### Week 3: Advanced Features
- [ ] Implement Notification APIs
- [ ] Implement User Profile APIs
- [ ] Add WebSocket for real-time updates
- [ ] Implement Official Dashboard APIs
- [ ] Implement Community Dashboard APIs

---

## 🎯 Success Criteria

Your backend is ready when:
1. ✅ Create issue with images works
2. ✅ User can see their issues in "My Issues"
3. ✅ Issues appear on interactive map
4. ✅ Nearby issues widget shows real data
5. ✅ Upvote/downvote updates in real-time
6. ✅ Notifications display correctly
7. ✅ Profile updates save successfully

---

## 📖 Documentation Index

1. **BACKEND_INTEGRATION_GUIDE.md** - Start here for API specs
2. **BACKEND_API_COMPLETE.md** - Quick API reference
3. **BACKEND_IMPLEMENTATION_GUIDE.md** - Copy-paste code examples
4. **This file (README_FOR_BACKEND_TEAM.md)** - Overview & quick start

---

## 🚀 Start Here

1. Read this file completely
2. Open `BACKEND_IMPLEMENTATION_GUIDE.md`
3. Follow steps 1-6 to implement Issue APIs
4. Test with Postman
5. Watch frontend come alive! ✨

---

**Frontend is 100% ready and waiting for your APIs!** 🎉

**Questions?** Search for "BACKEND API CALL" in the frontend code to see exactly what each endpoint needs!

**Good luck! You've got this! 💪**
