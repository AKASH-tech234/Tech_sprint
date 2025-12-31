// Backend/src/controllers/communityController.js
import Community from "../models/Community.js";
import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

// @desc    Get all communities with optional filters
// @route   GET /api/communities
// @access  Private
export const getCommunities = asyncHandler(async (req, res) => {
  console.log("🏘️ [Backend] Get communities request");
  const { state, district, page = 1, limit = 20 } = req.query;

  const query = { isActive: true };

  if (state) {
    query["district.state"] = state;
  }

  if (district) {
    query["district.name"] = district;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const communities = await Community.find(query)
    .select("-messages")
    .populate("leader", "username avatar")
    .sort({ "stats.totalMembers": -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Community.countDocuments(query);

  // Add isJoined flag for current user
  const userId = req.user.id;
  const communitiesWithJoinStatus = communities.map((c) => {
    const community = c.toObject();
    community.isJoined = c.members.some((m) => m.user.toString() === userId);
    return community;
  });

  res.json(
    new ApiResponse(
      200,
      {
        communities: communitiesWithJoinStatus,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Communities fetched successfully"
    )
  );
});

// @desc    Get community by district code
// @route   GET /api/communities/:districtCode
// @access  Private
export const getCommunityByCode = asyncHandler(async (req, res) => {
  const { districtCode } = req.params;
  console.log("🏘️ [Backend] Get community by code:", districtCode);

  const community = await Community.findOne({ districtCode })
    .populate("leader", "username avatar")
    .populate("members.user", "username avatar");

  if (!community) {
    throw new ApiError(404, "Community not found");
  }

  // Add isJoined flag
  const communityObj = community.toObject();
  communityObj.isJoined = community.members.some(
    (m) => m.user._id.toString() === req.user.id
  );

  res.json(
    new ApiResponse(200, communityObj, "Community fetched successfully")
  );
});

// @desc    Join a community
// @route   POST /api/communities/:id/join
// @access  Private
export const joinCommunity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  console.log("🏘️ [Backend] Join community:", id, "User:", userId);

  const community = await Community.findById(id);
  if (!community) {
    throw new ApiError(404, "Community not found");
  }

  if (!community.settings.allowJoin) {
    throw new ApiError(403, "This community is not accepting new members");
  }

  const result = await community.addMember(userId);

  if (result.alreadyMember) {
    throw new ApiError(400, "You are already a member of this community");
  }

  // Update user's joinedCommunities
  await User.findByIdAndUpdate(userId, {
    $addToSet: {
      joinedCommunities: {
        communityId: community._id,
        joinedAt: new Date(),
      },
    },
  });

  console.log("✅ [Backend] User joined community successfully");
  res.json(
    new ApiResponse(200, { joined: true }, "Joined community successfully")
  );
});

// @desc    Leave a community
// @route   POST /api/communities/:id/leave
// @access  Private
export const leaveCommunity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  console.log("🏘️ [Backend] Leave community:", id, "User:", userId);

  const community = await Community.findById(id);
  if (!community) {
    throw new ApiError(404, "Community not found");
  }

  // Check if user is the leader
  if (community.leader && community.leader.toString() === userId) {
    throw new ApiError(
      400,
      "Community leaders cannot leave. Transfer leadership first."
    );
  }

  const result = await community.removeMember(userId);

  if (result.notMember) {
    throw new ApiError(400, "You are not a member of this community");
  }

  // Update user's joinedCommunities
  await User.findByIdAndUpdate(userId, {
    $pull: {
      joinedCommunities: { communityId: community._id },
    },
  });

  console.log("✅ [Backend] User left community successfully");
  res.json(new ApiResponse(200, { left: true }, "Left community successfully"));
});

// @desc    Get user's joined communities
// @route   GET /api/communities/my
// @access  Private
export const getMyCommunitites = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  console.log("🏘️ [Backend] Get my communities for user:", userId);

  const user = await User.findById(userId).populate({
    path: "joinedCommunities.communityId",
    select: "-messages",
    populate: { path: "leader", select: "username avatar" },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const communities = user.joinedCommunities
    .filter((jc) => jc.communityId) // Filter out deleted communities
    .map((jc) => ({
      ...jc.communityId.toObject(),
      joinedAt: jc.joinedAt,
      isJoined: true,
    }));

  res.json(
    new ApiResponse(200, { communities }, "My communities fetched successfully")
  );
});

// @desc    Get community messages (chat)
// @route   GET /api/communities/:districtCode/messages
// @access  Private
export const getCommunityMessages = asyncHandler(async (req, res) => {
  const { districtCode } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.user.id;
  console.log("💬 [Backend] Get community messages:", districtCode);

  const community = await Community.findOne({ districtCode });
  if (!community) {
    throw new ApiError(404, "Community not found");
  }

  // Check if user is a member
  const isMember = community.members.some((m) => m.user.toString() === userId);
  if (!isMember) {
    throw new ApiError(403, "You must be a member to view messages");
  }

  // Get messages with pagination (most recent first, then reverse for display)
  const start = Math.max(
    0,
    community.messages.length - parseInt(page) * parseInt(limit)
  );
  const end =
    community.messages.length - (parseInt(page) - 1) * parseInt(limit);
  const messages = community.messages.slice(start, end);

  // Populate sender info
  const populatedMessages = await Promise.all(
    messages.map(async (msg) => {
      const sender = await User.findById(msg.sender).select("username avatar");
      return {
        id: msg._id,
        type: msg.type,
        content: msg.content,
        createdAt: msg.createdAt,
        sender: sender
          ? {
              id: sender._id,
              name: sender.username,
              avatar: sender.avatar,
            }
          : {
              id: msg.sender,
              name: "Unknown User",
              avatar: null,
            },
      };
    })
  );

  res.json(
    new ApiResponse(
      200,
      {
        messages: populatedMessages,
        hasMore: start > 0,
      },
      "Messages fetched successfully"
    )
  );
});

// @desc    Send a message to community chat
// @route   POST /api/communities/:districtCode/messages
// @access  Private
export const sendCommunityMessage = asyncHandler(async (req, res) => {
  const { districtCode } = req.params;
  const { content, type = "text" } = req.body;
  const userId = req.user.id;
  console.log("💬 [Backend] Send community message:", districtCode);

  if (!content || !content.trim()) {
    throw new ApiError(400, "Message content is required");
  }

  const community = await Community.findOne({ districtCode });
  if (!community) {
    throw new ApiError(404, "Community not found");
  }

  // Check if user is a member
  const member = community.members.find((m) => m.user.toString() === userId);
  if (!member) {
    throw new ApiError(403, "You must be a member to send messages");
  }

  // Only leaders/moderators can send announcements
  if (
    type === "announcement" &&
    !["leader", "moderator"].includes(member.role)
  ) {
    throw new ApiError(
      403,
      "Only leaders and moderators can send announcements"
    );
  }

  const message = await community.addMessage(userId, content.trim(), type);

  // Get sender info
  const sender = await User.findById(userId).select("username avatar");

  const responseMessage = {
    id: message._id || Date.now(),
    type: message.type,
    content: message.content,
    createdAt: message.createdAt,
    sender: {
      id: sender._id,
      name: sender.username,
      avatar: sender.avatar,
      role: member.role,
    },
  };

  console.log("✅ [Backend] Message sent successfully");
  res
    .status(201)
    .json(new ApiResponse(201, responseMessage, "Message sent successfully"));
});

// @desc    Get community members
// @route   GET /api/communities/:districtCode/members
// @access  Private
export const getCommunityMembers = asyncHandler(async (req, res) => {
  const { districtCode } = req.params;
  console.log("👥 [Backend] Get community members:", districtCode);

  const community = await Community.findOne({ districtCode }).populate(
    "members.user",
    "username avatar email"
  );

  if (!community) {
    throw new ApiError(404, "Community not found");
  }

  const members = community.members.map((m) => ({
    id: m.user._id,
    name: m.user.username,
    avatar: m.user.avatar,
    role: m.role,
    joinedAt: m.joinedAt,
  }));

  res.json(new ApiResponse(200, { members }, "Members fetched successfully"));
});
