// Backend/src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

// Protect routes - verify JWT token from HTTP-only cookie
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from HTTP-only cookie first, then fallback to Authorization header
  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, no token provided");
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    if (!user.isActive) {
      throw new ApiError(401, "Account has been deactivated");
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Not authorized, invalid token");
  }
});

// Restrict to specific roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action"
      );
    }
    next();
  };
};

// Check if profile is complete (for citizens reporting issues)
export const requireProfileComplete = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  // Check profile completion
  const isComplete = user.checkProfileCompletion();

  if (!isComplete) {
    throw new ApiError(
      403,
      "Please complete your profile to perform this action",
      {
        code: "PROFILE_INCOMPLETE",
        redirectTo: "/profile",
      }
    );
  }

  next();
});

// RBAC middleware for specific actions
export const rbac = (allowedRoles, options = {}) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    // Check if user role is allowed
    if (!allowedRoles.includes(userRole)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action"
      );
    }

    // Check profile completion if required
    if (options.requireProfile && !req.user.isProfileComplete) {
      throw new ApiError(403, "Please complete your profile first", {
        code: "PROFILE_INCOMPLETE",
        redirectTo: "/profile",
      });
    }

    next();
  };
};

// Optional auth - doesn't fail if no token, just sets req.user if available
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from HTTP-only cookie first, then fallback to Authorization header
  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    // No token - continue without user
    req.user = null;
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select("-password");

    if (user && user.isActive) {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (error) {
    // Invalid token - continue without user
    req.user = null;
  }

  next();
});

// Alias for protect middleware
export const authMiddleware = protect;
