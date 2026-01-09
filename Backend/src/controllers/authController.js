// Backend/src/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { isOfficialAdmin } from "../utils/officialPermissions.js";
import sendEmail from "../utils/sendemail.js";
import { passwordResetTemplate, passwordResetSuccessTemplate } from "../utils/emailTemplates.js";

// Initialize Google OAuth client lazily (after dotenv loads)
let googleClient = null;

const getGoogleClient = () => {
  if (!googleClient) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    console.log(
      "🔷 [Backend] Google OAuth Client initialized with ID:",
      process.env.GOOGLE_CLIENT_ID ? "Set ✅" : "NOT SET ❌"
    );
  }
  return googleClient;
};

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Cookie options for HTTP-only cookies
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: "/",
});

// Helper to set auth cookie and send response
const sendAuthResponse = (res, statusCode, user, message) => {
  const token = generateToken(user._id);
  console.log("🔐 [Backend] Token generated for user:", user._id);

  // Set HTTP-only cookie
  res.cookie("token", token, getCookieOptions());
  console.log("🍪 [Backend] Cookie set with options:", getCookieOptions());

  const userData = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar || null,
    officialDetails: user.role === 'official' ? (user.officialDetails || {}) : undefined,
    isOfficialAdmin: isOfficialAdmin(user),
    createdAt: user.createdAt,
  };

  console.log("📤 [Backend] Sending auth response:", {
    statusCode,
    message,
    userData,
  });

  res
    .status(statusCode)
    .json(new ApiResponse(statusCode, { user: userData }, message));
};

// @desc   Register new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = asyncHandler(async (req, res) => {
  console.log("📝 [Backend] Signup request received:", {
    ...req.body,
    password: "[HIDDEN]",
  });
  const { username, email, password, role } = req.body;

  // Validation
  if (!username || !email || !password || !role) {
    console.log("❌ [Backend] Signup validation failed: missing fields");
    throw new ApiError(400, "All fields are required");
  }

  // Check valid role
  const validRoles = ["citizen", "official", "community"];
  if (!validRoles.includes(role)) {
    console.log("❌ [Backend] Signup validation failed: invalid role", role);
    throw new ApiError(400, "Invalid role selected");
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    console.log(
      "❌ [Backend] User already exists:",
      existingUser.email === email ? "email" : "username"
    );
    throw new ApiError(
      409,
      existingUser.email === email
        ? "Email already registered"
        : "Username already taken"
    );
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  console.log("📝 [Backend] Creating user...");
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    role,
  });
  console.log("✅ [Backend] User created successfully:", user._id);

  sendAuthResponse(res, 201, user, "Account created successfully");
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  console.log("🔐 [Backend] Login request received:", {
    email: req.body.email,
  });
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    console.log("❌ [Backend] Login validation failed: missing fields");
    throw new ApiError(400, "Email and password are required");
  }

  // Check if user exists
  const user = await User.findOne({ email }).select("+password").populate('officialDetails.addedBy', 'username email');

  if (!user) {
    console.log("❌ [Backend] User not found:", email);
    throw new ApiError(401, "Invalid email or password");
  }

  console.log("👤 [Backend] User found:", user._id);

  // Additional check for team members: only allow login if added by a team leader
  if (user.role === 'official' && user.officialDetails?.addedBy) {
    // This is a team member - verify their team leader still exists
    const teamLeader = user.officialDetails.addedBy;
    if (!teamLeader) {
      console.log("❌ [Backend] Team member's leader not found:", email);
      throw new ApiError(403, "Your account has been deactivated. Contact your team leader.");
    }
    console.log("✅ [Backend] Team member verified, added by:", teamLeader.username);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    console.log("❌ [Backend] Invalid password for user:", email);
    throw new ApiError(401, "Invalid email or password");
  }

  console.log("✅ [Backend] Password valid, logging in user:", user._id);
  sendAuthResponse(res, 200, user, "Login successful");
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = asyncHandler(async (req, res) => {
  console.log("👤 [Backend] Get current user request, user ID:", req.user?.id);
  const user = await User.findById(req.user.id);

  if (!user) {
    console.log("❌ [Backend] User not found:", req.user.id);
    throw new ApiError(404, "User not found");
  }

  // Recalculate profile completion status
  const isProfileComplete = user.checkProfileCompletion ? user.checkProfileCompletion() : false;
//userData
  const userData = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar || null,
    profilePhoto: user.profilePhoto || null,
    // Profile completion fields
    isProfileComplete: isProfileComplete,
    fullAddress: user.fullAddress || null,
    aadhaarNumber: user.aadhaarNumber || null,
    mobileNumber: user.mobileNumber || null,
    // Role-specific details
    officialDetails: user.role === 'official' ? (user.officialDetails || {}) : undefined,
    communityDetails: user.role === 'community' ? (user.communityDetails || {}) : undefined,
    isOfficialAdmin: isOfficialAdmin(user),
    createdAt: user.createdAt,
  };

  console.log("✅ [Backend] Current user data:", { ...userData, aadhaarNumber: userData.aadhaarNumber ? '****' : null });
  res.json(new ApiResponse(200, userData, "User data fetched successfully"));
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public (so user can logout even if token is expired)
export const logout = asyncHandler(async (req, res) => {
  console.log("🚪 [Backend] Logout request received");
  // Clear the HTTP-only cookie
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    expires: new Date(0),
    path: "/",
  });

  console.log("✅ [Backend] Cookie cleared");
  res.json(new ApiResponse(200, null, "Logout successful"));
});

// @desc    Google OAuth
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = asyncHandler(async (req, res) => {
  console.log("🔷 [Backend] Google Auth request received");
  const { credential, role } = req.body;

  if (!credential) {
    console.log("❌ [Backend] No Google credential provided");
    throw new ApiError(400, "Google credential is required");
  }

  // Normalize and validate role if provided (accept case-insensitive)
  const validRoles = ["citizen", "official", "community"];
  const normalizedRole = role ? String(role).toLowerCase() : undefined;
  if (normalizedRole && !validRoles.includes(normalizedRole)) {
    console.log("❌ [Backend] Invalid role:", role);
    throw new ApiError(400, "Invalid role selected");
  }

  try {
    console.log("🔷 [Backend] Verifying Google token...");
    // Verify the Google token
    const client = getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    console.log("✅ [Backend] Google token verified:", { email, name });

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });

    if (!user) {
      console.log(
        "📝 [Backend] No user with this Google ID, checking email..."
      );
      // Check if user exists with this email (maybe registered with email/password)
      user = await User.findOne({ email });

      if (user) {
        console.log(
          "🔗 [Backend] Linking Google account to existing user:",
          user._id
        );
        // Link Google account to existing user
        user.googleId = googleId;
        user.avatar = user.avatar || picture;
        // If frontend provided a role and it differs from existing, update it
        if (normalizedRole && user.role !== normalizedRole) {
          console.log(
            "ℹ️ [Backend] Updating existing user's role:",
            user._id,
            "->",
            normalizedRole
          );
          user.role = normalizedRole;
        }
        await user.save();
      } else {
        console.log("📝 [Backend] Creating new user from Google account...");
        // Create new user
        // Generate a unique username from the email or name
        const baseUsername = name.toLowerCase().replace(/\s+/g, "_");
        let username = baseUsername;
        let counter = 1;

        // Check if username exists and make it unique
        while (await User.findOne({ username })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        user = await User.create({
          username,
          email,
          googleId,
          role: normalizedRole || "citizen",
          avatar: picture,
          // For Google OAuth users, we set a random password
          password: await bcrypt.hash(
            Math.random().toString(36).slice(-16),
            10
          ),
          isVerified: true, // Google accounts are verified
        });
        console.log("✅ [Backend] New user created:", user._id);
      }
    } else {
      console.log("✅ [Backend] Existing Google user found:", user._id);
    }

    sendAuthResponse(res, 200, user, "Google authentication successful");
  } catch (error) {
    console.error("❌ [Backend] Google auth error:", error.message);
    throw new ApiError(401, "Invalid Google token");
  }
});

// @desc    Check if user is authenticated (for frontend to verify cookie)
// @route   GET /api/auth/check
// @access  Public
export const checkAuth = asyncHandler(async (req, res) => {
  console.log("🔍 [Backend] Auth check request received");
  console.log("🍪 [Backend] Cookies:", req.cookies);
  const token = req.cookies?.token;

  if (!token) {
    console.log("⚠️ [Backend] No token found in cookies");
    return res.json(
      new ApiResponse(200, { authenticated: false }, "Not authenticated")
    );
  }

  try {
    console.log("🔐 [Backend] Verifying token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ [Backend] Token verified, user ID:", decoded.id);

    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      console.log("❌ [Backend] User not found or inactive");
      return res.json(
        new ApiResponse(200, { authenticated: false }, "Not authenticated")
      );
    }

    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar || null,
      officialDetails: user.role === 'official' ? (user.officialDetails || {}) : undefined,
      isOfficialAdmin: isOfficialAdmin(user),
      createdAt: user.createdAt,
    };

    console.log("✅ [Backend] User authenticated:", userData);
    res.json(
      new ApiResponse(
        200,
        { authenticated: true, user: userData },
        "Authenticated"
      )
    );
  } catch (error) {
    console.error("❌ [Backend] Token verification failed:", error.message);
    res.json(
      new ApiResponse(200, { authenticated: false }, "Not authenticated")
    );
  }
});

// @desc    Request password reset (Forgot Password)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  console.log("🔑 [Backend] Forgot password request received");
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // Always respond with success to prevent account enumeration
  const genericMessage = "If an account with that email exists, a password reset link has been sent.";

  try {
    // Find user by email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });

    // If no user found OR user is inactive, still return success (security)
    if (!user || !user.isActive) {
      console.log("⚠️ [Backend] No active user found for email:", email);
      return res.json(new ApiResponse(200, null, genericMessage));
    }

    // Generate random reset token (32 bytes = 64 hex chars)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before storing (never store raw token)
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token expiry (15 minutes from now)
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    // Update user with reset token data
    user.passwordResetTokenHash = resetTokenHash;
    user.passwordResetTokenExpiresAt = tokenExpiry;
    user.passwordResetRequestedAt = new Date();
    await user.save();

    console.log("🔐 [Backend] Reset token generated for user:", user._id);

    // Build reset URL
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

    // Send password reset email
    const emailTemplate = passwordResetTemplate(resetUrl, user.username);
    
    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    console.log("📧 [Backend] Password reset email sent to:", user.email);
    res.json(new ApiResponse(200, null, genericMessage));

  } catch (error) {
    console.error("❌ [Backend] Forgot password error:", error.message);
    // Still return generic message on error (security)
    res.json(new ApiResponse(200, null, genericMessage));
  }
});

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  console.log("🔑 [Backend] Reset password request received");
  const { token, newPassword } = req.body;

  // Validate inputs
  if (!token) {
    throw new ApiError(400, "Reset token is required");
  }

  if (!newPassword) {
    throw new ApiError(400, "New password is required");
  }

  // Validate password length
  if (newPassword.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  // Basic password strength check (at least one letter and one number)
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  if (!hasLetter || !hasNumber) {
    throw new ApiError(400, "Password must contain at least one letter and one number");
  }

  // Hash the incoming token to compare with stored hash
  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find user with matching token hash and non-expired token
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetTokenExpiresAt: { $gt: new Date() },
  }).select("+password");

  if (!user) {
    console.log("❌ [Backend] Invalid or expired reset token");
    throw new ApiError(400, "Invalid or expired reset token. Please request a new password reset.");
  }

  console.log("✅ [Backend] Valid reset token for user:", user._id);

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update user: set new password and clear reset token fields
  user.password = hashedPassword;
  user.passwordResetTokenHash = null;
  user.passwordResetTokenExpiresAt = null;
  user.passwordResetRequestedAt = null;
  await user.save();

  console.log("✅ [Backend] Password reset successful for user:", user._id);

  // Send confirmation email
  try {
    const emailTemplate = passwordResetSuccessTemplate(user.username);
    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });
    console.log("📧 [Backend] Password reset confirmation email sent to:", user.email);
  } catch (emailError) {
    // Don't fail the reset if confirmation email fails
    console.error("⚠️ [Backend] Failed to send confirmation email:", emailError.message);
  }

  res.json(new ApiResponse(200, null, "Password has been reset successfully. You can now log in with your new password."));
});
