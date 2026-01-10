/**
 * RAG Rate Limiter Middleware
 * Prevents abuse of the RAG API
 */

import ragConfig from "../rag/config.js";

// In-memory store for rate limiting
const rateLimitStore = new Map();

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > ragConfig.rateLimit.windowMs * 2) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

/**
 * Rate limiter middleware for RAG endpoints
 */
export function ragRateLimiter(req, res, next) {
  // Skip rate limiting if RAG is disabled
  if (!ragConfig.enabled) {
    return next();
  }

  const userId = req.user?._id?.toString() || req.ip;
  const now = Date.now();
  const windowMs = ragConfig.rateLimit.windowMs;
  const maxRequests = ragConfig.rateLimit.maxRequests;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(userId);

  if (!entry || now - entry.windowStart > windowMs) {
    // New window
    entry = {
      windowStart: now,
      count: 0,
    };
  }

  entry.count++;
  rateLimitStore.set(userId, entry);

  // Set rate limit headers
  res.setHeader("X-RateLimit-Limit", maxRequests);
  res.setHeader(
    "X-RateLimit-Remaining",
    Math.max(0, maxRequests - entry.count)
  );
  res.setHeader(
    "X-RateLimit-Reset",
    Math.ceil((entry.windowStart + windowMs) / 1000)
  );

  // Check if over limit
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    res.setHeader("Retry-After", retryAfter);

    return res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message:
          "Too many requests. Please wait before asking another question.",
        retryAfter,
      },
    });
  }

  next();
}

/**
 * Get rate limit status for a user
 */
export function getRateLimitStatus(userId) {
  const entry = rateLimitStore.get(userId);
  const now = Date.now();
  const windowMs = ragConfig.rateLimit.windowMs;
  const maxRequests = ragConfig.rateLimit.maxRequests;

  if (!entry || now - entry.windowStart > windowMs) {
    return {
      remaining: maxRequests,
      resetIn: 0,
    };
  }

  return {
    remaining: Math.max(0, maxRequests - entry.count),
    resetIn: Math.ceil((entry.windowStart + windowMs - now) / 1000),
  };
}

export default ragRateLimiter;
