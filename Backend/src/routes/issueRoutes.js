import express from 'express';
import {
  createIssue,
  getMyIssues,
  getRecentIssues,
  getAllIssues,
  getMapIssues,
  getNearbyIssues,
  upvoteIssue,
  deleteIssue,
  getIssue,
  updateIssue
} from '../controllers/issueController.js';
import { submitReport, getIssueReports } from '../controllers/reportController.js';
import { protect, requireProfileComplete, restrictTo } from '../middleware/authMiddleware.js';
import { uploadIssueImages } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Issue CRUD - citizens must have complete profile to create
router.post('/create', restrictTo('citizen'), requireProfileComplete, uploadIssueImages, createIssue);
router.get('/my-issues', getMyIssues);
router.get('/recent', getRecentIssues);
router.get('/all', getAllIssues); // Must be before /:issueId
router.get('/map', getMapIssues);
router.get('/nearby', getNearbyIssues);
router.get('/:issueId', getIssue);
router.put('/:issueId', uploadIssueImages, updateIssue);
router.delete('/:issueId', deleteIssue);

// Issue actions
router.post('/:issueId/upvote', upvoteIssue);

// Report submission and retrieval (for team members)
router.post('/:issueId/reports', uploadIssueImages, submitReport);
router.get('/:issueId/reports', getIssueReports);

export default router;