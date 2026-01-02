import React, { useState, useEffect } from "react";
import { Download, Search, Filter, Calendar, CreditCard, User, Package } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchPurchases();
  }, []);

  async function fetchPurchases() {
    try {
      setLoading(true);
      const response = await fetch(`${API}/api/study-materials/admin/purchases`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPurchases(data);
      } else {
        toast.error("Failed to fetch purchases");
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Error loading purchases");
    } finally {
      setLoading(false);
    }
  }

  async function downloadInvoice(purchaseId, invoiceNumber) {
    try {
      const response = await fetch(
        `${API}/api/study-materials/admin/purchases/${purchaseId}/invoice`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Invoice downloaded successfully");
      } else {
        toast.error("Failed to download invoice");
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Error downloading invoice");
    }
  }

  // Filter purchases
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.material?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.transactionId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPayment =
      paymentFilter === "All" || purchase.paymentMethod === paymentFilter;

    const matchesStatus =
      statusFilter === "All" || purchase.status === statusFilter;

    return matchesSearch && matchesPayment && matchesStatus;
  });

  const completedPurchases = purchases.filter((p) => p.status === "completed");
  const failedPurchases = purchases.filter((p) => p.status === "failed");
  const totalRevenue = completedPurchases.reduce((sum, p) => sum + p.amount, 0);
  const razorpayCount = purchases.filter((p) => p.paymentMethod === "Razorpay").length;
  const walletCount = purchases.filter((p) => p.paymentMethod === "Wallet").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <ToastContainer position="bottom-right" />

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-8 h-8 text-orange-500" />
              Purchase Records
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              View and manage all study material purchases
            </p>
          </div>

          <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-yellow-50 px-5 py-3 rounded-xl border border-orange-200">
            <div className="text-right">
              <p className="text-xs text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-orange-600">₹{totalRevenue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedPurchases.length}</p>
            </div>
            <Package className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{failedPurchases.length}</p>
            </div>
            <Package className="w-10 h-10 text-red-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Razorpay</p>
              <p className="text-2xl font-bold text-gray-900">{razorpayCount}</p>
            </div>
            <CreditCard className="w-10 h-10 text-purple-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Wallet</p>
              <p className="text-2xl font-bold text-gray-900">{walletCount}</p>
            </div>
            <CreditCard className="w-10 h-10 text-orange-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, material, invoice, or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Payment Method Filter */}
          <div className="sm:w-48 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="All">All Methods</option>
              <option value="Razorpay">Razorpay</option>
              <option value="Wallet">Wallet</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="All">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No purchases found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Invoice</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Material</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Payment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Transaction ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-semibold text-orange-600">
                        {purchase.invoiceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {purchase.user?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {purchase.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {purchase.material?.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {purchase.material?.subject} - Class {purchase.material?.class}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-green-600">
                        ₹{purchase.amount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          purchase.paymentMethod === "Razorpay"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {purchase.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          purchase.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : purchase.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {purchase.status === "completed" ? "Completed" : purchase.status === "failed" ? "Failed" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-gray-600">
                        {purchase.transactionId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(purchase.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {purchase.status === "completed" ? (
                        <button
                          onClick={() =>
                            downloadInvoice(purchase._id, purchase.invoiceNumber)
                          }
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <Download className="w-4 h-4" />
                          Invoice
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400 italic">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results count */}
      {!loading && filteredPurchases.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Showing {filteredPurchases.length} of {purchases.length} purchases
        </div>
      )}
    </div>
  );
}
