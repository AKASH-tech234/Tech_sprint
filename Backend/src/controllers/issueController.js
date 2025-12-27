import Issue from '../models/Issue.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AsyncHandler } from '../utils/AsyncHandler.js';

// Create Issue
export const createIssue = AsyncHandler(async (req, res) => {
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
  const imageUrls = req.files ? req.files.map(file => {
    // For local storage
    return `${req.protocol}://${req.get('host')}/uploads/issues/${file.filename}`;
    // For Cloudinary
    // return file.path;
  }) : [];
  
  // Create issue
  const issue = await Issue.create({
    title,
    description,
    category,
    priority: priority || 'medium',
    location: locationData,
    images: imageUrls,
    reportedBy: req.user._id
  });
  
  // Populate user details
  await issue.populate('reportedBy', 'username email avatar');
  
  res.status(201).json(
    new ApiResponse(201, issue, 'Issue created successfully')
  );
});

// Get User's Issues
export const getMyIssues = AsyncHandler(async (req, res) => {
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
export const getRecentIssues = AsyncHandler(async (req, res) => {
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
export const getMapIssues = AsyncHandler(async (req, res) => {
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
export const getNearbyIssues = AsyncHandler(async (req, res) => {
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
export const upvoteIssue = AsyncHandler(async (req, res) => {
  const { issueId } = req.params;
  
  const issue = await Issue.findById(issueId);
  
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  
  // Toggle upvote
  const userId = req.user._id;
  const upvoteIndex = issue.upvotes.indexOf(userId);
  
  if (upvoteIndex > -1) {
    // Remove upvote
    issue.upvotes.splice(upvoteIndex, 1);
  } else {
    // Add upvote
    issue.upvotes.push(userId);
  }
  
  await issue.save();
  
  res.json(
    new ApiResponse(200, { upvotes: issue.upvotes.length }, 'Upvote updated')
  );
});

// Delete Issue
export const deleteIssue = AsyncHandler(async (req, res) => {
  const { issueId } = req.params;
  
  const issue = await Issue.findById(issueId);
  
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  
  // Check ownership
  if (issue.reportedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to delete this issue');
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