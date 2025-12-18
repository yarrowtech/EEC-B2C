import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import SecurePdfViewer from "../components/SecurePdfViewer";


export default function PurchasedMaterialView() {
  const { materialId } = useParams();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/api/materials/${materialId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        });
        const data = await res.json();
        setMaterial(data);
      } catch (err) {
        console.error("Failed to load material", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [API, materialId]);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading material…</div>;
  }

  if (!material) {
    return <div className="p-6 text-red-500">Material not found</div>;
  }

  return (
    <SecurePdfViewer
      pdfUrl={material.pdfUrl}
      subject={material.subject}
      title={material.title}
      onClose={() => window.history.back()}
    />
  );
}
