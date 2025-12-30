# Official Dashboard - Quick Start Guide

## 🚀 For Backend Team

### What's Been Done (Frontend)

✅ **Complete UI Implementation**

- Issue Management with Kanban and Table views
- Team Management with workload distribution
- Analytics with charts and export
- Map integration with heatmap and markers
- All buttons and forms working

✅ **API Integration Ready**

- All service calls configured in `CitizenVoice/src/services/issueService.js`
- Error handling and loading states implemented
- Real-time updates supported

### What You Need to Do

#### 1. **Implement Missing Backend Endpoints** (Priority 1)

**File:** `Backend/src/controllers/officialController.js` (CREATE NEW)

```javascript
// Copy implementation from: readme/official-dashboard/IMPLEMENTATION_GUIDE.md
// Section: "Step 3: Create Official Controller"
```

**File:** `Backend/src/routes/officialRoutes.js` (CREATE NEW)

```javascript
// Copy implementation from: readme/official-dashboard/IMPLEMENTATION_GUIDE.md
// Section: "Step 2: Create Official Routes"
```

**File:** `Backend/app.js` (UPDATE)

```javascript
// Add this line after existing routes
import officialRoutes from "./src/routes/officialRoutes.js";
app.use("/api/officials", officialRoutes);
```

#### 2. **Update Existing Controllers** (Priority 2)

**File:** `Backend/src/controllers/issueController.js` (UPDATE)

Add these new functions:

- `getAssignedIssues`
- `assignIssue`
- `getIssuesByStatus`
- `bulkUpdateStatus`

See: `readme/official-dashboard/IMPLEMENTATION_GUIDE.md` - Step 1

#### 3. **Database Setup** (Priority 3)

```bash
# Create indexes for better performance
mongosh citizenvoice
```

```javascript
db.issues.createIndex({ assignedTo: 1, status: 1 });
db.issues.createIndex({ status: 1, priority: 1, createdAt: -1 });
db.users.createIndex({ role: 1, isActive: 1 });
```

See: `readme/official-dashboard/DATABASE_SCHEMA.md`

---

## 📋 Step-by-Step Implementation

### Step 1: Create Official Controller (15 min)

1. Create file: `Backend/src/controllers/officialController.js`
2. Copy code from `readme/official-dashboard/IMPLEMENTATION_GUIDE.md` - Step 3
3. Import User and Issue models

### Step 2: Create Official Routes (5 min)

1. Create file: `Backend/src/routes/officialRoutes.js`
2. Copy code from implementation guide - Step 2
3. Import necessary controllers

### Step 3: Update Issue Controller (10 min)

1. Open `Backend/src/controllers/issueController.js`
2. Add new functions from implementation guide - Step 1
3. Import User model at the top

### Step 4: Register Routes (2 min)

1. Open `Backend/app.js`
2. Add import and use official routes

### Step 5: Test Endpoints (10 min)

Use the test cases from `readme/official-dashboard/TESTING_GUIDE.md`

---

## 🧪 Quick Test

After implementation, test with:

```bash
# 1. Get team members
curl http://localhost:3000/api/officials/team \
  -H "Cookie: token=YOUR_TOKEN"

# 2. Get dashboard stats
curl http://localhost:3000/api/officials/stats \
  -H "Cookie: token=YOUR_TOKEN"

# 3. Get analytics
curl http://localhost:3000/api/officials/analytics?period=month \
  -H "Cookie: token=YOUR_TOKEN"
```

---

## 📁 File Structure

```
Backend/
├── src/
│   ├── controllers/
│   │   ├── issueController.js      (UPDATE - add 4 functions)
│   │   └── officialController.js   (CREATE NEW)
│   ├── routes/
│   │   └── officialRoutes.js       (CREATE NEW)
│   └── middleware/
│       └── authMiddleware.js       (UPDATE - add restrictTo)
└── app.js                           (UPDATE - register routes)
```

---

## 🎯 API Endpoints Summary

### Required Endpoints

| Method | Endpoint                         | Description          | Status     |
| ------ | -------------------------------- | -------------------- | ---------- |
| GET    | `/api/officials/team`            | Get team members     | ❌ Missing |
| GET    | `/api/officials/stats`           | Dashboard statistics | ❌ Missing |
| GET    | `/api/officials/analytics`       | Analytics data       | ❌ Missing |
| POST   | `/api/officials/assign/:issueId` | Assign issue         | ❌ Missing |
| GET    | `/api/issues/recent`             | Get all issues       | ✅ Exists  |
| PUT    | `/api/issues/:issueId`           | Update issue         | ✅ Exists  |
| DELETE | `/api/issues/:issueId`           | Delete issue         | ✅ Exists  |

---

## 🔧 Configuration

### Environment Variables

Add to `.env`:

```env
# Already configured
MONGODB_URI=mongodb://localhost:27017/citizenvoice
PORT=3000
JWT_SECRET=your_secret_key

# Official Dashboard (Single privileged official)
# This ONE email will be allowed to:
# - assign issues
# - manage team members
# Other officials will only see their assigned issues.
OFFICIAL_ADMIN_EMAIL=teamlead@officials.gov

# Optional: only needed if you use the seed script below
OFFICIAL_ADMIN_PASSWORD=change_me

# Optional for Official Dashboard
ANALYTICS_CACHE_TTL=3600
MAX_TEAM_MEMBERS=50
```

### Seed the privileged official (recommended)

From the `Backend/` folder:

```bash
npm run seed:official-admin
```

This script reads:

- `MONGO_URI`
- `OFFICIAL_ADMIN_EMAIL`
- `OFFICIAL_ADMIN_PASSWORD`

and creates/updates an `official` user with designation `team-lead`.

---

## 📚 Documentation Files

1. **[API_ENDPOINTS.md](./API_ENDPOINTS.md)** - Complete API specs with request/response examples
2. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database models and indexes
3. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Detailed step-by-step guide
4. **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Test cases and procedures

---

## 🐛 Common Issues & Solutions

**Issue:** "Only officials can access this endpoint"

```javascript
// Solution: Ensure user has role: "official" in database
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "official" } }
);
```

**Issue:** Empty team members array

```javascript
// Solution: Create official users
db.users.insertOne({
  username: "officer_john",
  email: "john@officials.gov",
  password: "$2a$10$hashedpassword",
  role: "official",
  officialDetails: {
    department: "Roads & Infrastructure",
    designation: "Field Officer",
  },
  status: "active",
  isActive: true,
});
```

**Issue:** Analytics returns no data

```javascript
// Solution: Ensure issues exist with createdAt within date range
db.issues
  .find({
    createdAt: {
      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  })
  .count();
```

---

## ✅ Verification Checklist

After implementation, verify:

- [ ] Frontend loads without errors
- [ ] Can login as official user
- [ ] Issue Management page displays issues
- [ ] Can change issue status
- [ ] Can assign issues to team members
- [ ] Team Management page shows members
- [ ] Analytics page displays charts
- [ ] Map shows issue markers
- [ ] All buttons work correctly
- [ ] No console errors

---

## 🎉 Success Criteria

Your implementation is successful when:

1. ✅ All API endpoints return 200 OK
2. ✅ Frontend displays real data (not mock data)
3. ✅ All CRUD operations work
4. ✅ No errors in browser console
5. ✅ No errors in server logs

---

## 📞 Support

If you encounter issues:

1. Check `readme/official-dashboard/IMPLEMENTATION_GUIDE.md` for detailed steps
2. Review `readme/official-dashboard/TESTING_GUIDE.md` for test cases
3. Verify database schema in `readme/official-dashboard/DATABASE_SCHEMA.md`
4. Check API specs in `readme/official-dashboard/API_ENDPOINTS.md`

---

## 🏁 Estimated Time

- **Experienced Developer:** 30-45 minutes
- **Junior Developer:** 1-2 hours
- **Includes Testing:** Add 30 minutes

---

## 📝 Notes

- Frontend is **100% complete** and ready to use
- All API calls are **already implemented** in frontend
- Backend just needs to **implement the endpoints**
- All documentation is **comprehensive and detailed**
- Code examples are **copy-paste ready**

Good luck! 🚀
