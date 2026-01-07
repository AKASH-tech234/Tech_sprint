import { useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

/**
 * AI Classification Results Component
 * Displays AI-powered image classification results with confidence scores
 */
export default function ClassificationResults({ classification, onAccept, onReject }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!classification) return null;

  const { category, confidence, priority, description, alternativeCategories } = classification;

  // Confidence level styling
  const getConfidenceColor = (conf) => {
    if (conf >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (conf >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPriorityIcon = (pri) => {
    if (pri === 'high') return <AlertTriangle className="text-red-500" size={20} />;
    if (pri === 'medium') return <TrendingUp className="text-yellow-500" size={20} />;
    return <Info className="text-blue-500" size={20} />;
  };

  const categoryLabels = {
    pothole: 'Pothole / Road Damage',
    streetlight: 'Streetlight / Electrical',
    garbage: 'Garbage / Waste',
    water: 'Water / Waterlogging',
    traffic: 'Traffic Signal',
    noise: 'Noise Pollution',
    safety: 'Public Safety',
    other: 'Other Issue'
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="text-blue-600" size={24} />
        <h3 className="text-lg font-semibold text-gray-800">AI Classification Results</h3>
      </div>

      {/* Main Classification */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-600 mb-1">Detected Category</p>
            <p className="text-xl font-bold text-gray-900 capitalize">
              {categoryLabels[category] || category}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg border-2 ${getConfidenceColor(confidence)}`}>
            <p className="text-xs font-medium">Confidence</p>
            <p className="text-2xl font-bold">{confidence}%</p>
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-center gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
          {getPriorityIcon(priority)}
          <div>
            <p className="text-sm text-gray-600">Suggested Priority</p>
            <p className="font-semibold capitalize text-gray-900">{priority}</p>
          </div>
        </div>

        {/* AI Description */}
        {description && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-gray-700 italic">"{description}"</p>
          </div>
        )}
      </div>

      {/* Alternative Categories */}
      {alternativeCategories && alternativeCategories.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium mb-2"
          >
            {showDetails ? '▼' : '▶'} Alternative Classifications
          </button>
          
          {showDetails && (
            <div className="space-y-2 mt-2">
              {alternativeCategories.map((alt, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm capitalize">{categoryLabels[alt.category] || alt.category}</span>
                  <span className="text-sm text-gray-600">{alt.probability}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onAccept}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={18} />
          Accept AI Suggestion
        </button>
        <button
          onClick={onReject}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Choose Manually
        </button>
      </div>

      {/* Info Footer */}
      <p className="text-xs text-gray-500 text-center">
        AI classification uses advanced image analysis to categorize civic issues
      </p>
    </div>
  );
}
