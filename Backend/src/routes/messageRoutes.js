// import express from "express";
// import Message from "../models/message.js";

// const router = express.Router();

// // fetch chat between logged-in user and another user
// router.get("/:userId", async (req, res) => {
//   try {
//     const myId = req.user._id;
//     const otherUserId = req.params.userId;

//     const messages = await Message.find({
//       $or: [
//         { sender: myId, receiver: otherUserId },
//         { sender: otherUserId, receiver: myId },
//       ],
//     }).sort({ createdAt: 1 });

//     res.status(200).json({
//       success: true,
//       messages,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch messages",
//     });
//   }
// });

// export default router;










import express from "express";
import Message from "../models/message.js";
import { User } from "../models/userModel.js";
import { TeamMember } from "../models/TeamMember.js";
import { protect } from "../middleware/authMiddleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { isOfficialAdmin } from "../utils/officialPermissions.js";

const router = express.Router();

// GET /api/messages/conversations - Get all conversations for current user
router.get("/conversations", protect, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const isAdmin = isOfficialAdmin(req.user);

  let conversations = [];

  if (isAdmin) {
    // Team leader sees all their team members as conversations
    const teamMembers = await TeamMember.find({ addedBy: userId, status: 'active' })
      .populate('userId', 'username email avatar isActive');

    for (const member of teamMembers) {
      // Skip if no valid userId
      const memberUserId = member.userId?._id || member.userId;
      if (!memberUserId) continue;

      // Get last message
      const lastMessage = await Message.findOne({
        $or: [
          { sender: userId, receiver: memberUserId },
          { sender: memberUserId, receiver: userId }
        ]
      }).sort({ createdAt: -1 });

      // Count unread messages
      const unreadCount = await Message.countDocuments({
        sender: memberUserId,
        receiver: userId,
        read: false
      });

      conversations.push({
        recipientId: memberUserId.toString(),
        name: member.name,
        email: member.email,
        avatar: member.userId?.avatar || member.name?.slice(0, 2).toUpperCase(),
        role: member.designation,
        lastMessage: lastMessage?.message || null,
        lastMessageTime: lastMessage?.createdAt || member.createdAt,
        unreadCount,
        isOnline: member.userId?.isActive || false,
      });
    }
  } else {
    // Team member sees their team leader as conversation
    const teamMember = await TeamMember.findOne({ userId: userId })
      .populate('addedBy', 'username email avatar isActive');

    if (teamMember && teamMember.addedBy) {
      const leader = teamMember.addedBy;
      
      // Get last message
      const lastMessage = await Message.findOne({
        $or: [
          { sender: userId, receiver: leader._id },
          { sender: leader._id, receiver: userId }
        ]
      }).sort({ createdAt: -1 });

      // Count unread messages
      const unreadCount = await Message.countDocuments({
        sender: leader._id,
        receiver: userId,
        read: false
      });

      conversations.push({
        recipientId: leader._id.toString(),
        name: leader.username,
        email: leader.email,
        avatar: leader.avatar || leader.username?.slice(0, 2).toUpperCase(),
        role: 'Team Leader',
        lastMessage: lastMessage?.message || null,
        lastMessageTime: lastMessage?.createdAt || teamMember.createdAt,
        unreadCount,
        isOnline: leader.isActive || false,
      });
    }
  }

  // Sort by last message time
  conversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

  res.json(new ApiResponse(200, { conversations }, 'Conversations fetched successfully'));
}));

// GET /api/messages/:userId - Get messages with a specific user
router.get("/:userId", protect, asyncHandler(async (req, res) => {
  const myId = req.user._id;
  const otherUserId = req.params.userId;

  const messages = await Message.find({
    $or: [
      { sender: myId, receiver: otherUserId },
      { sender: otherUserId, receiver: myId },
    ],
  })
    .populate('sender', 'username avatar')
    .populate('receiver', 'username avatar')
    .sort({ createdAt: 1 });

  // Transform messages to consistent format
  const formattedMessages = messages.map(msg => ({
    _id: msg._id,
    from: { _id: msg.sender?._id, username: msg.sender?.username, avatar: msg.sender?.avatar },
    to: { _id: msg.receiver?._id, username: msg.receiver?.username, avatar: msg.receiver?.avatar },
    message: msg.message,
    timestamp: msg.createdAt,
    read: msg.read || false,
  }));

  res.status(200).json({
    success: true,
    messages: formattedMessages,
  });
}));

// POST /api/messages/send - Send a message
router.post("/send", protect, asyncHandler(async (req, res) => {
  const { receiverId, message } = req.body;
  const senderId = req.user._id;

  if (!receiverId || !message) {
    throw new ApiError(400, 'receiverId and message are required');
  }

  const newMessage = await Message.create({
    sender: senderId,
    receiver: receiverId,
    message,
    read: false,
  });

  await newMessage.populate('sender', 'username avatar');
  await newMessage.populate('receiver', 'username avatar');

  res.status(201).json(new ApiResponse(201, {
    _id: newMessage._id,
    from: { _id: newMessage.sender._id, username: newMessage.sender.username },
    to: { _id: newMessage.receiver._id, username: newMessage.receiver.username },
    message: newMessage.message,
    timestamp: newMessage.createdAt,
    read: newMessage.read,
  }, 'Message sent successfully'));
}));

// PATCH /api/messages/:userId/mark-read - Mark messages from a user as read
router.patch("/:userId/mark-read", protect, asyncHandler(async (req, res) => {
  const myId = req.user._id;
  const otherUserId = req.params.userId;

  await Message.updateMany(
    { sender: otherUserId, receiver: myId, read: false },
    { read: true }
  );

  res.json(new ApiResponse(200, null, 'Messages marked as read'));
}));

export default router;
