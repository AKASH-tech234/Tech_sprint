// src/components/Dashboard/Official/QuickActions/CreateWorkOrder.jsx
// UI Component for creating work orders for issues
//
// TODO: Backend Developer - Implement the following endpoint:
// POST /api/officials/work-orders
// Body: { issueId, title, description, assignedTo, priority, estimatedCost, deadline }
// Response: { success, data: { workOrderId, ... } }

import React, { useState, useEffect } from "react";
import {
  X,
  ClipboardList,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { issueService } from "../../../../services/issueService";

const CreateWorkOrder = ({ isOpen, onClose, preSelectedIssue = null }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [issues, setIssues] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const [formData, setFormData] = useState({
    issueId: preSelectedIssue?._id || "",
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    estimatedCost: "",
    deadline: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadIssuesAndTeam();
    }
  }, [isOpen]);

  useEffect(() => {
    if (preSelectedIssue) {
      setFormData((prev) => ({
        ...prev,
        issueId: preSelectedIssue._id,
        title: `Work Order: ${preSelectedIssue.title}`,
        description: preSelectedIssue.description || "",
      }));
    }
  }, [preSelectedIssue]);

  const loadIssuesAndTeam = async () => {
    try {
      // Load pending issues
      const issueResponse = await issueService.getIssues({
        status: "acknowledged",
      });
      setIssues(issueResponse.data?.issues || []);

      // Load team members
      const teamResponse = await issueService.getTeamMembers();
      setTeamMembers(teamResponse.data?.members || []);
    } catch (err) {
      console.error("[CreateWorkOrder] Error loading data:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("[CreateWorkOrder] Submitting work order:", formData);

      // TODO: Backend team - Replace this mock with actual API call:
      // const response = await fetch('/api/officials/work-orders', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      //   credentials: 'include'
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock success
      setSuccess(true);
      console.log("[CreateWorkOrder] Work order created successfully");

      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          issueId: "",
          title: "",
          description: "",
          assignedTo: "",
          priority: "medium",
          estimatedCost: "",
          deadline: "",
          notes: "",
        });
      }, 2000);
    } catch (err) {
      console.error("[CreateWorkOrder] Error:", err);
      setError("Failed to create work order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <ClipboardList className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Create Work Order
              </h2>
              <p className="text-sm text-white/60">
                Assign work to team members
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
              Work Order Created!
            </h3>
            <p className="text-white/60">
              The work order has been assigned successfully.
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

            {/* Issue Selection */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Related Issue
              </label>
              <select
                name="issueId"
                value={formData.issueId}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
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
                    {issue.title} - {issue.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Work Order Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter work order title"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-blue-500/50 focus:outline-none"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the work to be done..."
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-blue-500/50 focus:outline-none resize-none"
                required
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Assign To */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Assign To
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                  required
                >
                  <option value="" className="bg-gray-800">
                    Select team member
                  </option>
                  {teamMembers.map((member) => (
                    <option
                      key={member._id}
                      value={member._id}
                      className="bg-gray-800"
                    >
                      {member.name || member.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                >
                  <option value="low" className="bg-gray-800">
                    Low
                  </option>
                  <option value="medium" className="bg-gray-800">
                    Medium
                  </option>
                  <option value="high" className="bg-gray-800">
                    High
                  </option>
                  <option value="urgent" className="bg-gray-800">
                    Urgent
                  </option>
                </select>
              </div>
            </div>

            {/* Estimated Cost & Deadline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Estimated Cost (₹)
                </label>
                <input
                  type="number"
                  name="estimatedCost"
                  value={formData.estimatedCost}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-blue-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Deadline
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes or instructions..."
                rows={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-blue-500/50 focus:outline-none resize-none"
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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <ClipboardList className="w-5 h-5" />
                    Create Work Order
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

export default CreateWorkOrder;
