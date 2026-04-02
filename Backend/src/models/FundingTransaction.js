import mongoose from "mongoose";

const fundingTransactionSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
      index: true,
    },
    fromOfficial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
      index: true,
    },

    razorpayOrderId: {
      type: String,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      index: true,
    },
    razorpaySignature: {
      type: String,
    },

    receipt: {
      type: String,
    },
    notes: {
      type: String,
      maxlength: 500,
    },

    paidAt: Date,
  },
  {
    timestamps: true,
  }
);

fundingTransactionSchema.index({ issue: 1, status: 1, createdAt: -1 });

export default mongoose.model("FundingTransaction", fundingTransactionSchema);
