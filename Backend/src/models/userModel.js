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
    profilePhoto: {
      type: String,
      default: null,
    },
    // Additional profile fields
    phone: {
      type: String,
      default: null,
    },
    // Full Address for profile completion
    fullAddress: {
      houseNo: { type: String, default: null },
      area: { type: String, default: null },
      city: { type: String, default: null },
      district: { type: String, default: null },
      state: { type: String, default: null },
      pincode: { type: String, default: null },
    },
    // Legacy address (for backward compatibility)
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    // Aadhaar Number (12 digits)
    aadhaarNumber: {
      type: String,
      default: null,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow null
          return /^\d{12}$/.test(v);
        },
        message: 'Aadhaar number must be exactly 12 digits'
      }
    },
    // Mobile Number (10 digits)
    mobileNumber: {
      type: String,
      default: null,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow null
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'Mobile number must be a valid 10-digit Indian number'
      }
    },
    // Profile completion status
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    // Role-specific fields
    officialDetails: {
      department: String,
      designation: String,
      municipalityId: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    // Password Reset Fields
    passwordResetTokenHash: {
      type: String,
      default: null,
    },
    passwordResetTokenExpiresAt: {
      type: Date,
      default: null,
    },
    passwordResetRequestedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for role queries (email and username already indexed via unique: true)
userSchema.index({ role: 1 });

// Method to check if profile is complete
userSchema.methods.checkProfileCompletion = function() {
  const hasAddress = this.fullAddress && 
    this.fullAddress.houseNo && 
    this.fullAddress.area && 
    this.fullAddress.city && 
    this.fullAddress.district && 
    this.fullAddress.state && 
    this.fullAddress.pincode;
  
  const hasAadhaar = this.aadhaarNumber && /^\d{12}$/.test(this.aadhaarNumber);
  const hasMobile = this.mobileNumber && /^[6-9]\d{9}$/.test(this.mobileNumber);
  
  return hasAddress && hasAadhaar && hasMobile;
};

export const User = mongoose.model("User", userSchema);
