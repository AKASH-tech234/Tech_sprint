import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { requireOfficialAdmin } from '../utils/officialPermissions.js';
import {
  getOfficialStats,
  getAssignedIssues,
  assignIssue,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  sendMessage,
  getMessages,
  markMessagesRead,
  updateSettings,
  getAnalytics,
  createWorkOrder,
  scheduleInspection,
  requestResources,
  generateReport,
} from '../controllers/officialController.js';
import {
  getPendingReports,
  getReportDetails,
  reviewReport,
  getIssueReports
} from '../controllers/reportController.js';

const router = express.Router();

// All routes require authentication and official role
router.use(protect);
router.use(restrictTo('official'));

// Dashboard stats
router.get('/stats', getOfficialStats);

// Assigned issues
router.get('/assigned', getAssignedIssues);
router.patch('/assign/:issueId', requireOfficialAdmin, assignIssue);

// Team management
router.get('/team', requireOfficialAdmin, getTeamMembers);
router.post('/team', requireOfficialAdmin, addTeamMember);
router.delete('/team/:memberId', requireOfficialAdmin, removeTeamMember);

// Communication
router.post('/message', requireOfficialAdmin, sendMessage);
router.get('/messages/:memberId', requireOfficialAdmin, getMessages);
router.patch('/messages/:memberId/mark-read', requireOfficialAdmin, markMessagesRead);

// Settings
router.patch('/settings', updateSettings);

// Analytics
router.get('/analytics', getAnalytics);

// Report review (admin only)
router.get('/reports/pending', requireOfficialAdmin, getPendingReports);
router.get('/reports/:reportId', requireOfficialAdmin, getReportDetails);
router.post('/reports/:reportId/review', requireOfficialAdmin, reviewReport);
router.get('/reports/history/:issueId', requireOfficialAdmin, getIssueReports);

// Quick actions
router.post('/quick-actions/work-order', requireOfficialAdmin, createWorkOrder);
router.post('/quick-actions/inspection', requireOfficialAdmin, scheduleInspection);
router.post('/quick-actions/resources', requireOfficialAdmin, requestResources);
router.post('/quick-actions/report', requireOfficialAdmin, generateReport);

export default router;
