// src/services/classificationService.js
// API service for image classification operations

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

/**
 * Get auth headers for authenticated requests
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Classification Service
 * Handles all API calls related to image classification
 */
class ClassificationService {
  /**
   * Classify an image for civic issue detection
   * @param {File} imageFile - The image file to classify
   * @returns {Promise<Object>} Classification result with category, confidence, department, priority
   */
  async classifyImage(imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(`${API_BASE_URL}/classification/classify`, {
      method: "POST",
      credentials: "include",
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Classification failed" }));
      throw new Error(error.message || "Failed to classify image");
    }

    const result = await response.json();
    return this.formatClassificationResult(result.data || result);
  }

  /**
   * Classify multiple images at once
   * @param {File[]} imageFiles - Array of image files to classify
   * @returns {Promise<Object[]>} Array of classification results
   */
  async classifyMultipleImages(imageFiles) {
    const formData = new FormData();
    imageFiles.forEach((file, index) => {
      formData.append("images", file);
    });

    const response = await fetch(`${API_BASE_URL}/classification/classify`, {
      method: "POST",
      credentials: "include",
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Classification failed" }));
      throw new Error(error.message || "Failed to classify images");
    }

    const result = await response.json();
    const results = result.data || result;
    return Array.isArray(results)
      ? results.map((r) => this.formatClassificationResult(r))
      : [this.formatClassificationResult(results)];
  }

  /**
   * Get department for a specific category
   * @param {string} category - The category to get department for
   * @returns {Promise<Object>} Department information
   */
  async getDepartment(category) {
    const response = await fetch(
      `${API_BASE_URL}/classification/department/${category}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get department");
    }

    const result = await response.json();
    return result.data || result;
  }

  /**
   * Get all available classification categories
   * @returns {Promise<Object>} Categories with their departments and priorities
   */
  async getCategories() {
    const response = await fetch(`${API_BASE_URL}/classification/categories`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to get categories");
    }

    const result = await response.json();
    return result.data || result;
  }

  /**
   * Check ML service health
   * @returns {Promise<Object>} Health status of ML service
   */
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/classification/health`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        return { status: "unhealthy", message: "ML service unavailable" };
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      return { status: "error", message: error.message };
    }
  }

  /**
   * Format classification result to a consistent structure
   * @param {Object} result - Raw classification result from API
   * @returns {Object} Formatted classification result
   */
  formatClassificationResult(result) {
    // Handle case where result is nested under 'classification'
    const classification = result.classification || result;

    return {
      category: classification.category || classification.predicted_category,
      confidence: this.normalizeConfidence(classification.confidence),
      department: classification.department,
      priority:
        classification.priority ||
        this.inferPriority(classification.confidence),
      all_predictions: classification.all_predictions?.map((pred) => ({
        category: pred.category,
        confidence: this.normalizeConfidence(pred.confidence),
        department: pred.department,
        priority: pred.priority,
      })),
      source: "ML Model",
      raw: classification,
    };
  }

  /**
   * Normalize confidence to percentage (0-100)
   * @param {number} confidence - Confidence value (0-1 or 0-100)
   * @returns {number} Confidence as percentage
   */
  normalizeConfidence(confidence) {
    if (confidence === undefined || confidence === null) return 0;
    return confidence > 1 ? confidence : confidence * 100;
  }

  /**
   * Infer priority based on confidence level
   * @param {number} confidence - Confidence value
   * @returns {string} Priority level
   */
  inferPriority(confidence) {
    const normalizedConf = this.normalizeConfidence(confidence);
    if (normalizedConf >= 80) return "high";
    if (normalizedConf >= 50) return "medium";
    return "low";
  }
}

// Export singleton instance
const classificationService = new ClassificationService();
export default classificationService;
export { ClassificationService };
