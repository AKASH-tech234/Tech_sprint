# 🔌 CitizenVoice - Complete Backend API Reference

**Version:** 1.0  
**Date:** December 27, 2024

---

## 📚 Quick Navigation

1. [Authentication APIs](#1-authentication-apis) - Login, Signup, Google OAuth
2. [Issue Management APIs](#2-issue-management-apis) - CRUD operations
3. [Issue Actions APIs](#3-issue-actions-apis) - Upvote, Comment, Delete
4. [Notification APIs](#4-notification-apis) - Real-time notifications
5. [User Profile APIs](#5-user-profile-apis) - Profile management
6. [Official Dashboard APIs](#6-official-dashboard-apis) - Issue assignment, team
7. [Community Dashboard APIs](#7-community-dashboard-apis) - Verification, stats
8. [Map & Geocoding APIs](#8-map--geocoding-apis) - Location services
9. [File Upload Configuration](#9-file-upload-configuration) - Multer setup
10. [WebSocket Events](#10-websocket-events) - Real-time updates
11. [Data Models](#11-data-models) - MongoDB schemas
12. [Quick Integration Steps](#12-quick-integration-steps)

---

## Base Configuration

```javascript
// Backend Server
BASE_URL: http://localhost:5000
API_PREFIX: /api

// Frontend (already configured)
VITE_API_BASE_URL: http://localhost:5000/api

// CORS Settings (Required)
cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
})
```

---

## 1. Authentication APIs

### ✅ Already in Backend folder
File: `Backend/src/controllers/authController.js`  
Routes: `Backend/src/routes/authRoutes.js`

### 1.1 POST /api/auth/signup
```javascript
Request Body: { username, email, password, role, phone?, address? }
Response: { success: true, user: {...} }
Frontend: CitizenVoice/src/services/authservices.js (line 40)
```

### 1.2 POST /api/auth/login
```javascript
Request Body: { email, password }
Response: { success: true, user: {...} }
Set-Cookie: token=JWT; HttpOnly
Frontend: CitizenVoice/src/services/authservices.js (line 60)
```

### 1.3 POST /api/auth/google
```javascript
Request Body: { credential: string, role: string }
Response: { success: true, user: {...} }
Frontend: CitizenVoice/src/services/authservices.js (line 80)
```

### 1.4 GET /api/auth/check
```javascript
Headers: Cookie: token=JWT
Response: { success: true, isAuthenticated: true, user: {...} }
Frontend: CitizenVoice/src/context/Authcontext.jsx (line 50)
```

### 1.5 GET /api/auth/me
```javascript
Headers: Cookie: token=JWT
Response: { success: true, user: {...} }
Frontend: CitizenVoice/src/services/authservices.js (line 100)
```

### 1.6 POST /api/auth/logout
```javascript
Headers: Cookie: token=JWT
Response: { success: true }
Frontend: CitizenVoice/src/context/Authcontext.jsx (line 110)
```

---

## 2. Issue Management APIs

### ⚠️ TO BE CREATED
File: Create `Backend/src/controllers/issueController.js`  
Routes: Create `Backend/src/routes/issueRoutes.js`

### 2.1 POST /api/issues/create
```javascript
Content-Type: multipart/form-data
Headers: Cookie: token=JWT

FormData:
- title: string
- description: string
- category: "pothole"|"streetlight"|"graffiti"|"garbage"|"water"|"traffic"|"parks"|"other"
- priority: "low"|"medium"|"high"
- location: JSON string {address, lat, lng, city, state}
- images: File[] (max 5, 5MB each)

Response (201):
{
  success: true,
  message: "Issue created successfully",
  issue: {
    id: "ISS-1234567890",
    title, description, category, priority,
    status: "reported",
    location: {address, lat, lng, city, state},
    images: ["https://cdn.com/img1.jpg"],
    reportedBy: "user123",
    upvotes: 0,
    comments: [],
    createdAt, updatedAt
  }
}

Frontend Location:
File: CitizenVoice/src/components/Dashboard/Citizen/reportissue.jsx
Function: handleSubmit()
Line: ~400
```

### 2.2 GET /api/issues/my-issues
```javascript
Query: ?status=all&category=all
Headers: Cookie: token=JWT

Response (200):
{
  success: true,
  issues: [{id, title, ...}],
  total: 12
}

Frontend Location:
File: CitizenVoice/src/components/Dashboard/Citizen/myissue.jsx
Function: fetchIssues()
Line: ~85
```

### 2.3 GET /api/issues/recent
```javascript
Query: ?limit=6
Headers: Cookie: token=JWT

Response (200):
{
  success: true,
  issues: [{...}],
  total: 6
}

Frontend Location:
File: CitizenVoice/src/pages/Dashboard/CitizenDashboard.jsx
Function: loadRecentIssues()
Line: ~93
```

### 2.4 GET /api/issues/map
```javascript
Query: ?bounds=40.7,-74.1,40.8,-74.0&status=all&category=all
Headers: Cookie: token=JWT

Response (200):
{
  success: true,
  issues: [
    {id, title, category, status, location: {lat, lng, address}}
  ],
  total: 25
}

Frontend Location:
File: CitizenVoice/src/components/Dashboard/Citizen/IssueMap.jsx
Line: ~150
```

### 2.5 GET /api/issues/nearby
```javascript
Query: ?lat=40.7128&lng=-74.0060&radius=2000
Headers: Cookie: token=JWT

Response (200):
{
  success: true,
  issues: [
    {id, title, category, status, location, distance: "0.5 km"}
  ],
  total: 10
}

Frontend Location:
File: CitizenVoice/src/components/Dashboard/Shared/NearbyIssuesMap.jsx
Function: loadNearbyIssues()
Line: ~70
```

### 2.6 GET /api/issues/:issueId
```javascript
Headers: Cookie: token=JWT

Response (200):
{
  success: true,
  issue: {
    id, title, description, category, priority, status,
    location, images, reportedBy, assignedTo,
    upvotes, comments: [{user, text, createdAt}],
    createdAt, updatedAt
  }
}

Frontend Location:
Multiple places (View Details buttons)
```

---

## 3. Issue Actions APIs

### 3.1 POST /api/issues/:issueId/upvote
```javascript
Headers: Cookie: token=JWT

Response (200):
{
  success: true,
  upvotes: 16,
  message: "Issue upvoted successfully"
}

Frontend Location:
File: CitizenVoice/src/components/Dashboard/Citizen/myissue.jsx
Function: handleUpvote()
Line: ~170
```

### 3.2 POST /api/issues/:issueId/comment
```javascript
Headers: Cookie: token=JWT
Body: { text: "This needs urgent attention" }

Response (201):
{
  success: true,
  comment: {
    id: "comment123",
    user: {id, username, avatar},
    text: "This needs urgent attention",
    createdAt: "2024-12-27T10:00:00Z"
  }
}

Frontend Location:
File: CitizenVoice/src/services/issueService.js
Function: addComment()
Line: ~90
```

### 3.3 DELETE /api/issues/:issueId
```javascript
Headers: Cookie: token=JWT

Response (200):
{
  success: true,
  message: "Issue deleted successfully"
}

Frontend Location:
File: CitizenVoice/src/components/Dashboard/Citizen/myissue.jsx
Function: handleDeleteIssue()
Line: ~185
```

### 3.4 PUT /api/issues/:issueId
```javascript
Headers: Cookie: token=JWT
Body: { status, priority, assignedTo, etc. }

Response (200):
{
  success: true,
  issue: {...updated issue}
}

Frontend Location:
File: CitizenVoice/src/services/issueService.js
Function: updateIssue()
Line: ~75
```

---

## 4. Notification APIs

### 4.1 GET /api/notifications
```javascript
Query: ?filter=all|unread|read
Headers: Cookie: token=JWT

Response (200):
{
  success: true,
  notifications: [
    {
      id, type, title, message, issueId, 
      unread: true, createdAt, icon: "🔄"
    }
  ],
  unreadCount: 5
}

Frontend Location:
File: CitizenVoice/src/pages/Dashboard/CitizenDashboard.jsx
Function: NotificationsPage
Line: ~305
```

### 4.2 PUT /api/notifications/mark-all-read
```javascript
Headers: Cookie: token=JWT

Response (200):
{
  success: true,
  updated: 5
}

Frontend Location:
File: CitizenVoice/src/pages/Dashboard/CitizenDashboard.jsx
Function: markAllAsRead()
Line: ~365
```

### 4.3 PUT /api/notifications/:id/read
```javascript
Headers: Cookie: token=JWT

Response (200):
{
  success: true
}

Frontend Location:
File: CitizenVoice/src/pages/Dashboard/CitizenDashboard.jsx
Function: markAsRead()
Line: ~376
```

### 4.4 DELETE /api/notifications/:id
```javascript
Headers: Cookie: token=JWT

Response (200):
{
  success: true
}

Frontend Location:
File: CitizenVoice/src/pages/Dashboard/CitizenDashboard.jsx
Function: deleteNotification()
Line: ~387
```

---

## 5. User Profile APIs

### 5.1 PUT /api/users/me
```javascript
Headers: Cookie: token=JWT
Body: { username, email, phone, address, bio }

Response (200):
{
  success: true,
  user: {...updated user}
}

Frontend Location:
File: CitizenVoice/src/pages/Dashboard/CitizenDashboard.jsx
Function: handleSave() in ProfilePage
Line: ~537
```

### 5.2 GET /api/users/me/stats
```javascript
Headers: Cookie: token=JWT

Response (200):
{
  success: true,
  totalIssues: 12,
  activeIssues: 5,
  resolutionRate: 68,
  totalUpvotes: 45
}

Frontend Location:
File: CitizenVoice/src/pages/Dashboard/CitizenDashboard.jsx
Function: updateStats()
Line: ~114
```

### 5.3 PUT /api/users/me/settings
```javascript
Headers: Cookie: token=JWT
Body: { emailNotifications, pushNotifications, smsAlerts, ... }

Response (200):
{
  success: true
}

Frontend Location:
File: CitizenVoice/src/pages/Dashboard/CitizenDashboard.jsx
Function: handleSave() in SettingsPage
Line: ~720
```

---

## 6. Official Dashboard APIs

### 6.1 GET /api/officials/assigned-issues
```javascript
Headers: Cookie: token=JWT

Response (200):
{
  success: true,
  issues: [{...}],
  total: 12
}

Frontend Location:
File: CitizenVoice/src/components/Dashboard/Official/issuemanagment.jsx
```

### 6.2 PUT /api/issues/:issueId/assign
```javascript
Headers: Cookie: token=JWT
Body: { assignedTo: "user123", status: "acknowledged" }

Response (200):
{
  success: true,
  issue: {...}
}

Frontend Location:
File: CitizenVoice/src/components/Dashboard/Official/issuemanagment.jsx
```

### 6.3 GET /api/officials/team
```javascript
Headers: Cookie: token=JWT

Response (200):
{
  success: true,
  members: [
    {id, name, role, email, assignedIssues, resolvedIssues}
  ]
}

Frontend Location:
File: CitizenVoice/src/components/Dashboard/Official/Teammanagement.jsx
```

### 6.4 GET /api/officials/analytics
```javascript
Headers: Cookie: token=JWT
Query: ?startDate=2024-01-01&endDate=2024-12-31

Response (200):
{
  success: true,
  data: {
    issuesOverTime: [{date, count}],
    resolutionRate: [{month, rate}],
    categoryBreakdown: [{category, count}]
  }
}

Frontend Location:
File: CitizenVoice/src/components/Dashboard/Official/Analytics.jsx
```

---

## 7. Community Dashboard APIs

### 7.1 GET /api/community/area-issues
```javascript
Headers: Cookie: token=JWT
Query: ?area=downtown&status=all

Response (200):
{
  success: true,
  issues: [{...}],
  total: 50
}

Frontend Location:
File: CitizenVoice/src/components/Dashboard/Community/areaissue.jsx
```

### 7.2 GET /api/community/verification-queue
```javascript
Headers: Cookie: token=JWT

Response (200):
{
  success: true,
  pendingVerifications: [
    {issueId, title, status, beforePhoto, afterPhoto, submittedBy}
  ]
}

Frontend Location:
File: CitizenVoice/src/components/Dashboard/Community/verificationpanel.jsx
```

### 7.3 POST /api/community/verify/:issueId
```javascript
Headers: Cookie: token=JWT
Body: { approved: true, comment: "Verified as resolved" }

Response (200):
{
  success: true,
  message: "Verification submitted"
}

Frontend Location:
File: CitizenVoice/src/components/Dashboard/Community/verificationpanel.jsx
```

### 7.4 GET /api/community/stats
```javascript
Headers: Cookie: token=JWT

Response (200):
{
  success: true,
  stats: {
    activeContributors: 150,
    mostReportedCategory: "pothole",
    resolutionTrend: [{month, count}],
    topReporters: [{user, count}]
  }
}

Frontend Location:
File: CitizenVoice/src/components/Dashboard/Community/communitystats.jsx
```

---

*Continued in next message...*
