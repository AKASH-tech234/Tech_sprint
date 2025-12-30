# Official Dashboard - Database Schema

## Overview

This document describes the MongoDB schema required for the Official Dashboard functionality.

---

## 1. User Model (Extended)

**Collection:** `users`

```javascript
{
  _id: ObjectId,
  username: String (required, unique, 3-30 chars),
  email: String (required, unique, lowercase),
  password: String (required, hashed, min 8 chars),
  role: String (enum: ['citizen', 'official', 'community'], required),
  
  // Google OAuth (optional)
  googleId: String (unique, sparse),
  avatar: String (URL),
  
  // Contact Information
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  
  // Official-specific fields
  officialDetails: {
    department: String,           // e.g., "Roads & Infrastructure"
    designation: String,           // e.g., "Field Officer", "Team Lead"
    municipalityId: String,        // Municipality/Ward ID
    employeeId: String,            // Official employee ID
    permissions: [String]          // e.g., ['assign', 'resolve', 'delete']
  },
  
  // Community-specific fields
  communityDetails: {
    organizationName: String,
    area: String
  },
  
  // Status
  isVerified: Boolean (default: false),
  isActive: Boolean (default: true),
  status: String (enum: ['active', 'busy', 'offline'], default: 'active'),
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ 'officialDetails.department': 1 })
```

---

## 2. Issue Model (Current)

**Collection:** `issues`

```javascript
{
  _id: ObjectId,
  issueId: String (unique, auto-generated: "ISS-{timestamp}"),
  title: String (required, max 200 chars),
  description: String (required, max 2000 chars),
  category: String (enum: ['pothole', 'streetlight', 'garbage', 'water', 'traffic', 'noise', 'safety', 'other'], required),
  priority: String (enum: ['low', 'medium', 'high'], default: 'medium'),
  status: String (enum: ['reported', 'acknowledged', 'in-progress', 'resolved', 'rejected'], default: 'reported'),
  
  // Location
  location: {
    address: String (required),
    lat: Number (required),
    lng: Number (required),
    city: String,
    state: String
  },
  
  // Media
  images: [String], // Array of image URLs
  
  // Relationships
  reportedBy: ObjectId (ref: 'User', required),
  assignedTo: ObjectId (ref: 'User'),
  verifiedBy: ObjectId (ref: 'User'),
  
  // Engagement
  upvotes: [ObjectId] (ref: 'User'),
  
  // Comments
  comments: [{
    user: ObjectId (ref: 'User'),
    text: String,
    createdAt: Date
  }],
  
  // Assignment tracking
  assignmentHistory: [{
    assignedTo: ObjectId (ref: 'User'),
    assignedBy: ObjectId (ref: 'User'),
    assignedAt: Date,
    notes: String
  }],
  
  // Status tracking
  statusHistory: [{
    status: String,
    changedBy: ObjectId (ref: 'User'),
    changedAt: Date,
    notes: String
  }],
  
  // Resolution
  resolvedAt: Date,
  resolutionNotes: String,
  resolutionImages: [String],
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
```javascript
db.issues.createIndex({ issueId: 1 }, { unique: true })
db.issues.createIndex({ 'location.lat': 1, 'location.lng': 1 })
db.issues.createIndex({ status: 1 })
db.issues.createIndex({ category: 1 })
db.issues.createIndex({ priority: 1 })
db.issues.createIndex({ reportedBy: 1 })
db.issues.createIndex({ assignedTo: 1 })
db.issues.createIndex({ createdAt: -1 })
db.issues.createIndex({ status: 1, priority: 1, createdAt: -1 })
```

---

## 3. Team Performance Model (New)

**Collection:** `teamperformance`

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  period: String (format: "YYYY-MM"),  // Monthly tracking
  
  // Issue counts
  assigned: Number (default: 0),
  completed: Number (default: 0),
  pending: Number (default: 0),
  inProgress: Number (default: 0),
  
  // Time metrics
  avgResolutionTime: Number, // in hours
  totalWorkHours: Number,
  
  // Performance metrics
  resolutionRate: Number, // percentage
  onTimeCompletions: Number,
  overdueCompletions: Number,
  
  // Category breakdown
  categoryStats: [{
    category: String,
    count: Number,
    avgTime: Number
  }],
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
```javascript
db.teamperformance.createIndex({ userId: 1, period: 1 }, { unique: true })
db.teamperformance.createIndex({ period: 1 })
```

---

## 4. Analytics Cache Model (New)

**Collection:** `analyticscache`

```javascript
{
  _id: ObjectId,
  type: String (enum: ['overview', 'category', 'monthly', 'department'], required),
  period: String, // e.g., "2024-12", "2024-Q4"
  
  // Cached data
  data: Object, // Flexible structure based on type
  
  // Cache metadata
  generatedAt: Date (required),
  expiresAt: Date (required, TTL index),
  
  // Filters used for this cache
  filters: {
    department: String,
    status: String,
    category: String
  }
}
```

**Indexes:**
```javascript
db.analyticscache.createIndex({ type: 1, period: 1 })
db.analyticscache.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index
```

---

## 5. Notifications Model (Optional)

**Collection:** `notifications`

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  type: String (enum: ['issue_assigned', 'status_update', 'comment', 'mention'], required),
  
  // Notification content
  title: String (required),
  message: String (required),
  
  // Related entities
  issueId: ObjectId (ref: 'Issue'),
  actionBy: ObjectId (ref: 'User'),
  
  // Status
  isRead: Boolean (default: false),
  readAt: Date,
  
  // Timestamps
  createdAt: Date (auto)
}
```

**Indexes:**
```javascript
db.notifications.createIndex({ userId: 1, isRead: 1, createdAt: -1 })
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }) // 30 days TTL
```

---

## Data Relationships

### User ↔ Issue
- One user (citizen) can report many issues
- One user (official) can be assigned many issues
- One issue belongs to one reporter
- One issue can be assigned to one official

### User ↔ Team Performance
- One user (official) has many performance records (one per month)

### Issue ↔ Comments
- One issue can have many comments
- One comment belongs to one user and one issue

---

## Sample Data Population

### Create Official Users
```javascript
db.users.insertMany([
  {
    username: "john_officer",
    email: "john@officials.gov",
    password: "$2a$10$hashedpassword",
    role: "official",
    officialDetails: {
      department: "Roads & Infrastructure",
      designation: "Field Officer",
      municipalityId: "MUN-001",
      permissions: ["assign", "resolve"]
    },
    status: "active",
    isVerified: true,
    isActive: true
  },
  {
    username: "sarah_lead",
    email: "sarah@officials.gov",
    password: "$2a$10$hashedpassword",
    role: "official",
    officialDetails: {
      department: "Sanitation",
      designation: "Team Lead",
      municipalityId: "MUN-001",
      permissions: ["assign", "resolve", "delete"]
    },
    status: "active",
    isVerified: true,
    isActive: true
  }
])
```

### Create Sample Issues
```javascript
db.issues.insertMany([
  {
    issueId: "ISS-1735543200000",
    title: "Large pothole on Main Street",
    description: "Dangerous pothole causing traffic issues",
    category: "pothole",
    priority: "high",
    status: "reported",
    location: {
      address: "123 Main Street",
      lat: 28.6139,
      lng: 77.2090,
      city: "New Delhi",
      state: "Delhi"
    },
    images: [],
    reportedBy: ObjectId("user_id_here"),
    upvotes: [],
    comments: [],
    createdAt: new Date()
  }
])
```

---

## Migration Scripts

### Add Official Details to Existing Users
```javascript
// Update existing users with official role
db.users.updateMany(
  { role: "official", officialDetails: { $exists: false } },
  {
    $set: {
      officialDetails: {
        department: "General",
        designation: "Officer",
        municipalityId: "MUN-001",
        permissions: ["assign", "resolve"]
      },
      status: "active"
    }
  }
)
```

### Initialize Team Performance Records
```javascript
// Create performance records for all officials
db.users.find({ role: "official" }).forEach(user => {
  const currentMonth = new Date().toISOString().substr(0, 7);
  db.teamperformance.insertOne({
    userId: user._id,
    period: currentMonth,
    assigned: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    avgResolutionTime: 0,
    totalWorkHours: 0,
    resolutionRate: 0,
    onTimeCompletions: 0,
    overdueCompletions: 0,
    categoryStats: []
  });
});
```

---

## Backup and Maintenance

### Regular Backups
```bash
# Backup entire database
mongodump --uri="mongodb://localhost:27017/citizenvoice" --out=/backup/$(date +%Y%m%d)

# Backup specific collections
mongodump --uri="mongodb://localhost:27017/citizenvoice" --collection=issues --out=/backup/issues
```

### Archive Old Data
```javascript
// Archive resolved issues older than 1 year
db.issues.updateMany(
  {
    status: "resolved",
    resolvedAt: { $lt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
  },
  {
    $set: { archived: true }
  }
)

// Or move to archive collection
const oldIssues = db.issues.find({
  status: "resolved",
  resolvedAt: { $lt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
}).toArray();

db.issues_archive.insertMany(oldIssues);
db.issues.deleteMany({ _id: { $in: oldIssues.map(i => i._id) } });
```
