// Backend/src/routes/communityRoutes.js
import express from "express";
import {
  getCommunities,
  getCommunityByCode,
  joinCommunity,
  leaveCommunity,
  getMyCommunitites,
  getCommunityMessages,
  sendCommunityMessage,
  getCommunityMembers,
} from "../controllers/communityController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Community routes
router.get("/", getCommunities);
router.get("/my", getMyCommunitites);
router.get("/:districtCode", getCommunityByCode);
router.post("/:id/join", joinCommunity);
router.post("/:id/leave", leaveCommunity);

// Chat routes
router.get("/:districtCode/messages", getCommunityMessages);
router.post("/:districtCode/messages", sendCommunityMessage);
router.get("/:districtCode/members", getCommunityMembers);

export default router;
