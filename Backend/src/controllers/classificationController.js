import { imageClassificationService } from "../services/imageClassificationService.js";
import { generateIssueDetails } from "../services/openaiclass.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

/**
 * Classification Controller
 * Handles AI-powered image classification for civic issues
 */
export const classificationController = {
  /**
   * Classify uploaded images
   * POST /api/classification/classify
   */
  classifyImages: asyncHandler(async (req, res) => {
    try {
      // Handle both 'image' (single) and 'images' (multiple) field names
      let files = [];
      if (req.files) {
        if (Array.isArray(req.files)) {
          files = req.files;
        } else {
          // req.files is an object with field names as keys
          if (req.files.image) files = files.concat(req.files.image);
          if (req.files.images) files = files.concat(req.files.images);
        }
      }

      // Check if files were uploaded
      if (!files || files.length === 0) {
        throw new ApiError(400, "No images uploaded for classification");
      }

      const imagePaths = files.map((file) => file.path);

      let classificationResult;

      // Single image classification
      if (imagePaths.length === 1) {
        classificationResult =
          await imageClassificationService.classifyIssueImage(imagePaths[0]);
      }
      // Multiple images classification
      else {
        classificationResult =
          await imageClassificationService.classifyMultipleImages(imagePaths);
        classificationResult = {
          success: true,
          data: classificationResult.primaryClassification,
          allResults: classificationResult.allResults,
        };
      }

      if (!classificationResult.success) {
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              classificationResult.data,
              "Classification completed with warnings: " +
                (classificationResult.error || "Unknown error")
            )
          );
      }

      // Add department mapping
      classificationResult.data.department =
        imageClassificationService.getDepartmentForCategory(
          classificationResult.data.category
        );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            classificationResult.data,
            `Image classified as ${
              classificationResult.data.categoryName ||
              classificationResult.data.category
            } with ${classificationResult.data.confidence}% confidence`
          )
        );
    } catch (error) {
      console.error("❌ Classification error:", error);
      throw new ApiError(500, error.message || "Failed to classify image");
    }
  }),

  /**
   * Get department for a category
   * GET /api/classification/department/:category
   */
  getDepartment: asyncHandler(async (req, res) => {
    const { category } = req.params;

    const department =
      imageClassificationService.getDepartmentForCategory(category);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { category, department },
          "Department retrieved successfully"
        )
      );
  }),

  /**
   * Get available categories
   * GET /api/classification/categories
   */
  getCategories: asyncHandler(async (req, res) => {
    const categories = await imageClassificationService.getCategories();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { categories },
          "Categories retrieved successfully"
        )
      );
  }),

  /**
   * Health check for classification service
   * GET /api/classification/health
   */
  healthCheck: asyncHandler(async (req, res) => {
    const health = await imageClassificationService.checkHealth();

    res.status(200).json(
      new ApiResponse(
        200,
        {
          status: health.available && health.modelLoaded ? "ready" : "degraded",
          mlService: {
            available: health.available,
            modelLoaded: health.modelLoaded,
            device: health.device || "unknown",
            categories: health.categories || [],
          },
          primaryService:
            health.available && health.modelLoaded ? "ml_model" : "fallback",
        },
        health.available && health.modelLoaded
          ? "ML Classification service is ready"
          : "Classification service degraded - " +
            (health.error || "ML service unavailable")
      )
    );
  }),

  /**
   * Test classification endpoint
   * POST /api/classification/test
   */
  testClassification: asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, "No test images uploaded");
    }

    const imagePath = req.files[0].path;
    const result = await imageClassificationService.classifyIssueImage(
      imagePath
    );

    res.status(200).json({
      success: true,
      message: "Test classification completed",
      classification: result.data,
      metadata: {
        imagePath,
        imageSize: req.files[0].size,
        mimeType: req.files[0].mimetype,
        timestamp: new Date(),
      },
    });
  }),

  /**
   * Generate issue details using OpenAI based on classification
   * POST /api/classification/generate-details
   */
  generateDetails: asyncHandler(async (req, res) => {
    const { category, confidence, department, priority } = req.body;

    if (!category) {
      throw new ApiError(400, "Category is required");
    }

    const result = await generateIssueDetails({
      category,
      confidence: confidence || 0,
      department: department || "General Municipal Department",
      priority: priority || "medium",
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result.data,
          result.success
            ? "Issue details generated successfully"
            : "Issue details generated with fallback values"
        )
      );
  }),
};
