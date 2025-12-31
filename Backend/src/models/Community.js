// src/models/Community.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  type: {
    type: String,
    enum: ["text", "image", "announcement"],
    default: "text",
  },
  attachments: [
    {
      type: String, // URL to uploaded files
    },
  ],
  readBy: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    district: {
      name: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
    },
    // Auto-generated unique identifier based on district
    districtCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Community leader/moderator (community role user for this district)
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // All members who joined this community
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["member", "moderator", "leader"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Chat messages for this community
    messages: [messageSchema],
    // Community stats
    stats: {
      totalMembers: {
        type: Number,
        default: 0,
      },
      totalIssuesReported: {
        type: Number,
        default: 0,
      },
      totalIssuesResolved: {
        type: Number,
        default: 0,
      },
      activeThisMonth: {
        type: Number,
        default: 0,
      },
    },
    // Settings
    settings: {
      isPublic: {
        type: Boolean,
        default: true,
      },
      allowJoin: {
        type: Boolean,
        default: true,
      },
      requireApproval: {
        type: Boolean,
        default: false,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient district lookup
communitySchema.index({ "district.state": 1, "district.name": 1 });

// Static method to generate district code
communitySchema.statics.generateDistrictCode = function (state, district) {
  const stateCode = state.substring(0, 3).toUpperCase().replace(/\s/g, "");
  const districtCode = district
    .substring(0, 5)
    .toUpperCase()
    .replace(/\s/g, "");
  return `${stateCode}-${districtCode}`;
};

// Static method to find or create community for a district
communitySchema.statics.findOrCreateForDistrict = async function (
  state,
  district
) {
  const districtCode = this.generateDistrictCode(state, district);

  let community = await this.findOne({ districtCode });

  if (!community) {
    community = await this.create({
      name: `${district} Community`,
      description: `Official community for ${district} district, ${state}`,
      district: {
        name: district,
        state: state,
      },
      districtCode: districtCode,
    });
  }

  return community;
};

// Method to add member
communitySchema.methods.addMember = async function (userId, role = "member") {
  const existingMember = this.members.find(
    (m) => m.user.toString() === userId.toString()
  );

  if (existingMember) {
    return { alreadyMember: true };
  }

  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date(),
  });

  this.stats.totalMembers = this.members.length;
  await this.save();

  return { alreadyMember: false };
};

// Method to remove member
communitySchema.methods.removeMember = async function (userId) {
  const memberIndex = this.members.findIndex(
    (m) => m.user.toString() === userId.toString()
  );

  if (memberIndex === -1) {
    return { notMember: true };
  }

  this.members.splice(memberIndex, 1);
  this.stats.totalMembers = this.members.length;
  await this.save();

  return { notMember: false };
};

// Method to add message
communitySchema.methods.addMessage = async function (
  senderId,
  content,
  type = "text"
) {
  const message = {
    sender: senderId,
    content: content,
    type: type,
    createdAt: new Date(),
  };

  this.messages.push(message);

  // Keep only last 500 messages in the document for performance
  if (this.messages.length > 500) {
    this.messages = this.messages.slice(-500);
  }

  await this.save();

  return message;
};

const Community = mongoose.model("Community", communitySchema);

export default Community;
