import Issue from "../models/Issue.js";
import { User } from "../models/userModel.js";
import { TeamMember } from "../models/TeamMember.js";
import WorkOrder from "../models/WorkOrder.js";
import Inspection from "../models/Inspection.js";
import ResourceRequest from "../models/ResourceRequest.js";
import GeneratedReport from "../models/GeneratedReport.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { isOfficialAdmin } from "../utils/officialPermissions.js";

// GET /api/officials/stats - Dashboard statistics
export const getOfficialStats = asyncHandler(async (req, res) => {
  const admin = isOfficialAdmin(req.user);

  // Admin sees global stats; regular officials see stats for their assigned issues only
  const scopeQuery = admin ? {} : { assignedTo: req.user._id };
  const allIssues = await Issue.find(scopeQuery);

  const pending = allIssues.filter((i) =>
    ["reported", "acknowledged"].includes(i.status)
  ).length;
  const assigned = allIssues.filter((i) => !!i.assignedTo).length;

  // Get today's resolved issues
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const resolvedToday = allIssues.filter(
    (i) => i.status === "resolved" && new Date(i.updatedAt) >= today
  ).length;

  // Calculate average resolution time (placeholder)
  const avgTime = "2.4 days";

  // Get priority issues
  const priorityIssues = await Issue.find({
    ...scopeQuery,
    priority: "high",
    status: { $in: ["reported", "acknowledged", "in-progress"] },
  })
    .populate("reportedBy", "username")
    .sort({ createdAt: -1 })
    .limit(5);

  const stats = {
    pending,
    assigned,
    resolvedToday,
    avgTime,
    todayActivity: {
      received: allIssues.filter((i) => new Date(i.createdAt) >= today).length,
      resolved: resolvedToday,
      inProgress: allIssues.filter((i) => i.status === "in-progress").length,
      escalated: 0,
    },
    priorityIssues: priorityIssues.map((issue) => ({
      _id: issue._id,
      issueId: issue.issueId,
      title: issue.title,
      priority: issue.priority,
      status: issue.status,
      location: issue.location?.address || "Unknown",
      createdAt: issue.createdAt,
    })),
  };

  res.json(new ApiResponse(200, stats, "Official stats fetched successfully"));
});

// GET /api/officials/assigned - Get assigned issues
export const getAssignedIssues = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = { assignedTo: req.user._id };

  if (status && status !== "all") {
    query.status = status;
  }

  const issues = await Issue.find(query)
    .populate("reportedBy", "username email avatar")
    .populate("assignedTo", "username email")
    .sort({ createdAt: -1 });

  res.json(
    new ApiResponse(
      200,
      { issues, total: issues.length },
      "Assigned issues fetched"
    )
  );
});

// PATCH /api/officials/assign/:issueId - Assign issue to team member
export const assignIssue = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  const { memberId } = req.body;

  if (!memberId) {
    throw new ApiError(400, "memberId is required");
  }

  const member = await User.findById(memberId);
  if (!member || member.role !== "official") {
    throw new ApiError(404, "Team member not found");
  }

  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, "Issue not found");
  }

  if (["resolved", "rejected"].includes(issue.status)) {
    throw new ApiError(400, `Cannot assign an issue that is ${issue.status}`);
  }

  issue.assignedTo = member._id;
  // WORKFLOW: Assigning issue → status = 'acknowledged'
  // Team member then submits verification report → admin approves → status = 'in-progress'
  issue.status = "acknowledged";

  await issue.save();
  await issue.populate("reportedBy", "username email avatar");
  await issue.populate("assignedTo", "username email");

  res.json(new ApiResponse(200, issue, "Issue assigned successfully"));
});

// GET /api/officials/team - Get team members
export const getTeamMembers = asyncHandler(async (req, res) => {
  // Get team members added by this team leader
  const teamMembers = await TeamMember.find({
    addedBy: req.user._id,
    status: "active",
  })
    .populate("userId", "username email phone avatar isActive")
    .sort({ createdAt: -1 });

  // Get issue counts for each member
  const membersWithStats = await Promise.all(
    teamMembers.map(async (teamMember) => {
      const assignedIssues = await Issue.find({
        assignedTo: teamMember.userId,
      });
      const completedIssues = assignedIssues.filter(
        (i) => i.status === "resolved"
      ).length;

      const recentIssues = await Issue.find({ assignedTo: teamMember.userId })
        .select("issueId title status")
        .sort({ createdAt: -1 })
        .limit(3);

      const unreadMessages = teamMember.messages.filter(
        (msg) => msg.to.toString() === req.user._id.toString() && !msg.read
      ).length;

      return {
        _id: teamMember._id,
        id: teamMember._id,
        userId: teamMember.userId?._id,
        username: teamMember.userId?.username || teamMember.name,
        name: teamMember.name,
        email: teamMember.email,
        phone: teamMember.phone || "",
        role: teamMember.designation,
        department: teamMember.department || "",
        avatar:
          teamMember.userId?.avatar ||
          teamMember.name?.slice(0, 2).toUpperCase(),
        status: teamMember.userId?.isActive ? "active" : "inactive",
        unreadMessages,
        stats: {
          assigned: assignedIssues.length,
          completed: completedIssues,
          avgTime: "2.3 days",
        },
        recentIssues: recentIssues.map((i) => ({
          id: i.issueId,
          title: i.title,
          status: i.status,
        })),
        addedAt: teamMember.createdAt,
      };
    })
  );

  res.json(
    new ApiResponse(
      200,
      { members: membersWithStats, total: membersWithStats.length },
      "Team members fetched"
    )
  );
});

// POST /api/officials/team - Add team member
export const addTeamMember = asyncHandler(async (req, res) => {
  const { name, email, phone, role, department } = req.body;

  if (!name || !email) {
    throw new ApiError(400, "Name and email are required");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // Check if team member already added by this leader
  const existingTeamMember = await TeamMember.findOne({
    email,
    addedBy: req.user._id,
  });
  if (existingTeamMember) {
    throw new ApiError(409, "Team member already added");
  }

  // Create new official user with temporary password
  const bcrypt = await import("bcryptjs");
  const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
  const hashedPassword = await bcrypt.default.hash(tempPassword, 10);

  const user = await User.create({
    username: name.toLowerCase().replace(/\s+/g, "_"),
    email,
    phone: phone || null,
    password: hashedPassword,
    role: "official",
    officialDetails: {
      designation: role || "field-officer",
      department: department || "",
      addedBy: req.user._id,
    },
  });

  // Create team member record
  const teamMember = await TeamMember.create({
    userId: user._id,
    addedBy: req.user._id,
    name,
    email,
    phone: phone || null,
    designation: role || "field-officer",
    department: department || "",
    status: "active",
  });

  const member = {
    _id: teamMember._id,
    id: teamMember._id,
    userId: user._id,
    username: user.username,
    name,
    email,
    phone: phone || "",
    role: role || "field-officer",
    department: department || "",
    avatar: name.slice(0, 2).toUpperCase(),
    status: "active",
    tempPassword, // Send this once to user (in real app, send via email)
    stats: { assigned: 0, completed: 0, avgTime: "0 days" },
    recentIssues: [],
  };

  res
    .status(201)
    .json(new ApiResponse(201, { member }, "Team member added successfully"));
});

// DELETE /api/officials/team/:memberId - Remove team member
export const removeTeamMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;

  // Find team member added by this leader
  const teamMember = await TeamMember.findOne({
    _id: memberId,
    addedBy: req.user._id,
  });
  if (!teamMember) {
    throw new ApiError(
      404,
      "Team member not found or you do not have permission to remove them"
    );
  }

  const user = await User.findById(teamMember.userId);
  if (user) {
    // Unassign all issues from this member
    await Issue.updateMany(
      { assignedTo: user._id },
      { $unset: { assignedTo: 1 } }
    );

    // Delete the user account
    await user.deleteOne();
  }

  // Delete team member record
  await teamMember.deleteOne();

  res.json(new ApiResponse(200, null, "Team member removed successfully"));
});

// POST /api/officials/message - Send message to team member
export const sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, message } = req.body;

  if (!recipientId || !message) {
    throw new ApiError(400, "recipientId and message are required");
  }

  // Find team member
  const teamMember = await TeamMember.findOne({
    _id: recipientId,
    addedBy: req.user._id,
  });

  if (!teamMember) {
    throw new ApiError(404, "Team member not found");
  }

  // Add message to team member record
  teamMember.messages.push({
    from: req.user._id,
    to: teamMember.userId,
    message,
    timestamp: new Date(),
    read: false,
  });

  await teamMember.save();

  res.status(201).json(
    new ApiResponse(
      201,
      {
        messageId: teamMember.messages[teamMember.messages.length - 1]._id,
        sent: true,
      },
      "Message sent successfully"
    )
  );
});

// GET /api/officials/messages/:memberId - Get message thread with team member
export const getMessages = asyncHandler(async (req, res) => {
  const { memberId } = req.params;

  const teamMember = await TeamMember.findOne({
    _id: memberId,
    addedBy: req.user._id,
  })
    .populate("userId", "username avatar")
    .populate("messages.from", "username avatar")
    .populate("messages.to", "username avatar");

  if (!teamMember) {
    throw new ApiError(404, "Team member not found");
  }

  res.json(
    new ApiResponse(
      200,
      {
        messages: teamMember.messages,
        member: {
          id: teamMember._id,
          name: teamMember.name,
          avatar:
            teamMember.userId?.avatar ||
            teamMember.name.slice(0, 2).toUpperCase(),
        },
      },
      "Messages fetched"
    )
  );
});

// PATCH /api/officials/messages/:memberId/mark-read - Mark messages as read
export const markMessagesRead = asyncHandler(async (req, res) => {
  const { memberId } = req.params;

  const teamMember = await TeamMember.findOne({
    _id: memberId,
    addedBy: req.user._id,
  });

  if (!teamMember) {
    throw new ApiError(404, "Team member not found");
  }

  // Mark all messages to this user as read
  teamMember.messages.forEach((msg) => {
    if (msg.to.toString() === req.user._id.toString()) {
      msg.read = true;
    }
  });

  await teamMember.save();

  res.json(new ApiResponse(200, null, "Messages marked as read"));
});

// PATCH /api/officials/settings - Update official settings
export const updateSettings = asyncHandler(async (req, res) => {
  const { department, notifications } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (department) {
    user.officialDetails = user.officialDetails || {};
    user.officialDetails.department = department;
  }

  await user.save();

  res.json(
    new ApiResponse(
      200,
      {
        settings: {
          department: user.officialDetails?.department || "",
          notifications: notifications || {},
        },
      },
      "Settings updated"
    )
  );
});

// GET /api/officials/analytics - Get analytics data
export const getAnalytics = asyncHandler(async (req, res) => {
  const { period = "month" } = req.query;

  const admin = isOfficialAdmin(req.user);
  const scopeQuery = admin ? {} : { assignedTo: req.user._id };

  // Get scoped issues for analytics
  const allIssues = await Issue.find(scopeQuery);
  const resolvedIssues = allIssues.filter((i) => i.status === "resolved");
  const pendingIssues = allIssues.filter((i) =>
    ["reported", "acknowledged", "in-progress"].includes(i.status)
  );

  // Category breakdown
  const categories = [
    "pothole",
    "streetlight",
    "garbage",
    "water",
    "traffic",
    "noise",
    "safety",
    "other",
  ];
  const categoryData = categories
    .map((cat) => {
      const count = allIssues.filter((i) => i.category === cat).length;
      return {
        category: cat.charAt(0).toUpperCase() + cat.slice(1),
        count,
        percentage:
          allIssues.length > 0
            ? Math.round((count / allIssues.length) * 100)
            : 0,
        color: `bg-${
          [
            "rose",
            "violet",
            "amber",
            "blue",
            "emerald",
            "orange",
            "red",
            "gray",
          ][categories.indexOf(cat)]
        }-500`,
      };
    })
    .filter((c) => c.count > 0);

  // Monthly data (last 6 months)
  const monthlyData = [];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.getMonth();
    const year = date.getFullYear();

    const reported = allIssues.filter((issue) => {
      const d = new Date(issue.createdAt);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;

    const resolved = resolvedIssues.filter((issue) => {
      const d = new Date(issue.updatedAt);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;

    monthlyData.push({ month: monthNames[month], reported, resolved });
  }

  const data = {
    overviewStats: [
      {
        title: "Total Issues",
        value: allIssues.length.toLocaleString(),
        change: "+12%",
        trend: "up",
        color: "rose",
      },
      {
        title: "Resolved",
        value: resolvedIssues.length.toLocaleString(),
        change: "+8%",
        trend: "up",
        color: "emerald",
      },
      {
        title: "Avg. Resolution Time",
        value: "2.4 days",
        change: "-15%",
        trend: "up",
        color: "violet",
      },
      {
        title: "Pending",
        value: pendingIssues.length.toLocaleString(),
        change: "+3%",
        trend: "down",
        color: "amber",
      },
    ],
    categoryData,
    monthlyData,
    departmentData: [
      {
        name: "Roads & Infrastructure",
        issues: Math.ceil(allIssues.length * 0.35),
        resolved: Math.ceil(resolvedIssues.length * 0.35),
        avgTime: "2.1 days",
      },
      {
        name: "Sanitation",
        issues: Math.ceil(allIssues.length * 0.25),
        resolved: Math.ceil(resolvedIssues.length * 0.25),
        avgTime: "1.5 days",
      },
      {
        name: "Electricity",
        issues: Math.ceil(allIssues.length * 0.2),
        resolved: Math.ceil(resolvedIssues.length * 0.2),
        avgTime: "3.2 days",
      },
      {
        name: "Water Supply",
        issues: Math.ceil(allIssues.length * 0.15),
        resolved: Math.ceil(resolvedIssues.length * 0.15),
        avgTime: "2.8 days",
      },
      {
        name: "Parks & Recreation",
        issues: Math.ceil(allIssues.length * 0.05),
        resolved: Math.ceil(resolvedIssues.length * 0.05),
        avgTime: "4.5 days",
      },
    ],
    period,
  };

  res.json(new ApiResponse(200, data, "Analytics data fetched"));
});

// ============== QUICK ACTIONS ==============

// POST /api/officials/quick-actions/work-order - Create work order
export const createWorkOrder = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    priority,
    workType,
    relatedIssueId,
    location,
    assignedToId,
    dueDate,
    estimatedDuration,
    resourcesRequired,
    notes,
  } = req.body;

  // Validate required fields
  if (!title || !description || !location?.address || !dueDate) {
    throw new ApiError(
      400,
      "Title, description, location address, and due date are required"
    );
  }

  // Build work order data
  const workOrderData = {
    title,
    description,
    priority: priority || "medium",
    workType: workType || "repair",
    location,
    dueDate: new Date(dueDate),
    estimatedDuration: estimatedDuration || 1,
    resourcesRequired: resourcesRequired || [],
    notes,
    createdBy: req.user._id,
    status: "pending",
  };

  // Link to issue if provided
  if (relatedIssueId) {
    const issue = await Issue.findById(relatedIssueId);
    if (issue) {
      workOrderData.relatedIssue = issue._id;
    }
  }

  // Assign to team member if provided
  if (assignedToId) {
    const assignee = await User.findById(assignedToId);
    if (assignee) {
      workOrderData.assignedTo = assignee._id;
      workOrderData.status = "assigned";
    }
  }

  const workOrder = await WorkOrder.create(workOrderData);

  // Populate for response
  const populatedWorkOrder = await WorkOrder.findById(workOrder._id)
    .populate("createdBy", "username email")
    .populate("assignedTo", "username email")
    .populate("relatedIssue", "issueId title");

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        populatedWorkOrder,
        "Work order created successfully"
      )
    );
});

// GET /api/officials/quick-actions/work-orders - Get all work orders
export const getWorkOrders = asyncHandler(async (req, res) => {
  const { status, priority, assignedTo, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [workOrders, total] = await Promise.all([
    WorkOrder.find(query)
      .populate("createdBy", "username email")
      .populate("assignedTo", "username email")
      .populate("relatedIssue", "issueId title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    WorkOrder.countDocuments(query),
  ]);

  res.json(
    new ApiResponse(
      200,
      {
        workOrders,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
      "Work orders fetched"
    )
  );
});

// PATCH /api/officials/quick-actions/work-orders/:id - Update work order
export const updateWorkOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const workOrder = await WorkOrder.findByIdAndUpdate(
    id,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  )
    .populate("createdBy", "username email")
    .populate("assignedTo", "username email")
    .populate("relatedIssue", "issueId title");

  if (!workOrder) {
    throw new ApiError(404, "Work order not found");
  }

  res.json(new ApiResponse(200, workOrder, "Work order updated"));
});

// POST /api/officials/quick-actions/inspection - Schedule inspection
export const scheduleInspection = asyncHandler(async (req, res) => {
  const {
    title,
    inspectionType,
    priority,
    relatedIssueId,
    relatedWorkOrderId,
    location,
    scheduledDate,
    estimatedDuration,
    assignedToId,
    instructions,
    checklist,
    siteContact,
  } = req.body;

  // Validate required fields
  if (!title || !location?.address || !scheduledDate) {
    throw new ApiError(
      400,
      "Title, location address, and scheduled date are required"
    );
  }

  // Build inspection data
  const inspectionData = {
    title,
    inspectionType: inspectionType || "site-visit",
    priority: priority || "medium",
    location,
    scheduledDate: new Date(scheduledDate),
    estimatedDuration: estimatedDuration || 60,
    instructions,
    checklist: checklist || [],
    siteContact,
    createdBy: req.user._id,
    status: "scheduled",
  };

  // Link to issue if provided
  if (relatedIssueId) {
    const issue = await Issue.findById(relatedIssueId);
    if (issue) {
      inspectionData.relatedIssue = issue._id;
    }
  }

  // Link to work order if provided
  if (relatedWorkOrderId) {
    const workOrder = await WorkOrder.findById(relatedWorkOrderId);
    if (workOrder) {
      inspectionData.relatedWorkOrder = workOrder._id;
    }
  }

  // Assign inspector if provided
  if (assignedToId) {
    const assignee = await User.findById(assignedToId);
    if (assignee) {
      inspectionData.assignedTo = assignee._id;
    }
  }

  const inspection = await Inspection.create(inspectionData);

  // Populate for response
  const populatedInspection = await Inspection.findById(inspection._id)
    .populate("createdBy", "username email")
    .populate("assignedTo", "username email")
    .populate("relatedIssue", "issueId title")
    .populate("relatedWorkOrder", "workOrderId title");

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        populatedInspection,
        "Inspection scheduled successfully"
      )
    );
});

// GET /api/officials/quick-actions/inspections - Get all inspections
export const getInspections = asyncHandler(async (req, res) => {
  const { status, priority, assignedTo, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [inspections, total] = await Promise.all([
    Inspection.find(query)
      .populate("createdBy", "username email")
      .populate("assignedTo", "username email")
      .populate("relatedIssue", "issueId title")
      .populate("relatedWorkOrder", "workOrderId title")
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Inspection.countDocuments(query),
  ]);

  res.json(
    new ApiResponse(
      200,
      {
        inspections,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
      "Inspections fetched"
    )
  );
});

// PATCH /api/officials/quick-actions/inspections/:id - Update inspection
export const updateInspection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const inspection = await Inspection.findByIdAndUpdate(
    id,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  )
    .populate("createdBy", "username email")
    .populate("assignedTo", "username email")
    .populate("relatedIssue", "issueId title");

  if (!inspection) {
    throw new ApiError(404, "Inspection not found");
  }

  res.json(new ApiResponse(200, inspection, "Inspection updated"));
});

// POST /api/officials/quick-actions/resources - Request resources
export const requestResources = asyncHandler(async (req, res) => {
  const {
    title,
    requestType,
    priority,
    relatedIssueId,
    relatedWorkOrderId,
    items,
    justification,
    deliveryLocation,
    requiredBy,
  } = req.body;

  // Validate required fields
  if (!title || !items || items.length === 0 || !justification || !requiredBy) {
    throw new ApiError(
      400,
      "Title, items, justification, and required date are required"
    );
  }

  // Calculate total estimated cost
  const totalEstimatedCost = items.reduce((sum, item) => {
    return sum + (item.estimatedCost || 0) * (item.quantity || 1);
  }, 0);

  // Build resource request data
  const resourceRequestData = {
    title,
    requestType: requestType || "materials",
    priority: priority || "medium",
    items: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || "units",
      estimatedCost: item.estimatedCost || 0,
      notes: item.notes,
    })),
    totalEstimatedCost,
    justification,
    deliveryLocation,
    requiredBy: new Date(requiredBy),
    requestedBy: req.user._id,
    status: "pending",
  };

  // Link to issue if provided
  if (relatedIssueId) {
    const issue = await Issue.findById(relatedIssueId);
    if (issue) {
      resourceRequestData.relatedIssue = issue._id;
    }
  }

  // Link to work order if provided
  if (relatedWorkOrderId) {
    const workOrder = await WorkOrder.findById(relatedWorkOrderId);
    if (workOrder) {
      resourceRequestData.relatedWorkOrder = workOrder._id;
    }
  }

  const resourceRequest = await ResourceRequest.create(resourceRequestData);

  // Populate for response
  const populatedRequest = await ResourceRequest.findById(resourceRequest._id)
    .populate("requestedBy", "username email")
    .populate("relatedIssue", "issueId title")
    .populate("relatedWorkOrder", "workOrderId title");

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        populatedRequest,
        "Resource request created successfully"
      )
    );
});

// GET /api/officials/quick-actions/resources - Get all resource requests
export const getResourceRequests = asyncHandler(async (req, res) => {
  const { status, priority, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [requests, total] = await Promise.all([
    ResourceRequest.find(query)
      .populate("requestedBy", "username email")
      .populate("reviewedBy", "username email")
      .populate("relatedIssue", "issueId title")
      .populate("relatedWorkOrder", "workOrderId title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    ResourceRequest.countDocuments(query),
  ]);

  res.json(
    new ApiResponse(
      200,
      {
        requests,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
      "Resource requests fetched"
    )
  );
});

// PATCH /api/officials/quick-actions/resources/:id - Review resource request
export const reviewResourceRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reviewNotes, approvedItems } = req.body;

  const updates = {
    status,
    reviewNotes,
    reviewedBy: req.user._id,
    reviewedAt: new Date(),
  };

  // Update approved quantities for each item
  if (approvedItems && Array.isArray(approvedItems)) {
    const request = await ResourceRequest.findById(id);
    if (request) {
      request.items = request.items.map((item, index) => ({
        ...item.toObject(),
        approved: approvedItems[index]?.approved || false,
        approvedQuantity: approvedItems[index]?.approvedQuantity || 0,
      }));
      await request.save();
    }
  }

  const resourceRequest = await ResourceRequest.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate("requestedBy", "username email")
    .populate("reviewedBy", "username email")
    .populate("relatedIssue", "issueId title");

  if (!resourceRequest) {
    throw new ApiError(404, "Resource request not found");
  }

  res.json(new ApiResponse(200, resourceRequest, "Resource request reviewed"));
});

// POST /api/officials/quick-actions/report - Generate report
export const generateReport = asyncHandler(async (req, res) => {
  const {
    title,
    reportType,
    dateRange: dateRangeInput,
    startDate: directStartDate,
    endDate: directEndDate,
    filters,
    format,
    includeCharts,
    notes,
  } = req.body;

  // Support both dateRange object and direct startDate/endDate
  const startDate = dateRangeInput?.startDate || directStartDate;
  const endDate = dateRangeInput?.endDate || directEndDate;

  // Validate required fields
  if (!reportType || !startDate || !endDate) {
    throw new ApiError(
      400,
      "Report type, start date, and end date are required"
    );
  }

  const dateRange = {
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  };

  // Build query for issues in date range
  const issueQuery = {
    createdAt: {
      $gte: dateRange.startDate,
      $lte: dateRange.endDate,
    },
  };

  // Apply filters if provided
  if (filters?.categories?.length) {
    issueQuery.category = { $in: filters.categories };
  }
  if (filters?.statuses?.length) {
    issueQuery.status = { $in: filters.statuses };
  }
  if (filters?.priorities?.length) {
    issueQuery.priority = { $in: filters.priorities };
  }

  // Get issues for report
  const issues = await Issue.find(issueQuery)
    .populate("reportedBy", "username")
    .populate("assignedTo", "username")
    .lean();

  // Calculate report data
  const totalIssues = issues.length;
  const resolved = issues.filter((i) => i.status === "resolved").length;
  const pending = issues.filter((i) =>
    ["reported", "acknowledged"].includes(i.status)
  ).length;
  const inProgress = issues.filter((i) => i.status === "in-progress").length;

  // Category breakdown
  const categoryMap = {};
  issues.forEach((issue) => {
    if (!categoryMap[issue.category]) {
      categoryMap[issue.category] = { count: 0, resolved: 0 };
    }
    categoryMap[issue.category].count++;
    if (issue.status === "resolved") {
      categoryMap[issue.category].resolved++;
    }
  });

  const categoryBreakdown = Object.entries(categoryMap).map(
    ([category, data]) => ({
      category,
      count: data.count,
      resolved: data.resolved,
      percentage:
        totalIssues > 0 ? Math.round((data.count / totalIssues) * 100) : 0,
    })
  );

  // Priority breakdown
  const priorityBreakdown = ["high", "medium", "low"].map((priority) => ({
    priority,
    count: issues.filter((i) => i.priority === priority).length,
    resolved: issues.filter(
      (i) => i.priority === priority && i.status === "resolved"
    ).length,
  }));

  // Status breakdown
  const statusBreakdown = [
    "reported",
    "acknowledged",
    "in-progress",
    "resolved",
    "rejected",
  ].map((status) => ({
    status,
    count: issues.filter((i) => i.status === status).length,
  }));

  // Top issues by upvotes
  const topIssues = issues
    .sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0))
    .slice(0, 10)
    .map((issue) => ({
      issueId: issue.issueId,
      title: issue.title,
      status: issue.status,
      upvotes: issue.upvotes?.length || 0,
    }));

  // Daily trends
  const dailyMap = {};
  issues.forEach((issue) => {
    const dateKey = new Date(issue.createdAt).toISOString().split("T")[0];
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = { reported: 0, resolved: 0 };
    }
    dailyMap[dateKey].reported++;
  });

  issues
    .filter((i) => i.status === "resolved" && i.updatedAt)
    .forEach((issue) => {
      const dateKey = new Date(issue.updatedAt).toISOString().split("T")[0];
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].resolved++;
      }
    });

  const dailyTrends = Object.entries(dailyMap)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Create report
  const reportData = {
    title: title || `${reportType} Report`,
    reportType,
    dateRange,
    filters: filters || {},
    format: format || "json",
    status: "completed",
    generatedBy: req.user._id,
    reportData: {
      summary: {
        totalIssues,
        resolved,
        pending,
        inProgress,
        avgResolutionTime: "2.4 days", // TODO: Calculate actual avg
      },
      categoryBreakdown,
      priorityBreakdown,
      statusBreakdown,
      topIssues,
      departmentPerformance: [],
      dailyTrends,
    },
    includeCharts: includeCharts !== false,
    notes,
    completedAt: new Date(),
  };

  const report = await GeneratedReport.create(reportData);

  // Populate for response
  const populatedReport = await GeneratedReport.findById(report._id).populate(
    "generatedBy",
    "username email"
  );

  res
    .status(201)
    .json(
      new ApiResponse(201, populatedReport, "Report generated successfully")
    );
});

// GET /api/officials/quick-actions/reports - Get generated reports
export const getGeneratedReports = asyncHandler(async (req, res) => {
  const { reportType, page = 1, limit = 20 } = req.query;

  const query = { generatedBy: req.user._id };
  if (reportType) query.reportType = reportType;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reports, total] = await Promise.all([
    GeneratedReport.find(query)
      .populate("generatedBy", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    GeneratedReport.countDocuments(query),
  ]);

  res.json(
    new ApiResponse(
      200,
      {
        reports,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
      "Reports fetched"
    )
  );
});

// GET /api/officials/quick-actions/reports/:id - Get single report
export const getReportById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await GeneratedReport.findById(id).populate(
    "generatedBy",
    "username email"
  );

  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  res.json(new ApiResponse(200, report, "Report fetched"));
});
