# Official Dashboard - Backend Integration Guide

## Overview
The Official Dashboard frontend is now fully functional with all button interactions working. All backend API calls have been commented out and replaced with mock data to allow the frontend to work independently while the backend team implements the required endpoints.

## Current Status
✅ **Frontend**: Fully functional with mock data
🔄 **Backend**: Endpoints need to be implemented
📋 **Integration**: Uncomment API calls once endpoints are ready

---

## Required Backend Endpoints

### 1. Analytics Endpoints

#### Get Analytics Data
```
GET /api/officials/analytics?period={dateRange}
```
**Purpose**: Fetch analytics data for the dashboard  
**Query Parameters**:
- `period`: string (week, month, quarter, year)

**Response**:
```json
{
  "overviewStats": [
    { "title": "Total Issues", "value": "1,284", "change": "+12%", "trend": "up", "color": "rose" },
    { "title": "Resolved", "value": "847", "change": "+8%", "trend": "up", "color": "emerald" },
    { "title": "Avg. Resolution Time", "value": "2.4 days", "change": "-15%", "trend": "up", "color": "violet" },
    { "title": "Pending", "value": "156", "change": "+3%", "trend": "down", "color": "amber" }
  ],
  "categoryData": [
    { "category": "Potholes", "count": 342, "percentage": 27, "color": "bg-rose-500" },
    { "category": "Street Lights", "count": 256, "percentage": 20, "color": "bg-violet-500" }
  ],
  "monthlyData": [
    { "month": "Jan", "reported": 120, "resolved": 98 },
    { "month": "Feb", "reported": 145, "resolved": 130 }
  ],
  "departmentData": [
    { "name": "Roads & Infrastructure", "issues": 456, "resolved": 389, "avgTime": "2.1 days" }
  ]
}
```

**File**: `CitizenVoice/src/components/Dashboard/Official/Analytics.jsx` (Line 108)

---

### 2. Issue Management Endpoints

#### Get All Issues
```
GET /api/issues/recent
```
**Purpose**: Fetch all issues for the official dashboard  
**Response**:
```json
{
  "issues": [
    {
      "_id": "string",
      "issueId": "ISS-001",
      "title": "string",
      "description": "string",
      "status": "reported|acknowledged|in-progress|resolved|rejected",
      "priority": "high|medium|low",
      "location": { "address": "string", "coordinates": [lat, lng] },
      "createdAt": "ISO date string",
      "assignedTo": { "_id": "string", "username": "string" } | null
    }
  ]
}
```

**File**: `CitizenVoice/src/components/Dashboard/Official/issuemanagment.jsx` (Line 72)

---

#### Update Issue Status
```
PUT /api/issues/:id
```
**Purpose**: Update issue status or other fields  
**Body**:
```json
{
  "status": "acknowledged|in-progress|resolved|rejected"
}
```

**Response**:
```json
{
  "success": true,
  "issue": { /* updated issue object */ }
}
```

**File**: `CitizenVoice/src/components/Dashboard/Official/issuemanagment.jsx` (Line 218)

---

#### Delete Issue
```
DELETE /api/issues/:id
```
**Purpose**: Delete an issue (admin action)  
**Response**:
```json
{
  "success": true,
  "message": "Issue deleted successfully"
}
```

**File**: `CitizenVoice/src/components/Dashboard/Official/issuemanagment.jsx` (Line 285)

---

#### Assign Issue to Team Member
```
PATCH /api/officials/assign/:issueId
```
**Purpose**: Assign an issue to a team member  
**Body**:
```json
{
  "memberId": "string"
}
```

**Response**:
```json
{
  "success": true,
  "issue": { /* updated issue with assignedTo field */ }
}
```

**File**: `CitizenVoice/src/components/Dashboard/Official/issuemanagment.jsx` (Line 249)

---

### 3. Team Management Endpoints

#### Get Team Members
```
GET /api/officials/team
```
**Purpose**: Fetch all team members  
**Response**:
```json
{
  "members": [
    {
      "_id": "string",
      "username": "string",
      "email": "string",
      "phone": "string",
      "role": "field-officer|team-lead|supervisor",
      "status": "active|busy|offline",
      "stats": {
        "assigned": 8,
        "completed": 45,
        "avgTime": "2.3 days"
      },
      "recentIssues": [
        { "id": "ISS-001", "title": "string", "status": "in-progress" }
      ]
    }
  ]
}
```

**Files**: 
- `CitizenVoice/src/components/Dashboard/Official/Teammanagement.jsx` (Line 117)
- `CitizenVoice/src/components/Dashboard/Official/issuemanagment.jsx` (Line 154)

---

#### Add Team Member
```
POST /api/officials/team
```
**Purpose**: Add a new team member  
**Body**:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string (optional)",
  "role": "field-officer|team-lead|supervisor"
}
```

**Response**:
```json
{
  "success": true,
  "member": { /* new member object */ }
}
```

**File**: `CitizenVoice/src/components/Dashboard/Official/Teammanagement.jsx` (Line 166)

---

#### Remove Team Member
```
DELETE /api/officials/team/:memberId
```
**Purpose**: Remove a team member  
**Response**:
```json
{
  "success": true,
  "message": "Team member removed successfully"
}
```

**File**: `CitizenVoice/src/components/Dashboard/Official/Teammanagement.jsx` (Line 208)

---

#### Send Message to Team Member
```
POST /api/officials/message
```
**Purpose**: Send a message to a team member  
**Body**:
```json
{
  "recipientId": "string",
  "message": "string"
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "string"
}
```

**File**: `CitizenVoice/src/components/Dashboard/Official/Teammanagement.jsx` (Line 227)

---

### 4. Official Settings Endpoints

#### Update Official Settings
```
PATCH /api/officials/settings
```
**Purpose**: Update official profile settings  
**Body**:
```json
{
  "department": "string",
  "notifications": {
    "newAssignments": boolean,
    "statusUpdates": boolean,
    "teamMessages": boolean,
    "dailySummary": boolean
  }
}
```

**Response**:
```json
{
  "success": true,
  "settings": { /* updated settings */ }
}
```

**File**: `CitizenVoice/src/pages/Dashboard/OfficialDashboard.jsx` (Line 373)

---

### 5. Quick Actions Endpoints

#### Create Work Order
```
POST /api/officials/work-order
```
**Purpose**: Create a work order for an issue  
**Body**: TBD (define based on requirements)

---

#### Schedule Inspection
```
POST /api/officials/schedule-inspection
```
**Purpose**: Schedule an inspection  
**Body**: TBD (define based on requirements)

---

#### Request Resources
```
POST /api/officials/request-resources
```
**Purpose**: Request resources for issue resolution  
**Body**: TBD (define based on requirements)

---

#### Generate Report
```
POST /api/officials/generate-report
```
**Purpose**: Generate analytical reports  
**Body**: TBD (define based on requirements)

**File**: `CitizenVoice/src/pages/Dashboard/OfficialDashboard.jsx` (Line 68)

---

## Integration Steps

### For Each Endpoint:

1. **Implement the endpoint** in the backend with proper authentication and authorization
2. **Test the endpoint** using Postman or similar tool
3. **Locate the TODO comment** in the frontend code (file paths provided above)
4. **Uncomment the API call** code
5. **Comment out or remove** the mock data simulation
6. **Test the integration** to ensure it works correctly

### Example Integration:

**Before (Current State)**:
```javascript
// TODO: Backend team - Implement analytics endpoint:
// GET /api/officials/analytics?period={dateRange}

// Uncomment when backend is ready:
// const response = await issueService.getAnalytics({ period: dateRange });
// setAnalyticsData(response.data || null);

// Using mock data until backend is ready
await new Promise(resolve => setTimeout(resolve, 500));
setAnalyticsData({ /* mock data */ });
```

**After (Backend Integration)**:
```javascript
// Backend endpoint implemented ✅
const response = await issueService.getAnalytics({ period: dateRange });
setAnalyticsData(response.data || null);
```

---

## Authentication

All endpoints should:
- Require authentication (JWT token in Authorization header)
- Verify the user has the `official` role
- Return 401 for unauthorized requests
- Return 403 for forbidden actions

---

## Error Handling

The frontend handles errors gracefully:
- Loading states during API calls
- Error messages for failed requests
- Fallback to mock data where appropriate
- User-friendly error notifications

Ensure backend returns consistent error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error info (optional)"
}
```

---

## Testing Checklist

Once you implement an endpoint:

- [ ] Test with valid authentication token
- [ ] Test with invalid/missing token
- [ ] Test with different user roles
- [ ] Test edge cases (empty data, invalid IDs, etc.)
- [ ] Verify response format matches frontend expectations
- [ ] Check CORS configuration for frontend access
- [ ] Test on both development and staging environments

---

## Frontend Features Already Working

✅ Priority queue filtering (High Priority, Overdue, New)  
✅ Stats cards with click navigation  
✅ Quick action buttons with alerts  
✅ Issue management Kanban and Table views  
✅ Drag-and-drop status changes  
✅ Issue assignment modal  
✅ Team member management (Add, Remove, View)  
✅ Workload distribution visualization  
✅ Analytics data export to CSV  
✅ Date range filtering  
✅ Search and filter functionality  
✅ Settings page with form controls  

---

## Notes

- All frontend functionality is working with mock data
- No breaking changes will occur when integrating backend
- Backend team can implement endpoints in any order
- Frontend will gracefully handle API failures with fallbacks
- Mock data provides realistic examples of expected data structures

---

## Support

If you have questions about:
- Expected data formats
- Frontend behavior
- Integration issues

Please refer to the component files or contact the frontend team.

**Last Updated**: 2025-12-30
**Status**: Ready for Backend Integration
