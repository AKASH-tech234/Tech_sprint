// Backend/src/models/userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ["citizen", "official", "community"],
      default: "citizen",
      required: true,
    },
    // District/Jurisdiction - Required for officials and community members
    district: {
      name: {
        type: String,
        default: null,
      },
      state: {
        type: String,
        default: null,
      },
      // Flag to indicate if district has been set (for first-time setup)
      isSet: {
        type: Boolean,
        default: false,
      },
      // When the district was set
      setAt: {
        type: Date,
        default: null,
      },
    },
    // Community membership for citizens
    joinedCommunities: [
      {
        communityId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Community",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Google OAuth fields (optional)
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    // Additional profile fields
    phone: {
      type: String,
      default: null,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    // Role-specific fields
    officialDetails: {
      department: String,
      designation: String,
      municipalityId: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    communityDetails: {
      organizationName: String,
      area: String,
    },
    // Status
    isVerified: {
      type: Boolean,
      default: false,
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

// Index for role queries (email and username already indexed via unique: true)
userSchema.index({ role: 1 });
// Index for district queries
userSchema.index({ "district.state": 1, "district.name": 1 });

export const User = mongoose.model("User", userSchema);
