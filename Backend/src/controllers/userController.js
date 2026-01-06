// Backend/src/controllers/userController.js
import { User } from '../models/userModel.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/AsyncHandler.js';

// Get user profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json(
    new ApiResponse(200, { user }, 'Profile retrieved successfully')
  );
});

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    fullAddress,
    aadhaarNumber,
    mobileNumber,
    profilePhoto,
    communityDetails,
  } = req.body;

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Validate Aadhaar format
  if (aadhaarNumber && !/^\d{12}$/.test(aadhaarNumber)) {
    throw new ApiError(400, 'Aadhaar number must be exactly 12 digits');
  }

  // Validate mobile format
  if (mobileNumber && !/^[6-9]\d{9}$/.test(mobileNumber)) {
    throw new ApiError(400, 'Mobile number must be a valid 10-digit Indian number starting with 6-9');
  }

  // Validate pincode format
  if (fullAddress?.pincode && !/^\d{6}$/.test(fullAddress.pincode)) {
    throw new ApiError(400, 'Pincode must be exactly 6 digits');
  }

  // Update fields
  if (fullAddress) {
    user.fullAddress = {
      houseNo: fullAddress.houseNo || user.fullAddress?.houseNo,
      area: fullAddress.area || user.fullAddress?.area,
      city: fullAddress.city || user.fullAddress?.city,
      district: fullAddress.district || user.fullAddress?.district,
      state: fullAddress.state || user.fullAddress?.state,
      pincode: fullAddress.pincode || user.fullAddress?.pincode,
    };
  }

  if (aadhaarNumber) {
    user.aadhaarNumber = aadhaarNumber;
  }

  if (mobileNumber) {
    user.mobileNumber = mobileNumber;
  }

  if (profilePhoto) {
    user.profilePhoto = profilePhoto;
  }

  // Update community details if community role
  if (user.role === 'community' && communityDetails) {
    user.communityDetails = {
      ...user.communityDetails,
      ...communityDetails,
    };
  }

  // Check if profile is complete
  user.isProfileComplete = user.checkProfileCompletion();

  await user.save();

  // Return updated user without password
  const updatedUser = await User.findById(userId).select('-password');

  res.status(200).json(
    new ApiResponse(200, { 
      user: updatedUser,
      isProfileComplete: user.isProfileComplete 
    }, 'Profile updated successfully')
  );
});

// Check profile completion status
export const checkProfileCompletion = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isComplete = user.checkProfileCompletion();
  
  // Get missing fields
  const missingFields = [];
  
  if (!user.fullAddress?.houseNo) missingFields.push('House No');
  if (!user.fullAddress?.area) missingFields.push('Area');
  if (!user.fullAddress?.city) missingFields.push('City');
  if (!user.fullAddress?.district) missingFields.push('District');
  if (!user.fullAddress?.state) missingFields.push('State');
  if (!user.fullAddress?.pincode) missingFields.push('Pincode');
  if (!user.aadhaarNumber) missingFields.push('Aadhaar Number');
  if (!user.mobileNumber) missingFields.push('Mobile Number');

  res.status(200).json(
    new ApiResponse(200, { 
      isProfileComplete: isComplete,
      missingFields,
      completionPercentage: Math.round(((8 - missingFields.length) / 8) * 100)
    }, 'Profile completion status retrieved')
  );
});

// Upload profile photo
export const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  const photoUrl = `/uploads/profiles/${req.file.filename}`;
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profilePhoto: photoUrl },
    { new: true }
  ).select('-password');

  res.status(200).json(
    new ApiResponse(200, { user, photoUrl }, 'Profile photo uploaded successfully')
  );
});
