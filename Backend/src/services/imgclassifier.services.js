/**
 * Image Classifier Service
 * Connects to the ML FastAPI service for civic issue classification
 */

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

// ML API Configuration
const ML_API_URL = process.env.ML_API_URL || "http://localhost:8001";

/**
 * Classify an image using the ML model
 * @param {Buffer|string} fileInput - Either a buffer or file path
 * @returns {Object} Classification result with category, confidence, department, priority
 */
async function classifyImage(fileInput) {
  try {
    const form = new FormData();

    // Handle both buffer and file path inputs
    if (Buffer.isBuffer(fileInput)) {
      form.append("file", fileInput, {
        filename: "image.jpg",
        contentType: "image/jpeg",
      });
    } else if (typeof fileInput === "string") {
      // It's a file path
      if (fileInput.startsWith("http")) {
        // Remote URL - fetch and send
        const response = await axios.get(fileInput, {
          responseType: "arraybuffer",
        });
        form.append("file", Buffer.from(response.data), {
          filename: "image.jpg",
          contentType: "image/jpeg",
        });
      } else {
        // Local file path
        const absolutePath = path.isAbsolute(fileInput)
          ? fileInput
          : path.join(process.cwd(), fileInput);
        form.append("file", fs.createReadStream(absolutePath));
      }
    } else {
      throw new Error("Invalid file input: must be Buffer or file path string");
    }

    console.log(
      `🤖 [MLClassifier] Sending image to ML API at ${ML_API_URL}/predict`
    );

    const res = await axios.post(`${ML_API_URL}/predict`, form, {
      headers: form.getHeaders(),
      timeout: 30000, // 30 second timeout
    });

    if (!res.data.success) {
      throw new Error(res.data.detail || "Classification failed");
    }

    console.log(`✅ [MLClassifier] Classification result:`, {
      category: res.data.category,
      confidence: res.data.confidence,
      department: res.data.department,
    });

    return {
      success: true,
      data: {
        category: res.data.legacy_category, // Backend-compatible category
        originalCategory: res.data.category, // Full category code
        categoryName: res.data.category_name,
        description: res.data.description,
        confidence: res.data.confidence,
        department: res.data.department,
        priority: res.data.priority,
        allPredictions: res.data.all_predictions || [],
      },
    };
  } catch (error) {
    console.error("❌ [MLClassifier] Classification error:", error.message);

    // Check if ML service is unavailable
    if (error.code === "ECONNREFUSED") {
      return {
        success: false,
        error: "ML service unavailable",
        data: {
          category: "other",
          confidence: 0,
          department: "General Municipal Department",
          priority: "medium",
          description: "Classification service unavailable",
        },
      };
    }

    return {
      success: false,
      error: error.message,
      data: {
        category: "other",
        confidence: 0,
        department: "General Municipal Department",
        priority: "medium",
        description: "Classification failed",
      },
    };
  }
}

/**
 * Check ML API health
 * @returns {Object} Health status
 */
async function checkHealth() {
  try {
    const res = await axios.get(`${ML_API_URL}/health`, { timeout: 5000 });
    return {
      available: true,
      modelLoaded: res.data.model_loaded,
      categories: res.data.categories || [],
    };
  } catch (error) {
    return {
      available: false,
      modelLoaded: false,
      error: error.message,
    };
  }
}

/**
 * Get available categories from ML API
 * @returns {Array} List of categories
 */
async function getCategories() {
  try {
    const res = await axios.get(`${ML_API_URL}/categories`, { timeout: 5000 });
    return res.data.categories || [];
  } catch (error) {
    console.error("❌ [MLClassifier] Failed to get categories:", error.message);
    return [];
  }
}

module.exports = { classifyImage, checkHealth, getCategories };
