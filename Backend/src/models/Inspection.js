import mongoose from "mongoose";

const inspectionSchema = new mongoose.Schema(
  {
    // Unique inspection ID
    inspectionId: {
      type: String,
      unique: true,
      required: true,
      default: () => `INSP-${Date.now()}`,
    },

    // Title/purpose of inspection
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // Type of inspection
    inspectionType: {
      type: String,
      required: true,
      enum: [
        "site-visit",
        "quality-check",
        "progress-review",
        "safety-audit",
        "follow-up",
        "pre-work",
        "post-work",
      ],
      default: "site-visit",
    },

    // Priority
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Status
    status: {
      type: String,
      required: true,
      enum: [
        "scheduled",
        "in-progress",
        "completed",
        "cancelled",
        "rescheduled",
      ],
      default: "scheduled",
    },

    // Related issue (optional)
    relatedIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
    },

    // Related work order (optional)
    relatedWorkOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkOrder",
    },

    // Location
    location: {
      address: { type: String, required: true },
      lat: { type: Number },
      lng: { type: Number },
      landmark: { type: String },
    },

    // Scheduled date and time
    scheduledDate: {
      type: Date,
      required: true,
    },

    // Duration in minutes
    estimatedDuration: {
      type: Number,
      default: 60,
    },

    // Inspector assigned
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Created by
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Special instructions
    instructions: {
      type: String,
      maxlength: 1000,
    },

    // Checklist items
    checklist: [
      {
        item: String,
        completed: { type: Boolean, default: false },
        notes: String,
      },
    ],

    // Contact person at site
    siteContact: {
      name: String,
      phone: String,
    },

    // Completion details
    completedAt: Date,

    // Findings/report
    findings: {
      type: String,
      maxlength: 2000,
    },

    // Condition rating
    conditionRating: {
      type: String,
      enum: ["excellent", "good", "fair", "poor", "critical"],
    },

    // Action required
    actionRequired: {
      type: Boolean,
      default: false,
    },

    // Follow-up needed
    followUpRequired: {
      type: Boolean,
      default: false,
    },

    followUpDate: Date,

    // Photos from inspection
    photos: [
      {
        type: String, // URLs
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
inspectionSchema.index({ status: 1, scheduledDate: 1 });
inspectionSchema.index({ assignedTo: 1, status: 1 });
inspectionSchema.index({ createdBy: 1 });

export default mongoose.model("Inspection", inspectionSchema);
