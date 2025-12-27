# 🔌 CitizenVoice Backend Integration Guide

**Version:** 1.0  
**Last Updated:** December 27, 2024  
**Frontend Tech Stack:** React 19 + Vite + React Router v7  
**Backend Expected:** Node.js + Express + MongoDB (or your choice)

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [API Endpoints Reference](#api-endpoints-reference)
4. [Authentication System](#authentication-system)
5. [File Structure](#file-structure)
6. [Where to Find Frontend API Calls](#where-to-find-frontend-api-calls)
7. [Data Models](#data-models)
8. [Real-time Integration Guide](#real-time-integration-guide)
9. [Testing & Development](#testing--development)

---

## 📖 Project Overview

**CitizenVoice** is a civic engagement platform with three role-based dashboards:
- **Citizen Dashboard** - Report and track civic issues
- **Official Dashboard** - Manage and assign issues to teams
- **Community Dashboard** - Verify and monitor area issues

### Key Features:
✅ Issue reporting with photo upload + GPS  
✅ Interactive maps with heatmap & clustering  
✅ Real-time notifications  
✅ Role-based access control (Citizen, Official, Community)  
✅ Upvoting, commenting, and verification system  
✅ Team management & analytics  

---

## 🏗️ Architecture

### Frontend Structure:
```
CitizenVoice/
├── src/
│   ├── components/
│   │   └── Dashboard/
│   │       ├── Citizen/        # Citizen-specific components
│   │       ├── Official/       # Official-specific components
│   │       ├── Community/      # Community-specific components
│   │       └── Shared/         # Shared components (Header, Sidebar, etc.)
│   ├── services/
│   │   ├── authservices.js     # ⚠️ AUTH API CALLS HERE
│   │   └── issueService.js     # ⚠️ ISSUE API CALLS HERE
│   ├── context/
│   │   └── Authcontext.jsx     # Authentication context
│   ├── pages/
│   │   └── Dashboard/          # Dashboard pages
│   └── utils/                  # Utility functions
```

### Backend Structure (Expected):
```
Backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── issueController.js  # Issue CRUD operations
│   │   ├── userController.js   # User management
│   │   └── notificationController.js
│   ├── models/
│   │   ├── User.js             # User schema
│   │   ├── Issue.js            # Issue schema
│   │   └── Notification.js     # Notification schema
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth/*
│   │   ├── issueRoutes.js      # /api/issues/*
│   │   ├── userRoutes.js       # /api/users/*
│   │   └── notificationRoutes.js # /api/notifications/*
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification
│   │   └── uploadMiddleware.js # File upload (multer)
│   └── utils/
│       ├── geocoding.js        # Reverse geocoding
│       └── websocket.js        # Real-time updates
```

---

## 🔗 API Endpoints Reference

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

---

## 1️⃣ Authentication APIs

**Frontend File:** `CitizenVoice/src/services/authservices.js`

### 1.1 User Signup
```http
POST /api/auth/signup
Content-Type: application/json

Request Body:
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "citizen" | "official" | "community",
  "phone": "+1234567890" (optional),
  "address": "123 Main St" (optional)
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user123",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "citizen",
    "avatar": null,
    "isVerified": false
  }
}

Response (400):
{
  "success": false,
  "message": "Email already exists",
  "errors": ["Email is already registered"]
}
```

**Frontend Location:**
- File: `CitizenVoice/src/services/authservices.js`
- Function: `signup(userData)`
- Line: ~40-50

---

### 1.2 User Login
```http
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user123",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "citizen",
    "avatar": "https://...",
    "isVerified": true
  }
}

Set-Cookie: token=<JWT_TOKEN>; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
```

**Important:** Use **HTTP-only cookies** for JWT tokens (not localStorage)

**Frontend Location:**
- File: `CitizenVoice/src/services/authservices.js`
- Function: `login(email, password)`
- Line: ~60-70

---

### 1.3 Google OAuth Login
```http
POST /api/auth/google
Content-Type: application/json

Request Body:
{
  "credential": "<GOOGLE_JWT_TOKEN>",
  "role": "citizen" | "official" | "community"
}

Response (200):
{
  "success": true,
  "message": "Google login successful",
  "user": {
    "id": "user123",
    "username": "John Doe",
    "email": "john@gmail.com",
    "role": "citizen",
    "avatar": "https://lh3.googleusercontent.com/...",
    "googleId": "1234567890"
  }
}
```

**Backend Implementation:**
1. Verify Google credential using `google-auth-library`
2. Check if user exists by `googleId`
3. If new user, create account with Google profile data
4. Return JWT token in HTTP-only cookie

**Frontend Location:**
- File: `CitizenVoice/src/services/authservices.js`
- Function: `googleAuth(credential, role)`
- Line: ~80-90

---

### 1.4 Check Auth Status
```http
GET /api/auth/check
Cookie: token=<JWT_TOKEN>

Response (200):
{
  "success": true,
  "isAuthenticated": true,
  "user": {
    "id": "user123",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "citizen"
  }
}

Response (401):
{
  "success": false,
  "isAuthenticated": false,
  "message": "Not authenticated"
}
```

**Frontend Location:**
- File: `CitizenVoice/src/context/Authcontext.jsx`
- Function: `checkAuth()`
- Line: ~50-60
- **Called on app mount** to restore session

---

### 1.5 Get Current User
```http
GET /api/auth/me
Cookie: token=<JWT_TOKEN>

Response (200):
{
  "success": true,
  "user": {
    "id": "user123",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "citizen",
    "phone": "+1234567890",
    "address": "123 Main St",
    "avatar": "https://...",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Frontend Location:**
- File: `CitizenVoice/src/services/authservices.js`
- Function: `getCurrentUser()`
- Used in Profile page

---

### 1.6 Logout
```http
POST /api/auth/logout
Cookie: token=<JWT_TOKEN>

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}

Set-Cookie: token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0
```

**Frontend Location:**
- File: `CitizenVoice/src/context/Authcontext.jsx`
- Function: `logout()`
- Line: ~100-110

---

## 2️⃣ Issue Management APIs

**Frontend File:** `CitizenVoice/src/services/issueService.js`

### 2.1 Create Issue (with File Upload)
```http
POST /api/issues/create
Content-Type: multipart/form-data
Cookie: token=<JWT_TOKEN>

FormData Fields:
- title: string (required)
- description: string (required)
- category: string (required)
  Values: "pothole" | "streetlight" | "graffiti" | "garbage" | "water" | "traffic" | "parks" | "other"
- priority: string (required)
  Values: "low" | "medium" | "high"
- location: JSON string (required)
  {
    "address": "123 Main St",
    "lat": 40.7128,
    "lng": -74.0060,
    "city": "New York",
    "state": "NY"
  }
- images: File[] (optional, max 5 files, 5MB each)

Response (201):
{
  "success": true,
  "message": "Issue created successfully",
  "issue": {
    "id": "ISS-1234567890",
    "title": "Large pothole on Main Street",
    "description": "...",
    "category": "pothole",
    "priority": "high",
    "status": "reported",
    "location": {
      "address": "123 Main St",
      "lat": 40.7128,
      "lng": -74.0060,
      "city": "New York",
      "state": "NY"
    },
    "images": [
      "https://your-cdn.com/uploads/issue-img-1.jpg",
      "https://your-cdn.com/uploads/issue-img-2.jpg"
    ],
    "reportedBy": "user123",
    "upvotes": 0,
    "comments": [],
    "createdAt": "2024-12-27T10:00:00Z",
    "updatedAt": "2024-12-27T10:00:00Z"
  }
}
```

**Backend Implementation Notes:**
1. Use **multer** for file upload
2. Validate image types (JPEG, PNG, WebP, GIF)
3. Limit file size to 5MB per image
4. Store images in CDN/S3/local storage
5. Parse `location` JSON string
6. Generate unique issue ID (e.g., `ISS-{timestamp}`)
7. Set initial status to `"reported"`

**Frontend Location:**
- File: `CitizenVoice/src/components/Dashboard/Citizen/reportissue.jsx`
- Function: `handleSubmit()`
- Line: ~350-400

---

### 2.2 Get User's Issues
```http
GET /api/issues/my-issues?status={status}&category={category}
Cookie: token=<JWT_TOKEN>

Query Parameters:
- status: string (optional)
  Values: "all" | "reported" | "acknowledged" | "in-progress" | "resolved" | "rejected"
- category: string (optional)
  Values: "all" | "pothole" | "streetlight" | etc.

Response (200):
{
  "success": true,
  "issues": [
    {
      "id": "ISS-001",
      "title": "Pothole on Main St",
      "description": "...",
      "category": "pothole",
      "priority": "high",
      "status": "in-progress",
      "location": {...},
      "images": ["https://..."],
      "upvotes": 15,
      "comments": [{...}],
      "createdAt": "2024-12-20T10:00:00Z",
      "updatedAt": "2024-12-24T15:00:00Z"
    }
  ],
  "total": 12
}
```

**Frontend Location:**
- File: `CitizenVoice/src/components/Dashboard/Citizen/myissue.jsx`
- Function: `fetchIssues()`
- Line: ~80-120

---

### 2.3 Get Recent Issues
```http
GET /api/issues/recent?limit=6
Cookie: token=<JWT_TOKEN>

Query Parameters:
- limit: number (optional, default: 6)

Response (200):
{
  "success": true,
  "issues": [
    {...}, {...}, {...}
  ],
  "total": 6
}
```

**Frontend Location:**
- File: `CitizenVoice/src/pages/Dashboard/CitizenDashboard.jsx`
- Function: `loadRecentIssues()`
- Line: ~90-110

---

### 2.4 Get Issues for Map (with bounds)
```http
GET /api/issues/map?bounds={minLat,minLng,maxLat,maxLng}&status={status}&category={category}
Cookie: token=<JWT_TOKEN>

Query Parameters:
- bounds: string (optional) - "40.7,-74.1,40.8,-74.0"
  Format: minLat,minLng,maxLat,maxLng
- status: string (optional)
- category: string (optional)

Response (200):
{
  "success": true,
  "issues": [
    {
      "id": "ISS-001",
      "title": "Pothole",
      "category": "pothole",
      "status": "reported",
      "location": {
        "lat": 40.7128,
        "lng": -74.0060,
        "address": "123 Main St"
      },
      "createdAt": "2024-12-27T10:00:00Z"
    }
  ],
  "total": 25
}
```

**Optimization:** Only return issues with valid lat/lng within map bounds

**Frontend Location:**
- File: `CitizenVoice/src/components/Dashboard/Citizen/IssueMap.jsx`
- Function: `useEffect()` load
- Line: ~150-200

---

### 2.5 Get Nearby Issues
```http
GET /api/issues/nearby?lat={lat}&lng={lng}&radius={meters}
Cookie: token=<JWT_TOKEN>

Query Parameters:
- lat: number (required) - User's latitude
- lng: number (required) - User's longitude
- radius: number (optional, default: 2000) - Radius in meters

Response (200):
{
  "success": true,
  "issues": [
    {
      "id": "ISS-001",
      "title": "Pothole on Main St",
      "category": "pothole",
      "status": "reported",
      "location": {
        "lat": 40.7128,
        "lng": -74.0060,
        "address": "123 Main St"
      },
      "distance": "0.5 km"  // Calculated distance from user
    }
  ],
  "total": 10
}
```

**Backend Implementation:**
Use MongoDB geospatial query or calculate distance:
```javascript
// Haversine formula for distance calculation
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

**Frontend Location:**
- File: `CitizenVoice/src/components/Dashboard/Shared/NearbyIssuesMap.jsx`
- Function: `loadNearbyIssues()`
- Line: ~70-100

---

## ⏰ Continue in next response with more endpoints...

This is part 1 of the Backend Integration Guide. Should I continue with:
- Issue actions (upvote, comment, delete)
- Notification APIs
- User profile APIs
- Official Dashboard APIs
- Community Dashboard APIs
- Real-time integration (WebSockets)
- Testing guide

Continue?
