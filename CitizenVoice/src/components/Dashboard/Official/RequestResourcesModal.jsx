// Request Resources Modal Component
import React, { useState, useEffect } from "react";
import {
  X,
  Package,
  Calendar,
  MapPin,
  AlertTriangle,
  Loader2,
  Check,
  Plus,
  Trash2,
  DollarSign,
} from "lucide-react";
import { issueService } from "../../../services/issueService";
import { cn } from "../../../lib/utils";

const RESOURCE_TYPES = [
  { value: "materials", label: "Materials", icon: "🧱" },
  { value: "equipment", label: "Equipment", icon: "🔧" },
  { value: "manpower", label: "Manpower", icon: "👷" },
  { value: "vehicles", label: "Vehicles", icon: "🚛" },
  { value: "tools", label: "Tools", icon: "🛠️" },
  { value: "safety-gear", label: "Safety Gear", icon: "🦺" },
  { value: "other", label: "Other", icon: "📦" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-emerald-400 bg-emerald-500/20" },
  { value: "medium", label: "Medium", color: "text-rose-400 bg-rose-500/20" },
  { value: "high", label: "High", color: "text-orange-400 bg-orange-500/20" },
  { value: "urgent", label: "Urgent", color: "text-red-400 bg-red-500/20" },
];

const COMMON_ITEMS = [
  { name: "Cement Bags", unit: "bags", estimatedCost: 350 },
  { name: "Asphalt Mix", unit: "kg", estimatedCost: 50 },
  { name: "Gravel", unit: "tons", estimatedCost: 2000 },
  { name: "Bricks", unit: "units", estimatedCost: 10 },
  { name: "Paint", unit: "liters", estimatedCost: 200 },
  { name: "PVC Pipes", unit: "units", estimatedCost: 150 },
  { name: "Safety Cones", unit: "units", estimatedCost: 100 },
  { name: "Barricades", unit: "units", estimatedCost: 500 },
];

export function RequestResourcesModal({
  isOpen,
  onClose,
  onSuccess,
  relatedIssue = null,
}) {
  const [formData, setFormData] = useState({
    title: "",
    requestType: "materials",
    priority: "medium",
    items: [],
    justification: "",
    deliveryLocation: {
      address: "",
      landmark: "",
    },
    requiredBy: "",
  });

  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 1,
    unit: "units",
    estimatedCost: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showCommonItems, setShowCommonItems] = useState(false);

  // Pre-fill from related issue if provided
  useEffect(() => {
    if (relatedIssue) {
      setFormData((prev) => ({
        ...prev,
        title: `Resources for: ${relatedIssue.title}`,
        deliveryLocation: {
          address: relatedIssue.location?.address || "",
          landmark: "",
        },
        justification: `Required for issue ${relatedIssue.issueId}: ${relatedIssue.title}`,
      }));
    }
  }, [relatedIssue]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("deliveryLocation.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        deliveryLocation: { ...prev.deliveryLocation, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addItem = () => {
    if (newItem.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, { ...newItem }],
      }));
      setNewItem({ name: "", quantity: 1, unit: "units", estimatedCost: 0 });
    }
  };

  const addCommonItem = (item) => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...item, quantity: 1 }],
    }));
    setShowCommonItems(false);
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItemQuantity = (index, quantity) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, quantity: parseInt(quantity) || 1 } : item
      ),
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (item.estimatedCost || 0) * (item.quantity || 1);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.items.length === 0) {
      setError("Please add at least one item to request");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        relatedIssueId: relatedIssue?._id,
      };

      await issueService.requestResources(payload);
      setSuccess(true);

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to submit resource request");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-violet-500">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Request Resources
              </h2>
              <p className="text-sm text-white/40">
                Request materials and equipment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Request Submitted!
            </h3>
            <p className="text-sm text-white/40">
              Your resource request is pending approval.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Related Issue Banner */}
            {relatedIssue && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
                <p className="text-xs text-rose-300">Related Issue:</p>
                <p className="text-sm text-white">
                  {relatedIssue.issueId} - {relatedIssue.title}
                </p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                Request Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter request title"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Resource Type & Priority */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Resource Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/60">
                  Resource Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {RESOURCE_TYPES.slice(0, 4).map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          requestType: type.value,
                        }))
                      }
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border p-2 transition-all",
                        formData.requestType === type.value
                          ? "border-rose-500 bg-rose-500/20 text-white"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                      )}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-[10px]">{type.label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {RESOURCE_TYPES.slice(4).map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          requestType: type.value,
                        }))
                      }
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border p-2 transition-all",
                        formData.requestType === type.value
                          ? "border-rose-500 bg-rose-500/20 text-white"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                      )}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-[10px]">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/60">
                  Priority
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, priority: p.value }))
                      }
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                        formData.priority === p.value
                          ? `border-transparent ${p.color}`
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Items List */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-white/60">
                  Items Required <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCommonItems(!showCommonItems)}
                  className="text-xs text-rose-400 hover:text-rose-300"
                >
                  {showCommonItems ? "Hide" : "+ Quick Add Common Items"}
                </button>
              </div>

              {/* Common Items Dropdown */}
              {showCommonItems && (
                <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/5 p-3 sm:grid-cols-4">
                  {COMMON_ITEMS.map((item, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => addCommonItem(item)}
                      className="rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white/60 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-white"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Items List */}
              {formData.items.length > 0 && (
                <div className="mb-3 space-y-2">
                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <span className="flex-1 text-sm text-white">
                        {item.name}
                      </span>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItemQuantity(index, e.target.value)
                        }
                        min={1}
                        className="w-16 rounded border border-white/10 bg-white/5 px-2 py-1 text-center text-sm text-white"
                      />
                      <span className="text-xs text-white/40">{item.unit}</span>
                      <span className="text-xs text-emerald-400">
                        ₹{(item.estimatedCost * item.quantity).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-white/60">
                      Estimated Total:
                    </span>
                    <span className="text-lg font-bold text-emerald-400">
                      ₹{calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Add Item Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Item name"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30"
                />
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 1,
                    }))
                  }
                  min={1}
                  className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center text-sm text-white"
                />
                <input
                  type="text"
                  value={newItem.unit}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, unit: e.target.value }))
                  }
                  placeholder="Unit"
                  className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white placeholder-white/30"
                />
                <input
                  type="number"
                  value={newItem.estimatedCost}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      estimatedCost: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="₹ Cost"
                  className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white placeholder-white/30"
                />
                <button
                  type="button"
                  onClick={addItem}
                  className="rounded-lg bg-rose-500/20 px-3 py-2 text-rose-400 hover:bg-rose-500/30"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Justification */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                Justification <span className="text-red-400">*</span>
              </label>
              <textarea
                name="justification"
                value={formData.justification}
                onChange={handleChange}
                placeholder="Why are these resources needed?"
                required
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500 focus:outline-none resize-none"
              />
            </div>

            {/* Delivery Location & Required By */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
                  <MapPin className="h-4 w-4" />
                  Delivery Location
                </label>
                <input
                  type="text"
                  name="deliveryLocation.address"
                  value={formData.deliveryLocation.address}
                  onChange={handleChange}
                  placeholder="Delivery address"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
                  <Calendar className="h-4 w-4" />
                  Required By <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="requiredBy"
                  value={formData.requiredBy}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-white/60 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-violet-500 px-6 py-3 text-sm font-medium text-white hover:shadow-lg hover:shadow-rose-500/25 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
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
}

export default RequestResourcesModal;
