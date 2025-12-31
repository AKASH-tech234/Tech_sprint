// src/components/Dashboard/Official/QuickActions/RequestResources.jsx
// UI Component for requesting resources for issue resolution
//
// TODO: Backend Developer - Implement the following endpoint:
// POST /api/officials/resource-requests
// Body: { issueId, resourceType, quantity, urgency, justification, requestedDeliveryDate }
// Response: { success, data: { requestId, ... } }

import React, { useState, useEffect } from "react";
import {
  X,
  Package,
  Truck,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react";
import { issueService } from "../../../../services/issueService";

const resourceTypes = [
  { id: "construction_materials", label: "Construction Materials", icon: "🧱" },
  { id: "equipment", label: "Equipment/Machinery", icon: "🚜" },
  { id: "workforce", label: "Additional Workforce", icon: "👷" },
  { id: "vehicles", label: "Vehicles", icon: "🚗" },
  { id: "tools", label: "Tools & Supplies", icon: "🔧" },
  { id: "safety_gear", label: "Safety Gear", icon: "⛑️" },
  { id: "electrical", label: "Electrical Supplies", icon: "⚡" },
  { id: "plumbing", label: "Plumbing Supplies", icon: "🔧" },
  { id: "other", label: "Other", icon: "📦" },
];

const RequestResources = ({ isOpen, onClose, preSelectedIssue = null }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [issues, setIssues] = useState([]);

  const [formData, setFormData] = useState({
    issueId: preSelectedIssue?._id || "",
    urgency: "normal",
    justification: "",
    requestedDeliveryDate: "",
    resources: [{ type: "", name: "", quantity: 1, unit: "pcs", notes: "" }],
  });

  useEffect(() => {
    if (isOpen) {
      loadIssues();
      // Set default delivery date to 3 days from now
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 3);
      setFormData((prev) => ({
        ...prev,
        requestedDeliveryDate: deliveryDate.toISOString().split("T")[0],
      }));
    }
  }, [isOpen]);

  useEffect(() => {
    if (preSelectedIssue) {
      setFormData((prev) => ({
        ...prev,
        issueId: preSelectedIssue._id,
        justification: `Resources needed for: ${preSelectedIssue.title}`,
      }));
    }
  }, [preSelectedIssue]);

  const loadIssues = async () => {
    try {
      const response = await issueService.getIssues({ status: "in-progress" });
      setIssues(response.data?.issues || []);
    } catch (err) {
      console.error("[RequestResources] Error loading issues:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResourceChange = (index, field, value) => {
    setFormData((prev) => {
      const newResources = [...prev.resources];
      newResources[index] = { ...newResources[index], [field]: value };
      return { ...prev, resources: newResources };
    });
  };

  const addResource = () => {
    setFormData((prev) => ({
      ...prev,
      resources: [
        ...prev.resources,
        { type: "", name: "", quantity: 1, unit: "pcs", notes: "" },
      ],
    }));
  };

  const removeResource = (index) => {
    if (formData.resources.length > 1) {
      setFormData((prev) => ({
        ...prev,
        resources: prev.resources.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate at least one complete resource
    const hasValidResource = formData.resources.some(
      (r) => r.type && r.name && r.quantity
    );
    if (!hasValidResource) {
      setError(
        "Please add at least one resource with type, name, and quantity."
      );
      setLoading(false);
      return;
    }

    try {
      console.log("[RequestResources] Submitting resource request:", formData);

      // TODO: Backend team - Replace this mock with actual API call:
      // const response = await fetch('/api/officials/resource-requests', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      //   credentials: 'include'
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock success
      setSuccess(true);
      console.log("[RequestResources] Resource request submitted successfully");

      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          issueId: "",
          urgency: "normal",
          justification: "",
          requestedDeliveryDate: "",
          resources: [
            { type: "", name: "", quantity: 1, unit: "pcs", notes: "" },
          ],
        });
      }, 2000);
    } catch (err) {
      console.error("[RequestResources] Error:", err);
      setError("Failed to submit resource request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Package className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Request Resources
              </h2>
              <p className="text-sm text-white/60">
                Request materials, equipment, or workforce
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Request Submitted!
            </h3>
            <p className="text-white/60">
              Your resource request has been sent for approval.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-200">{error}</span>
              </div>
            )}

            {/* Issue & Urgency Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Related Issue */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Related Issue
                </label>
                <select
                  name="issueId"
                  value={formData.issueId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-green-500/50 focus:outline-none"
                  required
                >
                  <option value="" className="bg-gray-800">
                    Select an issue
                  </option>
                  {issues.map((issue) => (
                    <option
                      key={issue._id}
                      value={issue._id}
                      className="bg-gray-800"
                    >
                      {issue.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Urgency Level
                </label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-green-500/50 focus:outline-none"
                >
                  <option value="low" className="bg-gray-800">
                    Low - Can wait
                  </option>
                  <option value="normal" className="bg-gray-800">
                    Normal - Standard delivery
                  </option>
                  <option value="high" className="bg-gray-800">
                    High - Priority needed
                  </option>
                  <option value="urgent" className="bg-gray-800">
                    Urgent - ASAP
                  </option>
                </select>
              </div>
            </div>

            {/* Resources List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-white/80">
                  <Package className="w-4 h-4 inline mr-1" />
                  Resources Needed
                </label>
                <button
                  type="button"
                  onClick={addResource}
                  className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300"
                >
                  <Plus className="w-4 h-4" />
                  Add Resource
                </button>
              </div>

              <div className="space-y-4">
                {formData.resources.map((resource, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">
                        Resource #{index + 1}
                      </span>
                      {formData.resources.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeResource(index)}
                          className="p-1 hover:bg-red-500/20 rounded text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Resource Type */}
                      <div>
                        <select
                          value={resource.type}
                          onChange={(e) =>
                            handleResourceChange(index, "type", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-green-500/50 focus:outline-none"
                          required
                        >
                          <option value="" className="bg-gray-800">
                            Select type
                          </option>
                          {resourceTypes.map((type) => (
                            <option
                              key={type.id}
                              value={type.id}
                              className="bg-gray-800"
                            >
                              {type.icon} {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Resource Name */}
                      <div>
                        <input
                          type="text"
                          value={resource.name}
                          onChange={(e) =>
                            handleResourceChange(index, "name", e.target.value)
                          }
                          placeholder="Specific item name"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:border-green-500/50 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {/* Quantity */}
                      <div>
                        <input
                          type="number"
                          value={resource.quantity}
                          onChange={(e) =>
                            handleResourceChange(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 1
                            )
                          }
                          min="1"
                          placeholder="Qty"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-green-500/50 focus:outline-none"
                          required
                        />
                      </div>

                      {/* Unit */}
                      <div>
                        <select
                          value={resource.unit}
                          onChange={(e) =>
                            handleResourceChange(index, "unit", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-green-500/50 focus:outline-none"
                        >
                          <option value="pcs" className="bg-gray-800">
                            Pieces
                          </option>
                          <option value="kg" className="bg-gray-800">
                            Kilograms
                          </option>
                          <option value="bags" className="bg-gray-800">
                            Bags
                          </option>
                          <option value="boxes" className="bg-gray-800">
                            Boxes
                          </option>
                          <option value="trucks" className="bg-gray-800">
                            Trucks
                          </option>
                          <option value="workers" className="bg-gray-800">
                            Workers
                          </option>
                          <option value="hours" className="bg-gray-800">
                            Hours
                          </option>
                        </select>
                      </div>

                      {/* Notes */}
                      <div>
                        <input
                          type="text"
                          value={resource.notes}
                          onChange={(e) =>
                            handleResourceChange(index, "notes", e.target.value)
                          }
                          placeholder="Notes"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:border-green-500/50 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Requested Delivery Date
              </label>
              <input
                type="date"
                name="requestedDeliveryDate"
                value={formData.requestedDeliveryDate}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-green-500/50 focus:outline-none"
                required
              />
            </div>

            {/* Justification */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Justification
              </label>
              <textarea
                name="justification"
                value={formData.justification}
                onChange={handleChange}
                placeholder="Explain why these resources are needed..."
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-green-500/50 focus:outline-none resize-none"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Truck className="w-5 h-5" />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RequestResources;
