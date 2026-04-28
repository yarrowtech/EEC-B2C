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
  Gift,
  ShoppingBag,
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
const BIO_MAX_WORDS = 30;

function countWords(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function trimToWordLimit(text, maxWords) {
  const tokens = String(text || "").match(/\S+|\s+/g) || [];
  const out = [];
  let words = 0;

  for (const token of tokens) {
    if (/\S/.test(token)) {
      if (words >= maxWords) break;
      words += 1;
      out.push(token);
    } else {
      out.push(token);
    }
  }

  return out.join("").replace(/^\s+/, "");
}

function showPromotionPopup(newClass) {
  toast(
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="text-4xl animate-bounce">🎉</div>
      <h3 className="text-lg font-bold text-green-700">
        Congratulations!
      </h3>
      <p className="text-sm text-gray-700">
        You have been automatically promoted to
      </p>
      <span className="px-4 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold shadow">
        {newClass}
      </span>
    </div>,
    {
      position: "top-center",
      autoClose: 6000,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      theme: "light",
      className:
        "rounded-2xl shadow-2xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50",
    }
  );
}


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
    state: user?.state || "",
    className: user?.className || "",
    board: user?.board || "",
    schoolName: user?.schoolName || "",
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
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
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
  const [classOptions, setClassOptions] = useState([]);
  const [boardOptions, setBoardOptions] = useState([]);
  const [states, setStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redemptionHistory, setRedemptionHistory] = useState([]);
  const [giftCardAvailability, setGiftCardAvailability] = useState({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

  /* fetch class and board options from database */
  useEffect(() => {
    async function fetchClassAndBoardOptions() {
      try {
        // Fetch classes
        const classRes = await fetch(`${API}/api/classes`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        const classData = await classRes.json();

        if (classRes.ok && classData) {
          setClassOptions(classData);
        }

        // Fetch boards
        const boardRes = await fetch(`${API}/api/boards`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        const boardData = await boardRes.json();

        if (boardRes.ok && boardData) {
          setBoardOptions(boardData);
        }
      } catch (err) {
        console.error("Failed to fetch class and board options", err);
      }
    }

    if (user?.role === "student") {
      fetchClassAndBoardOptions();
    }
  }, [user?.role]);

  // Load Indian states (with graceful fallback)
  useEffect(() => {
    let mounted = true;
    async function loadStates() {
      try {
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries/states",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: "India" }),
          }
        );
        const json = await res.json();
        const list =
          json?.data?.states?.map((s) => s.name).filter(Boolean) || [];
        if (mounted) setStates(list);
      } catch (_err) {
        if (mounted)
          setStates([
            "Andhra Pradesh",
            "Arunachal Pradesh",
            "Assam",
            "Bihar",
            "Chhattisgarh",
            "Delhi",
            "Goa",
            "Gujarat",
            "Haryana",
            "Himachal Pradesh",
            "Jammu and Kashmir",
            "Jharkhand",
            "Karnataka",
            "Kerala",
            "Madhya Pradesh",
            "Maharashtra",
            "Manipur",
            "Meghalaya",
            "Mizoram",
            "Nagaland",
            "Odisha",
            "Punjab",
            "Rajasthan",
            "Sikkim",
            "Tamil Nadu",
            "Telangana",
            "Tripura",
            "Uttar Pradesh",
            "Uttarakhand",
            "West Bengal",
          ]);
      } finally {
        if (mounted) setLoadingStates(false);
      }
    }
    loadStates();
    return () => {
      mounted = false;
    };
  }, []);

  /* fetch redemption history */
  useEffect(() => {
    async function fetchRedemptionHistory() {
      try {
        const res = await fetch(`${API}/users/redemption-history`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        const data = await res.json();

        if (res.ok && data.redemptions) {
          setRedemptionHistory(data.redemptions);
        }
      } catch (err) {
        console.error("Failed to fetch redemption history", err);
      }
    }

    if (user?.role === "student" && activeTab === "rewards") {
      fetchRedemptionHistory();
    }
  }, [user?.role, activeTab]);

  /* fetch gift card availability */
  useEffect(() => {
    async function fetchGiftCardAvailability() {
      try {
        const res = await fetch(`${API}/users/gift-card-availability`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        const data = await res.json();

        if (res.ok && data.availability) {
          setGiftCardAvailability(data.availability);
        }
      } catch (err) {
        console.error("Failed to fetch gift card availability", err);
      }
    }

    if (user?.role === "student" && activeTab === "rewards") {
      fetchGiftCardAvailability();
    }
  }, [user?.role, activeTab]);

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
      case "bio":
        if (countWords(value) > BIO_MAX_WORDS) {
          newErrors[name] = `Bio can have up to ${BIO_MAX_WORDS} words`;
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
    const nextValue =
      name === "bio" ? trimToWordLimit(value, BIO_MAX_WORDS) : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    validateField(name, nextValue);
  };

  /* ------------------- image upload handler ------------------- */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, avatar: "Please select a valid image file" }));
      return;
    }

    // size limit 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: "Image size must be less than 5MB" }));
      return;
    }

    const previousPreview = imagePreview;
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setUploadingAvatar(true);

    (async () => {
      try {
        const uploadForm = new FormData();
        uploadForm.append("image", file);

        const uploadRes = await fetch(`${API}/api/upload/image`, {
          method: "POST",
          body: uploadForm,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData?.url) {
          throw new Error(uploadData?.message || "Image upload failed");
        }

        const profileRes = await fetch(`${API}/users/update-profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ avatar: uploadData.url }),
        });
        const profileData = await profileRes.json();
        if (!profileRes.ok) {
          throw new Error(profileData?.message || "Failed to save avatar");
        }

        setForm((prev) => ({ ...prev, avatar: profileData.user?.avatar || uploadData.url }));
        setImagePreview(profileData.user?.avatar || uploadData.url);
        localStorage.setItem("user", JSON.stringify(profileData.user));

        setErrors((prev) => {
          const n = { ...prev };
          delete n.avatar;
          return n;
        });

        toast.success("Profile photo updated");
      } catch (err) {
        setImagePreview(previousPreview || "");
        toast.error(err?.message || "Failed to upload profile photo");
      } finally {
        setUploadingAvatar(false);
        URL.revokeObjectURL(localPreview);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    })();
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

        // if (res.ok && data.user && mounted) {
        //   setForm((prev) => ({ ...prev, ...data.user }));
        //   if (data.user.avatar) setImagePreview(data.user.avatar);
        //   setPointsState(data.user.points || 0);
        //   localStorage.setItem("user", JSON.stringify(data.user));
        // }
        if (res.ok && data.user && mounted) {
          const oldUser = getUser();
          const oldClass = oldUser?.className || oldUser?.class || "";
          const newClass = data.user.className || "";

          setForm((prev) => ({ ...prev, ...data.user }));
          setImagePreview(data.user.avatar || "");
          setPointsState(data.user.points || 0);

          localStorage.setItem("user", JSON.stringify(data.user));

          // 🎉 AUTO PROMOTION POPUP
          if (
            user?.role === "student" &&
            oldClass &&
            newClass &&
            oldClass !== newClass
          ) {
            showPromotionPopup(newClass);
          }
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

  /* ------------------- redeem coins function ------------------- */
  async function redeemCoins(type, amount) {
    try {
      setRedeeming(true);

      const coinsNeeded = type === "cash" ? Math.ceil(amount * 20) : amount * 20;

      if (points < coinsNeeded) {
        toast.error("Insufficient coins for this redemption");
        setRedeeming(false);
        return;
      }

      const res = await fetch(`${API}/users/redeem-coins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          type,
          amount,
          coinsUsed: coinsNeeded,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Redemption failed");
        setRedeeming(false);
        return;
      }

      // Update points
      setPointsState(data.remainingPoints || points - coinsNeeded);
      setRedeemAmount("");

      // Refresh redemption history
      const historyRes = await fetch(`${API}/users/redemption-history`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const historyData = await historyRes.json();
      if (historyRes.ok && historyData.redemptions) {
        setRedemptionHistory(historyData.redemptions);
      }

      // Refresh gift card availability
      const availabilityRes = await fetch(`${API}/users/gift-card-availability`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const availabilityData = await availabilityRes.json();
      if (availabilityRes.ok && availabilityData.availability) {
        setGiftCardAvailability(availabilityData.availability);
      }

      toast.success(data.message || "Coins redeemed successfully!");
    } catch (err) {
      toast.error("Something went wrong during redemption");
    } finally {
      setRedeeming(false);
    }
  }

  /* ------------------- End of Part 1 ------------------- */
  // Next: JSX UI layout (tabs, forms, preview) — I will send Part 2 now if you want.
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(251,191,36,0.22),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.08),transparent_25%),radial-gradient(circle_at_70%_85%,rgba(16,185,129,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[-16%] h-72 bg-gradient-to-t from-amber-200/40 to-transparent blur-3xl" />
      <ToastContainer position="bottom-right" />
      {/* Header */}
      <ToastContainer position="bottom-right" />
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-20">

        {/* ── Profile Hero Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
          {/* Cover */}
          <div className="h-28 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-black/5 rounded-full" />
          </div>

          {/* Avatar + Name */}
          <div className="px-5 pb-5">
            <div className="flex items-end gap-4 -mt-12 mb-3">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-amber-100">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500">
                      <span className="text-3xl font-bold text-white">{getInitial()}</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 bg-slate-900 hover:bg-slate-700 text-white p-1.5 rounded-lg shadow-md disabled:opacity-50 transition-colors"
                  title="Change photo"
                >
                  {uploadingAvatar
                    ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Camera className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="pt-14 min-w-0">
                <h2 className="text-xl font-bold text-slate-900 leading-tight truncate">{form.name || "Your Name"}</h2>
                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-md capitalize mt-0.5">
                  {user?.role}
                </span>
              </div>
            </div>

            {form.bio && (
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{form.bio}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {form.email && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />{form.email}
                </span>
              )}
              {form.phone && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />{form.phone}
                </span>
              )}
              {user?.role === "student" && form.className && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />{form.className}
                </span>
              )}
              {user?.role === "student" && form.schoolName && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />{form.schoolName}
                </span>
              )}
              {user?.role === "student" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg font-semibold">
                  <Coins className="w-3.5 h-3.5" />{points} coins
                </span>
              )}
            </div>
            {errors.avatar && <p className="mt-2 text-xs text-red-500">{errors.avatar}</p>}
          </div>
        </div>

        {/* ── Tabs + Form Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Tab Bar */}
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {[
              { key: "personal", label: "Personal" },
              { key: "security", label: "Security" },
              ...(user?.role === "student" ? [{ key: "rewards", label: "Rewards" }] : []),
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`shrink-0 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6">
            {/* PERSONAL TAB */}
            {activeTab === "personal" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PField label="Full Name" required error={errors.name}>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      <input type="text" name="name" value={form.name} onChange={handleChange}
                        placeholder="Full name" className={iCls(errors.name) + " pl-9"} required />
                    </div>
                  </PField>

                  <PField label="Email Address" required error={errors.email}>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      <input type="email" name="email" value={form.email} onChange={handleChange}
                        placeholder="Email address" className={iCls(errors.email) + " pl-9"} required />
                    </div>
                  </PField>

                  <PField label="Phone Number" error={errors.phone}>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                        placeholder="Phone number" className={iCls(errors.phone) + " pl-9"} />
                    </div>
                  </PField>

                  <PField label="Date of Birth">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      <input type="date" name="dob" value={form.dob} onChange={handleChange}
                        className={iCls() + " pl-9"} />
                    </div>
                  </PField>

                  <PField label="Gender">
                    <select name="gender" value={form.gender} onChange={handleChange} className={iCls()}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </PField>

                  <PField label="State">
                    <select name="state" value={form.state} onChange={handleChange} disabled={loadingStates} className={iCls()}>
                      <option value="">{loadingStates ? "Loading..." : "Select State"}</option>
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </PField>

                  {user?.role === "student" && (
                    <>
                      <PField label="Class" error={errors.className}>
                        <div className="relative">
                          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                          <select name="className" value={form.className} onChange={handleChange}
                            className={iCls(errors.className) + " pl-9"}>
                            <option value="">Select Class</option>
                            {classOptions.length > 0
                              ? classOptions.map(c => <option key={c._id} value={c.name}>{c.name}</option>)
                              : Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={`Class ${i + 1}`}>Class {i + 1}</option>)}
                          </select>
                        </div>
                      </PField>

                      <PField label="Board" error={errors.board}>
                        <select name="board" value={form.board} onChange={handleChange} className={iCls(errors.board)}>
                          <option value="">Select Board</option>
                          {boardOptions.length > 0
                            ? boardOptions.map(b => <option key={b._id} value={b.name}>{b.name}</option>)
                            : <>
                                <option value="CBSE">CBSE</option>
                                <option value="ICSE">ICSE</option>
                                <option value="WB">West Bengal Board</option>
                                <option value="STATE">State Board</option>
                              </>}
                        </select>
                      </PField>

                      <PField label="School Name">
                        <input
                          type="text"
                          name="schoolName"
                          value={form.schoolName}
                          onChange={handleChange}
                          placeholder="Enter school name"
                          className={iCls()}
                        />
                      </PField>
                    </>
                  )}
                </div>

                <PField label="About / Bio">
                  <div className="relative">
                    <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                      placeholder="Tell us a bit about yourself"
                      className={iCls() + " resize-none"} />
                    <span className={`absolute bottom-2.5 right-3 text-xs font-medium pointer-events-none ${countWords(form.bio) >= BIO_MAX_WORDS ? "text-amber-500" : "text-slate-400"}`}>
                      {countWords(form.bio)}/{BIO_MAX_WORDS}
                    </span>
                  </div>
                </PField>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
              <div className="space-y-4 max-w-sm">
                <PField label="Current Password">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input type="password" value={form.oldPassword || ""}
                      onChange={e => setForm(p => ({ ...p, oldPassword: e.target.value }))}
                      placeholder="Current password" className={iCls() + " pl-9"} />
                  </div>
                </PField>
                <PField label="New Password">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input type="password" value={form.newPassword || ""}
                      onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))}
                      placeholder="New password" className={iCls() + " pl-9"} />
                  </div>
                </PField>
                <PField label="Confirm New Password">
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input type="password" value={form.confirmPassword || ""}
                      onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password" className={iCls() + " pl-9"} />
                  </div>
                </PField>
              </div>
            )}

            {/* REWARDS TAB */}
            {activeTab === "rewards" && user?.role === "student" && (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Coins className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Rewards Coming Soon</h3>
                <p className="text-sm text-slate-500 max-w-xs">Keep learning and earning coins. Rewards will be available shortly.</p>
                <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl mt-1">
                  <span className="text-sm font-bold text-amber-700">{points} coins earned</span>
                </div>
              </div>
            )}

            {/* Submit */}
            {activeTab !== "rewards" && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <button
                  type={activeTab === "security" ? "button" : "submit"}
                  onClick={activeTab === "security" ? changePassword : undefined}
                  disabled={saving}
                  className="px-7 py-2.5 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-semibold text-sm transition-all shadow-sm active:scale-95"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {activeTab === "security" ? "Changing..." : "Saving..."}
                    </span>
                  ) : activeTab === "security" ? "Change Password" : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function PField({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

function iCls(hasError) {
  return `w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-all bg-white ${
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
      : "border-slate-200 hover:border-amber-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
  }`;
}

