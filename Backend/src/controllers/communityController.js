import Issue from '../models/Issue.js';
import { User } from '../models/userModel.js';
import CommunityChat from '../models/CommunityChat.js';

// GET /api/community/stats
// Supports district filtering via query param ?districtId=state__district
export const getCommunityStats = async (req, res) => {
  try {
    const { districtId } = req.query;
    
    console.log('📊 [CommunityStats] Request received');
    console.log('📊 [CommunityStats] District ID:', districtId || 'ALL');
    
    // Build query filter
    const filter = districtId ? { districtId } : {};
    
    const totalIssues = await Issue.countDocuments(filter);
    const reported = await Issue.countDocuments({ ...filter, status: 'reported' });
    const acknowledged = await Issue.countDocuments({ ...filter, status: 'acknowledged' });
    const inProgress = await Issue.countDocuments({ ...filter, status: 'in-progress' });
    const resolved = await Issue.countDocuments({ ...filter, status: 'resolved' });

    console.log('📊 [CommunityStats] Totals:', { totalIssues, reported, acknowledged, inProgress, resolved });

    // category breakdown
    const categoryAgg = await Issue.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const monthlyAgg = await Issue.aggregate([
      { $match: { ...filter, createdAt: { $gte: sixMonthsAgo } } },
      { $project: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, status: 1 } },
      { $group: { _id: { year: '$year', month: '$month', status: '$status' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // reshape monthlyAgg into an array of { month, reported, resolved }
    const monthsMap = {};
    monthlyAgg.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      monthsMap[key] = monthsMap[key] || { month: item._id.month, reported: 0, resolved: 0 };
      if (item._id.status === 'reported') monthsMap[key].reported = item.count;
      if (item._id.status === 'resolved') monthsMap[key].resolved = item.count;
    });

    const monthlyTrend = Object.values(monthsMap).slice(-6).map(m => ({
      month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m.month - 1] || m.month,
      reported: m.reported || 0,
      resolved: m.resolved || 0
    }));

    res.json({
      districtId: districtId || 'all',
      overviewStats: {
        totalIssues,
        reported,
        acknowledged,
        inProgress,
        resolved
      },
      categoryBreakdown: categoryAgg.map(c => ({ category: c._id, count: c.count })),
      monthlyTrend
    });
  } catch (err) {
    console.error('getCommunityStats error', err);
    res.status(500).json({ message: 'Failed to compute community stats' });
  }
};

// GET /api/community/leaderboard
// Supports district filtering via query param ?districtId=state__district
export const getCommunityLeaderboard = async (req, res) => {
  try {
    const { districtId } = req.query;
    const limit = parseInt(req.query.limit || '10', 10);

    // Build query filter for district-scoped leaderboard
    const matchStage = districtId ? { $match: { districtId } } : { $match: {} };

    // Simple leaderboard: count verifications or reports per user and points
    // Here we use reportedBy + verifiedCount on issues to approximate contribution
    const agg = await Issue.aggregate([
      matchStage,
      { $group: { _id: '$reportedBy', reports: { $sum: 1 }, verifications: { $sum: '$verifiedCount' } } },
      { $sort: { verifications: -1, reports: -1 } },
      { $limit: limit }
    ]);

    const ids = agg.map(a => a._id).filter(Boolean);
    const users = await User.find({ _id: { $in: ids } }).select('username displayName avatar').lean();

    const leaderboard = agg.map((a, idx) => {
      const u = users.find(x => x._id.toString() === a._id.toString()) || {};
      return {
        rank: idx + 1,
        id: a._id,
        name: u.displayName || u.username || 'User',
        points: (a.verifications || 0) * 10 + (a.reports || 0),
        verifications: a.verifications || 0,
        avatar: u.avatar || null
      };
    });

    res.json({ districtId: districtId || 'all', leaderboard });
  } catch (err) {
    console.error('getCommunityLeaderboard error', err);
    res.status(500).json({ message: 'Failed to compute leaderboard' });
  }
};

// GET /api/community/issues
// Get district-specific issues for community section
export const getCommunityIssues = async (req, res) => {
  try {
    const { districtId, status, category, limit = 50 } = req.query;
    
    console.log('📋 [CommunityIssues] Request received');
    console.log('📋 [CommunityIssues] Params:', { districtId: districtId || 'ALL', status, category, limit });
    
    const filter = {};
    if (districtId) filter.districtId = districtId;
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    
    console.log('📋 [CommunityIssues] Filter:', filter);
    
    const issues = await Issue.find(filter)
      .populate('reportedBy', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    console.log('📋 [CommunityIssues] Found:', issues.length, 'issues');
    
    res.json({
      districtId: districtId || 'all',
      issues,
      total: issues.length
    });
  } catch (err) {
    console.error('getCommunityIssues error', err);
    res.status(500).json({ message: 'Failed to fetch community issues' });
  }
};

// GET /api/community/chat
// Get community chat messages for a district
export const getCommunityChat = async (req, res) => {
  try {
    const { districtId, limit = 100, before } = req.query;
    
    if (!districtId) {
      return res.status(400).json({ message: 'districtId is required' });
    }
    
    const filter = { districtId, isDeleted: { $ne: true } };
    if (before) {
      filter.createdAt = { $lt: new Date(before) };
    }
    
    const messages = await CommunityChat.find(filter)
      .populate('sender', 'username avatar displayName')
      .populate('sharedIssue', 'title issueId category status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Return in chronological order (oldest first)
    res.json({
      districtId,
      messages: messages.reverse(),
      hasMore: messages.length === parseInt(limit)
    });
  } catch (err) {
    console.error('getCommunityChat error', err);
    res.status(500).json({ message: 'Failed to fetch community chat' });
  }
};

// POST /api/community/chat
// Send a message to district community chat
export const sendCommunityMessage = async (req, res) => {
  try {
    const { districtId, message, type = 'text', sharedIssueId, imageUrl } = req.body;
    
    if (!districtId) {
      return res.status(400).json({ message: 'districtId is required' });
    }
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    const chatMessage = await CommunityChat.create({
      districtId,
      sender: req.user._id,
      message: message.trim(),
      type,
      sharedIssue: type === 'issue_share' ? sharedIssueId : undefined,
      imageUrl: type === 'image' ? imageUrl : undefined,
      readBy: [req.user._id]  // Sender has read their own message
    });
    
    await chatMessage.populate('sender', 'username avatar displayName');
    if (chatMessage.sharedIssue) {
      await chatMessage.populate('sharedIssue', 'title issueId category status');
    }
    
    res.status(201).json({
      message: chatMessage,
      success: true
    });
  } catch (err) {
    console.error('sendCommunityMessage error', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// POST /api/community/chat/:messageId/react
// Add reaction to a chat message
export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reaction } = req.body;
    
    if (!['like', 'helpful', 'support'].includes(reaction)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }
    
    const chatMessage = await CommunityChat.findById(messageId);
    if (!chatMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user already reacted
    const existingReaction = chatMessage.reactions.find(
      r => r.user.toString() === req.user._id.toString()
    );
    
    if (existingReaction) {
      // Update existing reaction
      existingReaction.reaction = reaction;
    } else {
      // Add new reaction
      chatMessage.reactions.push({ user: req.user._id, reaction });
    }
    
    await chatMessage.save();
    
    res.json({ success: true, reactions: chatMessage.reactions });
  } catch (err) {
    console.error('reactToMessage error', err);
    res.status(500).json({ message: 'Failed to react to message' });
  }
};

// GET /api/community/heatmap
// Get heatmap data for a specific district
export const getDistrictHeatmap = async (req, res) => {
  try {
    const { districtId, status, category } = req.query;
    
    const filter = {};
    if (districtId) filter.districtId = districtId;
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    
    const issues = await Issue.find(filter)
      .select('issueId title category status priority location districtId createdAt')
      .lean();
    
    // Transform for heatmap
    const heatmapPoints = issues
      .filter(i => i.location?.lat && i.location?.lng)
      .map(i => ({
        lat: i.location.lat,
        lng: i.location.lng,
        weight: i.priority === 'high' ? 1.0 : i.priority === 'medium' ? 0.6 : 0.3,
        issue: {
          id: i._id,
          issueId: i.issueId,
          title: i.title,
          category: i.category,
          status: i.status,
          priority: i.priority
        }
      }));
    
    res.json({
      districtId: districtId || 'all',
      points: heatmapPoints,
      total: heatmapPoints.length
    });
  } catch (err) {
    console.error('getDistrictHeatmap error', err);
    res.status(500).json({ message: 'Failed to fetch heatmap data' });
  }
};

export default { 
  getCommunityStats, 
  getCommunityLeaderboard,
  getCommunityIssues,
  getCommunityChat,
  sendCommunityMessage,
  reactToMessage,
  getDistrictHeatmap
};
