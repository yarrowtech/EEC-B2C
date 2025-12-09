import React, { useState, useEffect } from "react";
import {
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    BookOpen,
    Briefcase,
    PenLine,
    Camera,
} from "lucide-react";

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

function getToken() {
    return localStorage.getItem("jwt") || "";
}

const API =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ProfilePage() {
    const user = getUser();
    // const user = JSON.parse(localStorage.getItem("user"));

    const [form, setForm] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        gender: user?.gender || "",
        dob: user?.dob || "",
        address: user?.address || "",
        className: user?.className || "",
        department: user?.department || "",
        bio: user?.bio || "",
        avatar: user?.avatar || "",
        createdAt: user?.createdAt || "",
        updatedAt: user?.updatedAt || "",
        _id: user?._id || ""
    });

    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState(user?.avatar || "");

    /* ---------------- IMAGE UPLOAD ---------------- */
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
            setForm({ ...form, avatar: reader.result });
        };
        reader.readAsDataURL(file);
    }

    /* ---------------- SAVE PROFILE ---------------- */
    async function saveProfile() {
        try {
            setSaving(true);

            const res = await fetch(`${API}/users/update-profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Update failed");
                return;
            }

            localStorage.setItem("user", JSON.stringify(data.user));

            alert("Profile updated successfully!");
        } catch (err) {
            alert("Something went wrong!");
        } finally {
            setSaving(false);
        }
    }

    /* ---------------- LOAD PROFILE FROM BACKEND ---------------- */
    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await fetch(`${API}/users/profile`, {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                });

                const data = await res.json();

                if (res.ok && data.user) {
                    setForm(prev => ({
                        ...prev,
                        ...data.user
                    }));

                    if (data.user.avatar) {
                        setImagePreview(data.user.avatar);
                    }

                    localStorage.setItem("user", JSON.stringify(data.user));
                }
            } catch (err) {
                console.error("Failed to load profile", err);
            }
        }

        loadProfile();
    }, []);

    return (
        <div className="max-w-6xl mx-auto py-10">

            <h1 className="text-3xl font-bold text-slate-800 mb-6">My Profile</h1>

            {/* ================= GRID: FORM LEFT | PREVIEW RIGHT ================= */}
            {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-10"> */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-10">

                {/* ---------------- LEFT COLUMN: FORM ---------------- */}
                {/* <div className="rounded-3xl bg-white/70 backdrop-blur-xl p-8 shadow-xl space-y-6 border border-white/50">

                    <Field label="Full Name" icon={<User size={18} />} value={form.name}
                        onChange={(v) => setForm({ ...form, name: v })} />

                    <Field label="Email" icon={<Mail size={18} />} value={form.email} disabled />

                    <Field label="Phone Number" icon={<Phone size={18} />} value={form.phone}
                        onChange={(v) => setForm({ ...form, phone: v })} />

                    <SelectField label="Gender" value={form.gender}
                        options={["Male", "Female", "Other"]}
                        onChange={(v) => setForm({ ...form, gender: v })} />

                    <Field label="Date of Birth" icon={<Calendar size={18} />} type="date"
                        value={form.dob}
                        onChange={(v) => setForm({ ...form, dob: v })} />

                    <Field label="Address" icon={<MapPin size={18} />} value={form.address}
                        onChange={(v) => setForm({ ...form, address: v })} />

                    {user.role === "student" && (
                        <Field
                            label="Class / Grade"
                            icon={<BookOpen size={18} />}
                            value={form.className}
                            onChange={(v) => setForm({ ...form, className: v })}
                        />
                    )}

                    {user.role === "teacher" && (
                        <Field
                            label="Department"
                            icon={<Briefcase size={18} />}
                            value={form.department}
                            onChange={(v) => setForm({ ...form, department: v })}
                        />
                    )}

                    <TextAreaField
                        label="About Me"
                        icon={<PenLine size={18} />}
                        value={form.bio}
                        onChange={(v) => setForm({ ...form, bio: v })}
                    />

                    <div className="pt-3 flex justify-end">
                        <button
                            disabled={saving}
                            onClick={saveProfile}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg shadow-md hover:opacity-90 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div> */}

                {/* ---------------- RIGHT COLUMN: LIVE PROFILE PREVIEW ---------------- */}
                <div className="rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden">

                    <div className="relative w-full h-40 bg-gradient-to-r from-yellow-500 to-yellow-600"></div>

                    <div className="px-6 pb-6 -mt-16">
                        <div className="flex flex-col items-center">

                            <div className="relative">
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="avatar"
                                        className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                                    />
                                ) : (
                                    <div className="
                                        w-32 h-32 rounded-full border-4 border-white shadow-xl 
                                        bg-gradient-to-br from-amber-600 to-yellow-700 
                                        flex items-center justify-center 
                                        text-white text-5xl font-bold">
                                        {form.name?.charAt(0)?.toUpperCase() || "U"}
                                    </div>
                                )}

                                <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full cursor-pointer shadow">
                                    <Camera size={18} className="text-blue-600" />
                                </label>
                            </div>

                            <h2 className="text-center text-2xl font-bold text-slate-800 mt-4">
                                {form.name}
                            </h2>

                            <span className="
                                mt-2 inline-block text-xs font-semibold 
                                bg-gradient-to-r from-yellow-400 to-orange-500 
                                text-white px-3 py-1 rounded-full shadow animate-pulse">
                                {/* Something cool loading here... */}
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                        </div>

                        {/* ---------- DETAILS SECTION ---------- */}
                        <div className="mt-6 space-y-4 text-slate-700 text-md bg-slate-50 rounded-2xl p-5 shadow-inner">

                            <PreviewRow label="Email" value={form.email} />
                            <PreviewRow label="Phone" value={form.phone} />
                            <PreviewRow label="Gender" value={form.gender} />
                            <PreviewRow label="Date of Birth" value={form.dob} />
                            <PreviewRow label="Address" value={form.address} />

                            {/* ⭐ NEW ADDED FIELDS */}
                            <PreviewRow label="Role" value={user.role} />
                            <PreviewRow label="User ID" value={form._id} />
                            <PreviewRow 
                                label="Account Created" 
                                value={form.createdAt ? new Date(form.createdAt).toLocaleString() : "—"} 
                            />
                            <PreviewRow 
                                label="Last Updated" 
                                value={form.updatedAt ? new Date(form.updatedAt).toLocaleString() : "—"} 
                            />

                            {user.role === "student" && (
                                <PreviewRow label="Class / Grade" value={form.className} />
                            )}

                            {user.role === "teacher" && (
                                <PreviewRow label="Department" value={form.department} />
                            )}

                            <PreviewRow label="About Me" value={form.bio} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

/* ----------------------- SMALL COMPONENTS ----------------------- */

function Field({ label, icon, value, onChange, type = "text", disabled }) {
    return (
        <div>
            <label className="text-sm font-semibold text-slate-700">{label}</label>

            <div className="flex items-center mt-1 rounded-xl border bg-white px-3 py-3 shadow-sm gap-2">
                {icon}
                <input
                    type={type}
                    disabled={disabled}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    className={`flex-1 bg-transparent outline-none ${disabled ? "text-slate-400" : ""}`}
                />
            </div>
        </div>
    );
}

function SelectField({ label, value, options, onChange }) {
    return (
        <div>
            <label className="text-sm font-semibold text-slate-700">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 w-full rounded-xl border bg-white px-3 py-3 shadow-sm outline-none"
            >
                <option value="">Select...</option>
                {options.map((op) => (
                    <option key={op} value={op}>{op}</option>
                ))}
            </select>
        </div>
    );
}

function TextAreaField({ label, icon, value, onChange }) {
    return (
        <div>
            <label className="text-sm font-semibold text-slate-700">{label}</label>
            <div className="flex gap-3 mt-1 rounded-xl border bg-white px-3 py-3 shadow-sm">
                {icon}
                <textarea
                    rows={3}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 bg-transparent outline-none resize-none"
                />
            </div>
        </div>
    );
}

function PreviewRow({ label, value }) {
    return (
        <div>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="text-slate-800">{value || "—"}</p>
        </div>
    );
}
