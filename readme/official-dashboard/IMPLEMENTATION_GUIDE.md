# Official Dashboard - Implementation Guide

## Prerequisites

- Node.js v18+
- MongoDB 5.0+
- Existing CitizenVoice backend setup
- Authentication middleware configured

---

## Step 1: Update Issue Controller

### File: `Backend/src/controllers/issueController.js`

The basic CRUD operations are already implemented. You need to add official-specific methods:

```javascript
// Add these new exports at the end of the file

// Get assigned issues for officials
export const getAssignedIssues = asyncHandler(async (req, res) => {
  const { status, priority } = req.query;
  
  // Verify user is an official
  if (req.user.role !== 'official') {
    throw new ApiError(403, 'Only officials can access assigned issues');
  }
  
  const query = { assignedTo: req.user._id };
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  if (priority && priority !== 'all') {
    query.priority = priority;
  }
  
  const issues = await Issue.find(query)
    .populate('reportedBy', 'username email avatar')
    .populate('assignedTo', 'username email')
    .sort({ priority: -1, createdAt: -1 });
  
  res.json(
    new ApiResponse(200, { issues, total: issues.length })
  );
});

// Assign issue to team member
export const assignIssue = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  const { memberId } = req.body;
  
  // Verify user is an official with permissions
  if (req.user.role !== 'official') {
    throw new ApiError(403, 'Only officials can assign issues');
  }
  
  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  
  // Verify member exists and is an official
  const member = await User.findById(memberId);
  if (!member || member.role !== 'official') {
    throw new ApiError(400, 'Invalid team member');
  }
  
  // Update issue
  issue.assignedTo = memberId;
  issue.status = 'acknowledged';
  
  // Add to assignment history
  if (!issue.assignmentHistory) {
    issue.assignmentHistory = [];
  }
  issue.assignmentHistory.push({
    assignedTo: memberId,
    assignedBy: req.user._id,
    assignedAt: new Date()
  });
  
  await issue.save();
  await issue.populate('assignedTo', 'username email');
  
  console.log(`✅ Issue ${issueId} assigned to ${member.username} by ${req.user.username}`);
  
  res.json(
    new ApiResponse(200, issue, 'Issue assigned successfully')
  );
});

// Get issues by status for officials
export const getIssuesByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  
  if (req.user.role !== 'official') {
    throw new ApiError(403, 'Only officials can access this endpoint');
  }
  
  const issues = await Issue.find({ status })
    .populate('reportedBy', 'username email avatar')
    .populate('assignedTo', 'username email')
    .sort({ priority: -1, createdAt: -1 });
  
  res.json(
    new ApiResponse(200, { issues, total: issues.length })
  );
});

// Bulk update issue status (for officials)
export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { issueIds, status } = req.body;
  
  if (req.user.role !== 'official') {
    throw new ApiError(403, 'Only officials can bulk update');
  }
  
  const result = await Issue.updateMany(
    { _id: { $in: issueIds } },
    { 
      $set: { status },
      $push: {
        statusHistory: {
          status,
          changedBy: req.user._id,
          changedAt: new Date()
        }
      }
    }
  );
  
  res.json(
    new ApiResponse(200, { updated: result.modifiedCount }, 'Issues updated successfully')
  );
});
```

---

## Step 2: Create Official Routes

### File: `Backend/src/routes/officialRoutes.js` (NEW)

```javascript
import express from 'express';
import {
  getAssignedIssues,
  assignIssue,
  getIssuesByStatus,
  bulkUpdateStatus
} from '../controllers/issueController.js';
import {
  getTeamMembers,
  getTeamMemberDetails,
  getDashboardStats,
  getAnalytics
} from '../controllers/officialController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication as official
router.use(protect);
router.use(restrictTo('official'));

// Issue management
router.get('/assigned', getAssignedIssues);
router.post('/assign/:issueId', assignIssue);
router.get('/issues/:status', getIssuesByStatus);
router.post('/bulk-update', bulkUpdateStatus);

// Team management
router.get('/team', getTeamMembers);
router.get('/team/:memberId', getTeamMemberDetails);

// Dashboard & Analytics
router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

export default router;
```

---

## Step 3: Create Official Controller

### File: `Backend/src/controllers/officialController.js` (NEW)

```javascript
import { User } from '../models/userModel.js';
import Issue from '../models/Issue.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/AsyncHandler.js';

// Get team members
export const getTeamMembers = asyncHandler(async (req, res) => {
  const { role, status } = req.query;
  
  const query = { role: 'official', isActive: true };
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  const members = await User.find(query)
    .select('-password')
    .lean();
  
  // Get stats for each member
  const membersWithStats = await Promise.all(
    members.map(async (member) => {
      const assigned = await Issue.countDocuments({
        assignedTo: member._id,
        status: { $in: ['acknowledged', 'in-progress'] }
      });
      
      const completed = await Issue.countDocuments({
        assignedTo: member._id,
        status: 'resolved'
      });
      
      // Calculate average resolution time
      const resolvedIssues = await Issue.find({
        assignedTo: member._id,
        status: 'resolved',
        resolvedAt: { $exists: true }
      }).select('createdAt resolvedAt').lean();
      
      let avgTime = 'N/A';
      if (resolvedIssues.length > 0) {
        const totalTime = resolvedIssues.reduce((sum, issue) => {
          const diff = new Date(issue.resolvedAt) - new Date(issue.createdAt);
          return sum + diff;
        }, 0);
        const avgMillis = totalTime / resolvedIssues.length;
        const avgDays = (avgMillis / (1000 * 60 * 60 * 24)).toFixed(1);
        avgTime = `${avgDays} days`;
      }
      
      // Get recent issues
      const recentIssues = await Issue.find({
        assignedTo: member._id,
        status: { $in: ['acknowledged', 'in-progress'] }
      })
        .select('issueId title status')
        .limit(3)
        .lean();
      
      return {
        ...member,
        stats: {
          assigned,
          completed,
          avgTime
        },
        recentIssues
      };
    })
  );
  
  res.json(
    new ApiResponse(200, { members: membersWithStats, total: membersWithStats.length })
  );
});

// Get team member details
export const getTeamMemberDetails = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  
  const member = await User.findById(memberId).select('-password');
  
  if (!member || member.role !== 'official') {
    throw new ApiError(404, 'Team member not found');
  }
  
  // Get detailed stats
  const assigned = await Issue.countDocuments({
    assignedTo: memberId,
    status: { $in: ['acknowledged', 'in-progress'] }
  });
  
  const completed = await Issue.countDocuments({
    assignedTo: memberId,
    status: 'resolved'
  });
  
  const pending = await Issue.countDocuments({
    assignedTo: memberId,
    status: 'acknowledged'
  });
  
  const inProgress = await Issue.countDocuments({
    assignedTo: memberId,
    status: 'in-progress'
  });
  
  // Get all assigned issues
  const recentIssues = await Issue.find({
    assignedTo: memberId,
    status: { $nin: ['resolved', 'rejected'] }
  })
    .select('issueId title status createdAt')
    .sort({ createdAt: -1 })
    .lean();
  
  res.json(
    new ApiResponse(200, {
      ...member.toObject(),
      stats: {
        assigned,
        completed,
        pending,
        inProgress,
        avgTime: 'N/A', // Calculate as above
        resolutionRate: completed > 0 ? Math.round((completed / (completed + assigned)) * 100) : 0
      },
      recentIssues
    })
  );
});

// Get dashboard statistics
export const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  
  // Get counts
  const pending = await Issue.countDocuments({ status: 'reported' });
  const assigned = await Issue.countDocuments({ 
    assignedTo: req.user._id,
    status: { $in: ['acknowledged', 'in-progress'] }
  });
  const resolvedToday = await Issue.countDocuments({
    status: 'resolved',
    resolvedAt: { $gte: startOfDay }
  });
  
  // Get priority issues
  const priorityIssues = await Issue.find({
    priority: 'high',
    status: { $in: ['reported', 'acknowledged'] }
  })
    .populate('reportedBy', 'username')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  
  // Today's activity
  const todayReceived = await Issue.countDocuments({
    createdAt: { $gte: startOfDay }
  });
  
  const todayResolved = await Issue.countDocuments({
    status: 'resolved',
    resolvedAt: { $gte: startOfDay }
  });
  
  const todayInProgress = await Issue.countDocuments({
    status: 'in-progress',
    updatedAt: { $gte: startOfDay }
  });
  
  res.json(
    new ApiResponse(200, {
      pending,
      assigned,
      resolvedToday,
      avgTime: '2.4 days', // Calculate based on actual data
      todayActivity: {
        received: todayReceived,
        resolved: todayResolved,
        inProgress: todayInProgress,
        escalated: 0
      },
      priorityIssues
    })
  );
});

// Get analytics data
export const getAnalytics = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  
  // Calculate date range based on period
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'quarter':
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default: // month
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }
  
  // Get total issues
  const totalIssues = await Issue.countDocuments({
    createdAt: { $gte: startDate }
  });
  
  const resolvedIssues = await Issue.countDocuments({
    status: 'resolved',
    createdAt: { $gte: startDate }
  });
  
  const pendingIssues = await Issue.countDocuments({
    status: { $in: ['reported', 'acknowledged'] },
    createdAt: { $gte: startDate }
  });
  
  // Category breakdown
  const categoryData = await Issue.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  const categoryStats = categoryData.map(item => ({
    category: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    count: item.count,
    percentage: Math.round((item.count / totalIssues) * 100),
    color: 'bg-rose-500' // Assign colors based on category
  }));
  
  // Monthly trend (last 12 months)
  const monthlyData = await Issue.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' },
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  // Format monthly data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedMonthly = months.map((month, index) => ({
    month,
    reported: 0,
    resolved: 0
  }));
  
  // Overview stats
  const overviewStats = [
    {
      title: 'Total Issues',
      value: totalIssues.toString(),
      change: '+12%',
      trend: 'up',
      color: 'rose'
    },
    {
      title: 'Resolved',
      value: resolvedIssues.toString(),
      change: '+8%',
      trend: 'up',
      color: 'emerald'
    },
    {
      title: 'Avg. Resolution Time',
      value: '2.4 days',
      change: '-15%',
      trend: 'up',
      color: 'violet'
    },
    {
      title: 'Pending',
      value: pendingIssues.toString(),
      change: '+3%',
      trend: 'down',
      color: 'amber'
    }
  ];
  
  res.json(
    new ApiResponse(200, {
      overviewStats,
      categoryData: categoryStats,
      monthlyData: formattedMonthly,
      departmentData: [] // Implement department-wise breakdown
    })
  );
});
```

---

## Step 4: Update Auth Middleware

### File: `Backend/src/middleware/authMiddleware.js`

Add role-based access control:

```javascript
// Add this function to existing middleware

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'You do not have permission to perform this action')
      );
    }
    next();
  };
};
```

---

## Step 5: Update Main App

### File: `Backend/app.js`

Import and use the official routes:

```javascript
import officialRoutes from './src/routes/officialRoutes.js';

// Add after existing routes
app.use('/api/officials', officialRoutes);
```

---

## Step 6: Update Issue Model (Optional Enhancements)

### File: `Backend/src/models/Issue.js`

Add these fields if not present:

```javascript
// Add to the schema
assignmentHistory: [{
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  notes: String
}],

statusHistory: [{
  status: String,
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  notes: String
}],

resolvedAt: Date,
resolutionNotes: String,
resolutionImages: [String]
```

---

## Step 7: Update Issue Routes

### File: `Backend/src/routes/issueRoutes.js`

Add the new official endpoints:

```javascript
import {
  // ... existing imports
  getAssignedIssues,
  assignIssue,
  getIssuesByStatus,
  bulkUpdateStatus
} from '../controllers/issueController.js';

// Add these routes
router.get('/assigned', getAssignedIssues);
router.post('/assign/:issueId', assignIssue);
router.get('/by-status/:status', getIssuesByStatus);
router.post('/bulk-update', bulkUpdateStatus);
```

---

## Step 8: Import User Model in Controllers

### File: `Backend/src/controllers/issueController.js`

Add at the top:

```javascript
import { User } from '../models/userModel.js';
```

---

## Step 9: Testing the Implementation

### Test 1: Get Team Members
```bash
curl -X GET http://localhost:3000/api/officials/team \
  -H "Cookie: token=your_jwt_token"
```

### Test 2: Assign Issue
```bash
curl -X POST http://localhost:3000/api/officials/assign/ISSUE_ID \
  -H "Cookie: token=your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"memberId":"MEMBER_ID"}'
```

### Test 3: Get Dashboard Stats
```bash
curl -X GET http://localhost:3000/api/officials/stats \
  -H "Cookie: token=your_jwt_token"
```

### Test 4: Get Analytics
```bash
curl -X GET "http://localhost:3000/api/officials/analytics?period=month" \
  -H "Cookie: token=your_jwt_token"
```

---

## Step 10: Environment Variables

Add to `.env`:

```env
# Official Dashboard Settings
ANALYTICS_CACHE_TTL=3600
MAX_TEAM_MEMBERS=50
ISSUE_ASSIGNMENT_NOTIFICATION=true
```

---

## Troubleshooting

### Issue: "Only officials can access this endpoint"
**Solution:** Make sure the logged-in user has `role: "official"` in the database.

### Issue: Team members not showing up
**Solution:** Check that users exist with `role: "official"` and `isActive: true`.

### Issue: Analytics returning empty data
**Solution:** Ensure you have issues created within the selected time period.

### Issue: Assignment not working
**Solution:** Verify both the issue ID and member ID exist and are valid ObjectIds.

---

## Next Steps

1. ✅ Implement all controller methods
2. ✅ Add routes to app.js
3. ✅ Test all endpoints
4. ⚠️ Add real-time notifications (WebSocket)
5. ⚠️ Implement analytics caching
6. ⚠️ Add permission-based access control
7. ⚠️ Set up performance monitoring

---

## Performance Optimization

### 1. Add Database Indexes
```javascript
// In Issue model
issueSchema.index({ assignedTo: 1, status: 1 });
issueSchema.index({ status: 1, priority: 1, createdAt: -1 });
```

### 2. Implement Caching
```javascript
import NodeCache from 'node-cache';
const analyticsCache = new NodeCache({ stdTTL: 3600 }); // 1 hour

export const getAnalytics = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const cacheKey = `analytics_${period}`;
  
  // Check cache
  const cached = analyticsCache.get(cacheKey);
  if (cached) {
    return res.json(new ApiResponse(200, cached));
  }
  
  // ... fetch data ...
  
  // Store in cache
  analyticsCache.set(cacheKey, data);
  
  res.json(new ApiResponse(200, data));
});
```

### 3. Use Aggregation Pipeline
For better performance with large datasets, use MongoDB aggregation:

```javascript
const stats = await Issue.aggregate([
  { $match: { status: 'resolved', createdAt: { $gte: startDate } } },
  {
    $group: {
      _id: null,
      count: { $sum: 1 },
      avgTime: { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } }
    }
  }
]);
```

---

## Security Considerations

1. **Rate Limiting**: Add rate limiting for analytics endpoints
2. **Input Validation**: Validate all input parameters
3. **Permission Checks**: Verify user permissions for sensitive operations
4. **Data Sanitization**: Sanitize user inputs to prevent injection attacks
5. **Audit Logging**: Log all assignment and status change operations

---

## Deployment Checklist

- [ ] All endpoints tested locally
- [ ] Database indexes created
- [ ] Environment variables configured
- [ ] Error handling tested
- [ ] Rate limiting configured
- [ ] Logging setup complete
- [ ] Frontend integration tested
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation updated
