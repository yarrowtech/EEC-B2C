import React, { useState, useEffect } from "react";
import { Plus, Trash2, Eye, EyeOff, LayoutGrid } from "lucide-react";
import { toast } from "react-toastify";

export default function HeroSettings() {
    // LEFT SIDE CONTENT
    const [heading, setHeading] = useState("Personalized learning that adapts to you");
    const [paragraph, setParagraph] = useState(
        "AI-guided study paths, concept videos, and gamified progress — crafted to boost focus, reduce stress, and improve outcomes."
    );

    // RIGHT SIDE — FORM FIELDS
    const [formVisible, setFormVisible] = useState(true);
    const [formFields, setFormFields] = useState([
        { id: Date.now(), label: "Enter your name", type: "text", placeholder: "Enter your name", required: true }
    ]);

    function addField() {
        setFormFields([
            ...formFields,
            {
                id: Date.now(),
                label: "New Field",
                type: "text",
                placeholder: "Enter value",
                required: false,
            },
        ]);
    }

    function updateField(id, key, value) {
        setFormFields(
            formFields.map((f) => (f.id === id ? { ...f, [key]: value } : f))
        );
    }

    function deleteField(id) {
        setFormFields(formFields.filter((f) => f.id !== id));
    }

    async function saveData() {
        const payload = {
            heading,
            paragraph,
            formVisible,
            formFields,
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hero-settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            // alert("Saved Successfully!");
            toast.success("Hero section updated successfully!");
            console.log("Saved:", data);

        } catch (err) {
            console.error(err);
            alert("Save failed");
        }
    }


    async function saveData() {
        const payload = {
            heading,
            paragraph,
            formVisible,
            formFields,
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hero-settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            // alert("Saved Successfully!");
            toast.success("Hero section updated successfully!");
            console.log("Saved:", data);

        } catch (err) {
            console.error(err);
            alert("Save failed");
        }
    }


    return (
        <div className="space-y-6">

            {/* PAGE HEADER */}
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-yellow-600 to-orange-600 text-white flex items-center justify-center shadow">
                    <LayoutGrid size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Hero Section Settings</h1>
                    <p className="text-sm text-slate-500">Manage hero heading, paragraph & signup form</p>
                </div>
            </div>

            {/* GRID TWO COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* LEFT SIDE — HEADING & PARAGRAPH */}
                <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-2xl p-6 space-y-6 transition-all duration-300">

                    <h2 className="text-lg font-semibold text-slate-800 tracking-wide">
                        Left Section (Content)
                    </h2>

                    {/* Heading */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            Main Heading
                        </label>

                        <textarea
                            rows={2}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5
                       text-sm shadow-sm bg-white/70 focus:ring-2 focus:ring-indigo-500
                       outline-none transition-all duration-200"
                            value={heading}
                            onChange={(e) => setHeading(e.target.value)}
                        ></textarea>

                        <p className="text-[11px] text-slate-500 pl-1">
                            This text appears as your hero title.
                        </p>
                    </div>

                    {/* Paragraph */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            Paragraph
                        </label>

                        <textarea
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5
                       text-sm shadow-sm bg-white/70 focus:ring-2 focus:ring-indigo-500
                       outline-none transition-all duration-200"
                            value={paragraph}
                            onChange={(e) => setParagraph(e.target.value)}
                        ></textarea>

                        <p className="text-[11px] text-slate-500 pl-1">
                            This text appears under the main heading.
                        </p>
                    </div>

                </div>


                {/* RIGHT SIDE — FORM BUILDER */}
                <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-2xl p-6 space-y-6 transition-all duration-200">

                    {/* FORM HEADER */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800 tracking-wide">
                            Right Section (Form Builder)
                        </h2>

                        <div className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-slate-200 to-slate-100 text-slate-600 shadow-inner border border-slate-300 cursor-not-allowed">
                            Coming Soon
                        </div>
                    </div>

                    {/* COMING SOON BOX */}
                    <div className="w-full h-[220px] flex flex-col justify-center items-center rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 shadow-inner border border-gray-300 animate-pulse">

                        <div className="w-12 h-12 mb-3 flex items-center justify-center rounded-full bg-white shadow-lg">
                            <EyeOff size={24} className="text-gray-500" />
                        </div>

                        <p className="text-sm font-medium text-gray-700 tracking-wide">
                            Form Builder Module is Coming Soon...
                        </p>

                        <p className="text-[11px] text-gray-500 mt-1">
                            (Dynamic fields, dropdown manager, visibility controls)
                        </p>
                    </div>
                </div>

            </div>

            {/* SAVE BUTTON */}
            <div>
                <button
                    onClick={saveData}
                    className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700 transition"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
}
