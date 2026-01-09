import mongoose from 'mongoose';

/**
 * CommunityChat Model
 * District-based chat messages for community members
 * Each message belongs to a specific district
 */
const communityChatSchema = new mongoose.Schema({
  // District ID (format: "state__district", e.g., "maharashtra__mumbai")
  districtId: {
    type: String,
    required: true,
    index: true
  },
  // Sender information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Message content
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  // Message type
  type: {
    type: String,
    enum: ['text', 'image', 'issue_share', 'system'],
    default: 'text'
  },
  // Reference to shared issue (if type is issue_share)
  sharedIssue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  },
  // Image URL (if type is image)
  imageUrl: {
    type: String
  },
  // Read status tracking (array of user IDs who have read)
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reaction: {
      type: String,
      enum: ['like', 'helpful', 'support']
    }
  }],
  // Flag for deleted messages (soft delete)
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for efficient district + time queries
communityChatSchema.index({ districtId: 1, createdAt: -1 });

// Index for unread message queries
communityChatSchema.index({ districtId: 1, readBy: 1 });

export default mongoose.model('CommunityChat', communityChatSchema);
