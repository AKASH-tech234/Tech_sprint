import Issue from '../models/Issue.js';
import { User } from '../models/userModel.js';

// GET /api/community/stats
export const getCommunityStats = async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const reported = await Issue.countDocuments({ status: 'reported' });
    const acknowledged = await Issue.countDocuments({ status: 'acknowledged' });
    const inProgress = await Issue.countDocuments({ status: 'in-progress' });
    const resolved = await Issue.countDocuments({ status: 'resolved' });

    // category breakdown
    const categoryAgg = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const monthlyAgg = await Issue.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
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
export const getCommunityLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);

    // Simple leaderboard: count verifications or reports per user and points
    // Here we use reportedBy + verifiedCount on issues to approximate contribution
    const agg = await Issue.aggregate([
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

    res.json({ leaderboard });
  } catch (err) {
    console.error('getCommunityLeaderboard error', err);
    res.status(500).json({ message: 'Failed to compute leaderboard' });
  }
};

export default { getCommunityStats, getCommunityLeaderboard };
