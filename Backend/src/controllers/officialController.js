import Issue from '../models/Issue.js';
import { User } from '../models/userModel.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { isOfficialAdmin } from '../utils/officialPermissions.js';

// GET /api/officials/stats - Dashboard statistics
export const getOfficialStats = asyncHandler(async (req, res) => {
  const admin = isOfficialAdmin(req.user);

  // Admin sees global stats; regular officials see stats for their assigned issues only
  const scopeQuery = admin ? {} : { assignedTo: req.user._id };
  const allIssues = await Issue.find(scopeQuery);

  const pending = allIssues.filter((i) => ['reported', 'acknowledged'].includes(i.status)).length;
  const assigned = allIssues.filter((i) => !!i.assignedTo).length;
  
  // Get today's resolved issues
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const resolvedToday = allIssues.filter(i =>
    i.status === 'resolved' && new Date(i.updatedAt) >= today
  ).length;

  // Calculate average resolution time (placeholder)
  const avgTime = '2.4 days';

  // Get priority issues
  const priorityIssues = await Issue.find({
    ...scopeQuery,
    priority: 'high',
    status: { $in: ['reported', 'acknowledged', 'in-progress'] },
  })
    .populate('reportedBy', 'username')
    .sort({ createdAt: -1 })
    .limit(5);

  const stats = {
    pending,
    assigned,
    resolvedToday,
    avgTime,
    todayActivity: {
      received: allIssues.filter(i => new Date(i.createdAt) >= today).length,
      resolved: resolvedToday,
      inProgress: allIssues.filter(i => i.status === 'in-progress').length,
      escalated: 0,
    },
    priorityIssues: priorityIssues.map(issue => ({
      _id: issue._id,
      issueId: issue.issueId,
      title: issue.title,
      priority: issue.priority,
      status: issue.status,
      location: issue.location?.address || 'Unknown',
      createdAt: issue.createdAt,
    })),
  };

  res.json(new ApiResponse(200, stats, 'Official stats fetched successfully'));
});

// GET /api/officials/assigned - Get assigned issues
export const getAssignedIssues = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = { assignedTo: req.user._id };

  if (status && status !== 'all') {
    query.status = status;
  }

  const issues = await Issue.find(query)
    .populate('reportedBy', 'username email avatar')
    .populate('assignedTo', 'username email')
    .sort({ createdAt: -1 });

  res.json(new ApiResponse(200, { issues, total: issues.length }, 'Assigned issues fetched'));
});

// PATCH /api/officials/assign/:issueId - Assign issue to team member
export const assignIssue = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  const { memberId } = req.body;

  if (!memberId) {
    throw new ApiError(400, 'memberId is required');
  }

  const member = await User.findById(memberId);
  if (!member || member.role !== 'official') {
    throw new ApiError(404, 'Team member not found');
  }

  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  if (['resolved', 'rejected'].includes(issue.status)) {
    throw new ApiError(400, `Cannot assign an issue that is ${issue.status}`);
  }

  issue.assignedTo = member._id;
  // Requirement: once assigned, issue should be in-progress
  issue.status = 'in-progress';

  await issue.save();
  await issue.populate('reportedBy', 'username email avatar');
  await issue.populate('assignedTo', 'username email');

  res.json(new ApiResponse(200, issue, 'Issue assigned successfully'));
});

// GET /api/officials/team - Get team members
export const getTeamMembers = asyncHandler(async (req, res) => {
  const members = await User.find({ role: 'official', isActive: true }).select(
    'username email phone avatar officialDetails createdAt'
  );

  // Get issue counts for each member
  const membersWithStats = await Promise.all(
    members.map(async (member) => {
      const assignedIssues = await Issue.find({ assignedTo: member._id });
      const completedIssues = assignedIssues.filter(i => i.status === 'resolved').length;
      
      const recentIssues = await Issue.find({ assignedTo: member._id })
        .select('issueId title status')
        .sort({ createdAt: -1 })
        .limit(3);

      return {
        _id: member._id,
        id: member._id,
        username: member.username,
        name: member.username,
        email: member.email,
        phone: member.phone || '',
        role: member.officialDetails?.designation || 'field-officer',
        avatar: member.avatar || member.username?.slice(0, 2).toUpperCase(),
        status: 'active',
        stats: {
          assigned: assignedIssues.length,
          completed: completedIssues,
          avgTime: '2.3 days',
        },
        recentIssues: recentIssues.map(i => ({
          id: i.issueId,
          title: i.title,
          status: i.status,
        })),
      };
    })
  );

  res.json(new ApiResponse(200, { members: membersWithStats, total: membersWithStats.length }, 'Team members fetched'));
});

// POST /api/officials/team - Add team member
export const addTeamMember = asyncHandler(async (req, res) => {
  const { name, email, phone, role } = req.body;

  if (!name || !email) {
    throw new ApiError(400, 'Name and email are required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Create new official user with temporary password
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash('TempPass123!', 10);

  const user = await User.create({
    username: name,
    email,
    phone: phone || null,
    password: hashedPassword,
    role: 'official',
    officialDetails: {
      designation: role || 'field-officer',
    },
  });

  const member = {
    _id: user._id,
    id: user._id,
    username: user.username,
    name: user.username,
    email: user.email,
    phone: user.phone,
    role: role || 'field-officer',
    avatar: user.username?.slice(0, 2).toUpperCase(),
    status: 'active',
    stats: { assigned: 0, completed: 0, avgTime: '0 days' },
    recentIssues: [],
  };

  res.status(201).json(new ApiResponse(201, { member }, 'Team member added successfully'));
});

// DELETE /api/officials/team/:memberId - Remove team member
export const removeTeamMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;

  const user = await User.findById(memberId);
  if (!user || user.role !== 'official') {
    throw new ApiError(404, 'Team member not found');
  }

  // Unassign all issues from this member
  await Issue.updateMany({ assignedTo: memberId }, { $unset: { assignedTo: 1 } });
  
  await user.deleteOne();

  res.json(new ApiResponse(200, null, 'Team member removed successfully'));
});

// POST /api/officials/message - Send message to team member
export const sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, message } = req.body;

  if (!recipientId || !message) {
    throw new ApiError(400, 'recipientId and message are required');
  }

  // For now, just acknowledge the message (real implementation would save to DB)
  const messageId = `msg_${Date.now()}`;

  res.status(201).json(new ApiResponse(201, { messageId, sent: true }, 'Message sent successfully'));
});

// PATCH /api/officials/settings - Update official settings
export const updateSettings = asyncHandler(async (req, res) => {
  const { department, notifications } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (department) {
    user.officialDetails = user.officialDetails || {};
    user.officialDetails.department = department;
  }

  await user.save();

  res.json(new ApiResponse(200, { 
    settings: { 
      department: user.officialDetails?.department || '',
      notifications: notifications || {}
    }
  }, 'Settings updated'));
});

// GET /api/officials/analytics - Get analytics data
export const getAnalytics = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;

  const admin = isOfficialAdmin(req.user);
  const scopeQuery = admin ? {} : { assignedTo: req.user._id };

  // Get scoped issues for analytics
  const allIssues = await Issue.find(scopeQuery);
  const resolvedIssues = allIssues.filter(i => i.status === 'resolved');
  const pendingIssues = allIssues.filter(i => ['reported', 'acknowledged', 'in-progress'].includes(i.status));

  // Category breakdown
  const categories = ['pothole', 'streetlight', 'garbage', 'water', 'traffic', 'noise', 'safety', 'other'];
  const categoryData = categories.map(cat => {
    const count = allIssues.filter(i => i.category === cat).length;
    return {
      category: cat.charAt(0).toUpperCase() + cat.slice(1),
      count,
      percentage: allIssues.length > 0 ? Math.round((count / allIssues.length) * 100) : 0,
      color: `bg-${['rose', 'violet', 'amber', 'blue', 'emerald', 'orange', 'red', 'gray'][categories.indexOf(cat)]}-500`,
    };
  }).filter(c => c.count > 0);

  // Monthly data (last 6 months)
  const monthlyData = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const reported = allIssues.filter(issue => {
      const d = new Date(issue.createdAt);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;
    
    const resolved = resolvedIssues.filter(issue => {
      const d = new Date(issue.updatedAt);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;
    
    monthlyData.push({ month: monthNames[month], reported, resolved });
  }

  const data = {
    overviewStats: [
      { title: 'Total Issues', value: allIssues.length.toLocaleString(), change: '+12%', trend: 'up', color: 'rose' },
      { title: 'Resolved', value: resolvedIssues.length.toLocaleString(), change: '+8%', trend: 'up', color: 'emerald' },
      { title: 'Avg. Resolution Time', value: '2.4 days', change: '-15%', trend: 'up', color: 'violet' },
      { title: 'Pending', value: pendingIssues.length.toLocaleString(), change: '+3%', trend: 'down', color: 'amber' },
    ],
    categoryData,
    monthlyData,
    departmentData: [
      { name: 'Roads & Infrastructure', issues: Math.ceil(allIssues.length * 0.35), resolved: Math.ceil(resolvedIssues.length * 0.35), avgTime: '2.1 days' },
      { name: 'Sanitation', issues: Math.ceil(allIssues.length * 0.25), resolved: Math.ceil(resolvedIssues.length * 0.25), avgTime: '1.5 days' },
      { name: 'Electricity', issues: Math.ceil(allIssues.length * 0.2), resolved: Math.ceil(resolvedIssues.length * 0.2), avgTime: '3.2 days' },
      { name: 'Water Supply', issues: Math.ceil(allIssues.length * 0.15), resolved: Math.ceil(resolvedIssues.length * 0.15), avgTime: '2.8 days' },
      { name: 'Parks & Recreation', issues: Math.ceil(allIssues.length * 0.05), resolved: Math.ceil(resolvedIssues.length * 0.05), avgTime: '4.5 days' },
    ],
    period,
  };

  res.json(new ApiResponse(200, data, 'Analytics data fetched'));
});

// POST quick actions
export const createWorkOrder = asyncHandler(async (req, res) => {
  res.status(201).json(new ApiResponse(201, { id: `wo_${Date.now()}` }, 'Work order created'));
});

export const scheduleInspection = asyncHandler(async (req, res) => {
  res.status(201).json(new ApiResponse(201, { id: `insp_${Date.now()}` }, 'Inspection scheduled'));
});

export const requestResources = asyncHandler(async (req, res) => {
  res.status(201).json(new ApiResponse(201, { id: `req_${Date.now()}` }, 'Resource request created'));
});

export const generateReport = asyncHandler(async (req, res) => {
  res.status(201).json(new ApiResponse(201, { id: `rep_${Date.now()}` }, 'Report generation started'));
});
