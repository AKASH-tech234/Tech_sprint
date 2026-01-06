// Backend/src/models/CommunityVerification.js
import mongoose from 'mongoose';

const communityVerificationSchema = new mongoose.Schema({
  issue: {
    type: mongoose.Schema.Types.ObjectId,
     ref: 'Issue',
    required: true,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['correct', 'incorrect'],
    required: true,
  },
  remarks: {
    type: String,
    maxlength: 500,
    default: null,
  },
}, {
  timestamps: true,
});

// Compound index to ensure one verification per user per issue
communityVerificationSchema.index({ issue: 1, verifiedBy: 1 }, { unique: true });

// Index for querying verifications by issue
communityVerificationSchema.index({ issue: 1, status: 1 });

export default mongoose.model('CommunityVerification', communityVerificationSchema);
