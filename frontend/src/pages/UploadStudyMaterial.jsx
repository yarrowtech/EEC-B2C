import React, { useState, useEffect } from "react";
import { Upload, FileText, Trash2, Pencil } from "lucide-react";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getToken() {
    return localStorage.getItem("jwt") || "";
}

export default function UploadStudyMaterial() {
    const emptyForm = {
        title: "",
        class: "",
        board: "CBSE",
        subject: "Maths",
        isFree: true,
        price: 0,
    };

    const [form, setForm] = useState(emptyForm);
    const [pdf, setPdf] = useState(null);
    const [loading, setLoading] = useState(false);
    const [materials, setMaterials] = useState([]);
    const [editId, setEditId] = useState(null);
    const ITEMS_PER_PAGE = 6;
    const [currentPage, setCurrentPage] = useState(1);
    const [existingPdfUrl, setExistingPdfUrl] = useState(null);

    useEffect(() => {
        fetchMaterials();
    }, []);

    async function fetchMaterials() {
        const res = await fetch(`${API}/api/study-materials/admin/all`, {
            headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        setMaterials(data || []);
    }

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!editId && !pdf) {
            toast.error("Please upload a PDF");
            return;
        }

        const data = new FormData();
        Object.entries(form).forEach(([k, v]) => data.append(k, v));
        if (pdf) data.append("pdf", pdf);

        try {
            setLoading(true);

            const url = editId
                ? `${API}/api/study-materials/${editId}`
                : `${API}/api/study-materials/upload`;

            const method = editId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${getToken()}` },
                body: data,
            });

            if (!res.ok) throw new Error();

            toast.success(editId ? "Material updated" : "Material uploaded");

            setForm(emptyForm);
            setPdf(null);
            setEditId(null);
            setExistingPdfUrl(null);

            fetchMaterials();
            setCurrentPage(1);
        } catch {
            toast.error("Action failed");
        } finally {
            setLoading(false);
        }
    }


    async function deleteMaterial(id) {
        if (!window.confirm("Delete this material permanently?")) return;

        try {
            const res = await fetch(`${API}/api/study-materials/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            // 🔥 Safely read response
            const text = await res.text();
            let data = {};

            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                data = {};
            }

            if (!res.ok) {
                throw new Error(data.message || "Delete failed");
            }

            toast.success(data.message || "Material deleted");
            fetchMaterials();
            setCurrentPage(1);
        } catch (err) {
            console.error("DELETE ERROR:", err);
            toast.error(err.message || "Delete failed");
        }
    }


    function editMaterial(m) {
        setEditId(m._id);
        setForm({
            title: m.title,
            class: m.class,
            board: m.board,
            subject: m.subject,
            isFree: m.isFree,
            price: m.price || 0,
        });
        setExistingPdfUrl(m.pdfUrl);
        setPdf(null); // important

        // 👇 Scroll to form so admin knows edit opened
        window.scrollTo({ top: 0, behavior: "smooth" });
    }


    const totalPages = Math.ceil(materials.length / ITEMS_PER_PAGE);

    const paginatedMaterials = materials.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    function getInlinePdfUrl(url) {
        if (!url) return "";
        // Force inline rendering for Cloudinary RAW PDFs
        return url.replace("/raw/upload/", "/raw/upload/fl_attachment:false/");
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="bg-gradient-to-r from-indigo-500 via-blue-600 to-sky-600 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full" />
                    <div className="absolute bottom-4 left-4 w-24 h-24 bg-white rounded-full" />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-8 h-8 text-indigo-200" />
                            <h1 className="text-3xl font-bold">Study Materials</h1>
                        </div>
                        <p className="text-indigo-100">
                            Upload, edit and manage all study materials
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-indigo-100 text-sm">Total Materials</p>
                        <p className="text-2xl font-bold">{materials.length}</p>
                    </div>
                </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* FREE MATERIALS */}
                <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-lg text-white">
                    {/* Decorative blob */}
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/20 rounded-full" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />

                    <div className="relative z-10">
                        <p className="text-sm text-green-100">Free Materials</p>
                        <p className="text-3xl font-extrabold mt-2">
                            {materials.filter(m => m.isFree).length}
                        </p>

                        <div className="mt-4 flex items-center gap-2 text-sm text-green-100">
                            <span className="bg-white/20 px-2 py-1 rounded-full">Accessible</span>
                            <span className="bg-white/20 px-2 py-1 rounded-full">No Cost</span>
                        </div>
                    </div>
                </div>

                {/* PAID MATERIALS */}
                <div className="relative overflow-hidden bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 p-6 rounded-2xl shadow-lg text-white">
                    {/* Decorative blob */}
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/20 rounded-full" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />

                    <div className="relative z-10">
                        <p className="text-sm text-yellow-100">Paid Materials</p>
                        <p className="text-3xl font-extrabold mt-2">
                            {materials.filter(m => !m.isFree).length}
                        </p>

                        <div className="mt-4 flex items-center gap-2 text-sm text-yellow-100">
                            <span className="bg-white/20 px-2 py-1 rounded-full">Premium</span>
                            <span className="bg-white/20 px-2 py-1 rounded-full">Unlocked</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* UPLOAD FORM */}
            <div className="relative overflow-hidden rounded-2xl shadow-lg border border-white/60 bg-white/70 backdrop-blur-md">

                {/* Gradient accent bar */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                {/* Decorative blobs */}
                <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-400/10 rounded-full blur-2xl" />

                <div className="relative p-6">

                    {/* HEADER */}
                    <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3 text-slate-800">
                        <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                            <Upload className="w-5 h-5" />
                        </span>
                        {editId ? "Edit Study Material" : "Upload Study Material"}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* TITLE */}
                        <div>
                            <label className="text-sm font-semibold text-slate-700">
                                Material Title
                            </label>
                            <input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="e.g. Algebra – Chapter 1 Notes"
                                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white/80"
                                required
                            />
                        </div>

                        {/* CLASS / BOARD / SUBJECT */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { name: "class", options: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8"] },
                                { name: "board", options: ["CBSE", "ICSE", "State Board"] },
                                { name: "subject", options: ["Maths", "Science", "English"] }
                            ].map((f) => (
                                <div key={f.name}>
                                    <label className="text-sm font-semibold text-slate-700 capitalize">
                                        {f.name}
                                    </label>
                                    <select
                                        name={f.name}
                                        value={form[f.name]}
                                        onChange={handleChange}
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 bg-white/80 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {f.options.map(o => (
                                            <option key={o}>{o}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        {/* FREE / PAID */}
                        <div className="flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-2 font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    name="isFree"
                                    checked={form.isFree}
                                    onChange={handleChange}
                                    className="accent-indigo-600 scale-110"
                                />
                                Free Material
                            </label>

                            {!form.isFree && (
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 font-semibold">₹</span>
                                    <input
                                        type="number"
                                        name="price"
                                        value={form.price}
                                        onChange={handleChange}
                                        className="rounded-xl border border-slate-200 px-3 py-2 w-32 focus:ring-2 focus:ring-yellow-500"
                                        placeholder="Price"
                                    />
                                </div>
                            )}
                        </div>
                        {editId && existingPdfUrl && (
                            <div className="border rounded-xl overflow-hidden bg-white">
                                <p className="text-sm font-semibold text-slate-700 px-3 py-2 bg-slate-100">
                                    Current PDF Preview
                                </p>

                                <iframe
                                    src={`https://docs.google.com/gview?url=${encodeURIComponent(existingPdfUrl)}&embedded=true`}
                                    className="w-full h-72"
                                    title="PDF Preview"
                                />
                            </div>
                        )}

                        {/* PDF UPLOAD */}
                        <div className="relative border-2 border-dashed rounded-2xl p-8 text-center bg-gradient-to-br from-slate-50 to-indigo-50 hover:border-indigo-400 transition">
                            <FileText className="mx-auto text-indigo-400 mb-3 w-8 h-8" />
                            <p className="text-sm font-medium text-slate-700 mb-1">
                                Upload PDF Study Material
                            </p>
                            <p className="text-xs text-slate-500 mb-3">
                                Only PDF files are allowed
                            </p>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => setPdf(e.target.files[0])}
                                className="mx-auto block text-sm"
                            />
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex gap-3 pt-2">
                            <button
                                disabled={loading}
                                className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white
                     bg-gradient-to-r from-blue-600 to-indigo-600
                     hover:from-blue-700 hover:to-indigo-700
                     shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {loading ? "Saving..." : editId ? "Update Material" : "Upload Material"}
                            </button>

                            {editId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditId(null);
                                        setForm(emptyForm);
                                        setPdf(null);
                                    }}
                                    className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                    </form>
                </div>
            </div>

            {/* MATERIALS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedMaterials.map((m) => (
                    <div
                        key={m._id}
                        className="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md
                 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.15)]
                 border border-white/60
                 hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.25)]
                 hover:-translate-y-1 transition-all duration-300"
                    >
                        {/* TOP GRADIENT STRIP */}
                        <div
                            className={`absolute inset-x-0 top-0 h-1.5 ${m.isFree
                                ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                : "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500"
                                }`}
                        />

                        {/* DECORATIVE BLOBS */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl" />

                        <div className="relative p-6">

                            {/* TITLE */}
                            <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                                {m.title}
                            </h3>

                            {/* META */}
                            <p className="text-sm text-slate-600 mt-1">
                                {m.class} • {m.board} • {m.subject}
                            </p>

                            {/* BADGE */}
                            <div className="mt-3">
                                <span
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full
              text-xs font-bold tracking-wide
              ${m.isFree
                                            ? "bg-green-100 text-green-700 border border-green-200"
                                            : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                        }`}
                                >
                                    {m.isFree ? "FREE ACCESS" : `₹ ${m.price}`}
                                </span>
                            </div>

                            {/* ACTIONS */}
                            <div className="mt-5 flex justify-end gap-2">
                                <button
                                    onClick={() => editMaterial(m)}
                                    className="p-2.5 rounded-xl
                       bg-blue-50 text-blue-600
                       hover:bg-blue-100
                       hover:scale-105 transition"
                                    title="Edit material"
                                >
                                    <Pencil size={16} />
                                </button>

                                <button
                                    onClick={() => deleteMaterial(m._id)}
                                    className="p-2.5 rounded-xl
                       bg-red-50 text-red-600
                       hover:bg-red-100
                       hover:scale-105 transition"
                                    title="Delete material"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {materials.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500">
                        <FileText className="w-10 h-10 mb-3 opacity-40" />
                        <p className="text-sm font-medium">
                            No study materials uploaded yet
                        </p>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-10">

                        {/* PREVIOUS */}
                        <button
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-xl border bg-white text-gray-700
                 hover:bg-gray-100 disabled:opacity-40"
                        >
                            Prev
                        </button>

                        {/* PAGE NUMBERS */}
                        {[...Array(totalPages)].map((_, i) => {
                            const page = i + 1;
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-4 py-2 rounded-xl font-semibold transition
            ${currentPage === page
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                                            : "bg-white border text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        {/* NEXT */}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-xl border bg-white text-gray-700
                 hover:bg-gray-100 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
