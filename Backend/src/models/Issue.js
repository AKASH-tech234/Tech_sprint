import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    issueId: {
      type: String,
      unique: true,
      required: true,
      default: () => `ISS-${Date.now()}`,
    },
    // District ID for area-scoped queries (format: "state__district", e.g., "maharashtra__mumbai")
    districtId: {
      type: String,
      index: true, // Index for efficient district-based queries
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "pothole",
        "streetlight",
        "garbage",
        "water",
        "traffic",
        "noise",
        "safety",
        "other",
      ],
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      required: true,
      enum: ["reported", "acknowledged", "in-progress", "resolved", "rejected"],
      default: "reported",
    },
    location: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      city: String,
      state: String,
      district: String,
    },
    images: [
      {
        type: String, // URLs to uploaded images
      },
    ],
    solutionPdf: {
  type: String, // URL or path to generated resolution PDF
},

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Community verification counts
    verifiedCount: {
      type: Number,
      default: 0,
    },
    incorrectCount: {
      type: Number,
      default: 0,
    },

    // Gamification fields
    gamification: {
      // Verification quorum status (minimum verifications needed)
      verificationQuorum: { type: Number, default: 3 },
      quorumMet: { type: Boolean, default: false },
      quorumMetAt: { type: Date },

      // Resolution tracking
      resolutionVerified: { type: Boolean, default: false },
      resolutionVerifiedAt: { type: Date },

      // After-photo tracking
      afterPhotoUploaded: { type: Boolean, default: false },
      afterPhotoUrl: { type: String },
      afterPhotoVerified: { type: Boolean, default: false },

      // Category accuracy (set by verification)
      categoryAccurate: { type: Boolean },

      // Reopened tracking (for penalties)
      wasReopened: { type: Boolean, default: false },
      reopenedCount: { type: Number, default: 0 },

      // Flag as fake/spam
      flaggedAsFake: { type: Boolean, default: false },
      flaggedAsSpam: { type: Boolean, default: false },

      // RP already awarded flags (idempotency)
      rpAwardedForResolution: { type: Boolean, default: false },
      rpAwardedForAfterPhoto: { type: Boolean, default: false },
      rpAwardedForCategorization: { type: Boolean, default: false },
      rpAwardedForCommunityConfirm: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
issueSchema.index({ "location.lat": 1, "location.lng": 1 });

export default mongoose.model("Issue", issueSchema);
