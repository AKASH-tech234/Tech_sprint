import { useState, useEffect } from 'react';
import { Camera, MapPin, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import ClassificationResults from './ClassificationResults';

/**
 * Enhanced Issue Report Form with AI Classification
 * Allows users to report issues with automatic AI categorization
 */
export default function AIIssueForm({ onSubmit, initialData = {} }) {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    category: initialData.category || '',
    priority: initialData.priority || 'medium',
    location: initialData.location || null,
    images: [],
    useAiClassification: true
  });

  const [imagePreview, setImagePreview] = useState([]);
  const [aiClassification, setAiClassification] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState('');

  // Get user's location
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Current Location'
          }
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        setError('Unable to retrieve your location');
        setIsGettingLocation(false);
      }
    );
  };

  // Handle image selection and trigger AI classification
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
    setFormData(prev => ({ ...prev, images: files }));

    // Trigger AI classification if enabled
    if (formData.useAiClassification && files.length > 0) {
      await classifyImage(files[0]);
    }
  };

  // Call AI classification API
  const classifyImage = async (imageFile) => {
    setIsClassifying(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('images', imageFile);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/classification/classify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: formDataToSend
      });

      const result = await response.json();

      if (result.success) {
        setAiClassification(result.data);
      } else {
        setError('AI classification failed. Please select category manually.');
      }
    } catch (error) {
      console.error('Classification error:', error);
      setError('Failed to classify image. Please try again.');
    } finally {
      setIsClassifying(false);
    }
  };

  // Accept AI suggestion
  const handleAcceptAI = () => {
    if (aiClassification) {
      setFormData(prev => ({
        ...prev,
        category: aiClassification.category,
        priority: aiClassification.priority,
        description: prev.description || aiClassification.description
      }));
    }
  };

  // Reject AI and show manual selection
  const handleRejectAI = () => {
    setAiClassification(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.location) {
      setError('Please provide your location');
      return;
    }

    if (formData.images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    if (!formData.category && !aiClassification) {
      setError('Please select a category or enable AI classification');
      return;
    }

    // Prepare submission data
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('category', formData.category);
    submitData.append('priority', formData.priority);
    submitData.append('location', JSON.stringify(formData.location));
    submitData.append('useAiClassification', formData.useAiClassification);

    formData.images.forEach(image => {
      submitData.append('images', image);
    });

    // Call parent submit handler
    if (onSubmit) {
      await onSubmit(submitData);
    }
  };

  useEffect(() => {
    // Auto-get location on mount
    getCurrentLocation();

    // Cleanup preview URLs
    return () => {
      imagePreview.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const categories = [
    { value: 'pothole', label: 'Pothole / Road Damage' },
    { value: 'streetlight', label: 'Streetlight / Electrical' },
    { value: 'garbage', label: 'Garbage / Waste' },
    { value: 'water', label: 'Water / Waterlogging' },
    { value: 'traffic', label: 'Traffic Signal' },
    { value: 'noise', label: 'Noise Pollution' },
    { value: 'safety', label: 'Public Safety' },
    { value: 'other', label: 'Other Issue' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* AI Toggle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.useAiClassification}
            onChange={(e) => setFormData(prev => ({ ...prev, useAiClassification: e.target.checked }))}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-600" size={20} />
            <span className="font-medium text-gray-800">Enable AI Auto-Classification</span>
          </div>
        </label>
        <p className="text-sm text-gray-600 mt-2 ml-8">
          AI will automatically detect and categorize your issue from the uploaded image
        </p>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Images <span className="text-red-500">*</span>
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Camera className="mx-auto text-gray-400 mb-2" size={48} />
            <p className="text-sm text-gray-600">Click to upload images</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB (max 5 images)</p>
          </label>
        </div>

        {/* Image Preview */}
        {imagePreview.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {imagePreview.map((preview, idx) => (
              <img key={idx} src={preview} alt={`Preview ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
            ))}
          </div>
        )}

        {/* AI Classification Loading */}
        {isClassifying && (
          <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm font-medium">Analyzing image with AI...</span>
          </div>
        )}
      </div>

      {/* AI Classification Results */}
      {aiClassification && (
        <ClassificationResults
          classification={aiClassification}
          onAccept={handleAcceptAI}
          onReject={handleRejectAI}
        />
      )}

      {/* Manual Category Selection (if AI disabled or rejected) */}
      {(!formData.useAiClassification || !aiClassification) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={!aiClassification}
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Issue Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Large pothole on Main Street"
          required
          maxLength={200}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder={aiClassification?.description || "Describe the issue in detail..."}
          required
          maxLength={2000}
        />
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
        <div className="flex gap-4">
          {['low', 'medium', 'high'].map(pri => (
            <label key={pri} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="priority"
                value={pri}
                checked={formData.priority === pri}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="capitalize">{pri}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
        >
          {isGettingLocation ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <MapPin size={20} />
          )}
          {formData.location ? '✓ Location Captured' : 'Get Current Location'}
        </button>
        {formData.location && (
          <p className="text-sm text-gray-600 mt-2">
            📍 Lat: {formData.location.lat.toFixed(6)}, Lng: {formData.location.lng.toFixed(6)}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Submit Issue Report
      </button>
    </form>
  );
}
