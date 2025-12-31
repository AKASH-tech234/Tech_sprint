# District-Based Jurisdiction System - Implementation Guide

## 📋 Overview

This document outlines the **District-Based Jurisdiction System** implementation for CitizenVoice. This feature allows officials and community leaders to set their jurisdiction based on Indian districts, and enables citizens to join district-based communities.

**Date Implemented:** December 31, 2025  
**Branch:** main

---

## 🎯 Key Features

### 1. **District Setup for Officials & Community Leaders**

- First-time login prompts officials/community users to set their district
- One-time setting (permanent, cannot be changed)
- Geolocation-based auto-detection using OpenStreetMap
- Manual selection via state → district dropdown
- Uses comprehensive India states & districts data (36 states/UTs, 800+ districts)

### 2. **Community System for Citizens**

- Citizens can browse and join district-based communities
- Search/filter communities by state and district
- View community members, statistics, and activity
- Join/leave communities with real-time updates

### 3. **Community Chat**

- Real-time chat for community members
- Role-based messaging (member, moderator, leader)
- Announcement system for leaders/moderators
- Message history with pagination
- Online/offline member status

---

## 🗄️ Database Schema Changes

### User Model (`Backend/src/models/userModel.js`)

**New Fields Added:**

```javascript
district: {
  name: { type: String, default: null },        // e.g., "Pune"
  state: { type: String, default: null },       // e.g., "Maharashtra"
  isSet: { type: Boolean, default: false },     // One-time flag
  setAt: { type: Date, default: null }          // Timestamp
},

joinedCommunities: [{
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
  joinedAt: { type: Date, default: Date.now }
}]
```

**Migration Notes:**

- Existing users will have `district: null` and `isSet: false`
- Officials/community users will be prompted to set district on next login
- Citizens can optionally join communities

---

### Community Model (`Backend/src/models/Community.js`)

**New Model Created:**

```javascript
{
  name: String,                    // "Pune Community"
  description: String,             // Community description

  district: {
    name: String,                  // Required: "Pune"
    state: String                  // Required: "Maharashtra"
  },

  districtCode: String,            // Unique: "MAH-PUNE"

  leader: ObjectId,                // Community leader (role: community)

  members: [{
    user: ObjectId,
    role: String,                  // member, moderator, leader
    joinedAt: Date
  }],

  messages: [{                     // Chat messages (last 500)
    sender: ObjectId,
    content: String,
    type: String,                  // text, image, announcement
    createdAt: Date
  }],

  stats: {
    totalMembers: Number,
    totalIssuesReported: Number,
    totalIssuesResolved: Number,
    activeThisMonth: Number
  },

  settings: {
    isPublic: Boolean,
    allowJoin: Boolean,
    requireApproval: Boolean
  }
}
```

**Indexes:**

- `districtCode` (unique)
- `district.state` + `district.name` (compound)

---

## 🔌 API Endpoints

### Authentication Endpoints

#### `POST /api/auth/set-district`

Set district for official/community user (one-time only)

**Auth Required:** Yes  
**Roles:** `official`, `community`

**Request Body:**

```json
{
  "state": "Maharashtra",
  "district": "Pune"
}
```

**Response:**

```json
{
  "statusCode": 200,
  "data": {
    "id": "user_id",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "official",
    "district": {
      "name": "Pune",
      "state": "Maharashtra",
      "isSet": true,
      "setAt": "2025-12-31T10:30:00.000Z"
    }
  },
  "message": "District set successfully"
}
```

**Errors:**

- `400` - District already set
- `400` - Missing state or district
- `403` - Invalid role (only official/community)

---

### Community Endpoints

#### `GET /api/communities`

Get all communities with optional filters

**Auth Required:** Yes

**Query Parameters:**

- `state` (optional) - Filter by state
- `district` (optional) - Filter by district
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Response:**

```json
{
  "statusCode": 200,
  "data": {
    "communities": [
      {
        "_id": "community_id",
        "name": "Pune Community",
        "description": "Official community for Pune district",
        "district": {
          "name": "Pune",
          "state": "Maharashtra"
        },
        "districtCode": "MAH-PUNE",
        "leader": {
          "_id": "user_id",
          "username": "community_leader"
        },
        "stats": {
          "totalMembers": 150,
          "totalIssuesReported": 45,
          "totalIssuesResolved": 32
        },
        "isJoined": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

#### `GET /api/communities/my`

Get user's joined communities

**Auth Required:** Yes

**Response:**

```json
{
  "statusCode": 200,
  "data": {
    "communities": [
      {
        "_id": "community_id",
        "name": "Pune Community",
        "district": { "name": "Pune", "state": "Maharashtra" },
        "joinedAt": "2025-12-30T10:00:00.000Z",
        "isJoined": true
      }
    ]
  }
}
```

---

#### `GET /api/communities/:districtCode`

Get community by district code

**Auth Required:** Yes

**Parameters:**

- `districtCode` - e.g., "MAH-PUNE"

**Response:**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "community_id",
    "name": "Pune Community",
    "district": { "name": "Pune", "state": "Maharashtra" },
    "districtCode": "MAH-PUNE",
    "leader": { "_id": "id", "username": "leader" },
    "members": [...],
    "stats": {...},
    "isJoined": true
  }
}
```

---

#### `POST /api/communities/:id/join`

Join a community

**Auth Required:** Yes

**Parameters:**

- `id` - Community ID

**Response:**

```json
{
  "statusCode": 200,
  "data": { "joined": true },
  "message": "Joined community successfully"
}
```

**Errors:**

- `400` - Already a member
- `403` - Community not accepting members
- `404` - Community not found

---

#### `POST /api/communities/:id/leave`

Leave a community

**Auth Required:** Yes

**Parameters:**

- `id` - Community ID

**Response:**

```json
{
  "statusCode": 200,
  "data": { "left": true },
  "message": "Left community successfully"
}
```

**Errors:**

- `400` - Leaders cannot leave (must transfer leadership)
- `400` - Not a member

---

### Community Chat Endpoints

#### `GET /api/communities/:districtCode/messages`

Get chat messages for a community

**Auth Required:** Yes  
**Permission:** Must be a member

**Parameters:**

- `districtCode` - e.g., "MAH-PUNE"

**Query Parameters:**

- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 50)

**Response:**

```json
{
  "statusCode": 200,
  "data": {
    "messages": [
      {
        "id": "message_id",
        "type": "text",
        "content": "Hello everyone!",
        "sender": {
          "id": "user_id",
          "name": "John Doe",
          "avatar": "url"
        },
        "createdAt": "2025-12-31T10:30:00.000Z"
      }
    ],
    "hasMore": true
  }
}
```

---

#### `POST /api/communities/:districtCode/messages`

Send a message to community chat

**Auth Required:** Yes  
**Permission:** Must be a member

**Parameters:**

- `districtCode` - e.g., "MAH-PUNE"

**Request Body:**

```json
{
  "content": "Hello everyone!",
  "type": "text" // text, image, announcement
}
```

**Response:**

```json
{
  "statusCode": 201,
  "data": {
    "id": "message_id",
    "type": "text",
    "content": "Hello everyone!",
    "sender": {
      "id": "user_id",
      "name": "John Doe",
      "avatar": "url",
      "role": "member"
    },
    "createdAt": "2025-12-31T10:30:00.000Z"
  },
  "message": "Message sent successfully"
}
```

**Errors:**

- `403` - Not a member
- `403` - Only leaders/moderators can send announcements
- `400` - Empty message content

---

#### `GET /api/communities/:districtCode/members`

Get all members of a community

**Auth Required:** Yes

**Parameters:**

- `districtCode` - e.g., "MAH-PUNE"

**Response:**

```json
{
  "statusCode": 200,
  "data": {
    "members": [
      {
        "id": "user_id",
        "name": "John Doe",
        "avatar": "url",
        "role": "leader",
        "joinedAt": "2025-12-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## 📁 Files Created/Modified

### Backend Files

**New Files:**

- `Backend/src/models/Community.js` - Community model
- `Backend/src/controllers/communityController.js` - Community endpoints
- `Backend/src/routes/communityRoutes.js` - Community routes

**Modified Files:**

- `Backend/src/models/userModel.js` - Added district & joinedCommunities
- `Backend/src/controllers/authController.js` - Added setDistrict endpoint, updated userData responses
- `Backend/src/routes/authRoutes.js` - Added /set-district route
- `Backend/app.js` - Registered community routes

---

### Frontend Files

**New Files:**

- `CitizenVoice/src/components/Dashboard/Shared/DistrictSetup.jsx` - District setup modal
- `CitizenVoice/src/components/Dashboard/Citizen/JoinCommunity.jsx` - Community browser
- `CitizenVoice/src/components/Dashboard/Community/CommunityChat.jsx` - Chat interface
- `CitizenVoice/src/services/communityService.js` - Community API service
- `CitizenVoice/src/data/indianDistricts.json` - India districts data (36 states, 800+ districts)

**Modified Files:**

- `CitizenVoice/src/components/projectedroute.jsx` - District setup check
- `CitizenVoice/src/context/Authcontext.jsx` - Added setDistrict function
- `CitizenVoice/src/services/authservices.js` - Added setDistrict API call
- `CitizenVoice/src/components/Dashboard/Shared/Sidebar.jsx` - Added community menu items
- `CitizenVoice/src/pages/Dashboard/CitizenDashboard.jsx` - Added /communities route
- `CitizenVoice/src/pages/Dashboard/CommunityDashboard.jsx` - Added /chat route

---

## 🚀 Integration Steps

### 1. Database Setup

No manual migration needed. The schema changes are backward compatible:

```javascript
// Existing users automatically get:
{
  district: null,
  joinedCommunities: []
}
```

### 2. Test District Setup Flow

**For Officials/Community Users:**

1. Create or login as official/community user
2. Check if `user.district.isSet === false`
3. Call `POST /api/auth/set-district` with state and district
4. Verify district is saved and `isSet === true`
5. Subsequent logins should NOT show district setup

**Test Script:**

```bash
# Login as official
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"official@test.com","password":"password"}' \
  --cookie-jar cookies.txt

# Set district (only works once)
curl -X POST http://localhost:3000/api/auth/set-district \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"state":"Maharashtra","district":"Pune"}'

# Verify user has district
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt
```

### 3. Test Community System

**Create/Find Community:**

```bash
# List communities
curl -X GET http://localhost:3000/api/communities?state=Maharashtra \
  -b cookies.txt

# Get specific community
curl -X GET http://localhost:3000/api/communities/MAH-PUNE \
  -b cookies.txt
```

**Join/Leave Community:**

```bash
# Join community
curl -X POST http://localhost:3000/api/communities/COMMUNITY_ID/join \
  -b cookies.txt

# Get my communities
curl -X GET http://localhost:3000/api/communities/my \
  -b cookies.txt

# Leave community
curl -X POST http://localhost:3000/api/communities/COMMUNITY_ID/leave \
  -b cookies.txt
```

**Chat Messages:**

```bash
# Get messages
curl -X GET http://localhost:3000/api/communities/MAH-PUNE/messages \
  -b cookies.txt

# Send message
curl -X POST http://localhost:3000/api/communities/MAH-PUNE/messages \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"content":"Hello community!","type":"text"}'

# Get members
curl -X GET http://localhost:3000/api/communities/MAH-PUNE/members \
  -b cookies.txt
```

---

## 🧪 Testing Checklist

### Backend Testing

- [ ] User can set district (official/community only)
- [ ] District cannot be changed after setting
- [ ] Citizens cannot set district
- [ ] Community is auto-created for each district
- [ ] User can join multiple communities
- [ ] User cannot join same community twice
- [ ] Leaders cannot leave community without transfer
- [ ] Only members can view messages
- [ ] Only leaders/moderators can send announcements
- [ ] Messages are paginated correctly
- [ ] District code generation is unique

### Frontend Testing

- [ ] District setup modal shows on first login (official/community)
- [ ] Geolocation auto-detects state/district
- [ ] Manual selection works with dropdown
- [ ] Modal shows success state after setting
- [ ] Citizen can browse communities by state/district
- [ ] Join/leave actions work correctly
- [ ] Community chat shows messages with proper formatting
- [ ] Real-time updates work (if WebSocket implemented)
- [ ] Member list shows correct roles and status
- [ ] Routes are properly protected

---

## 🔧 Configuration

### Environment Variables

No new environment variables required. Uses existing:

- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Authentication
- `NODE_ENV` - Environment mode

### Frontend Configuration

The district data file is located at:

```
CitizenVoice/src/data/indianDistricts.json
```

Contains all 36 Indian states/UTs and 800+ districts.

---

## 📊 Data Structure Examples

### District Code Generation

```javascript
State: "Maharashtra", District: "Pune"
→ District Code: "MAH-PUNE"

State: "Tamil Nadu", District: "Chennai"
→ District Code: "TAM-CHENN"

State: "Uttar Pradesh", District: "Lucknow"
→ District Code: "UTT-LUCKN"
```

### Community Auto-Creation

When an official/community user sets their district:

1. System checks if community exists for that district
2. If not, creates community with:
   - Name: `{District} Community`
   - Description: `Official community for {District} district, {State}`
   - District Code: Auto-generated
   - Leader: Community user (if role === "community")

---

## ⚠️ Important Notes

### For Backend Team

1. **District is Permanent:** Once set, it cannot be changed. Implement carefully.
2. **Community Messages:** Only last 500 messages are stored in the document. Consider archiving for history.
3. **Real-time Updates:** Current implementation is REST-based. Consider WebSocket for real-time chat.
4. **Pagination:** Implement proper pagination for messages and community lists.
5. **Permissions:** Always verify user is a member before allowing chat access.

### For Frontend Team

1. **Geolocation Permission:** Handle permission denied gracefully.
2. **Offline Fallback:** Manual selection should always be available.
3. **State Management:** Consider using context or Redux for community data.
4. **Real-time Chat:** Current implementation polls. Upgrade to WebSocket for production.
5. **Image Uploads:** Chat supports image messages but upload not implemented yet.

---

## 🐛 Known Issues & Limitations

1. **No District Change:** Once set, district cannot be changed. Feature by design.
2. **Message Limit:** Only last 500 messages stored per community.
3. **No WebSocket:** Chat uses polling, not real-time.
4. **No Image Upload:** Chat UI supports images but backend upload not implemented.
5. **No Search:** Community list doesn't support text search, only state/district filter.
6. **No Moderation:** No admin tools to moderate communities or messages.

---

## 🔮 Future Enhancements

- [ ] WebSocket integration for real-time chat
- [ ] Image/file upload in chat
- [ ] Community moderation tools
- [ ] Ban/mute members
- [ ] Community analytics dashboard
- [ ] Email notifications for community events
- [ ] Community badges and achievements
- [ ] Advanced search and filters
- [ ] Message reactions and replies
- [ ] Voice/video chat integration

---

## 📞 Support

For questions or issues:

- Check existing issues in the repository
- Review the API documentation above
- Test with the provided curl commands
- Contact: Backend Team

---

## 📝 Changelog

**v1.0.0 - December 31, 2025**

- Initial implementation of district jurisdiction system
- Community model and endpoints
- District setup UI for officials/community
- Community browser for citizens
- Community chat with role-based permissions
- Integration with Indian states and districts data

---

## 🙏 Credits

- **District Data:** Comprehensive list of all Indian states and districts
- **Geolocation:** OpenStreetMap Nominatim API for reverse geocoding
- **UI Components:** Lucide React icons, Tailwind CSS

---

**Last Updated:** December 31, 2025  
**Version:** 1.0.0  
**Status:** ✅ Ready for Integration
