import { imageClassificationService } from '../services/imageClassificationService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/AsyncHandler.js';

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
      // Check if files were uploaded
      if (!req.files || req.files.length === 0) {
        throw new ApiError(400, 'No images uploaded for classification');
      }

      const imagePaths = req.files.map(file => file.path);

      let classificationResult;

      // Single image classification
      if (imagePaths.length === 1) {
        classificationResult = await imageClassificationService.classifyIssueImage(imagePaths[0]);
      } 
      // Multiple images classification
      else {
        classificationResult = await imageClassificationService.classifyMultipleImages(imagePaths);
        classificationResult = {
          success: true,
          data: classificationResult.primaryClassification,
          allResults: classificationResult.allResults
        };
      }

      if (!classificationResult.success) {
        return res.status(200).json(
          new ApiResponse(
            200,
            classificationResult.data,
            'Classification completed with warnings: ' + (classificationResult.error || 'Unknown error')
          )
        );
      }

      // Add department mapping
      classificationResult.data.department = imageClassificationService.getDepartmentForCategory(
        classificationResult.data.category
      );

      res.status(200).json(
        new ApiResponse(
          200,
          classificationResult.data,
          'Image successfully classified'
        )
      );

    } catch (error) {
      console.error('❌ Classification error:', error);
      throw new ApiError(
        500,
        error.message || 'Failed to classify image'
      );
    }
  }),

  /**
   * Get department for a category
   * GET /api/classification/department/:category
   */
  getDepartment: asyncHandler(async (req, res) => {
    const { category } = req.params;
    
    const department = imageClassificationService.getDepartmentForCategory(category);

    res.status(200).json(
      new ApiResponse(
        200,
        { category, department },
        'Department retrieved successfully'
      )
    );
  }),

  /**
   * Test classification endpoint
   * POST /api/classification/test
   */
  testClassification: asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, 'No test images uploaded');
    }

    const imagePath = req.files[0].path;
    const result = await imageClassificationService.classifyIssueImage(imagePath);

    res.status(200).json({
      success: true,
      message: 'Test classification completed',
      classification: result.data,
      metadata: {
        imagePath,
        imageSize: req.files[0].size,
        mimeType: req.files[0].mimetype,
        timestamp: new Date()
      }
    });
  })
};
