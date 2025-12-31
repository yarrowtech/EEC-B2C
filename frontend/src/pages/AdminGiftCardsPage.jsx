import React, { useState, useEffect } from "react";
import { Plus, Trash2, Upload, Package, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminGiftCardsPage() {
  const [giftCards, setGiftCards] = useState([]);
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "all", amount: "all" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Single add form
  const [singleForm, setSingleForm] = useState({
    code: "",
    amount: 100,
    provider: "Amazon",
    expiryDate: "",
    notes: "",
  });

  // Bulk add form
  const [bulkText, setBulkText] = useState("");

  useEffect(() => {
    fetchGiftCards();
    fetchInventory();
  }, [filter]);

  const getToken = () => localStorage.getItem("jwt");

  async function fetchGiftCards() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status !== "all") params.append("status", filter.status);
      if (filter.amount !== "all") params.append("amount", filter.amount);

      const res = await fetch(`${API}/api/gift-cards/all?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const data = await res.json();
      if (res.ok) {
        setGiftCards(data.giftCards || []);
      } else {
        toast.error(data.message || "Failed to fetch gift cards");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch gift cards");
    } finally {
      setLoading(false);
    }
  }

  async function fetchInventory() {
    try {
      const res = await fetch(`${API}/api/gift-cards/inventory`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const data = await res.json();
      if (res.ok) {
        setInventory(data.inventory || {});
      }
    } catch (err) {
      console.error("Inventory error:", err);
    }
  }

  async function handleAddSingle(e) {
    e.preventDefault();

    if (!singleForm.code.trim()) {
      toast.error("Please enter a gift card code");
      return;
    }

    try {
      const res = await fetch(`${API}/api/gift-cards/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(singleForm),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Gift card added successfully!");
        setShowAddModal(false);
        setSingleForm({
          code: "",
          amount: 100,
          provider: "Amazon",
          expiryDate: "",
          notes: "",
        });
        fetchGiftCards();
        fetchInventory();
      } else {
        toast.error(data.message || "Failed to add gift card");
      }
    } catch (err) {
      console.error("Add error:", err);
      toast.error("Failed to add gift card");
    }
  }

  async function handleBulkAdd(e) {
    e.preventDefault();

    if (!bulkText.trim()) {
      toast.error("Please enter gift card data");
      return;
    }

    try {
      // Parse bulk text (format: CODE,AMOUNT per line)
      const lines = bulkText.trim().split("\n");
      const giftCards = [];

      for (const line of lines) {
        const [code, amount] = line.split(",").map((s) => s.trim());
        if (code && amount) {
          giftCards.push({
            code,
            amount: parseInt(amount),
            provider: "Amazon",
          });
        }
      }

      if (giftCards.length === 0) {
        toast.error("No valid gift cards found");
        return;
      }

      const res = await fetch(`${API}/api/gift-cards/bulk-add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ giftCards }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setShowBulkModal(false);
        setBulkText("");
        fetchGiftCards();
        fetchInventory();
      } else {
        toast.error(data.message || "Failed to bulk add");
      }
    } catch (err) {
      console.error("Bulk add error:", err);
      toast.error("Failed to bulk add gift cards");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this gift card?")) {
      return;
    }

    try {
      const res = await fetch(`${API}/api/gift-cards/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Gift card deleted");
        fetchGiftCards();
        fetchInventory();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete gift card");
    }
  }

  async function handleUpdateStatus(id, newStatus) {
    try {
      const res = await fetch(`${API}/api/gift-cards/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Status updated");
        fetchGiftCards();
        fetchInventory();
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update status");
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      available: "bg-green-100 text-green-800 border-green-200",
      redeemed: "bg-blue-100 text-blue-800 border-blue-200",
      expired: "bg-red-100 text-red-800 border-red-200",
    };

    const icons = {
      available: <CheckCircle className="w-3 h-3" />,
      redeemed: <Package className="w-3 h-3" />,
      expired: <XCircle className="w-3 h-3" />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ToastContainer position="bottom-right" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gift Card Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage Amazon gift card inventory</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-semibold shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Add Single
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-semibold shadow-sm"
              >
                <Upload className="w-5 h-5" />
                Bulk Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[100, 250, 500, 1000].map((amount) => (
            <div key={amount} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">₹{amount}</h3>
                <Package className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-semibold text-green-600">{inventory[amount]?.available || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Redeemed:</span>
                  <span className="font-semibold text-blue-600">{inventory[amount]?.redeemed || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expired:</span>
                  <span className="font-semibold text-red-600">{inventory[amount]?.expired || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="redeemed">Redeemed</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <select
                value={filter.amount}
                onChange={(e) => setFilter({ ...filter, amount: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="all">All Amounts</option>
                <option value="100">₹100</option>
                <option value="250">₹250</option>
                <option value="500">₹500</option>
                <option value="1000">₹1000</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Gift Cards List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Redeemed By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-500" />
                      Loading gift cards...
                    </td>
                  </tr>
                ) : giftCards.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-lg font-semibold">No gift cards found</p>
                      <p className="text-sm">Add gift cards to get started</p>
                    </td>
                  </tr>
                ) : (
                  giftCards.map((card) => (
                    <tr key={card._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{card.code}</code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">₹{card.amount}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(card.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {card.redeemedBy ? (
                          <div>
                            <p className="font-medium">{card.redeemedBy.name}</p>
                            <p className="text-gray-500">{card.redeemedBy.email}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {card.redeemedAt ? new Date(card.redeemedAt).toLocaleDateString() : new Date(card.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {card.status === "available" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(card._id, "expired")}
                                className="text-orange-600 hover:text-orange-800 font-medium"
                              >
                                Mark Expired
                              </button>
                              <button
                                onClick={() => handleDelete(card._id)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {card.status === "expired" && (
                            <button
                              onClick={() => handleUpdateStatus(card._id, "available")}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              Mark Available
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Single Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Add Gift Card</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddSingle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gift Card Code *</label>
                <input
                  type="text"
                  value={singleForm.code}
                  onChange={(e) => setSingleForm({ ...singleForm, code: e.target.value })}
                  placeholder="AMZ-XXXX-XXXX-XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <select
                  value={singleForm.amount}
                  onChange={(e) => setSingleForm({ ...singleForm, amount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value={100}>₹100</option>
                  <option value={250}>₹250</option>
                  <option value={500}>₹500</option>
                  <option value={1000}>₹1000</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <input
                  type="text"
                  value={singleForm.provider}
                  onChange={(e) => setSingleForm({ ...singleForm, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={singleForm.expiryDate}
                  onChange={(e) => setSingleForm({ ...singleForm, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={singleForm.notes}
                  onChange={(e) => setSingleForm({ ...singleForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Batch #123, Purchased from..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold"
                >
                  Add Gift Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Bulk Add Gift Cards</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Format: CODE,AMOUNT (one per line)</p>
                  <p className="text-blue-600">Example:</p>
                  <code className="block bg-white px-2 py-1 rounded mt-1 text-xs">
                    AMZ-1111-2222-3333,100
                    <br />
                    AMZ-4444-5555-6666,250
                    <br />
                    AMZ-7777-8888-9999,500
                  </code>
                </div>
              </div>
            </div>

            <form onSubmit={handleBulkAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gift Card Data</label>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                  placeholder="AMZ-XXXX-XXXX-XXXX,100&#10;AMZ-YYYY-YYYY-YYYY,250"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold"
                >
                  Upload Gift Cards
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
