import mongoose from "mongoose";

const workOrderSchema = new mongoose.Schema(
  {
    // Unique work order ID
    workOrderId: {
      type: String,
      unique: true,
      required: true,
      default: () => `WO-${Date.now()}`,
    },

    // Title of the work order
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // Detailed description
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    // Priority level
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Status of work order
    status: {
      type: String,
      required: true,
      enum: ["pending", "assigned", "in-progress", "completed", "cancelled"],
      default: "pending",
    },

    // Type of work
    workType: {
      type: String,
      required: true,
      enum: [
        "repair",
        "maintenance",
        "installation",
        "inspection",
        "cleanup",
        "other",
      ],
      default: "repair",
    },

    // Related issue (optional)
    relatedIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
    },

    // Location details
    location: {
      address: { type: String, required: true },
      lat: { type: Number },
      lng: { type: Number },
      landmark: { type: String },
    },

    // Assigned team/person
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

    // Due date
    dueDate: {
      type: Date,
      required: true,
    },

    // Estimated duration (in hours)
    estimatedDuration: {
      type: Number,
      default: 1,
    },

    // Resources required
    resourcesRequired: [
      {
        name: String,
        quantity: Number,
        unit: String,
      },
    ],

    // Notes/instructions
    notes: {
      type: String,
      maxlength: 1000,
    },

    // Completion details
    completedAt: Date,
    completionNotes: String,

    // Photos for completion proof
    completionPhotos: [
      {
        type: String, // URLs
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
workOrderSchema.index({ status: 1, dueDate: 1 });
workOrderSchema.index({ assignedTo: 1, status: 1 });
workOrderSchema.index({ createdBy: 1 });

export default mongoose.model("WorkOrder", workOrderSchema);
