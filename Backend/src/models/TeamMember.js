import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    // Reference to the user account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Team leader who added this member
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Team member details
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      default: 'field-officer',
    },
    department: {
      type: String,
      default: '',
    },
    // Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    // Messages between team leader and member
    messages: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        to: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        read: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
teamMemberSchema.index({ userId: 1 });
teamMemberSchema.index({ addedBy: 1 });
teamMemberSchema.index({ email: 1 });

export const TeamMember = mongoose.model('TeamMember', teamMemberSchema);
