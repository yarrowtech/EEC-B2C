import { useEffect, useState, useMemo } from "react";

export default function PurchasedProducts() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("material"); // material | video | test
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/api/users/me/purchased`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        });
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load purchased products", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [API]);

  const filtered = useMemo(
    () => items.filter((i) => i.type === activeTab),
    [items, activeTab]
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Purchased Products
      </h1>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {[
          { key: "material", label: "Materials" },
          { key: "video", label: "Videos" },
          { key: "test", label: "Tests" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              activeTab === t.key
                ? "bg-yellow-400 text-blue-950"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-gray-500">Loading purchased items…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-gray-500">
          No {activeTab} purchased yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.materialId}
              className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition"
            >
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {item.subject} • {item.class} • {item.board}
              </p>

              <button
                className="mt-3 text-sm font-semibold text-blue-600 hover:underline"
                onClick={() =>
                  window.open(`/dashboard/material/${item.materialId}`, "_blank")
                }
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
