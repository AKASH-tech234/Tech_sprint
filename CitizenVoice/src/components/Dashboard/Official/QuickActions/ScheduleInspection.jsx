// src/components/Dashboard/Official/QuickActions/ScheduleInspection.jsx
// UI Component for scheduling inspections for issues
//
// TODO: Backend Developer - Implement the following endpoint:
// POST /api/officials/inspections
// Body: { issueId, inspectorId, scheduledDate, scheduledTime, location, notes }
// Response: { success, data: { inspectionId, ... } }

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  User,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { issueService } from "../../../../services/issueService";

const ScheduleInspection = ({ isOpen, onClose, preSelectedIssue = null }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [issues, setIssues] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const [formData, setFormData] = useState({
    issueId: preSelectedIssue?._id || "",
    inspectorId: "",
    scheduledDate: "",
    scheduledTime: "",
    inspectionType: "initial",
    location: preSelectedIssue?.location?.address || "",
    notes: "",
    notifyReporter: true,
  });

  useEffect(() => {
    if (isOpen) {
      loadIssuesAndTeam();
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData((prev) => ({
        ...prev,
        scheduledDate: tomorrow.toISOString().split("T")[0],
      }));
    }
  }, [isOpen]);

  useEffect(() => {
    if (preSelectedIssue) {
      setFormData((prev) => ({
        ...prev,
        issueId: preSelectedIssue._id,
        location: preSelectedIssue.location?.address || "",
      }));
    }
  }, [preSelectedIssue]);

  const loadIssuesAndTeam = async () => {
    try {
      // Load issues needing inspection
      const issueResponse = await issueService.getIssues({
        status: "reported",
      });
      setIssues(issueResponse.data?.issues || []);

      // Load team members (inspectors)
      const teamResponse = await issueService.getTeamMembers();
      setTeamMembers(teamResponse.data?.members || []);
    } catch (err) {
      console.error("[ScheduleInspection] Error loading data:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleIssueChange = (e) => {
    const issueId = e.target.value;
    const selectedIssue = issues.find((i) => i._id === issueId);
    setFormData((prev) => ({
      ...prev,
      issueId,
      location: selectedIssue?.location?.address || prev.location,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("[ScheduleInspection] Submitting inspection:", formData);

      // TODO: Backend team - Replace this mock with actual API call:
      // const response = await fetch('/api/officials/inspections', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      //   credentials: 'include'
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock success
      setSuccess(true);
      console.log("[ScheduleInspection] Inspection scheduled successfully");

      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          issueId: "",
          inspectorId: "",
          scheduledDate: "",
          scheduledTime: "",
          inspectionType: "initial",
          location: "",
          notes: "",
          notifyReporter: true,
        });
      }, 2000);
    } catch (err) {
      console.error("[ScheduleInspection] Error:", err);
      setError("Failed to schedule inspection. Please try again.");
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
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Search className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Schedule Inspection
              </h2>
              <p className="text-sm text-white/60">
                Arrange site visit for an issue
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
              Inspection Scheduled!
            </h3>
            <p className="text-white/60">The inspector has been notified.</p>
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
                Issue to Inspect
              </label>
              <select
                name="issueId"
                value={formData.issueId}
                onChange={handleIssueChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500/50 focus:outline-none"
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
                    {issue.title} - {issue.category}
                  </option>
                ))}
              </select>
            </div>

            {/* Inspector Selection */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Assign Inspector
              </label>
              <select
                name="inspectorId"
                value={formData.inspectorId}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500/50 focus:outline-none"
                required
              >
                <option value="" className="bg-gray-800">
                  Select inspector
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

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Inspection Date
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500/50 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Inspection Time
                </label>
                <input
                  type="time"
                  name="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-amber-500/50 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Inspection Type */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Inspection Type
              </label>
              <div className="flex gap-4">
                {[
                  { value: "initial", label: "Initial Assessment" },
                  { value: "followup", label: "Follow-up" },
                  { value: "final", label: "Final Verification" },
                ].map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="inspectionType"
                      value={type.value}
                      checked={formData.inspectionType === type.value}
                      onChange={handleChange}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-white/80">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Inspection Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter location address"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Notes for Inspector
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any special instructions or notes..."
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none resize-none"
              />
            </div>

            {/* Notify Reporter */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notifyReporter"
                  checked={formData.notifyReporter}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-amber-500 cursor-pointer"
                />
                <span className="text-sm text-white/80">
                  Notify the issue reporter about the scheduled inspection
                </span>
              </label>
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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    Schedule Inspection
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

export default ScheduleInspection;
