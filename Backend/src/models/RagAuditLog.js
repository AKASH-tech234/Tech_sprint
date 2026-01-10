/**
 * RAG Audit Log Model
 * Tracks all RAG queries for debugging, analytics, and accountability
 */

import mongoose from "mongoose";

const ragAuditLogSchema = new mongoose.Schema(
  {
    // User who made the query
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // The user's query
    query: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    // Related issue ID (if any)
    issueId: {
      type: String,
      index: true,
    },

    // District context
    districtId: {
      type: String,
    },

    // Query classification
    queryCategory: {
      type: String,
      enum: [
        "status_explanation",
        "delay_context",
        "historical_pattern",
        "department_performance",
        "process_clarification",
        "timeline_estimation",
        "blocked",
      ],
    },

    // The generated response (truncated for storage)
    response: {
      type: String,
      maxlength: 2000,
    },

    // Source document IDs used
    sources: [
      {
        type: String,
      },
    ],

    // Confidence level
    confidence: {
      type: String,
      enum: ["high", "medium", "low"],
    },

    // Was the response from cache?
    cached: {
      type: Boolean,
      default: false,
    },

    // Processing time in milliseconds
    processingTimeMs: {
      type: Number,
    },

    // Any error that occurred
    error: {
      code: String,
      message: String,
    },

    // Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // Automatically expire old logs after 90 days
    expireAfterSeconds: 90 * 24 * 60 * 60,
  }
);

// Compound index for analytics queries
ragAuditLogSchema.index({ districtId: 1, timestamp: -1 });
ragAuditLogSchema.index({ queryCategory: 1, timestamp: -1 });

export default mongoose.model("RagAuditLog", ragAuditLogSchema);
