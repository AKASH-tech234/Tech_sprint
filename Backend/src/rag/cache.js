/**
 * Simple in-memory cache for RAG responses
 * Prevents redundant LLM calls for identical queries
 */

import crypto from "crypto";
import ragConfig from "./config.js";

class RagCache {
  constructor(maxSize = 1000, ttlSeconds = 300) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttlSeconds * 1000; // Convert to ms
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Generate a hash key for the query
   */
  _generateKey(query, issueId, districtId) {
    const normalized = JSON.stringify({
      q: query.toLowerCase().trim(),
      i: issueId || null,
      d: districtId || null,
    });
    return crypto.createHash("md5").update(normalized).digest("hex");
  }

  /**
   * Get cached response if exists and not expired
   */
  get(query, issueId, districtId) {
    const key = this._generateKey(query, issueId, districtId);
    const cached = this.cache.get(key);

    if (!cached) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return {
      ...cached.response,
      cached: true,
      cachedAt: new Date(cached.timestamp).toISOString(),
    };
  }

  /**
   * Store response in cache
   */
  set(query, issueId, districtId, response) {
    const key = this._generateKey(query, issueId, districtId);

    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlSeconds: this.ttl / 1000,
      hits: this.hits,
      misses: this.misses,
      hitRate:
        this.hits + this.misses > 0
          ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(1) + "%"
          : "0%",
    };
  }

  /**
   * Prune expired entries
   */
  prune() {
    const now = Date.now();
    let pruned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
        pruned++;
      }
    }

    return pruned;
  }
}

// Singleton instance
export const ragCache = new RagCache(
  ragConfig.cache.maxSize,
  ragConfig.cache.ttl
);

export default ragCache;
