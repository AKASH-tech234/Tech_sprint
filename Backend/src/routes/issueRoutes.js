import express from 'express';
import {
  createIssue,
  getMyIssues,
  getRecentIssues,
  getMapIssues,
  getNearbyIssues,
  upvoteIssue,
  deleteIssue
} from '../controllers/issueController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadIssueImages } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Issue CRUD
router.post('/create', uploadIssueImages, createIssue);
router.get('/my-issues', getMyIssues);
router.get('/recent', getRecentIssues);
router.get('/map', getMapIssues);
router.get('/nearby', getNearbyIssues);

// Issue actions
router.post('/:issueId/upvote', upvoteIssue);
router.delete('/:issueId', deleteIssue);

export default router;