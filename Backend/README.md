# CitizenVoice Backend API

A comprehensive Node.js/Express backend for the CitizenVoice civic engagement platform. This system enables citizens to report issues, officials to manage and resolve them, and team leaders to coordinate their teams.

---

## 📚 Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [Authentication System](#authentication-system)
- [Team Management System](#team-management-system)
- [File Upload System](#file-upload-system)
- [Environment Variables](#environment-variables)
- [Setup & Installation](#setup--installation)
- [Scripts](#scripts)

---

## 🛠 Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express** | 5.2.1 | Web framework |
| **MongoDB** | - | NoSQL database |
| **Mongoose** | 9.0.2 | MongoDB ODM |
| **JWT** | 9.0.3 | Authentication tokens |
| **bcryptjs** | 3.0.3 | Password hashing |
| **Cloudinary** | 1.41.3 | Cloud image storage |
| **Multer** | 2.0.2 | File upload handling |
| **cookie-parser** | 1.4.7 | HTTP cookie parsing |
| **google-auth-library** | 10.5.0 | Google OAuth integration |

---

## 📁 Project Structure

```
Backend/
├── app.js                          # Main application entry point
├── package.json                    # Dependencies and scripts
├── .env                            # Environment variables (git ignored)
├── uploads/                        # Local file uploads (git ignored)
│   └── issues/                     # Issue images
└── src/
    ├── controllers/
    │   ├── authController.js       # Authentication logic
    │   ├── issueController.js      # Issue CRUD operations
    │   └── officialController.js   # Official dashboard & team management
    ├── middleware/
    │   ├── authMiddleware.js       # JWT verification & role restriction
    │   └── uploadMiddleware.js     # Multer/Cloudinary file uploads
    ├── models/
    │   ├── userModel.js            # User schema (citizen/official/community)
    │   ├── Issue.js                # Issue schema
    │   └── TeamMember.js           # Team member schema with messaging
    ├── routes/
    │   ├── authRoutes.js           # /api/auth routes
    │   ├── issueRoutes.js          # /api/issues routes
    │   └── officialRoutes.js       # /api/officials routes
    ├── scripts/
    │   └── seedOfficialAdmin.js    # Create/update official admin user
    └── utils/
        ├── ApiError.js             # Custom error class
        ├── ApiResponse.js          # Standardized API response
        ├── AsyncHandler.js         # Async error wrapper
        └── officialPermissions.js  # Admin permission checks
```

---

## 📊 Database Models

### 1. User Model (`userModel.js`)

Stores all users across three roles: citizen, official, and community.

```javascript
{
  username: String,           // Unique, 3-30 chars
  email: String,              // Unique, validated
  password: String,           // Hashed, min 8 chars
  role: 'citizen' | 'official' | 'community',
  googleId: String,           // Optional: Google OAuth ID
  avatar: String,             // Profile image URL
  phone: String,
  address: {
    street, city, state, zipCode
  },
  officialDetails: {          // Only for officials
    department: String,
    designation: String,      // 'team-lead' = admin privileges
    municipalityId: String,
    addedBy: ObjectId         // Reference to team leader who added this member
  },
  communityDetails: {         // Only for community users
    organizationName: String,
    area: String
  },
  isVerified: Boolean,
  isActive: Boolean,
  timestamps: true
}
```

### 2. Issue Model (`Issue.js`)

Stores civic issues reported by citizens.

```javascript
{
  issueId: String,            // Auto-generated: ISS-{timestamp}
  title: String,              // Max 200 chars
  description: String,        // Max 2000 chars
  category: 'pothole' | 'streetlight' | 'garbage' | 'water' | 
            'traffic' | 'noise' | 'safety' | 'other',
  priority: 'low' | 'medium' | 'high',
  status: 'reported' | 'acknowledged' | 'in-progress' | 'resolved' | 'rejected',
  location: {
    address: String,
    lat: Number,              // Required: GPS latitude
    lng: Number,              // Required: GPS longitude
    city: String,
    state: String
  },
  images: [String],           // Array of image URLs
  reportedBy: ObjectId,       // User who reported
  assignedTo: ObjectId,       // Official assigned to resolve
  upvotes: [ObjectId],        // Users who upvoted
  comments: [{
    user: ObjectId,
    text: String,
    createdAt: Date
  }],
  timestamps: true
}
```

### 3. TeamMember Model (`TeamMember.js`)

Tracks team members and their communication with team leaders.

```javascript
{
  userId: ObjectId,           // Reference to User account
  addedBy: ObjectId,          // Team leader who added this member
  name: String,
  email: String,
  phone: String,
  designation: String,        // Default: 'field-officer'
  department: String,
  status: 'active' | 'inactive' | 'suspended',
  messages: [{                // Built-in messaging system
    from: ObjectId,
    to: ObjectId,
    message: String,
    timestamp: Date,
    read: Boolean
  }],
  timestamps: true
}
```

---

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/signup` | Public | Register new user |
| `POST` | `/login` | Public | Login with email/password |
| `POST` | `/google` | Public | Google OAuth login |
| `GET` | `/check` | Public | Verify authentication status |
| `POST` | `/logout` | Public | Clear auth cookie |
| `GET` | `/me` | Protected | Get current user details |

#### Request/Response Examples:

**POST /api/auth/signup**
```json
// Request
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePass123",
  "role": "citizen"
}

// Response
{
  "statusCode": 201,
  "data": {
    "user": {
      "id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "citizen",
      "isOfficialAdmin": false
    }
  },
  "message": "Account created successfully",
  "success": true
}
```

**POST /api/auth/login**
```json
// Request
{
  "email": "john@example.com",
  "password": "securePass123"
}

// Response (sets HTTP-only cookie)
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "citizen",
      "isOfficialAdmin": false
    }
  },
  "message": "Login successful"
}
```

---

### Issue Routes (`/api/issues`)

All routes require authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/create` | Create new issue (with images) |
| `GET` | `/my-issues` | Get user's reported issues |
| `GET` | `/recent` | Get recent issues (limit param) |
| `GET` | `/all` | Get all issues with filters |
| `GET` | `/map` | Get issues for map view (with bounds) |
| `GET` | `/nearby` | Get nearby issues (lat/lng/radius) |
| `GET` | `/:issueId` | Get single issue details |
| `PUT` | `/:issueId` | Update issue |
| `DELETE` | `/:issueId` | Delete issue |
| `POST` | `/:issueId/upvote` | Toggle upvote on issue |

#### Query Parameters:

**GET /api/issues/all**
- `status`: Filter by status (reported, acknowledged, in-progress, resolved, rejected)
- `category`: Filter by category (pothole, streetlight, garbage, etc.)
- `priority`: Filter by priority (low, medium, high)
- `search`: Search in title/description

**GET /api/issues/map**
- `bounds`: `minLat,minLng,maxLat,maxLng`
- `status`: Filter by status
- `category`: Filter by category

**GET /api/issues/nearby**
- `lat`: Latitude (required)
- `lng`: Longitude (required)
- `radius`: Radius in meters (default: 2000)

---

### Official Routes (`/api/officials`)

All routes require authentication + `official` role.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/stats` | Official | Dashboard statistics |
| `GET` | `/assigned` | Official | Get assigned issues |
| `PATCH` | `/assign/:issueId` | **Admin Only** | Assign issue to team member |
| `GET` | `/team` | **Admin Only** | Get team members list |
| `POST` | `/team` | **Admin Only** | Add new team member |
| `DELETE` | `/team/:memberId` | **Admin Only** | Remove team member |
| `POST` | `/message` | **Admin Only** | Send message to team member |
| `GET` | `/messages/:memberId` | **Admin Only** | Get message thread |
| `PATCH` | `/messages/:memberId/mark-read` | **Admin Only** | Mark messages as read |
| `PATCH` | `/settings` | Official | Update user settings |
| `GET` | `/analytics` | Official | Get analytics data |
| `POST` | `/quick-actions/work-order` | **Admin Only** | Create work order |
| `POST` | `/quick-actions/inspection` | **Admin Only** | Schedule inspection |
| `POST` | `/quick-actions/resources` | **Admin Only** | Request resources |
| `POST` | `/quick-actions/report` | **Admin Only** | Generate report |

#### Request Examples:

**POST /api/officials/team** (Add Team Member)
```json
{
  "name": "John Field Officer",
  "email": "john@municipality.gov",
  "phone": "+1234567890",
  "role": "field-officer",
  "department": "Roads"
}

// Response includes temporary password
{
  "statusCode": 201,
  "data": {
    "member": {
      "_id": "...",
      "name": "John Field Officer",
      "email": "john@municipality.gov",
      "tempPassword": "TempXyz123!"  // Send to member
    }
  }
}
```

**PATCH /api/officials/assign/:issueId**
```json
{
  "memberId": "user_id_here"  // The User._id (not TeamMember._id)
}
```

**POST /api/officials/message**
```json
{
  "recipientId": "team_member_id",
  "message": "Please check the pothole on Main Street"
}
```

---

## 🔐 Authentication System

### Cookie-Based JWT Authentication

The system uses HTTP-only cookies for secure token storage:

```javascript
// Cookie Options
{
  httpOnly: true,              // Not accessible via JavaScript
  secure: production,          // HTTPS only in production
  sameSite: 'lax'/'strict',    // CSRF protection
  maxAge: 30 days,
  path: '/'
}
```

### Middleware

#### `protect`
Verifies JWT token from cookie or Authorization header:
```javascript
// Checks:
// 1. req.cookies.token (primary)
// 2. Authorization: Bearer <token> (fallback)
```

#### `restrictTo(...roles)`
Restricts access to specific roles:
```javascript
router.use(restrictTo('official'));  // Only officials
```

#### `requireOfficialAdmin`
Restricts access to team leaders only:
```javascript
router.patch('/assign/:issueId', requireOfficialAdmin, assignIssue);
```

### Admin Permission Logic (`officialPermissions.js`)

A user is considered an **Official Admin** (Team Leader) if:
1. Their email matches `OFFICIAL_ADMIN_EMAIL` environment variable, OR
2. Their `officialDetails.designation === 'team-lead'`

```javascript
export const isOfficialAdmin = (user) => {
  if (!user || user.role !== 'official') return false;
  
  // Check email allowlist
  const allowlistedEmails = process.env.OFFICIAL_ADMIN_EMAIL?.split(',');
  if (allowlistedEmails?.includes(user.email)) return true;
  
  // Check designation
  return user.officialDetails?.designation === 'team-lead';
};
```

---

## 👥 Team Management System

### Features

1. **Add Team Members**
   - Creates User account with `official` role
   - Creates TeamMember record linking to User
   - Generates temporary password
   - Sets `officialDetails.addedBy` to team leader

2. **Remove Team Members**
   - Unassigns all issues from member
   - Deletes User account
   - Deletes TeamMember record

3. **Assign Issues**
   - Only admin can assign issues
   - Auto-changes status to `in-progress`
   - Validates member exists and is official

4. **Messaging System**
   - Built into TeamMember model
   - Team leader ↔ Member communication
   - Read/unread tracking
   - Real-time message threads

### Data Flow

```
Team Leader (OFFICIAL_ADMIN_EMAIL)
    │
    ├── Can add team members
    ├── Can remove team members
    ├── Can assign issues to members
    ├── Can send/receive messages
    │
    └── Team Members (added by leader)
        ├── Can view assigned issues
        ├── Can update issue status
        └── Can message team leader
```

---

## 📸 File Upload System

### Dual Storage Support

The system supports both Cloudinary (cloud) and local storage:

```javascript
// Set in .env
USE_CLOUDINARY=true   // Use Cloudinary
USE_CLOUDINARY=false  // Use local storage
```

### Configuration

**Cloudinary Storage:**
- Folder: `citizenvoice/issues`
- Allowed formats: jpg, jpeg, png, webp, gif
- Auto resource type detection

**Local Storage:**
- Directory: `uploads/issues/`
- Filename: `issue-{timestamp}-{random}.{ext}`

### Limits
- Max file size: **5MB**
- Max files per issue: **5 images**

### Image Cleanup
When an issue is deleted, associated images are automatically removed from Cloudinary.

---

## ⚙️ Environment Variables

Create a `.env` file in the Backend directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=30d

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary Configuration
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Official Admin (Team Leader)
OFFICIAL_ADMIN_EMAIL=admin@example.com
OFFICIAL_ADMIN_PASSWORD=secure_password  # Only for seed script
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (optional)

### Installation Steps

```bash
# 1. Navigate to backend directory
cd Backend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env with your values

# 4. Seed official admin (optional)
npm run seed:official-admin

# 5. Start development server
npm run dev
```

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm run seed:official-admin` | Create/update official admin user |

---

## 🔄 API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success message",
  "success": true
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "success": false
}
```

---

## 🛡️ Error Handling

Custom error handling with `ApiError` class:

```javascript
// Throwing errors
throw new ApiError(400, 'Validation failed');
throw new ApiError(401, 'Unauthorized');
throw new ApiError(403, 'Forbidden');
throw new ApiError(404, 'Not found');
throw new ApiError(409, 'Conflict - resource exists');
throw new ApiError(500, 'Server error');
```

Multer errors are automatically handled:
- `LIMIT_FILE_SIZE` → 400: File too large
- `LIMIT_FILE_COUNT` → 400: Too many files
- Invalid file type → 400: Invalid file type

---

## 🔗 CORS Configuration

```javascript
cors({
  origin: [
    "http://localhost:5173",  // Vite dev server
    "http://localhost:5174",  // Alternative port
  ],
  credentials: true,  // Required for cookies
})
```

---

## 📝 Development Notes

1. **Route Order Matters**: Place specific routes before parameterized routes
   ```javascript
   router.get('/all', getAllIssues);    // ✅ First
   router.get('/:issueId', getIssue);   // ✅ After
   ```

2. **Password Never Returned**: User password is excluded by default (`select: false`)

3. **Team Member vs User ID**: When assigning issues, use `User._id`, not `TeamMember._id`

4. **Auth State Persistence**: `checkAuth` endpoint returns `isOfficialAdmin` for frontend state

---

## 📄 License

ISC

---

## 👨‍💻 Contributors

- Backend Team - CitizenVoice Project
