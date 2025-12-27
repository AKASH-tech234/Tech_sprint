import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  issueId: {
    type: String,
    unique: true,
    required: true,
    default: () => `ISS-${Date.now()}`
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: ['pothole', 'streetlight', 'graffiti', 'garbage', 'water', 'traffic', 'parks', 'other']
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    required: true,
    enum: ['reported', 'acknowledged', 'in-progress', 'resolved', 'rejected'],
    default: 'reported'
  },
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    city: String,
    state: String
  },
  images: [{
    type: String  // URLs to uploaded images
  }],
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for geospatial queries
issueSchema.index({ 'location.lat': 1, 'location.lng': 1 });

export default mongoose.model('Issue', issueSchema);