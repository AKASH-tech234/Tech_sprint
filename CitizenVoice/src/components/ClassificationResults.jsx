import { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Building2,
  Cpu,
} from "lucide-react";

/**
 * AI Classification Results Component
 * Displays AI-powered image classification results with confidence scores
 * Supports both ML Model classifications and Vision API results
 */
export default function ClassificationResults({
  classification,
  onAccept,
  onReject,
}) {
  const [showDetails, setShowDetails] = useState(false);

  if (!classification) return null;

  // Support both old format and new ML model format
  const {
    category,
    confidence,
    priority,
    description,
    alternativeCategories,
    // New ML model fields
    department,
    all_predictions,
    source = "ML Model", // Default to ML Model
  } = classification;

  // Confidence level styling - handle both percentage (0-100) and decimal (0-1) formats
  const normalizedConfidence = confidence > 1 ? confidence : confidence * 100;

  const getConfidenceColor = (conf) => {
    const normalConf = conf > 1 ? conf : conf * 100;
    if (normalConf >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (normalConf >= 60)
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getPriorityIcon = (pri) => {
    if (pri === "high")
      return <AlertTriangle className="text-red-500" size={20} />;
    if (pri === "medium")
      return <TrendingUp className="text-yellow-500" size={20} />;
    return <Info className="text-blue-500" size={20} />;
  };

  // Category labels mapping - supports both old categories and new ML model categories
  const categoryLabels = {
    // Old categories
    pothole: "Pothole / Road Damage",
    streetlight: "Streetlight / Electrical",
    garbage: "Garbage / Waste",
    water: "Water / Waterlogging",
    traffic: "Traffic Signal",
    noise: "Noise Pollution",
    safety: "Public Safety",
    other: "Other Issue",
    // New ML model categories
    INFRASTRUCTURE: "Infrastructure Issue",
    STREETLIGHT: "Streetlight Issue",
    ROAD_SIGNS: "Road Signs Issue",
    POLLUTION: "Pollution",
    FALLEN_TREES: "Fallen Trees",
    GARBAGE: "Garbage / Waste",
    GRAFFITI: "Graffiti",
    ILLEGAL_PARKING: "Illegal Parking",
    ROAD_POTHOLE: "Road Pothole",
  };

  // Get display category - format nicely
  const getDisplayCategory = (cat) => {
    if (categoryLabels[cat]) return categoryLabels[cat];
    // Convert SNAKE_CASE to Title Case
    return cat
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">
            AI Classification Results
          </h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
          <Cpu size={12} />
          <span>{source}</span>
        </div>
      </div>

      {/* Main Classification */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-600 mb-1">Detected Category</p>
            <p className="text-xl font-bold text-gray-900">
              {getDisplayCategory(category)}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-lg border-2 ${getConfidenceColor(
              confidence
            )}`}
          >
            <p className="text-xs font-medium">Confidence</p>
            <p className="text-2xl font-bold">
              {normalizedConfidence.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Department - New ML model field */}
        {department && (
          <div className="flex items-center gap-2 mb-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <Building2 className="text-indigo-600" size={20} />
            <div>
              <p className="text-sm text-gray-600">Assigned Department</p>
              <p className="font-semibold text-indigo-900">{department}</p>
            </div>
          </div>
        )}

        {/* Priority */}
        {priority && (
          <div className="flex items-center gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
            {getPriorityIcon(priority)}
            <div>
              <p className="text-sm text-gray-600">Suggested Priority</p>
              <p className="font-semibold capitalize text-gray-900">
                {priority}
              </p>
            </div>
          </div>
        )}

        {/* AI Description */}
        {description && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-gray-700 italic">"{description}"</p>
          </div>
        )}
      </div>

      {/* All Predictions from ML Model */}
      {all_predictions && all_predictions.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium mb-2 flex items-center gap-1"
          >
            <span>{showDetails ? "▼" : "▶"}</span>
            <span>All Classification Results ({all_predictions.length})</span>
          </button>

          {showDetails && (
            <div className="space-y-2 mt-2">
              {all_predictions.map((pred, idx) => {
                const predConfidence =
                  pred.confidence > 1 ? pred.confidence : pred.confidence * 100;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {getDisplayCategory(pred.category)}
                      </span>
                      {pred.department && (
                        <span className="text-xs text-gray-500 ml-2">
                          • {pred.department}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-sm font-semibold px-2 py-0.5 rounded ${
                        predConfidence >= 50
                          ? "text-green-700 bg-green-100"
                          : predConfidence >= 20
                          ? "text-yellow-700 bg-yellow-100"
                          : "text-gray-600 bg-gray-200"
                      }`}
                    >
                      {predConfidence.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Alternative Categories - Legacy support */}
      {alternativeCategories &&
        alternativeCategories.length > 0 &&
        !all_predictions && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium mb-2"
            >
              {showDetails ? "▼" : "▶"} Alternative Classifications
            </button>

            {showDetails && (
              <div className="space-y-2 mt-2">
                {alternativeCategories.map((alt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm capitalize">
                      {categoryLabels[alt.category] || alt.category}
                    </span>
                    <span className="text-sm text-gray-600">
                      {alt.probability}%
                    </span>
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
        AI classification uses advanced image analysis to categorize civic
        issues
      </p>
    </div>
  );
}
