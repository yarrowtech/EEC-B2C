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
  Zap,
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
    className: user?.className || "",
    board: user?.board || "",
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
  const [redeeming, setRedeeming] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redemptionHistory, setRedemptionHistory] = useState([]);
  const [giftCardAvailability, setGiftCardAvailability] = useState({});

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
          if (data.user.avatar) setImagePreview(data.user.avatar);
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

      if (user?.role === "student") {
        delete profileData.className;
        delete profileData.board;
      }

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
  // Part 2 of 3 — JSX layout (header, sidebar, avatar preview, Personal tab UI)
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#fff9ec] via-[#fffef9] to-[#fef2d8]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(251,191,36,0.22),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.08),transparent_25%),radial-gradient(circle_at_70%_85%,rgba(16,185,129,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[-16%] h-72 bg-gradient-to-t from-amber-200/40 to-transparent blur-3xl" />
      <ToastContainer position="bottom-right" />
      {/* Header */}
      <header className="relative z-10 bg-white/85 backdrop-blur border-b border-amber-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-400 to-yellow-500 shadow-lg flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                Profile
              </p>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                {form.name || "Profile settings"}
              </h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200">
              {user?.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Account` : "User"}
            </span>
            {user.role === "student" && (
              <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-sm">
                {/* {form._id ? `Class • ${form.class}` : "ID Pending"} */}
                {form._id ? `${form.class}` : "ID Pending"}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Intro / Highlight */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 space-y-4 md:space-y-6">
        <div className="grid lg:grid-cols-[1.05fr,0.95fr] gap-4 md:gap-6">
          <div className="rounded-3xl bg-white/85 backdrop-blur border border-amber-100 shadow-xl p-5 md:p-6">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-amber-700 font-semibold">Welcome back</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                    {form.name || "Complete your profile"}
                  </h2>
                  <p className="text-sm md:text-base text-slate-600 mt-1 md:mt-2">
                    Keep your information fresh so we can personalise your learning journey.
                  </p>
                </div>
                <div className="hidden md:flex flex-col items-end text-right gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Last updated</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : "Not yet"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                  <Mail className="w-4 h-4 text-amber-600" />
                  {form.email || "Add your email"}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                  <Phone className="w-4 h-4 text-amber-600" />
                  {form.phone || "Add a phone"}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  {form.address || "Add address"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900 text-white p-5 md:p-6 shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-200/80 font-semibold">Account snapshot</p>
                <h3 className="text-2xl font-bold">{user?.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` : "User"}</h3>
                <p className="text-sm text-slate-200/90 mt-1">Stay on top of your profile in one glance.</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">

              {user.role === "student" && (
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3 flex flex-col gap-1">
                  <p className="text-[11px] uppercase tracking-wide text-amber-100/80 font-semibold">Class</p>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-200" />
                    <span className="text-lg font-semibold">
                      {user?.role === "teacher" ? (form.department || "Add dept") : (form.className || "—")}
                    </span>
                  </div>
                  <p className="text-xs text-amber-100/80">{user?.role === "teacher" ? "Teaching department" : ""}</p>
                </div>
              )}

              <div className="rounded-2xl bg-white/10 border border-white/10 p-3 flex flex-col gap-1">
                <p className="text-[11px] uppercase tracking-wide text-amber-100/80 font-semibold">
                  {user?.role === "student" ? "Board" : "Account Age"}
                </p>
                <div className="flex items-center gap-2">
                  {user?.role === "student" ? (
                    <>
                      <Shield className="w-4 h-4 text-amber-200" />
                      <span className="text-lg font-semibold">{form.board || "—"}</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 text-amber-200" />
                      <span className="text-lg font-semibold">
                        {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : "Not set"}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-amber-100/80">
                  {user?.role === "student" ? "" : "Joined the platform"}
                </p>
              </div>

              {user.role === "student" && (
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3 col-span-2 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-amber-100/80 font-semibold">Points</p>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-200" />
                      <span className="text-xl font-bold">{user?.role === "student" ? points : "—"}</span>
                    </div>
                    <p className="text-xs text-amber-100/80">
                      {user?.role === "student" ? "Earn more by completing your profile" : "Secure profile keeps data safe"}
                    </p>
                  </div>
                  <div className="hidden sm:block w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    {/* <Check className="w-6 h-6 text-amber-200" /> */}
                    <img src="/coin.png" alt="coin" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 md:pb-16">
        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-amber-100/80 overflow-hidden">
          <div className="flex flex-col lg:grid lg:grid-cols-[340px,1fr]">
            {/* Sidebar Navigation */}
            <aside className="bg-gradient-to-b from-white via-amber-50/70 to-white border-b lg:border-b-0 lg:border-r border-amber-100 p-5 md:p-6">
              <div className="flex flex-col items-center space-y-3 md:space-y-4">
                <div className="relative group">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-amber-200 shadow-xl bg-gray-100">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
                        <div className="text-amber-700 text-3xl sm:text-4xl font-bold">
                          {getInitial()}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-slate-900 hover:bg-slate-800 text-white p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
                    title="Change profile picture"
                  >
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                  /> */}
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900">{form.name || "—"}</h3>
                  <p className="text-slate-500 text-xs sm:text-sm">{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} account</p>
                </div>

                <div className="w-full bg-white/70 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-md border border-amber-100 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-1 bg-amber-100 rounded-lg text-amber-800 text-[11px] font-bold uppercase tracking-wide">Bio</span>
                    <span className="text-[11px] text-amber-700 font-semibold">
                      {form.updatedAt ? `Updated ${new Date(form.updatedAt).toLocaleDateString()}` : "Keep it fresh"}
                    </span>
                  </div>

                  {form.bio ? (
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed mt-2">{form.bio}</p>
                  ) : (
                    <p className="text-sm sm:text-base text-slate-400 italic mt-2">Add a short note about yourself</p>
                  )}
                </div>

                {/* <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="rounded-xl border border-amber-100 bg-white/80 p-3 flex flex-col">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">ID</span>
                    <span className="text-sm font-semibold text-slate-900 truncate">{form._id || "Pending"}</span>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-white/80 p-3 flex flex-col">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Role</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—"}
                    </span>
                  </div>
                </div> */}
              </div>

              <nav className="mt-6 space-y-2">
                <div className={`flex bg-amber-100/60 rounded-full p-1 gap-1 ${user?.role === "student" ? "grid grid-cols-3" : ""}`}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("personal")}
                    className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${activeTab === "personal"
                      ? "bg-white shadow text-amber-800"
                      : "text-amber-800/70 hover:bg-white/70"
                      }`}
                  >
                    Personal
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("security")}
                    className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${activeTab === "security"
                      ? "bg-white shadow text-amber-800"
                      : "text-amber-800/70 hover:bg-white/70"
                      }`}
                  >
                    Security
                  </button>
                  {user?.role === "student" && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("rewards")}
                      className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${activeTab === "rewards"
                        ? "bg-white shadow text-amber-800"
                        : "text-amber-800/70 hover:bg-white/70"
                        }`}
                    >
                      Rewards
                    </button>
                  )}
                </div>
              </nav>
            </aside>

            {/* Main Form Content */}
            <section className="flex-1 w-full bg-white/60 p-4 sm:p-6 lg:p-8">
              {/* PERSONAL TAB */}
              {activeTab === 'personal' && (
                <div className="space-y-5 md:space-y-7">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Personal</p>
                        <h3 className="text-xl md:text-2xl font-semibold text-slate-900">Information</h3>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Fields marked * are required
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-white/80 p-4 md:p-5 shadow-sm space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {/* Name Field */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100'} focus:ring-4 bg-white`}
                            required
                          />
                        </div>
                        {errors.name && (
                          <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            {errors.name}
                          </p>
                        )}
                      </div>

                      {/* Email Field */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Enter your email address"
                            className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100'} focus:ring-4 bg-white`}
                            required
                          />
                        </div>
                        {errors.email && (
                          <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Phone Field */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="Enter your phone number"
                            className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100'} focus:ring-4 bg-white`}
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      {/* Semester / Class Field */}
                      {/* Class / Semester + Board (Student only) */}
                      {user.role === "student" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">

                          {/* Class / Semester */}
                          <div>
                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                              Class
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />

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
                                {classOptions.length > 0 ? (
                                  classOptions.map((cls) => (
                                    <option key={cls._id} value={cls.name}>
                                      {cls.name}
                                    </option>
                                  ))
                                ) : (
                                  Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={`Class ${i + 1}`}>
                                      Class {i + 1}
                                    </option>
                                  ))
                                )}
                              </select>
                              {/* <select
                                name="className"
                                value={form.className}
                                disabled
                                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl bg-gray-100 text-sm sm:text-base"
                              >
                                <option>{form.className}</option>
                              </select> */}
                            </div>
                            {/* <p className="text-xs text-gray-500 mt-1">
                              Class is auto-promoted based on board rules
                            </p> */}

                            {errors.className && (
                              <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                {errors.className}
                              </p>
                            )}
                          </div>

                          {/* Board */}
                          <div>
                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                              Board
                            </label>
                            <div className="relative">
                              <BookOpen className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />

                              <select
                                name="board"
                                value={form.board}
                                onChange={handleChange}
                                className={`w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none ${errors.board
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                  : "border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100"
                                  } focus:ring-4 bg-white`}
                              >
                                <option value="">Select Board</option>
                                {boardOptions.length > 0 ? (
                                    boardOptions.map((board) => (
                                      <option key={board._id} value={board.name}>
                                        {board.name}
                                      </option>
                                    ))
                                ) : (
                                  <>
                                    <option value="CBSE">CBSE</option>
                                    <option value="ICSE">ICSE</option>
                                    <option value="WB">West Bengal Board</option>
                                    <option value="STATE">State Board</option>
                                  </>
                                )}
                              </select>
                              {/* <select
                                name="board"
                                value={form.board}
                                disabled
                                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl bg-gray-100 cursor-not-allowed text-sm sm:text-base"
                              >
                                <option>{form.board}</option>
                              </select> */}
                            </div>

                            {errors.board && (
                              <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                {errors.board}
                              </p>
                            )}
                          </div>

                        </div>
                      )}



                      {/* Address Field */}
                      <div className="md:col-span-2">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                          Address
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="text"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="Enter your address"
                            className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${errors.address ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100'} focus:ring-4 bg-white`}
                          />
                        </div>
                      </div>

                      {/* DOB Field */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                          Date of Birth
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="date"
                            name="dob"
                            value={form.dob}
                            onChange={handleChange}
                            className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${errors.dob ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100'} focus:ring-4 bg-white`}
                          />
                        </div>
                      </div>

                      {/* Gender Field */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                          Gender
                        </label>
                        <div className="relative">
                          <select
                            name="gender"
                            value={form.gender}
                            onChange={handleChange}
                            className={`w-full pl-3 sm:pl-4 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base ${errors.gender ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100'} focus:ring-4 bg-white`}
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
                        <div className="md:col-span-2 mt-3 md:mt-4">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 md:mb-3 border-b pb-2">
                            Parent Details
                          </h3>
                        </div>
                      )}

                      {/* ---------------------- FATHER SECTION ---------------------- */}
                      {user.role === "student" && (
                        <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4 mb-4 md:mb-6">
                          <h4 className="text-sm sm:text-md font-semibold text-gray-800 mb-2 md:mb-3">Father Information</h4>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

                            {/* Father Name */}
                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                                Father Name
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2
                          text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                <input
                                  type="text"
                                  name="fatherName"
                                  value={form.fatherName}
                                  onChange={handleChange}
                                  placeholder="Enter father's name"
                                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm outline-none text-sm sm:text-base
                     border-gray-300 hover:border-yellow-400 focus:border-yellow-500
                     focus:ring-yellow-100 focus:ring-4 bg-white"
                                />
                              </div>
                            </div>

                            {/* Father Occupation */}
                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                                Father Occupation
                              </label>
                              <div className="relative">
                                <Briefcase className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2
                              text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
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
                                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm outline-none text-sm sm:text-base
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
                                    className="mt-2 w-full pl-3 sm:pl-4 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm outline-none text-sm sm:text-base
                     border-gray-300 hover:border-yellow-400 focus:border-yellow-500
                     focus:ring-yellow-100 focus:ring-4 bg-white"
                                  />
                                )}
                            </div>

                            {/* Father Contact Number */}
                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                                Father Contact Number
                              </label>
                              <div className="relative">
                                <Phone className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2
                          text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                <input
                                  type="tel"
                                  name="fatherContact"
                                  value={form.fatherContact}
                                  onChange={handleChange}
                                  placeholder="Enter father's mobile number"
                                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm outline-none text-sm sm:text-base
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
                        <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4">
                          <h4 className="text-sm sm:text-md font-semibold text-gray-800 mb-2 md:mb-3">Mother Information</h4>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

                            {/* Mother Name */}
                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                                Mother Name
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2
                        text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                <input
                                  type="text"
                                  name="motherName"
                                  value={form.motherName}
                                  onChange={handleChange}
                                  placeholder="Enter mother's name"
                                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm outline-none text-sm sm:text-base
                     border-gray-300 hover:border-yellow-400 focus:border-yellow-500
                     focus:ring-yellow-100 focus:ring-4 bg-white"
                                />
                              </div>
                            </div>

                            {/* Mother Occupation */}
                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                                Mother Occupation
                              </label>
                              <div className="relative">
                                <Briefcase className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2
                              text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />

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
                                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm outline-none text-sm sm:text-base
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
                                    className="mt-2 w-full pl-3 sm:pl-4 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm outline-none text-sm sm:text-base
                     border-gray-300 hover:border-yellow-400 focus:border-yellow-500
                     focus:ring-yellow-100 focus:ring-4 bg-white"
                                  />
                                )}
                            </div>

                            {/* Mother Contact Number */}
                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                                Mother Contact Number
                              </label>
                              <div className="relative">
                                <Phone className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2
                          text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                <input
                                  type="tel"
                                  name="motherContact"
                                  value={form.motherContact}
                                  onChange={handleChange}
                                  placeholder="Enter mother's mobile number"
                                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm outline-none text-sm sm:text-base
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
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                          About / Bio
                        </label>
                        <div className="relative">
                          <textarea
                            name="bio"
                            value={form.bio}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Tell us a bit about yourself"
                            className="w-full pl-3 sm:pl-4 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm transition-all duration-200 outline-none text-sm sm:text-base border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100 focus:ring-4 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ACCOUNT TAB (UI-only fields per Option A) */}
              {activeTab === 'account' && (
                <div className="space-y-5 md:space-y-7">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <AtSign className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Account</p>
                      <h3 className="text-xl md:text-2xl font-semibold text-slate-900">Preferences</h3>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-white/80 p-4 md:p-5 shadow-sm space-y-5">
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
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === 'security' && (
                <div className="space-y-5 md:space-y-7">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-slate-900 text-amber-200 flex items-center justify-center shadow-sm">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Security</p>
                      <h3 className="text-xl md:text-2xl font-semibold text-slate-900">Password & access</h3>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-white/80 p-4 md:p-5 shadow-sm space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                      {/* Old Password */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Old Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="password"
                            name="oldPassword"
                            value={form.oldPassword || ""}
                            onChange={(e) => setForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                            placeholder="Enter old password"
                            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm outline-none text-sm sm:text-base border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100 bg-white"
                          />
                        </div>
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="password"
                            name="newPassword"
                            value={form.newPassword || ""}
                            onChange={(e) => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Enter new password"
                            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm outline-none text-sm sm:text-base border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100 bg-white"
                          />
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Confirm New Password</label>
                        <div className="relative">
                          <Shield className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword || ""}
                            onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirm new password"
                            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl shadow-sm outline-none text-sm sm:text-base border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* REWARDS TAB */}
              {activeTab === 'rewards' && user?.role === "student" && (
                <div className="space-y-5 md:space-y-7">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white flex items-center justify-center shadow-sm">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Rewards</p>
                      <h3 className="text-xl md:text-2xl font-semibold text-slate-900">Redeem Your Coins</h3>
                    </div>
                  </div>

                  {/* Coin Balance Card */}
                  <div className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-amber-200/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-200/20 rounded-full blur-3xl"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-xl">
                              <Coins className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Available Balance</p>
                              <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                                  {points.toLocaleString()}
                                </span>
                                <span className="text-sm font-bold text-amber-600">Coins</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-amber-200">
                            <div className="flex-1">
                              <p className="text-xs text-slate-600 font-semibold mb-1">Wallet Value</p>
                              <p className="text-2xl font-black text-green-600">₹{(points / 20).toFixed(2)}</p>
                            </div>
                            <div className="h-12 w-px bg-amber-200"></div>
                            <div className="flex-1">
                              <p className="text-xs text-slate-600 font-semibold mb-1">Total Earned</p>
                              <p className="text-2xl font-black text-blue-600">{points.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="hidden lg:block">
                          <img src="/coin.png" alt="coins" className="w-32 h-32 opacity-90 animate-pulse" />
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-5 bg-white/50 rounded-full h-4 overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 rounded-full transition-all duration-700 shadow-lg"
                          style={{ width: `${Math.min((points / 20000) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-amber-700 mt-2 text-center font-bold">
                        {points >= 20000 ? "🎉 Max tier reached! Unlock all rewards!" : `${(20000 - points).toLocaleString()} more coins to unlock ₹1000 gift card`}
                      </p>
                    </div>
                  </div>

                  {/* Conversion Rate Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 p-5 shadow-lg hover:shadow-xl transition-all hover:scale-105 duration-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-xs font-extrabold text-blue-900 uppercase tracking-wide">Exchange Rate</p>
                      </div>
                      <p className="text-lg font-black text-blue-700">10 Coins = ₹0.50</p>
                      <p className="text-xs text-blue-600 mt-1">Perfect for small redemptions</p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-5 shadow-lg hover:shadow-xl transition-all hover:scale-105 duration-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-xs font-extrabold text-purple-900 uppercase tracking-wide">Exchange Rate</p>
                      </div>
                      <p className="text-lg font-black text-purple-700">20 Coins = ₹1.00</p>
                      <p className="text-xs text-purple-600 mt-1">Standard conversion rate</p>
                    </div>
                  </div>

                  {/* Redemption Options */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-800">Redemption Options</h4>

                    {/* Cash Redemption for Study Materials */}
                    <div className="rounded-2xl border border-amber-100 bg-white/80 p-4 md:p-5 shadow-sm">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-semibold text-slate-900">Study Material Purchase</h5>
                          <p className="text-sm text-slate-600 mt-1">Use your coins as credit when buying study materials</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Enter Amount (₹)
                          </label>
                          <input
                            type="number"
                            value={redeemAmount}
                            onChange={(e) => setRedeemAmount(e.target.value)}
                            placeholder="Enter amount in rupees"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 bg-white"
                            min="0.5"
                            step="0.5"
                          />
                          {redeemAmount && (
                            <p className="text-xs text-slate-600 mt-2">
                              Required: <span className="font-semibold text-amber-700">{Math.ceil(parseFloat(redeemAmount) * 20)} coins</span>
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => redeemCoins("cash", parseFloat(redeemAmount))}
                          disabled={redeeming || !redeemAmount || parseFloat(redeemAmount) < 0.5}
                          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {redeeming ? "Processing..." : "Redeem for Study Materials"}
                        </button>
                      </div>
                    </div>

                    {/* Amazon Gift Card */}
                    <div className="rounded-2xl border border-amber-100 bg-white/80 p-4 md:p-5 shadow-sm">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <Gift className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-semibold text-slate-900">Amazon Gift Card</h5>
                          <p className="text-sm text-slate-600 mt-1">Redeem coins for Amazon gift vouchers</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { amount: 100, coins: 2000 },
                          { amount: 250, coins: 5000 },
                          { amount: 500, coins: 10000 },
                          { amount: 1000, coins: 20000 },
                        ].map((option) => {
                          const isAvailable = giftCardAvailability[option.amount]?.available;
                          const availableCount = giftCardAvailability[option.amount]?.count || 0;
                          const canRedeem = points >= option.coins && isAvailable;

                          return (
                            <button
                              key={option.amount}
                              type="button"
                              onClick={() => redeemCoins("giftcard", option.amount)}
                              disabled={redeeming || !canRedeem}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 relative ${
                                canRedeem
                                  ? "border-amber-300 bg-amber-50 hover:bg-amber-100 hover:border-amber-400"
                                  : "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                              }`}
                            >
                              {isAvailable && availableCount <= 5 && availableCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                  {availableCount} left
                                </span>
                              )}
                              <div className="text-center">
                                <p className="text-lg font-bold text-slate-900">₹{option.amount}</p>
                                <p className="text-xs text-slate-600 mt-1">{option.coins} coins</p>
                                {!isAvailable && (
                                  <p className="text-xs text-red-600 mt-1 font-semibold">Out of stock</p>
                                )}
                                {isAvailable && points < option.coins && (
                                  <p className="text-xs text-red-600 mt-1">Need {option.coins - points} more</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Redemption History */}
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-slate-800 mb-4">Redemption History</h4>

                      {redemptionHistory.length === 0 ? (
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center">
                          <p className="text-sm text-slate-500">No redemptions yet</p>
                          <p className="text-xs text-slate-400 mt-1">Your redemption history will appear here</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {redemptionHistory.map((redemption) => (
                            <div
                              key={redemption._id}
                              className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={`p-2 rounded-lg ${
                                    redemption.type === "cash"
                                      ? "bg-green-100"
                                      : "bg-orange-100"
                                  }`}>
                                    {redemption.type === "cash" ? (
                                      <ShoppingBag className={`w-5 h-5 ${
                                        redemption.type === "cash"
                                          ? "text-green-600"
                                          : "text-orange-600"
                                      }`} />
                                    ) : (
                                      <Gift className={`w-5 h-5 ${
                                        redemption.type === "cash"
                                          ? "text-green-600"
                                          : "text-orange-600"
                                      }`} />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="font-semibold text-slate-900">
                                        {redemption.type === "cash" ? "Wallet Credit" : "Amazon Gift Card"}
                                      </h5>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        redemption.status === "completed"
                                          ? "bg-green-100 text-green-700"
                                          : redemption.status === "pending"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-red-100 text-red-700"
                                      }`}>
                                        {redemption.status}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-2">
                                      {redemption.description}
                                    </p>
                                    {redemption.giftCardCode && (
                                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-2">
                                        <p className="text-xs text-slate-600 mb-1">Gift Card Code:</p>
                                        <code className="text-sm font-mono font-bold text-orange-700">
                                          {redemption.giftCardCode}
                                        </code>
                                      </div>
                                    )}
                                    <p className="text-xs text-slate-400 mt-2">
                                      {new Date(redemption.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-lg font-bold text-indigo-600">
                                    ₹{redemption.amount}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {redemption.coinsUsed} coins
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Redemption History Info */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mt-6">
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">Note:</span> Redeemed coins will be credited to your wallet and can be used during checkout. Gift card codes will be sent to your registered email within 24 hours.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBMIT BUTTON (all tabs share same button except rewards) */}
              {activeTab !== 'rewards' && (
                <div className="pt-4 md:pt-6 mt-4 md:mt-6 border-t border-amber-100">
                  {activeTab === 'security' ? (
                  <button
                    type="button"
                    onClick={changePassword}
                    disabled={saving}
                    className="w-full md:w-auto px-6 sm:px-8 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 disabled:from-gray-300 disabled:to-gray-400 text-white py-2.5 sm:py-3 rounded-xl transition-all duration-200 font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {saving ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Changing Password...
                      </div>
                    ) : (
                      "Change Password"
                    )}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving || Object.keys(errors).length > 0}
                    className="w-full md:w-auto px-6 sm:px-8 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 disabled:from-gray-300 disabled:to-gray-400 text-white py-2.5 sm:py-3 rounded-xl transition-all duration-200 font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {saving ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving Changes...
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                )}

                {/* SUCCESS MESSAGE */}
                {success && (
                  <div className="mt-3 md:mt-4 bg-green-50 border border-green-200 rounded-xl p-3 md:p-4 flex items-center gap-2 md:gap-3 animate-fade-in">
                    <div className="bg-green-500 rounded-full p-1">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-green-800 font-semibold text-sm sm:text-base">Profile Updated Successfully!</p>
                      <p className="text-green-700 text-xs sm:text-sm">Your changes have been saved.</p>
                    </div>
                  </div>
                )}
              </div>
              )}
            </section>
          </div>
        </form>
      </main>

      {/* FOOTER */}
      <footer className="bg-white/80 backdrop-blur border-t border-amber-100 mt-8 md:mt-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-amber-500 flex items-center justify-center shadow-sm">
                <User className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 text-center">© 2025 Student Portal. All rights reserved to EEC.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
