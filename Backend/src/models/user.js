import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["citizen", "official", "community"],
      default: "citizen",
      required: true,
    },

    refreshToken: String,
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
