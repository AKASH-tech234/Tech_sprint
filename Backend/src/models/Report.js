import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  // Reference to the issue
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true,
    index: true
  },
  
  // Type of report: verification or resolution
  reportType: {
    type: String,
    enum: ['verification', 'resolution'],
    required: true
  },
  
  // Submitted by (team member)
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Submission timestamp
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  // Review status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // === VERIFICATION FIELDS ===
  // Field outcome: verified or not-verified
  outcome: {
    type: String,
    enum: ['verified', 'not-verified'],
    // Required only for verification reports
  },
  
  // Root cause analysis (required if verified)
  rootCause: {
    type: String,
    maxlength: 2000
  },
  
  // === RESOLUTION FIELDS ===
  // Summary of work done
  workSummary: {
    type: String,
    maxlength: 2000
  },
  
  // Steps taken to resolve
  stepsTaken: {
    type: String,
    maxlength: 2000
  },
  
  // Resources used
  resourcesUsed: {
    type: String,
    maxlength: 1000
  },
  
  // Completion confirmation
  completionConfirmed: {
    type: Boolean,
    default: false
  },
  
  // === COMMON FIELDS ===
  // Officer remarks/notes
  remarks: {
    type: String,
    maxlength: 1000
  },
  
  // Evidence images (for verification)
  evidence: [{
    type: String // URLs to uploaded images
  }],
  
  // Proof images (for resolution)
  proof: [{
    type: String // URLs to uploaded images
  }],
  
  // == REVIEW FIELDS ==
  // Reviewed by (admin)
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Review timestamp
  reviewedAt: {
    type: Date
  },
  
  // Admin remarks on review
  adminRemarks: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
reportSchema.index({ issue: 1, reportType: 1 });
reportSchema.index({ status: 1, reportType: 1 });
reportSchema.index({ submittedBy: 1 });

export default mongoose.model('Report', reportSchema);
