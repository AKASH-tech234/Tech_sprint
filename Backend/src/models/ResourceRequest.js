import mongoose from "mongoose";

const resourceRequestSchema = new mongoose.Schema(
  {
    // Unique request ID
    requestId: {
      type: String,
      unique: true,
      required: true,
      default: () => `RES-${Date.now()}`,
    },

    // Title/purpose
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // Request type
    requestType: {
      type: String,
      required: true,
      enum: [
        "materials",
        "equipment",
        "manpower",
        "vehicles",
        "tools",
        "safety-gear",
        "other",
      ],
      default: "materials",
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
        "pending",
        "approved",
        "rejected",
        "partially-approved",
        "fulfilled",
        "cancelled",
      ],
      default: "pending",
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

    // Items requested
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, default: "units" },
        estimatedCost: Number,
        approved: { type: Boolean, default: false },
        approvedQuantity: Number,
        notes: String,
      },
    ],

    // Total estimated cost
    totalEstimatedCost: {
      type: Number,
      default: 0,
    },

    // Justification/reason
    justification: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    // Delivery location
    deliveryLocation: {
      address: String,
      landmark: String,
    },

    // Required by date
    requiredBy: {
      type: Date,
      required: true,
    },

    // Requested by
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Approved/reviewed by
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: Date,

    // Review notes
    reviewNotes: {
      type: String,
      maxlength: 1000,
    },

    // Fulfillment details
    fulfilledAt: Date,
    fulfilledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
resourceRequestSchema.index({ status: 1, requiredBy: 1 });
resourceRequestSchema.index({ requestedBy: 1 });

export default mongoose.model("ResourceRequest", resourceRequestSchema);
