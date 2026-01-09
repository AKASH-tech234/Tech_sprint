/**
 * Image Classification Service
 * ES Module wrapper for ML classification API
 * Provides image classification for civic issues using trained PyTorch model
 */

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

// ML API Configuration
const ML_API_URL = process.env.ML_API_URL || "http://localhost:8001";

// Department mapping for categories
const DEPARTMENT_MAP = {
  pothole: "Public Works Department (PWD)",
  garbage: "Sanitation Department",
  streetlight: "Electrical Department",
  water: "Water Supply & Drainage Department",
  traffic: "Traffic Department",
  infrastructure: "Public Works Department (PWD)",
  pollution: "Environmental Health Department",
  other: "General Municipal Department",
  // ML Model categories
  ROAD_POTHOLE: "Public Works Department (PWD)",
  GARBAGE: "Sanitation Department",
  STREETLIGHT: "Electrical Department",
  INFRASTRUCTURE: "Public Works Department (PWD)",
  ROAD_SIGNS: "Traffic Department",
  POLLUTION: "Environmental Health Department",
  FALLEN_TREES: "Parks & Recreation Department",
  GRAFFITI: "Municipal Cleaning Department",
  ILLEGAL_PARKING: "Traffic Police Department",
};

/**
 * Classify an image using the ML model
 * @param {string} imagePath - Path to the image file
 * @returns {Object} Classification result
 */
async function classifyIssueImage(imagePath) {
  try {
    const form = new FormData();

    // Handle different input types
    if (imagePath.startsWith("http")) {
      // Remote URL - fetch and send
      const response = await axios.get(imagePath, {
        responseType: "arraybuffer",
      });
      form.append("file", Buffer.from(response.data), {
        filename: "image.jpg",
        contentType: "image/jpeg",
      });
    } else {
      // Local file path
      const absolutePath = path.isAbsolute(imagePath)
        ? imagePath
        : path.join(process.cwd(), imagePath);
      form.append("file", fs.createReadStream(absolutePath));
    }

    console.log(
      `🤖 [ImageClassification] Sending to ML API: ${ML_API_URL}/predict`
    );

    const response = await axios.post(`${ML_API_URL}/predict`, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });

    if (!response.data.success) {
      throw new Error(response.data.detail || "Classification failed");
    }

    const result = response.data;

    console.log(`✅ [ImageClassification] Result:`, {
      category: result.category,
      confidence: result.confidence,
      department: result.department,
    });

    return {
      success: true,
      data: {
        category: result.legacy_category || result.category.toLowerCase(),
        originalCategory: result.category,
        categoryName: result.category_name,
        description: result.description,
        confidence: result.confidence,
        department: result.department,
        priority: result.priority,
        allPredictions: result.all_predictions || [],
        source: "ml_model",
      },
    };
  } catch (error) {
    console.error("❌ [ImageClassification] Error:", error.message);

    // Return fallback result
    return {
      success: false,
      error: error.message,
      data: {
        category: "other",
        confidence: 0,
        department: "General Municipal Department",
        priority: "medium",
        description: "Classification service unavailable",
        source: "fallback",
      },
    };
  }
}

/**
 * Classify multiple images and return aggregated result
 * @param {string[]} imagePaths - Array of image paths
 * @returns {Object} Aggregated classification result
 */
async function classifyMultipleImages(imagePaths) {
  const results = await Promise.all(
    imagePaths.map((path) => classifyIssueImage(path))
  );

  // Find the result with highest confidence
  let primaryResult = results[0];
  for (const result of results) {
    if (
      result.success &&
      result.data.confidence > (primaryResult.data?.confidence || 0)
    ) {
      primaryResult = result;
    }
  }

  return {
    success: primaryResult.success,
    primaryClassification: primaryResult.data,
    allResults: results.map((r) => r.data),
  };
}

/**
 * Get department for a category
 * @param {string} category - Category name
 * @returns {string} Department name
 */
function getDepartmentForCategory(category) {
  const upperCategory = category?.toUpperCase();
  const lowerCategory = category?.toLowerCase();

  return (
    DEPARTMENT_MAP[upperCategory] ||
    DEPARTMENT_MAP[lowerCategory] ||
    DEPARTMENT_MAP.other
  );
}

/**
 * Check ML API health
 * @returns {Object} Health status
 */
async function checkHealth() {
  try {
    const response = await axios.get(`${ML_API_URL}/health`, { timeout: 5000 });
    return {
      available: true,
      modelLoaded: response.data.model_loaded,
      device: response.data.device,
      categories: response.data.categories || [],
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
    const response = await axios.get(`${ML_API_URL}/categories`, {
      timeout: 5000,
    });
    return response.data.categories || [];
  } catch (error) {
    console.error(
      "❌ [ImageClassification] Failed to get categories:",
      error.message
    );
    return [];
  }
}

export const imageClassificationService = {
  classifyIssueImage,
  classifyMultipleImages,
  getDepartmentForCategory,
  checkHealth,
  getCategories,
};

export default imageClassificationService;
