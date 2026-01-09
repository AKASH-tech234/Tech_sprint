/**
 * Vision Classifier Service
 * Uses Google Cloud Vision API for image classification of civic issues
 *
 * Categories:
 * - ROAD_POTHOLE: Road damage, potholes, cracks
 * - GARBAGE: Waste, litter, trash accumulation
 * - STREETLIGHT: Broken/damaged streetlights
 * - DRAINAGE: Blocked drains, sewage issues
 * - WATER_LOGGING: Flooded areas, water accumulation
 * - UNKNOWN: Cannot determine category
 */

import fetch from "node-fetch";
import fs from "fs";
import path from "path";

// Category mapping from Vision API labels to civic issue categories
const LABEL_TO_CATEGORY_MAP = {
  // Road/Pothole related
  pothole: "ROAD_POTHOLE",
  "road damage": "ROAD_POTHOLE",
  road: "ROAD_POTHOLE",
  asphalt: "ROAD_POTHOLE",
  crack: "ROAD_POTHOLE",
  pavement: "ROAD_POTHOLE",
  highway: "ROAD_POTHOLE",
  street: "ROAD_POTHOLE",

  // Garbage related
  garbage: "GARBAGE",
  waste: "GARBAGE",
  trash: "GARBAGE",
  litter: "GARBAGE",
  rubbish: "GARBAGE",
  debris: "GARBAGE",
  pollution: "GARBAGE",
  dump: "GARBAGE",
  landfill: "GARBAGE",

  // Streetlight related
  streetlight: "STREETLIGHT",
  "street light": "STREETLIGHT",
  lamp: "STREETLIGHT",
  "light pole": "STREETLIGHT",
  lighting: "STREETLIGHT",
  pole: "STREETLIGHT",
  "electric light": "STREETLIGHT",

  // Drainage related
  drain: "DRAINAGE",
  drainage: "DRAINAGE",
  sewer: "DRAINAGE",
  manhole: "DRAINAGE",
  sewage: "DRAINAGE",
  gutter: "DRAINAGE",
  pipe: "DRAINAGE",

  // Water logging related
  flood: "WATER_LOGGING",
  flooding: "WATER_LOGGING",
  water: "WATER_LOGGING",
  puddle: "WATER_LOGGING",
  waterlogging: "WATER_LOGGING",
  inundation: "WATER_LOGGING",
  "standing water": "WATER_LOGGING",
};

// Department mapping for each category
const CATEGORY_DEPARTMENT_MAP = {
  ROAD_POTHOLE: "Public Works Department (PWD)",
  GARBAGE: "Sanitation Department",
  STREETLIGHT: "Electrical Department",
  DRAINAGE: "Water Supply & Drainage Department",
  WATER_LOGGING: "Water Supply & Drainage Department",
  UNKNOWN: "General Municipal Department",
};

// Map new categories to legacy system categories
const CATEGORY_TO_LEGACY_MAP = {
  ROAD_POTHOLE: "pothole",
  GARBAGE: "garbage",
  STREETLIGHT: "streetlight",
  DRAINAGE: "water",
  WATER_LOGGING: "water",
  UNKNOWN: "other",
};

class VisionClassifierService {
  constructor() {
    this.apiKey = process.env.GOOGLE_CLOUD_VISION_KEY;
    this.apiEndpoint = "https://vision.googleapis.com/v1/images:annotate";
    console.log(
      "🔧 [VisionClassifier] Initialized with API key:",
      this.apiKey ? "✓" : "✗"
    );
  }

  /**
   * Check if the Vision API is properly configured
   */
  isConfigured() {
    return Boolean(this.apiKey);
  }

  /**
   * Convert image file to base64
   */
  async imageToBase64(imagePath) {
    try {
      // Handle both local paths and URLs
      if (imagePath.startsWith("http")) {
        const response = await fetch(imagePath);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return buffer.toString("base64");
      } else {
        const absolutePath = path.isAbsolute(imagePath)
          ? imagePath
          : path.join(process.cwd(), imagePath);
        const imageBuffer = fs.readFileSync(absolutePath);
        return imageBuffer.toString("base64");
      }
    } catch (error) {
      console.error("❌ [VisionClassifier] Error reading image:", error);
      throw new Error(`Failed to read image: ${error.message}`);
    }
  }

  /**
   * Call Google Cloud Vision API
   */
  async callVisionAPI(base64Image) {
    if (!this.isConfigured()) {
      console.warn(
        "⚠️ [VisionClassifier] API key not configured, returning UNKNOWN"
      );
      return { labels: [], error: "API key not configured" };
    }

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            { type: "LABEL_DETECTION", maxResults: 15 },
            { type: "OBJECT_LOCALIZATION", maxResults: 10 },
          ],
        },
      ],
    };

    try {
      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [VisionClassifier] API error:", errorText);
        return { labels: [], objects: [], error: errorText };
      }

      const data = await response.json();
      const annotations = data.responses[0];

      return {
        labels: annotations.labelAnnotations || [],
        objects: annotations.localizedObjectAnnotations || [],
        error: null,
      };
    } catch (error) {
      console.error("❌ [VisionClassifier] Network error:", error);
      return { labels: [], objects: [], error: error.message };
    }
  }

  /**
   * Map Vision API labels to civic issue category
   */
  mapLabelsToCategory(labels, objects) {
    const allDetections = [
      ...labels.map((l) => ({
        description: l.description.toLowerCase(),
        score: l.score,
      })),
      ...objects.map((o) => ({
        description: o.name.toLowerCase(),
        score: o.score,
      })),
    ];

    console.log(
      "🔍 [VisionClassifier] Detected labels:",
      allDetections.map((d) => d.description)
    );

    let bestMatch = { category: "UNKNOWN", confidence: 0, matchedLabel: null };

    for (const detection of allDetections) {
      for (const [keyword, category] of Object.entries(LABEL_TO_CATEGORY_MAP)) {
        if (
          detection.description.includes(keyword) ||
          keyword.includes(detection.description)
        ) {
          const confidence = Math.round(detection.score * 100);
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              category,
              confidence,
              matchedLabel: detection.description,
            };
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Determine priority based on category and confidence
   */
  determinePriority(category, confidence) {
    // High priority for safety-critical categories
    if (category === "ROAD_POTHOLE" && confidence >= 80) return "high";
    if (category === "WATER_LOGGING" && confidence >= 75) return "high";

    // Medium priority for most issues
    if (confidence >= 60) return "medium";

    // Low priority for uncertain classifications
    return "low";
  }

  /**
   * Main classification method
   * @param {string} imagePath - Path to image file or URL
   * @returns {Object} Classification result
   */
  async classifyImage(imagePath) {
    console.log(
      "🤖 [VisionClassifier] Starting classification for:",
      imagePath
    );

    try {
      // Convert image to base64
      const base64Image = await this.imageToBase64(imagePath);

      // Call Vision API
      const visionResult = await this.callVisionAPI(base64Image);

      if (visionResult.error && !this.isConfigured()) {
        // Return fallback when API is not configured
        return {
          success: true,
          data: {
            category: "UNKNOWN",
            legacyCategory: "other",
            confidence: 0,
            priority: "medium",
            department: CATEGORY_DEPARTMENT_MAP["UNKNOWN"],
            description:
              "Image classification unavailable - API not configured",
            labels: [],
            requiresManualReview: true,
          },
        };
      }

      if (visionResult.error) {
        console.error(
          "❌ [VisionClassifier] Classification failed:",
          visionResult.error
        );
        return {
          success: false,
          error: visionResult.error,
          data: {
            category: "UNKNOWN",
            legacyCategory: "other",
            confidence: 0,
            priority: "medium",
            department: CATEGORY_DEPARTMENT_MAP["UNKNOWN"],
            requiresManualReview: true,
          },
        };
      }

      // Map labels to category
      const classification = this.mapLabelsToCategory(
        visionResult.labels,
        visionResult.objects
      );

      const priority = this.determinePriority(
        classification.category,
        classification.confidence
      );

      const legacyCategory = CATEGORY_TO_LEGACY_MAP[classification.category];

      const result = {
        success: true,
        data: {
          category: legacyCategory,
          detectedCategory: classification.category,
          confidence: classification.confidence,
          priority,
          department: CATEGORY_DEPARTMENT_MAP[classification.category],
          matchedLabel: classification.matchedLabel,
          description: `Detected ${classification.category
            .toLowerCase()
            .replace("_", " ")} with ${classification.confidence}% confidence`,
          labels: visionResult.labels.slice(0, 5).map((l) => ({
            description: l.description,
            score: Math.round(l.score * 100),
          })),
          objects: visionResult.objects.slice(0, 5).map((o) => ({
            name: o.name,
            score: Math.round(o.score * 100),
          })),
          requiresManualReview:
            classification.category === "UNKNOWN" ||
            classification.confidence < 60,
        },
      };

      console.log("✅ [VisionClassifier] Classification result:", result.data);
      return result;
    } catch (error) {
      console.error("❌ [VisionClassifier] Error:", error);
      return {
        success: false,
        error: error.message,
        data: {
          category: "UNKNOWN",
          legacyCategory: "other",
          confidence: 0,
          priority: "medium",
          department: CATEGORY_DEPARTMENT_MAP["UNKNOWN"],
          requiresManualReview: true,
        },
      };
    }
  }

  /**
   * Get department for a category
   */
  getDepartmentForCategory(category) {
    return (
      CATEGORY_DEPARTMENT_MAP[category] || CATEGORY_DEPARTMENT_MAP["UNKNOWN"]
    );
  }

  /**
   * Get legacy category name for database compatibility
   */
  getLegacyCategory(category) {
    return CATEGORY_TO_LEGACY_MAP[category] || "other";
  }
}

export const visionClassifierService = new VisionClassifierService();
export default visionClassifierService;
