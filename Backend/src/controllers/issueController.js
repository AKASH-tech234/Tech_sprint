import Issue from '../models/Issue.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { v2 as cloudinary } from 'cloudinary';
import { isOfficialAdmin } from '../utils/officialPermissions.js';

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  try {
   
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    const pathParts = parts[1].split('/');
    // Remove version (v1767029697) if present
    const filteredParts = pathParts.filter(part => !part.startsWith('v'));
    
    // Join folder and filename, remove extension
    const publicId = filteredParts.join('/').replace(/\.[^/.]+$/, '');
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
};

// Helper function to delete images from Cloudinary
const deleteImagesFromCloudinary = async (imageUrls) => {
  if (!imageUrls || imageUrls.length === 0) return;
  
  const useCloudinary = process.env.USE_CLOUDINARY === 'true';
  if (!useCloudinary) return;

  const deletionResults = [];
  
  for (const url of imageUrls) {
    try {
      const publicId = getPublicIdFromUrl(url);
      if (publicId) {
        console.log(`🗑️ [Cloudinary] Deleting image: ${publicId}`);
        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`✅ [Cloudinary] Deletion result:`, result);
        deletionResults.push({ url, publicId, result });
      }
    } catch (error) {
      console.error(`❌ [Cloudinary] Failed to delete image ${url}:`, error);
      deletionResults.push({ url, error: error.message });
    }
  }
  
  return deletionResults;
};

// Create Issue
export const createIssue = asyncHandler(async (req, res) => {
  console.log('📝 [CreateIssue] Request received');
  console.log('📝 [CreateIssue] Body:', req.body);
  console.log('📝 [CreateIssue] Files:', req.files ? req.files.length : 0);
  
  const { title, description, category, priority, location } = req.body;
  
  // Parse location JSON string
  const locationData = typeof location === 'string' ? JSON.parse(location) : location;
  
  // Validate required fields
  if (!title || !description || !category || !locationData) {
    throw new ApiError(400, 'Missing required fields');
  }
  
  // Validate location coordinates
  if (!locationData.lat || !locationData.lng) {
    throw new ApiError(400, 'GPS coordinates required');
  }
  
  // Get uploaded image URLs
  const useCloudinary = process.env.USE_CLOUDINARY === 'true';
  console.log(`📸 [CreateIssue] Using Cloudinary: ${useCloudinary}`);
  
  const imageUrls = req.files ? req.files.map(file => {
    console.log('📸 [CreateIssue] Processing file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      filename: file.filename
    });
    
    // For Cloudinary, use the path provided by Cloudinary
    if (useCloudinary) {
      console.log('☁️ [CreateIssue] Using Cloudinary path:', file.path);
      return file.path;
    }
    // For local storage
    const localPath = `${req.protocol}://${req.get('host')}/uploads/issues/${file.filename}`;
    console.log('💾 [CreateIssue] Using local path:', localPath);
    return localPath;
  }) : [];
  
  console.log('📸 [CreateIssue] Final image URLs:', imageUrls);
  
  // Create issue
  let issue;
  try {
    issue = await Issue.create({
      title,
      description,
      category,
      priority: priority || 'medium',
      location: locationData,
      images: imageUrls,
      reportedBy: req.user._id
    });
    
    console.log('✅ [CreateIssue] Issue created with images:', issue.images);
  } catch (error) {
    // If database save fails, clean up uploaded images from Cloudinary
    if (imageUrls.length > 0 && useCloudinary) {
      console.log('❌ [CreateIssue] Database save failed, cleaning up Cloudinary images');
      await deleteImagesFromCloudinary(imageUrls);
    }
    throw error; // Re-throw the error
  }
  
  // Populate user details
  await issue.populate('reportedBy', 'username email avatar');
  
  res.status(201).json(
    new ApiResponse(201, issue, 'Issue created successfully')
  );
});

// Get User's Issues
export const getMyIssues = asyncHandler(async (req, res) => {
  const { status, category } = req.query;
  
  const query = { reportedBy: req.user._id };
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  if (category && category !== 'all') {
    query.category = category;
  }
  
  const issues = await Issue.find(query)
    .populate('reportedBy', 'username avatar')
    .populate('assignedTo', 'username')
    .sort({ createdAt: -1 });
  
  res.json(
    new ApiResponse(200, { issues, total: issues.length }, 'Issues fetched successfully')
  );
});

// Get Recent Issues
export const getRecentIssues = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  
  const issues = await Issue.find()
    .populate('reportedBy', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(limit);
  
  res.json(
    new ApiResponse(200, { issues, total: issues.length })
  );
});

// Get Issues for Map
export const getMapIssues = asyncHandler(async (req, res) => {
  const { bounds, status, category } = req.query;
  
  const query = {};
  
  // Parse bounds (minLat,minLng,maxLat,maxLng)
  if (bounds) {
    const [minLat, minLng, maxLat, maxLng] = bounds.split(',').map(Number);
    query['location.lat'] = { $gte: minLat, $lte: maxLat };
    query['location.lng'] = { $gte: minLng, $lte: maxLng };
  }
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  if (category && category !== 'all') {
    query.category = category;
  }
  
  const issues = await Issue.find(query)
    .select('issueId title category status location createdAt')
    .lean();
  
  res.json(
    new ApiResponse(200, { issues, total: issues.length })
  );
});

// Get Nearby Issues
export const getNearbyIssues = asyncHandler(async (req, res) => {
  const { lat, lng, radius } = req.query;
  
  if (!lat || !lng) {
    throw new ApiError(400, 'Latitude and longitude required');
  }
  
  const radiusInMeters = parseInt(radius) || 2000;
  const radiusInDegrees = radiusInMeters / 111000; // Approximate conversion
  
  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  
  const issues = await Issue.find({
    'location.lat': {
      $gte: userLat - radiusInDegrees,
      $lte: userLat + radiusInDegrees
    },
    'location.lng': {
      $gte: userLng - radiusInDegrees,
      $lte: userLng + radiusInDegrees
    }
  })
  .select('issueId title category status location')
  .lean();
  
  // Calculate exact distances
  const issuesWithDistance = issues.map(issue => {
    const distance = calculateDistance(
      userLat, userLng,
      issue.location.lat, issue.location.lng
    );
    
    return {
      ...issue,
      distance: `${(distance / 1000).toFixed(1)} km`
    };
  });
  
  // Filter by exact radius and sort by distance
  const nearbyIssues = issuesWithDistance
    .filter(issue => parseFloat(issue.distance) * 1000 <= radiusInMeters)
    .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
    .slice(0, 10);
  
  res.json(
    new ApiResponse(200, { issues: nearbyIssues, total: nearbyIssues.length })
  );
});

// Upvote Issue
export const upvoteIssue = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  
  const issue = await Issue.findById(issueId);
  
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  
  // Toggle upvote
  const userId = req.user._id;
  const upvoteIndex = issue.upvotes.indexOf(userId);
  
  let action = 'added';
  if (upvoteIndex > -1) {
    // Remove upvote
    issue.upvotes.splice(upvoteIndex, 1);
    action = 'removed';
  } else {
    // Add upvote
    issue.upvotes.push(userId);
  }
  
  await issue.save();
  
  console.log(`👍 [Upvote] User ${req.user.username} ${action} upvote for issue ${issueId}`);
  
  res.json(
    new ApiResponse(200, { 
      upvotes: issue.upvotes.length, 
      hasUpvoted: action === 'added',
      action 
    }, `Upvote ${action}`)
  );
});

// Get Single Issue
export const getIssue = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  
  const issue = await Issue.findById(issueId)
    .populate('reportedBy', 'username avatar email')
    .populate('assignedTo', 'username email');
  
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  
  res.json(
    new ApiResponse(200, issue, 'Issue fetched successfully')
  );
});

// Update Issue
export const updateIssue = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  const { title, description, category, priority, location, status } = req.body;
  
  const issue = await Issue.findById(issueId);
  
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  
  // Permission rules:
  // - Citizen: can update only their reported issues
  // - Official admin: can update any issue
  // - Official (non-admin): can update only issues assigned to them
  const isAdmin = isOfficialAdmin(req.user);
  const isReporter = issue.reportedBy?.toString() === req.user._id.toString();
  const isAssignee = issue.assignedTo?.toString() === req.user._id.toString();

  if (req.user.role === 'citizen') {
    if (!isReporter) throw new ApiError(403, 'Not authorized to update this issue');
  } else if (req.user.role === 'official') {
    if (!isAdmin && !isAssignee) {
      throw new ApiError(403, 'Not authorized to update this issue');
    }
  } else {
    throw new ApiError(403, 'Not authorized to update this issue');
  }
  
  // Update fields
  if (title) issue.title = title;
  if (description) issue.description = description;
  if (category) issue.category = category;
  if (priority) issue.priority = priority;
  if (status) issue.status = status;
  
  if (location) {
    const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
    issue.location = parsedLocation;
  }
  
  // Handle new images
  if (req.files && req.files.length > 0) {
    const useCloudinary = process.env.USE_CLOUDINARY === 'true';
    
    // If replacing images (not appending), delete old images from Cloudinary
    const shouldReplaceImages = req.body.replaceImages === 'true';
    
    if (shouldReplaceImages && issue.images && issue.images.length > 0) {
      console.log(`🗑️ [UpdateIssue] Replacing images, deleting ${issue.images.length} old images`);
      await deleteImagesFromCloudinary(issue.images);
      issue.images = []; // Clear old images
    }
    
    const newImages = req.files.map(file => {
      if (useCloudinary) {
        return file.path;
      }
      return `${req.protocol}://${req.get('host')}/uploads/issues/${file.filename}`;
    });
    
    console.log(`📸 [UpdateIssue] Adding ${newImages.length} new images`);
    issue.images = [...issue.images, ...newImages];
  }
  
  await issue.save();
  
  res.json(
    new ApiResponse(200, issue, 'Issue updated successfully')
  );
});

// Delete Issue
export const deleteIssue = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  
  const issue = await Issue.findById(issueId);
  
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  
  // Check ownership
  if (issue.reportedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to delete this issue');
  }
  
  // Delete all associated images from Cloudinary before deleting from database
  if (issue.images && issue.images.length > 0) {
    console.log(`🗑️ [DeleteIssue] Deleting ${issue.images.length} images from Cloudinary`);
    await deleteImagesFromCloudinary(issue.images);
  }
  
  await issue.deleteOne();
  
  res.json(
    new ApiResponse(200, null, 'Issue deleted successfully')
  );
});

// Helper: Calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}
