# Official Dashboard - API Endpoints Specification

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints require authentication via HTTP-only cookies set during login.

---

## 1. Issue Management Endpoints

### 1.1 Get All Issues
**Endpoint:** `GET /api/issues/recent`

**Query Parameters:**
- `status` (optional): Filter by status (reported, acknowledged, in-progress, resolved, rejected)
- `category` (optional): Filter by category (pothole, streetlight, garbage, water, traffic, etc.)
- `limit` (optional): Number of issues to return (default: 50)
- `page` (optional): Page number for pagination

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "issues": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "issueId": "ISS-1735543200000",
        "title": "Large pothole on Main Street",
        "description": "Dangerous pothole causing traffic issues",
        "category": "pothole",
        "priority": "high",
        "status": "reported",
        "location": {
          "address": "123 Main Street",
          "lat": 28.6139,
          "lng": 77.2090,
          "city": "New Delhi",
          "state": "Delhi"
        },
        "images": [
          "https://cloudinary.com/image1.jpg"
        ],
        "reportedBy": {
          "_id": "507f1f77bcf86cd799439012",
          "username": "john_citizen",
          "email": "john@example.com",
          "avatar": "https://avatar.url"
        },
        "assignedTo": null,
        "upvotes": ["507f1f77bcf86cd799439013"],
        "createdAt": "2024-12-25T10:30:00.000Z",
        "updatedAt": "2024-12-25T10:30:00.000Z"
      }
    ],
    "total": 150,
    "page": 1,
    "totalPages": 3
  },
  "message": "Issues fetched successfully",
  "success": true
}
```

---

### 1.2 Update Issue Status
**Endpoint:** `PUT /api/issues/:issueId`

**URL Parameters:**
- `issueId`: MongoDB ObjectId of the issue

**Request Body:**
```json
{
  "status": "acknowledged"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "issueId": "ISS-1735543200000",
    "status": "acknowledged",
    "updatedAt": "2024-12-25T11:00:00.000Z"
  },
  "message": "Issue updated successfully",
  "success": true
}
```

---

### 1.3 Assign Issue to Team Member
**Endpoint:** `POST /api/officials/assign/:issueId`

**URL Parameters:**
- `issueId`: MongoDB ObjectId of the issue

**Request Body:**
```json
{
  "memberId": "507f1f77bcf86cd799439014"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "issueId": "ISS-1735543200000",
    "assignedTo": {
      "_id": "507f1f77bcf86cd799439014",
      "username": "officer_john",
      "email": "john@officials.gov"
    },
    "status": "acknowledged",
    "updatedAt": "2024-12-25T11:30:00.000Z"
  },
  "message": "Issue assigned successfully",
  "success": true
}
```

---

### 1.4 Delete Issue (Admin Only)
**Endpoint:** `DELETE /api/issues/:issueId`

**URL Parameters:**
- `issueId`: MongoDB ObjectId of the issue

**Response:**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Issue deleted successfully",
  "success": true
}
```

---

## 2. Team Management Endpoints

### 2.1 Get Team Members
**Endpoint:** `GET /api/officials/team`

**Query Parameters:**
- `role` (optional): Filter by role (field-officer, team-lead, supervisor)
- `status` (optional): Filter by status (active, busy, offline)

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "members": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "username": "john_doe",
        "email": "john@officials.gov",
        "role": "official",
        "avatar": "https://avatar.url",
        "phone": "+1234567890",
        "officialDetails": {
          "department": "Roads & Infrastructure",
          "designation": "Field Officer"
        },
        "status": "active",
        "stats": {
          "assigned": 8,
          "completed": 45,
          "avgTime": "2.3 days"
        },
        "recentIssues": [
          {
            "_id": "507f1f77bcf86cd799439011",
            "issueId": "ISS-1735543200000",
            "title": "Pothole repair",
            "status": "in-progress"
          }
        ]
      }
    ],
    "total": 10
  },
  "message": "Team members fetched successfully",
  "success": true
}
```

---

### 2.2 Get Team Member Details
**Endpoint:** `GET /api/officials/team/:memberId`

**URL Parameters:**
- `memberId`: MongoDB ObjectId of the team member

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "username": "john_doe",
    "email": "john@officials.gov",
    "role": "official",
    "phone": "+1234567890",
    "officialDetails": {
      "department": "Roads & Infrastructure",
      "designation": "Field Officer",
      "municipalityId": "MUN-001"
    },
    "stats": {
      "assigned": 8,
      "completed": 45,
      "avgTime": "2.3 days",
      "resolutionRate": 85
    },
    "recentIssues": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "issueId": "ISS-1735543200000",
        "title": "Pothole repair",
        "status": "in-progress",
        "assignedAt": "2024-12-20T10:00:00.000Z"
      }
    ],
    "performanceMetrics": {
      "thisMonth": {
        "assigned": 8,
        "completed": 5,
        "pending": 3
      },
      "lastMonth": {
        "assigned": 12,
        "completed": 11,
        "pending": 1
      }
    }
  },
  "message": "Team member details fetched successfully",
  "success": true
}
```

---

## 3. Analytics Endpoints

### 3.1 Get Analytics Overview
**Endpoint:** `GET /api/officials/analytics`

**Query Parameters:**
- `period` (optional): Time period (week, month, quarter, year) - default: month
- `startDate` (optional): Start date in ISO format
- `endDate` (optional): End date in ISO format

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "overviewStats": [
      {
        "title": "Total Issues",
        "value": "1,284",
        "change": "+12%",
        "trend": "up",
        "color": "rose"
      },
      {
        "title": "Resolved",
        "value": "847",
        "change": "+8%",
        "trend": "up",
        "color": "emerald"
      },
      {
        "title": "Avg. Resolution Time",
        "value": "2.4 days",
        "change": "-15%",
        "trend": "up",
        "color": "violet"
      },
      {
        "title": "Pending",
        "value": "156",
        "change": "+3%",
        "trend": "down",
        "color": "amber"
      }
    ],
    "categoryData": [
      {
        "category": "Potholes",
        "count": 342,
        "percentage": 27,
        "color": "bg-rose-500"
      },
      {
        "category": "Street Lights",
        "count": 256,
        "percentage": 20,
        "color": "bg-violet-500"
      }
    ],
    "monthlyData": [
      {
        "month": "Jan",
        "reported": 120,
        "resolved": 98
      },
      {
        "month": "Feb",
        "reported": 145,
        "resolved": 130
      }
    ],
    "departmentData": [
      {
        "name": "Roads & Infrastructure",
        "issues": 456,
        "resolved": 389,
        "avgTime": "2.1 days"
      }
    ]
  },
  "message": "Analytics data fetched successfully",
  "success": true
}
```

---

### 3.2 Get Dashboard Statistics
**Endpoint:** `GET /api/officials/stats`

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "pending": 23,
    "assigned": 12,
    "resolvedToday": 8,
    "avgTime": "2.4 days",
    "todayActivity": {
      "received": 15,
      "resolved": 8,
      "inProgress": 12,
      "escalated": 2
    },
    "priorityIssues": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "issueId": "ISS-1735543200000",
        "title": "Traffic signal malfunction",
        "priority": "high",
        "status": "reported",
        "location": "Main & 5th Intersection",
        "createdAt": "2024-12-25T09:00:00.000Z"
      }
    ]
  },
  "message": "Dashboard statistics fetched successfully",
  "success": true
}
```

---

## 4. Map Integration Endpoints

### 4.1 Get Issues for Map
**Endpoint:** `GET /api/issues/map`

**Query Parameters:**
- `bounds` (optional): Map bounds (minLat,minLng,maxLat,maxLng)
- `lat` (optional): Center latitude
- `lng` (optional): Center longitude
- `radius` (optional): Radius in meters (default: 5000)
- `status` (optional): Filter by status
- `category` (optional): Filter by category

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "issues": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "issueId": "ISS-1735543200000",
        "title": "Pothole on Main Street",
        "category": "pothole",
        "status": "reported",
        "priority": "high",
        "location": {
          "lat": 28.6139,
          "lng": 77.2090,
          "address": "123 Main Street"
        },
        "createdAt": "2024-12-25T10:30:00.000Z"
      }
    ],
    "total": 50
  },
  "message": "Map issues fetched successfully",
  "success": true
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Error message describing what went wrong",
  "success": false,
  "errors": []
}
```

### Common Error Codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

- Standard endpoints: 100 requests per 15 minutes
- Analytics endpoints: 20 requests per 15 minutes
- Map endpoints: 50 requests per 15 minutes

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response includes:**
```json
{
  "data": {
    "items": [...],
    "total": 150,
    "page": 1,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## WebSocket Events (Optional)

For real-time updates:

**Connection:** `ws://localhost:3000`

**Events:**
- `issue:created` - New issue created
- `issue:updated` - Issue status changed
- `issue:assigned` - Issue assigned to team member
- `issue:resolved` - Issue marked as resolved

**Event Payload:**
```json
{
  "event": "issue:updated",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "issueId": "ISS-1735543200000",
    "status": "in-progress",
    "updatedAt": "2024-12-25T11:00:00.000Z"
  }
}
```
