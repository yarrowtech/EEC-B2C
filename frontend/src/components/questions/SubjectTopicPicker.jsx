// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useQuestionScope } from "../../context/QuestionScopeContext";
// import { FiBookOpen, FiTag, FiRefreshCw } from "react-icons/fi";

// export default function SubjectTopicPicker() {
//   const { scope, setSubject, setTopic, clear } = useQuestionScope();

//   const [subjects, setSubjects] = useState([]);
//   const [topics, setTopics] = useState([]);

//   // Load subjects on mount
//   useEffect(() => {
//     loadSubjects();
//   }, []);

//   // Load topics when subject changes
//   useEffect(() => {
//     if (scope.subject) loadTopics(scope.subject);
//     else setTopics([]);
//   }, [scope.subject]);

//   const loadSubjects = async () => {
//     try {
//       const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/subject`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
//       });
//       setSubjects(res.data);
//     } catch (err) {
//       console.error("Error loading subjects:", err);
//     }
//   };

//   const loadTopics = async (subjectId) => {
//     try {
//       const res = await axios.get(
//         `${import.meta.env.VITE_API_URL}/api/topic/${subjectId}`,
//         {
//           headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
//         }
//       );
//       setTopics(res.data);
//     } catch (err) {
//       console.error("Error loading topics:", err);
//     }
//   };

//   return (
//     <div
//       className="
//       rounded-3xl border border-white/60 
//       bg-gradient-to-br from-white/70 to-white/30
//       backdrop-blur-2xl shadow-lg p-7 
//       transition-all duration-300 hover:shadow-2xl
//     "
//     >
//       {/* Header */}
//       <div className="flex items-center gap-2 mb-6">
//         <div className="p-2 rounded-xl bg-blue-100 text-blue-600 text-xl shadow-sm">
//           <FiBookOpen />
//         </div>
//         <h2 className="text-xl font-bold text-slate-900 tracking-tight">
//           Select Scope
//         </h2>
//       </div>

//       <div className="grid sm:grid-cols-3 gap-6">
//         {/* SUBJECT DROPDOWN */}
//         <div className="flex flex-col">
//           <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
//             <FiTag className="text-blue-500" /> Subject
//           </label>

//           <select
//             className="
//               w-full rounded-xl border border-slate-200 px-4 py-3 bg-white
//               outline-none shadow-sm
//               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
//               transition-all
//             "
//             value={scope.subject}
//             onChange={(e) => {
//               setSubject(e.target.value);
//               setTopic("");
//             }}
//           >
//             <option value="">Choose a subject…</option>
//             {subjects.map((s) => (
//               <option key={s._id} value={s._id}>
//                 {s.name}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* TOPIC DROPDOWN */}
//         <div className="flex flex-col">
//           <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
//             <FiTag className="text-purple-500" /> Topic
//           </label>

//           <select
//             className="
//               w-full rounded-xl border border-slate-200 px-4 py-3 bg-white
//               outline-none shadow-sm
//               focus:ring-2 focus:ring-purple-500 focus:border-purple-500
//               transition-all disabled:opacity-40
//             "
//             value={scope.topic}
//             onChange={(e) => setTopic(e.target.value)}
//             disabled={!scope.subject}
//           >
//             <option value="">Choose a topic…</option>

//             {topics.map((t) => (
//               <option key={t._id} value={t._id}>
//                 {t.name}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* CLEAR + ACTIVE STATUS */}
//         <div className="flex flex-col justify-between">
//           <button
//             type="button"
//             onClick={clear}
//             className="
//               flex items-center justify-center gap-2
//               rounded-xl bg-red-500 text-white px-4 py-3
//               text-sm font-semibold
//               hover:bg-red-600 active:scale-95 transition-all shadow-md
//             "
//           >
//             <FiRefreshCw /> Clear Selection
//           </button>

//           <div className="mt-3 text-center">
//             {scope.subject && scope.topic ? (
//               <div
//                 className="
//                   inline-block px-4 py-2 rounded-full
//                   bg-green-100 text-green-700
//                   text-xs font-medium shadow-sm
//                   animate-[fadeIn_0.3s_ease-out]
//                 "
//               >
//                 Active: {subjects.find((s) => s._id === scope.subject)?.name} →{" "}
//                 {topics.find((t) => t._id === scope.topic)?.name}
//               </div>
//             ) : (
//               <span className="text-xs text-slate-500">
//                 Choose subject & topic
//               </span>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { FiRefreshCw } from "react-icons/fi";
import { Book, BookA } from "lucide-react";

export default function SubjectTopicPicker() {
  const { scope, setSubject, setTopic, clear } = useQuestionScope();
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (scope.subject) loadTopics(scope.subject);
    else setTopics([]);
  }, [scope.subject]);

  const loadSubjects = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/subject`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
    });
    setSubjects(res.data);
  };

  const loadTopics = async (subjectId) => {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/topic/${subjectId}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
      }
    );
    setTopics(res.data);
  };

  return (
    <div className="relative rounded-[2.5rem] bg-gradient-to-br from-yellow-50 via-pink-50 to-sky-50 p-8 shadow-xl overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-300/30 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-300/30 rounded-full blur-2xl" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg">
          <Book size={24} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          Choose What You Want to Learn
        </h2>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 relative z-10">
        {/* Subject */}
        <div>
          <label className="font-bold text-slate-700 mb-2 block">
            Subject
          </label>
          <select
            className="w-full rounded-xl px-4 py-3 shadow-md focus:ring-2 focus:ring-blue-500 bg-white"
            value={scope.subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setTopic("");
            }}
          >
            <option value="">Choose subject…</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Topic */}
        <div>
          <label className="font-bold text-slate-700 mb-2 block">
            Topic
          </label>
          <select
            className="bg-white w-full rounded-xl px-4 py-3 shadow-md focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
            value={scope.topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={!scope.subject}
          >
            <option value="">Choose topic…</option>
            {topics.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear + Active */}
        <div className="flex flex-col justify-between">
          <button
            type="button"
            onClick={clear}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-400 to-pink-500 text-white py-3 font-bold shadow-lg hover:scale-105 transition-all"
          >
            <FiRefreshCw /> Clear
          </button>

          <div className="mt-4 text-center">
            {scope.subject && scope.topic ? (
              <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold shadow">
                Ready to Play!
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Pick subject & topic
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
