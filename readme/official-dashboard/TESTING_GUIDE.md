# Official Dashboard - Testing Guide

## Overview

This guide provides comprehensive testing procedures for all Official Dashboard endpoints.

---

## Prerequisites

1. Backend server running on `http://localhost:3000`
2. MongoDB running with sample data
3. Postman or similar API testing tool
4. Valid official user account

---

## Test Setup

### 1. Create Test Official User

```javascript
// Run in MongoDB shell
use citizenvoice;

db.users.insertOne({
  username: "test_official",
  email: "official@test.com",
  password: "$2a$10$YourHashedPasswordHere",
  role: "official",
  officialDetails: {
    department: "Roads & Infrastructure",
    designation: "Test Officer",
    municipalityId: "MUN-TEST"
  },
  status: "active",
  isVerified: true,
  isActive: true
});
```

### 2. Login and Get Token

**Request:**
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "official@test.com",
  "password": "your_password"
}
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "...",
      "username": "test_official",
      "role": "official"
    }
  },
  "success": true
}
```

---

## Test Cases

## 1. Issue Management Tests

### Test 1.1: Get All Issues
```bash
curl -X GET "http://localhost:3000/api/issues/recent?limit=10" \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

**Expected:** 200 OK with list of issues

### Test 1.2: Filter Issues by Status
```bash
curl -X GET "http://localhost:3000/api/issues/recent?status=reported" \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

**Expected:** Only issues with status "reported"

### Test 1.3: Update Issue Status
```bash
curl -X PUT "http://localhost:3000/api/issues/ISSUE_ID" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "acknowledged"}'
```

**Expected:** 200 OK with updated issue

### Test 1.4: Assign Issue
```bash
curl -X POST "http://localhost:3000/api/officials/assign/ISSUE_ID" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"memberId": "MEMBER_ID"}'
```

**Expected:** 200 OK with assigned issue

---

## 2. Team Management Tests

### Test 2.1: Get Team Members
```bash
curl -X GET "http://localhost:3000/api/officials/team" \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "data": {
    "members": [...],
    "total": 5
  },
  "success": true
}
```

### Test 2.2: Get Team Member Details
```bash
curl -X GET "http://localhost:3000/api/officials/team/MEMBER_ID" \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

**Expected:** Detailed member info with stats

---

## 3. Analytics Tests

### Test 3.1: Get Dashboard Stats
```bash
curl -X GET "http://localhost:3000/api/officials/stats" \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "data": {
    "pending": 23,
    "assigned": 12,
    "resolvedToday": 8,
    "avgTime": "2.4 days",
    "priorityIssues": [...]
  },
  "success": true
}
```

### Test 3.2: Get Analytics Data
```bash
curl -X GET "http://localhost:3000/api/officials/analytics?period=month" \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

**Expected:** Complete analytics with charts data

---

## 4. Map Integration Tests

### Test 4.1: Get Issues by Location
```bash
curl -X GET "http://localhost:3000/api/issues/map?lat=28.6139&lng=77.2090&radius=5000" \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

**Expected:** Issues within 5km radius

### Test 4.2: Get Issues by Bounds
```bash
curl -X GET "http://localhost:3000/api/issues/map?bounds=28.5,77.1,28.7,77.3" \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

**Expected:** Issues within map bounds

---

## Error Case Tests

### Test E.1: Unauthorized Access
```bash
curl -X GET "http://localhost:3000/api/officials/team"
```

**Expected:** 401 Unauthorized

### Test E.2: Invalid Issue ID
```bash
curl -X PUT "http://localhost:3000/api/issues/invalid_id" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved"}'
```

**Expected:** 400 Bad Request or 404 Not Found

### Test E.3: Invalid Member ID for Assignment
```bash
curl -X POST "http://localhost:3000/api/officials/assign/ISSUE_ID" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"memberId": "invalid_id"}'
```

**Expected:** 400 Bad Request

---

## Frontend Integration Tests

### 1. Issue Management Component
- ✅ Load issues on mount
- ✅ Display issues in Kanban view
- ✅ Display issues in Table view
- ✅ Search functionality works
- ✅ Status change updates issue
- ✅ Assign modal opens and works
- ✅ Delete button works

### 2. Team Management Component
- ✅ Load team members on mount
- ✅ Display member cards
- ✅ Search functionality works
- ✅ Click member shows details modal
- ✅ Workload distribution displays

### 3. Analytics Component
- ✅ Load analytics on mount
- ✅ Date range filter works
- ✅ Export button downloads CSV
- ✅ Charts display correctly

### 4. Map Component
- ✅ Map loads with issues
- ✅ Markers display correctly
- ✅ Popup shows issue details
- ✅ Filters work
- ✅ Heatmap toggles

---

## Performance Tests

### Load Test: Get Issues
```bash
# Using Apache Bench
ab -n 1000 -c 10 -H "Cookie: token=YOUR_JWT" \
  http://localhost:3000/api/issues/recent
```

**Expected:** < 200ms average response time

### Load Test: Analytics
```bash
ab -n 100 -c 5 -H "Cookie: token=YOUR_JWT" \
  http://localhost:3000/api/officials/analytics?period=month
```

**Expected:** < 500ms average response time

---

## Automated Test Script

### Run All Tests
```javascript
// test-official-dashboard.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let token = '';

async function runTests() {
  try {
    // 1. Login
    console.log('🔐 Test 1: Login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'official@test.com',
      password: 'test123'
    });
    token = loginRes.headers['set-cookie'][0];
    console.log('✅ Login successful');

    // 2. Get Issues
    console.log('📋 Test 2: Get Issues...');
    const issuesRes = await axios.get(`${BASE_URL}/issues/recent`, {
      headers: { Cookie: token }
    });
    console.log(`✅ Got ${issuesRes.data.data.issues.length} issues`);

    // 3. Get Team Members
    console.log('👥 Test 3: Get Team Members...');
    const teamRes = await axios.get(`${BASE_URL}/officials/team`, {
      headers: { Cookie: token }
    });
    console.log(`✅ Got ${teamRes.data.data.members.length} team members`);

    // 4. Get Analytics
    console.log('📊 Test 4: Get Analytics...');
    const analyticsRes = await axios.get(`${BASE_URL}/officials/analytics?period=month`, {
      headers: { Cookie: token }
    });
    console.log('✅ Analytics loaded successfully');

    console.log('\n✨ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();
```

---

## Checklist

### Backend Tests
- [ ] All endpoints return correct status codes
- [ ] Authentication works properly
- [ ] Authorization checks prevent unauthorized access
- [ ] Data validation works
- [ ] Error handling returns proper messages
- [ ] Database operations complete successfully

### Frontend Tests
- [ ] All components load without errors
- [ ] API calls succeed
- [ ] Loading states display correctly
- [ ] Error messages show when API fails
- [ ] Buttons trigger correct actions
- [ ] Forms validate input
- [ ] Maps render properly

### Integration Tests
- [ ] Login → Dashboard flow works
- [ ] Issue assignment updates UI
- [ ] Status changes reflect immediately
- [ ] Analytics update with filters
- [ ] Team member details load correctly

---

## Troubleshooting

**Problem:** Tests fail with 401 Unauthorized
**Solution:** Check that JWT token is valid and not expired

**Problem:** No data returned from endpoints
**Solution:** Verify MongoDB has sample data populated

**Problem:** CORS errors
**Solution:** Ensure backend has proper CORS configuration

**Problem:** Map doesn't load
**Solution:** Check that issues have valid lat/lng coordinates

---

## Test Data Setup

```javascript
// Create sample issues for testing
db.issues.insertMany([
  {
    issueId: "ISS-TEST-001",
    title: "Test Issue 1",
    description: "Test description",
    category: "pothole",
    priority: "high",
    status: "reported",
    location: {
      address: "Test Street 1",
      lat: 28.6139,
      lng: 77.2090
    },
    reportedBy: ObjectId("USER_ID"),
    images: [],
    upvotes: []
  },
  // Add more test issues...
]);
```
