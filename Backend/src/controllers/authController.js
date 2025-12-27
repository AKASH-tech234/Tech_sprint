// Backend/src/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

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

// @desc    Register new user
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
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    console.log("❌ [Backend] User not found:", email);
    throw new ApiError(401, "Invalid email or password");
  }

  console.log("👤 [Backend] User found:", user._id);

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

  const userData = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar || null,
    createdAt: user.createdAt,
  };

  console.log("✅ [Backend] Current user data:", userData);
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

  // Check valid role
  const validRoles = ["citizen", "official", "community"];
  if (!validRoles.includes(role)) {
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
          role,
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
