import React, { useRef, useState } from "react";
import { FiImage, FiUpload, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { uploadImage } from "../../lib/api";

export default function ExplanationEditor({
  explanation = "",
  explanationImage = "",
  onExplanationChange,
  onExplanationImageChange,
}) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleImageFile(file) {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      toast.warn("Please choose an image file");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        onExplanationImageChange(url);
        toast.success("Explanation image uploaded");
      } else {
        toast.error("Image upload failed");
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="font-bold text-slate-800 mb-2 block">Explanation (optional)</label>
        <textarea
          className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-300 min-h-24
                   focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
          placeholder="Add explanation text..."
          value={explanation}
          onChange={(e) => onExplanationChange(e.target.value)}
        />
      </div>

      <div>
        <label className="font-bold text-slate-800 mb-2 block">Explanation Image (optional)</label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="flex-1 min-w-[220px] rounded-xl px-4 py-2 bg-slate-50 border border-slate-300
                     focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Paste explanation image URL"
            value={explanationImage || ""}
            onChange={(e) => onExplanationImageChange(e.target.value)}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            <FiUpload size={16} />
            {uploading ? "Uploading..." : "Upload"}
          </button>
          {explanationImage && (
            <button
              type="button"
              onClick={() => onExplanationImageChange("")}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              <FiX size={14} />
              Remove
            </button>
          )}
        </div>
        {explanationImage && (
          <div className="mt-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
              <FiImage size={14} /> Preview
            </div>
            <img
              src={explanationImage}
              alt="Explanation"
              className="max-h-48 rounded-xl border border-slate-200 bg-white p-1"
            />
          </div>
        )}
      </div>
    </div>
  );
}
