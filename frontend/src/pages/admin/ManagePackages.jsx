import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Package, Pencil, Trash2, Plus, Check, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ManagePackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "Basic",
    displayName: "",
    description: "",
    price: 0,
    duration: 30,
    features: "",
    unlockedStages: "",
    studyMaterialsAccess: "none",
    prioritySupport: false,
  });

  const token = localStorage.getItem("jwt");

  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/packages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPackages(data.packages || []);
    } catch (err) {
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  function resetForm() {
    setFormData({
      name: "Basic",
      displayName: "",
      description: "",
      price: 0,
      duration: 30,
      features: "",
      unlockedStages: "",
      studyMaterialsAccess: "none",
      prioritySupport: false,
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(pkg) {
    setFormData({
      name: pkg.name,
      displayName: pkg.displayName,
      description: pkg.description,
      price: pkg.price,
      duration: pkg.duration,
      features: pkg.features.join(", "),
      unlockedStages: pkg.unlockedStages.join(", "),
      studyMaterialsAccess: pkg.studyMaterialsAccess,
      prioritySupport: pkg.prioritySupport,
    });
    setEditingId(pkg._id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.displayName || !formData.description) {
      return toast.warn("Please fill all required fields");
    }

    try {
      const payload = {
        ...formData,
        features: formData.features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
        unlockedStages: formData.unlockedStages
          .split(",")
          .map((s) => parseInt(s.trim()))
          .filter((n) => !isNaN(n)),
      };

      const url = editingId
        ? `${API}/api/packages/${editingId}`
        : `${API}/api/packages`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save package");

      toast.success(editingId ? "Package updated!" : "Package created!");
      resetForm();
      loadPackages();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this package?")) return;

    try {
      await fetch(`${API}/api/packages/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Package deleted");
      loadPackages();
    } catch (err) {
      toast.error("Failed to delete package");
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <ToastContainer />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-2xl p-8 shadow-sm border border-purple-100">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
          <div className="p-3 bg-white rounded-xl shadow-md">
            <Package className="w-8 h-8 text-purple-500" />
          </div>
          Manage Packages
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Create and manage subscription packages for students
        </p>
      </div>

      {/* Add Package Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg font-semibold"
        >
          {showForm ? (
            <>
              <X size={20} /> Cancel
            </>
          ) : (
            <>
              <Plus size={20} /> Add New Package
            </>
          )}
        </button>
      </div>

      {/* Package Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-6 text-gray-800">
            {editingId ? "Edit Package" : "Create New Package"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Package Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Package Type
                </label>
                <select
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all"
                >
                  <option value="Basic">Basic</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="e.g., Basic - Stage 2 Access"
                  className="w-full border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (₹)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="299"
                  className="w-full border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration (days)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="30"
                  className="w-full border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all"
                />
              </div>

              {/* Unlocked Stages */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unlocked Stages (comma-separated)
                </label>
                <input
                  type="text"
                  name="unlockedStages"
                  value={formData.unlockedStages}
                  onChange={handleInputChange}
                  placeholder="1, 2, 3"
                  className="w-full border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all"
                />
              </div>

              {/* Study Materials Access */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Study Materials Access
                </label>
                <select
                  name="studyMaterialsAccess"
                  value={formData.studyMaterialsAccess}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all"
                >
                  <option value="none">None</option>
                  <option value="limited">Limited</option>
                  <option value="full">Full Access</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what this package includes..."
                rows="3"
                className="w-full border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all"
                required
              />
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Features (comma-separated)
              </label>
              <textarea
                name="features"
                value={formData.features}
                onChange={handleInputChange}
                placeholder="Stage 1 & 2 Access, Limited Study Materials, Email Support"
                rows="2"
                className="w-full border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none transition-all"
              />
            </div>

            {/* Priority Support */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="prioritySupport"
                checked={formData.prioritySupport}
                onChange={handleInputChange}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-400"
              />
              <label className="text-sm font-semibold text-gray-700">
                Priority Support
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg font-semibold"
              >
                {editingId ? "Update Package" : "Create Package"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Packages List */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Package size={20} />
            All Packages ({packages.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading packages...</div>
        ) : packages.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 font-medium">No packages created yet</p>
            <p className="text-sm text-gray-400">Create your first package above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {packages.map((pkg) => (
              <div
                key={pkg._id}
                className="border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-400 hover:shadow-lg transition-all"
              >
                {/* Package Header */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      pkg.name === "Premium"
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                        : pkg.name === "Intermediate"
                        ? "bg-gradient-to-r from-blue-400 to-cyan-500 text-white"
                        : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                    }`}
                  >
                    {pkg.name}
                  </span>
                  {pkg.prioritySupport && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                      Priority Support
                    </span>
                  )}
                </div>

                {/* Display Name */}
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {pkg.displayName}
                </h4>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-purple-600">
                    ₹{pkg.price}
                  </span>
                  <span className="text-gray-500 text-sm">
                    /{pkg.duration} days
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {pkg.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Unlocked Stages */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    Unlocked Stages:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {pkg.unlockedStages.map((stage) => (
                      <span
                        key={stage}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold"
                      >
                        {stage}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Study Materials */}
                <div className="mb-6">
                  <span className="text-xs font-semibold text-gray-500">
                    Study Materials:{" "}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      pkg.studyMaterialsAccess === "full"
                        ? "bg-green-100 text-green-700"
                        : pkg.studyMaterialsAccess === "limited"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {pkg.studyMaterialsAccess}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(pkg)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 rounded-lg hover:from-yellow-200 hover:to-amber-200 transition-all shadow-sm hover:shadow-md font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg._id)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-100 to-pink-100 text-red-700 rounded-lg hover:from-red-200 hover:to-pink-200 transition-all shadow-sm hover:shadow-md font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
