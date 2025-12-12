// import React, { useState, useEffect } from "react";
// import {
//     User,
//     Mail,
//     Phone,
//     Calendar,
//     MapPin,
//     BookOpen,
//     Briefcase,
//     PenLine,
//     Camera,
// } from "lucide-react";

// function getUser() {
//     try {
//         return JSON.parse(localStorage.getItem("user") || "null");
//     } catch {
//         return null;
//     }
// }

// function getToken() {
//     return localStorage.getItem("jwt") || "";
// }

// const API =
//     import.meta.env.VITE_API_URL || "http://localhost:5000";

// export default function ProfilePage() {
//     const user = getUser();
//     // const user = JSON.parse(localStorage.getItem("user"));

//     const [form, setForm] = useState({
//         name: user?.name || "",
//         email: user?.email || "",
//         phone: user?.phone || "",
//         gender: user?.gender || "",
//         dob: user?.dob || "",
//         address: user?.address || "",
//         className: user?.className || "",
//         department: user?.department || "",
//         bio: user?.bio || "",
//         avatar: user?.avatar || "",
//         createdAt: user?.createdAt || "",
//         updatedAt: user?.updatedAt || "",
//         _id: user?._id || ""
//     });

//     const [saving, setSaving] = useState(false);
//     const [imagePreview, setImagePreview] = useState(user?.avatar || "");

//     /* ---------------- IMAGE UPLOAD ---------------- */
//     function handleImageUpload(e) {
//         const file = e.target.files[0];
//         if (!file) return;

//         const reader = new FileReader();
//         reader.onloadend = () => {
//             setImagePreview(reader.result);
//             setForm({ ...form, avatar: reader.result });
//         };
//         reader.readAsDataURL(file);
//     }

//     /* ---------------- SAVE PROFILE ---------------- */
//     async function saveProfile() {
//         try {
//             setSaving(true);

//             const res = await fetch(`${API}/users/update-profile`, {
//                 method: "PUT",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${getToken()}`,
//                 },
//                 body: JSON.stringify(form),
//             });

//             const data = await res.json();

//             if (!res.ok) {
//                 alert(data.message || "Update failed");
//                 return;
//             }

//             localStorage.setItem("user", JSON.stringify(data.user));

//             alert("Profile updated successfully!");
//         } catch (err) {
//             alert("Something went wrong!");
//         } finally {
//             setSaving(false);
//         }
//     }

//     /* ---------------- LOAD PROFILE FROM BACKEND ---------------- */
//     useEffect(() => {
//         async function loadProfile() {
//             try {
//                 const res = await fetch(`${API}/users/profile`, {
//                     headers: {
//                         Authorization: `Bearer ${getToken()}`,
//                     },
//                 });

//                 const data = await res.json();

//                 if (res.ok && data.user) {
//                     setForm(prev => ({
//                         ...prev,
//                         ...data.user
//                     }));

//                     if (data.user.avatar) {
//                         setImagePreview(data.user.avatar);
//                     }

//                     localStorage.setItem("user", JSON.stringify(data.user));
//                 }
//             } catch (err) {
//                 console.error("Failed to load profile", err);
//             }
//         }

//         loadProfile();
//     }, []);

//     return (
//         <div className="max-w-6xl mx-auto py-10">

//             <h1 className="text-3xl font-bold text-slate-800 mb-6">My Profile</h1>

//             {/* ================= GRID: FORM LEFT | PREVIEW RIGHT ================= */}
//             {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-10"> */}
//                 <div className="grid grid-cols-1 lg:grid-cols-1 gap-10">

//                 {/* ---------------- LEFT COLUMN: FORM ---------------- */}
//                 {/* <div className="rounded-3xl bg-white/70 backdrop-blur-xl p-8 shadow-xl space-y-6 border border-white/50">

//                     <Field label="Full Name" icon={<User size={18} />} value={form.name}
//                         onChange={(v) => setForm({ ...form, name: v })} />

//                     <Field label="Email" icon={<Mail size={18} />} value={form.email} disabled />

//                     <Field label="Phone Number" icon={<Phone size={18} />} value={form.phone}
//                         onChange={(v) => setForm({ ...form, phone: v })} />

//                     <SelectField label="Gender" value={form.gender}
//                         options={["Male", "Female", "Other"]}
//                         onChange={(v) => setForm({ ...form, gender: v })} />

//                     <Field label="Date of Birth" icon={<Calendar size={18} />} type="date"
//                         value={form.dob}
//                         onChange={(v) => setForm({ ...form, dob: v })} />

//                     <Field label="Address" icon={<MapPin size={18} />} value={form.address}
//                         onChange={(v) => setForm({ ...form, address: v })} />

//                     {user.role === "student" && (
//                         <Field
//                             label="Class / Grade"
//                             icon={<BookOpen size={18} />}
//                             value={form.className}
//                             onChange={(v) => setForm({ ...form, className: v })}
//                         />
//                     )}

//                     {user.role === "teacher" && (
//                         <Field
//                             label="Department"
//                             icon={<Briefcase size={18} />}
//                             value={form.department}
//                             onChange={(v) => setForm({ ...form, department: v })}
//                         />
//                     )}

//                     <TextAreaField
//                         label="About Me"
//                         icon={<PenLine size={18} />}
//                         value={form.bio}
//                         onChange={(v) => setForm({ ...form, bio: v })}
//                     />

//                     <div className="pt-3 flex justify-end">
//                         <button
//                             disabled={saving}
//                             onClick={saveProfile}
//                             className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg shadow-md hover:opacity-90 disabled:opacity-50"
//                         >
//                             {saving ? "Saving..." : "Save Changes"}
//                         </button>
//                     </div>
//                 </div> */}

//                 {/* ---------------- RIGHT COLUMN: LIVE PROFILE PREVIEW ---------------- */}
//                 <div className="rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden">

//                     <div className="relative w-full h-40 bg-gradient-to-r from-yellow-500 to-yellow-600"></div>

//                     <div className="px-6 pb-6 -mt-16">
//                         <div className="flex flex-col items-center">

//                             <div className="relative">
//                                 {imagePreview ? (
//                                     <img
//                                         src={imagePreview}
//                                         alt="avatar"
//                                         className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
//                                     />
//                                 ) : (
//                                     <div className="
//                                         w-32 h-32 rounded-full border-4 border-white shadow-xl 
//                                         bg-gradient-to-br from-amber-600 to-yellow-700 
//                                         flex items-center justify-center 
//                                         text-white text-5xl font-bold">
//                                         {form.name?.charAt(0)?.toUpperCase() || "U"}
//                                     </div>
//                                 )}

//                                 <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full cursor-pointer shadow">
//                                     <Camera size={18} className="text-blue-600" />
//                                 </label>
//                             </div>

//                             <h2 className="text-center text-2xl font-bold text-slate-800 mt-4">
//                                 {form.name}
//                             </h2>

//                             <span className="
//                                 mt-2 inline-block text-xs font-semibold 
//                                 bg-gradient-to-r from-yellow-400 to-orange-500 
//                                 text-white px-3 py-1 rounded-full shadow animate-pulse">
//                                 {/* Something cool loading here... */}
//                                 {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
//                             </span>
//                         </div>

//                         {/* ---------- DETAILS SECTION ---------- */}
//                         <div className="mt-6 space-y-4 text-slate-700 text-md bg-slate-50 rounded-2xl p-5 shadow-inner">

//                             <PreviewRow label="Email" value={form.email} />
//                             <PreviewRow label="Phone" value={form.phone} />
//                             <PreviewRow label="Gender" value={form.gender} />
//                             <PreviewRow label="Date of Birth" value={form.dob} />
//                             <PreviewRow label="Address" value={form.address} />

//                             {/* ⭐ NEW ADDED FIELDS */}
//                             <PreviewRow label="Role" value={user.role} />
//                             <PreviewRow label="User ID" value={form._id} />
//                             <PreviewRow 
//                                 label="Account Created" 
//                                 value={form.createdAt ? new Date(form.createdAt).toLocaleString() : "—"} 
//                             />
//                             <PreviewRow 
//                                 label="Last Updated" 
//                                 value={form.updatedAt ? new Date(form.updatedAt).toLocaleString() : "—"} 
//                             />

//                             {user.role === "student" && (
//                                 <PreviewRow label="Class / Grade" value={form.className} />
//                             )}

//                             {user.role === "teacher" && (
//                                 <PreviewRow label="Department" value={form.department} />
//                             )}

//                             <PreviewRow label="About Me" value={form.bio} />
//                         </div>
//                     </div>
//                 </div>

//             </div>
//         </div>
//     );
// }

// /* ----------------------- SMALL COMPONENTS ----------------------- */

// function Field({ label, icon, value, onChange, type = "text", disabled }) {
//     return (
//         <div>
//             <label className="text-sm font-semibold text-slate-700">{label}</label>

//             <div className="flex items-center mt-1 rounded-xl border bg-white px-3 py-3 shadow-sm gap-2">
//                 {icon}
//                 <input
//                     type={type}
//                     disabled={disabled}
//                     value={value}
//                     onChange={(e) => onChange?.(e.target.value)}
//                     className={`flex-1 bg-transparent outline-none ${disabled ? "text-slate-400" : ""}`}
//                 />
//             </div>
//         </div>
//     );
// }

// function SelectField({ label, value, options, onChange }) {
//     return (
//         <div>
//             <label className="text-sm font-semibold text-slate-700">{label}</label>
//             <select
//                 value={value}
//                 onChange={(e) => onChange(e.target.value)}
//                 className="mt-1 w-full rounded-xl border bg-white px-3 py-3 shadow-sm outline-none"
//             >
//                 <option value="">Select...</option>
//                 {options.map((op) => (
//                     <option key={op} value={op}>{op}</option>
//                 ))}
//             </select>
//         </div>
//     );
// }

// function TextAreaField({ label, icon, value, onChange }) {
//     return (
//         <div>
//             <label className="text-sm font-semibold text-slate-700">{label}</label>
//             <div className="flex gap-3 mt-1 rounded-xl border bg-white px-3 py-3 shadow-sm">
//                 {icon}
//                 <textarea
//                     rows={3}
//                     value={value}
//                     onChange={(e) => onChange(e.target.value)}
//                     className="flex-1 bg-transparent outline-none resize-none"
//                 />
//             </div>
//         </div>
//     );
// }

// function PreviewRow({ label, value }) {
//     return (
//         <div>
//             <p className="text-xs font-semibold text-slate-500">{label}</p>
//             <p className="text-slate-800">{value || "—"}</p>
//         </div>
//     );
// }


// Part 1 of 3 — ProfilePage.jsx (imports, helpers, state, loaders, handlers)
import React, { useEffect, useState, useRef } from "react";
import {
  User,
  Mail,
  AtSign,
  Lock,
  Camera,
  Check,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Shield,
  CreditCard,
  Coins,
  CameraOff,
  Briefcase,
} from "lucide-react";
import { getPoints } from "../lib/points"; // optional helper from your new design
import { ToastContainer, toast } from "react-toastify";

/* ------------------------- local helpers / API ------------------------- */
function getToken() {
  return localStorage.getItem("jwt") || "";
}
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ------------------------- component ------------------------- */
export default function ProfilePage() {
  const user = getUser();

  /* --------------- form state: keep your existing backend fields --------------- */
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
    fatherName: user?.fatherName || "",
    fatherOccupation: user?.fatherOccupation || "",
    motherName: user?.motherName || "",
    motherOccupation: user?.motherOccupation || "",
    fatherContact: user?.fatherContact || "",
    motherContact: user?.motherContact || "",
    _id: user?._id || "",
  });

  /* preview for uploaded image (dataURL) */
  const [imagePreview, setImagePreview] = useState(user?.avatar || "");
  const fileInputRef = useRef(null);
  const occupationOptions = [
    "Government Employee",
    "Private Job",
    "Business",
    "Teacher",
    "Farmer",
    "Driver",
    "Engineer",
    "Doctor",
    "Shopkeeper",
    "Retired",
    "Homemaker",
    "Others",
  ];


  /* UI state */
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("personal");
  const [points, setPointsState] = useState(0);

  /* load points (optional) */
  useEffect(() => {
    try {
      setPointsState(getPoints());
      // setPointsState(data.user.points || 0);
    } catch {
      setPointsState(0);
    }
    const onUpdate = (e) => setPointsState(e?.detail?.total ?? getPoints());
    window.addEventListener("points:update", onUpdate);
    return () => window.removeEventListener("points:update", onUpdate);
  }, []);

  /* ------------------- validation ------------------- */
  const validateField = (name, value) => {
    // shallow copy
    const newErrors = { ...errors };

    switch (name) {
      case "name":
        if (!value || value.trim().length < 2) {
          newErrors[name] = "Name must be at least 2 characters";
        } else {
          delete newErrors[name];
        }
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value || "")) {
          newErrors[name] = "Please enter a valid email address";
        } else {
          delete newErrors[name];
        }
        break;
      case "phone":
        const phoneRegex = /^\+?[\d\s()-]+$/;
        if (value && !phoneRegex.test(value)) {
          newErrors[name] = "Please enter a valid phone number";
        } else {
          delete newErrors[name];
        }
        break;
      case "className":
        // optional: enforce short length if present
        if (value && value.length > 50) {
          newErrors[name] = "Class name is too long";
        } else {
          delete newErrors[name];
        }
        break;
      case "department":
        if (value && value.length > 100) {
          newErrors[name] = "Department text is too long";
        } else {
          delete newErrors[name];
        }
        break;
      default:
        // keep other fields unvalidated for now
        break;
    }

    setErrors(newErrors);
  };

  /* ------------------- change handlers ------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  /* ------------------- image upload handler ------------------- */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // size limit 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: "Image size must be less than 5MB" }));
      return;
    }

    // set avatar file locally (we will convert to base64 for preview and send as dataURL)
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setForm((prev) => ({ ...prev, avatar: reader.result }));
      setErrors((prev) => {
        const n = { ...prev };
        delete n.avatar;
        return n;
      });
    };
    reader.readAsDataURL(file);
  };

  /* ------------------- load profile from backend (preserve existing logic) ------------------- */
  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const res = await fetch(`${API}/users/profile`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        const data = await res.json();

        if (res.ok && data.user && mounted) {
          setForm((prev) => ({ ...prev, ...data.user }));
          if (data.user.avatar) setImagePreview(data.user.avatar);
          setPointsState(data.user.points || 0);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    }

    loadProfile();
    return () => { mounted = false; };
  }, []);

  /* ------------------- save profile (preserve your saveProfile implementation) ------------------- */
  async function saveProfile() {
    try {
      setSaving(true);

      // Remove password fields before sending to backend
      const profileData = { ...form };
      delete profileData.password;
      delete profileData.oldPassword;
      delete profileData.newPassword;
      delete profileData.confirmPassword;

      const res = await fetch(`${API}/users/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Update failed");
        return;
      }

      setForm((prev) => ({ ...prev, ...data.user }));
      if (data.user.avatar) setImagePreview(data.user.avatar);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Something went wrong!");
    } finally {
      setSaving(false);
    }
  }


  /* ------------------- submit wrapper (client-side validation then save) ------------------- */
  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    // validate main fields
    ["name", "email", "phone", "className", "department"].forEach((k) => {
      validateField(k, form[k]);
    });

    // if validation errors exist, abort
    if (Object.keys(errors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    await saveProfile();
  };

  /* ------------------- small util: get initial for fallback avatar ------------------- */
  const getInitial = () => {
    const n = form.name || user?.name || "";
    return (n.split(" ")[0]?.charAt(0) || "U").toUpperCase();
  };


  async function changePassword() {
    try {
      if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
        return toast.error("Please fill all password fields");
      }

      if (form.newPassword !== form.confirmPassword) {
        return toast.error("New password and confirm password do not match");
      }

      const res = await fetch(`${API}/users/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          oldPassword: form.oldPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return toast.error(data.message || "Password change failed");
      }

      // Clear fields
      setForm(prev => ({
        ...prev,
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      toast.success("Password updated successfully!");
    } catch (err) {
      toast.error("Something went wrong");
    }
  }

  /* ------------------- End of Part 1 ------------------- */
  // Next: JSX UI layout (tabs, forms, preview) — I will send Part 2 now if you want.
  // Part 2 of 3 — JSX layout (header, sidebar, avatar preview, Personal tab UI)
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
      <ToastContainer />
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {(user.role?.charAt(0).toUpperCase() + user.role?.slice(1))} Portal
            </h1>
          </div>

          {/* <nav className="flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-yellow-600 transition-colors">Dashboard</a>
            <a href="#" className="text-gray-600 hover:text-yellow-600 transition-colors">Messages</a>
            <a href="#" className="text-gray-600 hover:text-yellow-600 transition-colors">Settings</a>
          </nav> */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl border border-yellow-100 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-8 py-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Profile Settings</h2>
              <p className="text-yellow-100">Manage your personal and account information</p>
            </div>
            {user?.role === "student" && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-200/80 text-amber-900 font-semibold shadow-sm">
                <Coins className="w-5 h-5 text-amber-700" />
                <span>{points} Points</span>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row w-full overflow-x-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4 md:p-6">
              <div className="flex flex-col items-center space-y-4 mb-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-yellow-300 shadow-lg bg-gray-100">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-amber-100">
                        <div className="text-yellow-700 text-4xl font-bold">
                          {getInitial()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* change image button */}
                  <button
                    type="button"
                    // onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
                    title="Change profile picture"
                  >
                    <Camera className="w-5 h-5" />
                  </button>

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                <h3 className="text-xl font-semibold text-gray-800">{form.name || "—"}</h3>
                <p className="text-gray-500 text-sm">{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Account</p>
                <div className="w-full max-w-md bg-white bg-opacity-70 backdrop-blur-md p-4 rounded-xl shadow-md border border-yellow-100 hover:shadow-lg transition-all duration-300">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="px-2 py-1 bg-yellow-100 rounded-lg text-yellow-700 text-sm font-bold">Bio</span>
                  </h4>

                  {user?.bio ? (
                    <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                  ) : (
                    <p className="text-gray-400 italic">No bio added yet.</p>
                  )}
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('personal')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'personal'
                    ? 'bg-yellow-100 text-yellow-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  Personal Information
                </button>

                {/* <button
                  type="button"
                  onClick={() => setActiveTab('account')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'account'
                    ? 'bg-yellow-100 text-yellow-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  Account Settings
                </button> */}

                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'security'
                    ? 'bg-yellow-100 text-yellow-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  Security
                </button>
              </nav>
            </aside>

            {/* Main Form Content */}
            <section className="flex-1 w-full p-4 md:p-8">
              {/* PERSONAL TAB */}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-800 border-b pb-3">Personal Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100'} focus:ring-4 bg-white`}
                          required
                        />
                      </div>
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="Enter your email address"
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100'} focus:ring-4 bg-white`}
                          required
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Phone Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="Enter your phone number"
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100'} focus:ring-4 bg-white`}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    {/* Semester / Class Field */}
                    {user.role === "student" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Class / Semester
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />

                        <select
                          name="className"
                          value={form.className}
                          onChange={handleChange}
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none ${errors.className
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100"
                            } focus:ring-4 bg-white`}
                        >
                          <option value="">Select Class</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={`Class ${i + 1}`}>
                              Class {i + 1}
                            </option>
                          ))}
                        </select>
                      </div>

                      {errors.className && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.className}
                        </p>
                      )}
                    </div>
                    )}

                    {/* Address Field */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="address"
                          value={form.address}
                          onChange={handleChange}
                          placeholder="Enter your address"
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none ${errors.address ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100'} focus:ring-4 bg-white`}
                        />
                      </div>
                    </div>

                    {/* DOB Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="date"
                          name="dob"
                          value={form.dob}
                          onChange={handleChange}
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none ${errors.dob ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100'} focus:ring-4 bg-white`}
                        />
                      </div>
                    </div>

                    {/* Gender Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Gender
                      </label>
                      <div className="relative">
                        <select
                          name="gender"
                          value={form.gender}
                          onChange={handleChange}
                          className={`w-full pl-4 pr-4 py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none ${errors.gender ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100'} focus:ring-4 bg-white`}
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Department (for teachers) */}
                    {/* <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Department
                      </label>
                      <div className="relative">
                        <BookOpen className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="department"
                          value={form.department}
                          onChange={handleChange}
                          placeholder="Department (for teachers)"
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none ${errors.department ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100'} focus:ring-4 bg-white`}
                        />
                      </div>
                    </div> */}
                    {/* ---------------- Parent Details Section ---------------- */}
                    {user.role === "student" && (
                    <div className="md:col-span-2 mt-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                        Parent Details
                      </h3>
                    </div>
                    )}

                    {/* ---------------------- FATHER SECTION ---------------------- */}
                    {user.role === "student" && (
                    <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Father Information</h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Father Name */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Father Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 
                          text-gray-400 w-5 h-5" />
                            <input
                              type="text"
                              name="fatherName"
                              value={form.fatherName}
                              onChange={handleChange}
                              placeholder="Enter father's name"
                              className="w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm outline-none 
                     border-gray-300 hover:border-yellow-400 focus:border-yellow-500 
                     focus:ring-yellow-100 focus:ring-4 bg-white"
                            />
                          </div>
                        </div>

                        {/* Father Occupation */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Father Occupation
                          </label>
                          <div className="relative">
                            <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 
                              text-gray-400 w-5 h-5" />
                            <select
                              name="fatherOccupation"
                              value={
                                occupationOptions.includes(form.fatherOccupation)
                                  ? form.fatherOccupation
                                  : "Others"
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "Others") {
                                  setForm((prev) => ({ ...prev, fatherOccupation: "" }));
                                } else {
                                  setForm((prev) => ({ ...prev, fatherOccupation: value }));
                                }
                              }}
                              className="w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm outline-none 
                     border-gray-300 hover:border-yellow-400 focus:border-yellow-500 
                     focus:ring-yellow-100 focus:ring-4 bg-white"
                            >
                              <option value="">Select Occupation</option>
                              {occupationOptions.map((job) => (
                                <option key={job} value={job}>
                                  {job}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Custom Father Occupation */}
                          {(!occupationOptions.includes(form.fatherOccupation) ||
                            form.fatherOccupation === "") && (
                              <input
                                type="text"
                                name="fatherOccupation"
                                value={form.fatherOccupation}
                                onChange={handleChange}
                                placeholder="Enter custom occupation"
                                className="mt-2 w-full pl-4 pr-4 py-3 border rounded-xl shadow-sm outline-none 
                     border-gray-300 hover:border-yellow-400 focus:border-yellow-500 
                     focus:ring-yellow-100 focus:ring-4 bg-white"
                              />
                            )}
                        </div>

                        {/* Father Contact Number */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Father Contact Number
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 
                          text-gray-400 w-5 h-5" />
                            <input
                              type="tel"
                              name="fatherContact"
                              value={form.fatherContact}
                              onChange={handleChange}
                              placeholder="Enter father's mobile number"
                              className="w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm outline-none 
                     border-gray-300 hover:border-yellow-400 focus:border-yellow-500 
                     focus:ring-yellow-100 focus:ring-4 bg-white"
                            />
                          </div>
                        </div>

                      </div>
                    </div>
                    )}
                    {/* ---------------------- MOTHER SECTION ---------------------- */}
                    {user.role === "student" && (
                    <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Mother Information</h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Mother Name */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Mother Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 
                        text-gray-400 w-5 h-5" />
                            <input
                              type="text"
                              name="motherName"
                              value={form.motherName}
                              onChange={handleChange}
                              placeholder="Enter mother's name"
                              className="w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm outline-none 
                     border-gray-300 hover:border-yellow-400 focus:border-yellow-500 
                     focus:ring-yellow-100 focus:ring-4 bg-white"
                            />
                          </div>
                        </div>

                        {/* Mother Occupation */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Mother Occupation
                          </label>
                          <div className="relative">
                            <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 
                              text-gray-400 w-5 h-5" />

                            <select
                              name="motherOccupation"
                              value={
                                occupationOptions.includes(form.motherOccupation)
                                  ? form.motherOccupation
                                  : "Others"
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "Others") {
                                  setForm((prev) => ({ ...prev, motherOccupation: "" }));
                                } else {
                                  setForm((prev) => ({ ...prev, motherOccupation: value }));
                                }
                              }}
                              className="w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm outline-none 
                     border-gray-300 hover:border-yellow-400 focus:border-yellow-500 
                     focus:ring-yellow-100 focus:ring-4 bg-white"
                            >
                              <option value="">Select Occupation</option>
                              {occupationOptions.map((job) => (
                                <option key={job} value={job}>
                                  {job}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Custom Mother Occupation */}
                          {(!occupationOptions.includes(form.motherOccupation) ||
                            form.motherOccupation === "") && (
                              <input
                                type="text"
                                name="motherOccupation"
                                value={form.motherOccupation}
                                onChange={handleChange}
                                placeholder="Enter custom occupation"
                                className="mt-2 w-full pl-4 pr-4 py-3 border rounded-xl shadow-sm outline-none 
                     border-gray-300 hover:border-yellow-400 focus:border-yellow-500 
                     focus:ring-yellow-100 focus:ring-4 bg-white"
                              />
                            )}
                        </div>

                        {/* Mother Contact Number */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Mother Contact Number
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 
                          text-gray-400 w-5 h-5" />
                            <input
                              type="tel"
                              name="motherContact"
                              value={form.motherContact}
                              onChange={handleChange}
                              placeholder="Enter mother's mobile number"
                              className="w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm outline-none 
                     border-gray-300 hover:border-yellow-400 focus:border-yellow-500 
                     focus:ring-yellow-100 focus:ring-4 bg-white"
                            />
                          </div>
                        </div>

                      </div>
                    </div>
                    )}




                    {/* About / Bio */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        About / Bio
                      </label>
                      <div className="relative">
                        <textarea
                          name="bio"
                          value={form.bio}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Tell us a bit about yourself"
                          className="w-full pl-4 pr-4 py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100 focus:ring-4 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ACCOUNT TAB (UI-only fields per Option A) */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-800 border-b pb-3">Account Settings</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Username (UI-only) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                      <div className="relative">
                        <AtSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="username"
                          value={form.username || ""}
                          onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="Choose a username"
                          className="w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100 bg-white"
                        />
                      </div>
                    </div>

                    {/* Language Preference (UI-only) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Language Preference</label>
                      <select
                        className="mt-1 w-full rounded-xl border bg-white px-3 py-3 shadow-sm outline-none"
                        value={form.language || "en"}
                        onChange={(e) => setForm(prev => ({ ...prev, language: e.target.value }))}
                      >
                        <option value="en">English</option>
                        <option value="bn">Bengali</option>
                        <option value="hi">Hindi</option>
                        <option value="ta">Tamil</option>
                      </select>
                    </div>

                    {/* Notification Preferences (UI-only) */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Notification Preferences
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="email-notifications"
                            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                            checked={form.emailNotifications ?? true}
                            onChange={(e) => setForm(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                          />
                          <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-700">
                            Email Notifications
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="sms-notifications"
                            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                            checked={form.smsNotifications ?? false}
                            onChange={(e) => setForm(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                          />
                          <label htmlFor="sms-notifications" className="ml-2 block text-sm text-gray-700">
                            SMS Notifications
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="push-notifications"
                            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                            checked={form.pushNotifications ?? true}
                            onChange={(e) => setForm(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                          />
                          <label htmlFor="push-notifications" className="ml-2 block text-sm text-gray-700">
                            Push Notifications
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-800 border-b pb-3">Security Settings</h3>

                  <div className="grid grid-cols-1 gap-6">

                    {/* Old Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Old Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="password"
                          name="oldPassword"
                          value={form.oldPassword || ""}
                          onChange={(e) => setForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                          placeholder="Enter old password"
                          className="w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm outline-none border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100 bg-white"
                        />
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="password"
                          name="newPassword"
                          value={form.newPassword || ""}
                          onChange={(e) => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new password"
                          className="w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm outline-none border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100 bg-white"
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={form.confirmPassword || ""}
                          onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm new password"
                          className="w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm outline-none border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100 bg-white"
                        />
                      </div>
                    </div>

                    {/* Change Password Button */}
                    {/* <button
                      type="button"
                      onClick={changePassword}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:opacity-90"
                    >
                      Update Password
                    </button> */}

                  </div>
                </div>
              )}

              {/* SUBMIT BUTTON (all tabs share same button) */}
              <div className="pt-6 mt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving || Object.keys(errors).length > 0}
                  className="w-full md:w-auto px-8 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 disabled:from-gray-300 disabled:to-gray-400 text-white py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {saving ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving Changes...
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </button>

                {/* SUCCESS MESSAGE */}
                {success && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                    <div className="bg-green-500 rounded-full p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-green-800 font-semibold">Profile Updated Successfully!</p>
                      <p className="text-green-700 text-sm">Your changes have been saved.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </form>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <p className="text-gray-600">© 2025 Student Portal. All rights reserved to EEC.</p>
            </div>

            {/* <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-600 hover:text-yellow-600 transition-colors">Terms</a>
              <a href="#" className="text-gray-600 hover:text-yellow-600 transition-colors">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-yellow-600 transition-colors">Help Center</a>
              <a href="#" className="text-gray-600 hover:text-yellow-600 transition-colors">Contact</a>
            </div> */}
          </div>
        </div>
      </footer>
    </div>
  );
}
