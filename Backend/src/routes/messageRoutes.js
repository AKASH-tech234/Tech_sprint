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
import { protect } from "../middleware/authMiddleware.js";


const router = express.Router();

router.get("/:userId", protect, async (req, res) => {

  try {
    const myId = req.user._id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: otherUserId },
        { sender: otherUserId, receiver: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
});

export default router;
