import crypto from "crypto";
import Razorpay from "razorpay";

import Issue from "../models/Issue.js";
import FundingTransaction from "../models/FundingTransaction.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new ApiError(
      500,
      "Razorpay keys missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET"
    );
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// POST /api/officials/payments/create-order
export const createFundingOrder = asyncHandler(async (req, res) => {
  const { issueId, amount, notes } = req.body;

  if (!issueId) throw new ApiError(400, "issueId is required");
  const numericAmount = Number(amount);
  if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "amount must be a positive number");
  }

  const issue = await Issue.findById(issueId);
  if (!issue) throw new ApiError(404, "Issue not found");

  if (issue.status !== "verified") {
    throw new ApiError(400, "Funding can only be sent for verified issues");
  }

  if (!issue.assignedTo) {
    throw new ApiError(400, "Issue has no assigned team member");
  }

  const razorpay = getRazorpayClient();

  const amountPaise = Math.round(numericAmount * 100);
  const receipt = `fund_${issue._id}_${Date.now()}`;

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
    notes: {
      issueId: String(issue._id),
      issuePublicId: issue.issueId || "",
      toMember: String(issue.assignedTo),
      fromOfficial: String(req.user._id),
    },
  });

  const tx = await FundingTransaction.create({
    issue: issue._id,
    fromOfficial: req.user._id,
    toMember: issue.assignedTo,
    amount: numericAmount,
    currency: "INR",
    status: "created",
    razorpayOrderId: order.id,
    receipt,
    notes: typeof notes === "string" ? notes : undefined,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        transactionId: tx._id,
        order,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
      "Funding order created"
    )
  );
});

// POST /api/officials/payments/verify
export const verifyFundingPayment = asyncHandler(async (req, res) => {
  const {
    transactionId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!transactionId) throw new ApiError(400, "transactionId is required");
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(
      400,
      "razorpay_order_id, razorpay_payment_id, razorpay_signature are required"
    );
  }

  const tx = await FundingTransaction.findById(transactionId);
  if (!tx) throw new ApiError(404, "Transaction not found");

  // Only the same official admin who created the order can verify it
  if (tx.fromOfficial.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not allowed to verify this transaction");
  }

  if (tx.status === "paid") {
    const issueAlready = await Issue.findById(tx.issue);
    return res.json(
      new ApiResponse(
        200,
        { transaction: tx, issue: issueAlready },
        "Payment already verified"
      )
    );
  }

  if (tx.razorpayOrderId && tx.razorpayOrderId !== razorpay_order_id) {
    throw new ApiError(400, "Order ID does not match transaction");
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new ApiError(
      500,
      "Razorpay secret missing. Set RAZORPAY_KEY_SECRET"
    );
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");

  if (expected !== razorpay_signature) {
    tx.status = "failed";
    tx.razorpayPaymentId = razorpay_payment_id;
    tx.razorpaySignature = razorpay_signature;
    await tx.save();
    throw new ApiError(400, "Invalid payment signature");
  }

  tx.status = "paid";
  tx.razorpayPaymentId = razorpay_payment_id;
  tx.razorpaySignature = razorpay_signature;
  tx.paidAt = new Date();
  await tx.save();

  const issue = await Issue.findById(tx.issue);
  if (!issue) throw new ApiError(404, "Issue not found");

  // Gate: only move to in-progress after payment
  if (issue.status === "verified") {
    issue.status = "in-progress";
    await issue.save();
  }

  res.json(
    new ApiResponse(
      200,
      {
        transaction: tx,
        issue,
      },
      "Payment verified and issue moved to in-progress"
    )
  );
});
