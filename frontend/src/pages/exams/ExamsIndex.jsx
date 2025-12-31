// import React, { useState } from "react";
// import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
// import { useQuestionScope } from "../../context/QuestionScopeContext";
// import { startExam } from "../../lib/api";
// import { useNavigate } from "react-router-dom";
// import { FiPlayCircle, FiList, FiHash } from "react-icons/fi";
// import { toast, ToastContainer } from "react-toastify";

// const TYPES = [
//   { value: "mcq-single", label: "MCQ — Single Correct" },
//   { value: "mcq-multi", label: "MCQ — Multiple Correct" },
//   { value: "choice-matrix", label: "Choice Matrix" },
//   // { value: "true-false", label: "True / False" },
//   { value: "essay-plain", label: "Essay — Plain Text" },
//   { value: "cloze-drag", label: "Cloze — Drag & Drop" },
//   { value: "cloze-select", label: "Cloze — Drop-Down" },
//   // { value: "cloze-select", label: "Cloze — Select" },
//   // { value: "cloze-text", label: "Cloze — Text Input" },
//   // { value: "match-list", label: "Match List" },
// ];

// export default function ExamsIndex() {
//   const { scope } = useQuestionScope();
//   const [type, setType] = useState("mcq-single");
//   const [limit, setLimit] = useState(10);
//   const [busy, setBusy] = useState(false);
//   const navigate = useNavigate();

//   async function onStart(e) {
//     e.preventDefault();
//     if (!scope.subject || !scope.topic)
//       // return alert("Pick Subject & Topic first");
//       return toast.warn("Pick Subject & Topic first");
//     setBusy(true);
//     try {
//       const data = await startExam({
//         stage: "stage-1",
//         subject: scope.subject,
//         topic: scope.topic,
//         type,
//         limit,
//       });

//       navigate(`/dashboard/exams/take/${data.attemptId}`, {
//         state: data,
//       });
//     } catch (err) {
//       toast.info(err.message);
//     } finally {
//       setBusy(false);
//     }
//   }

//   return (
//     <div
//       className="
//         space-y-8 p-6
//         rounded-3xl
//         border border-white/40 backdrop-blur-xl
//       "
//     >
//       <ToastContainer />
//       {/* Header */}
//       <div className="flex items-center gap-3">
//         <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-700 shadow">
//           <FiPlayCircle size={22} />
//         </div>
//         <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
//           Level — Basic
//         </h1>
//       </div>

//       <p className="text-slate-600 text-sm">
//         Choose the <b className="text-slate-800">Subject</b> & {" "}
//         <b className="text-slate-800">Topic</b> of exam
//       </p>

//       {/* Subject & Topic */}
//       <SubjectTopicPicker />

//       {/* Exam Settings Panel */}
//       <form
//         onSubmit={onStart}
//         className="
//           rounded-3xl p-6 bg-white/70 backdrop-blur-lg shadow-xl 
//           grid sm:grid-cols-3 gap-6
//         "
//       >
//         {/* Type */}
//         <div>
//           <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
//             <FiList className="text-indigo-600" />
//             Choose Question Type
//           </label>

//           <select
//             className="
//               w-full rounded-xl px-4 py-2.5 bg-white shadow-sm
//               focus:ring-2 focus:ring-indigo-500 transition-all
//             "
//             value={type}
//             onChange={(e) => setType(e.target.value)}
//           >
//             {TYPES.map((t) => (
//               <option key={t.value} value={t.value}>
//                 {t.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Number of Questions */}
//         {/* <div>
//           <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
//             <FiHash className="text-purple-600" />
//             Number of Questions
//           </label>

//           <input
//             type="number"
//             min={1}
//             max={50}
//             className="
//               w-full rounded-xl px-4 py-2.5 bg-white shadow-sm
//               focus:ring-2 focus:ring-purple-500 transition-all
//             "
//             value={limit}
//             onChange={(e) => setLimit(Number(e.target.value || 10))}
//           />
//         </div> */}

//         {/* Button */}
//         <div className="flex items-end">
//           <button
//             disabled={busy}
//             className="
//               flex items-center gap-2 w-full justify-center
//               rounded-xl px-6 py-3 font-semibold text-white
//               bg-gradient-to-r from-emerald-600 to-green-600
//               hover:from-emerald-700 hover:to-green-700
//               shadow-md hover:shadow-xl hover:scale-[1.02]
//               active:scale-95 transition-all disabled:opacity-50
//             "
//           >
//             <FiPlayCircle />
//             {busy ? "Starting..." : "Start Exam"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

import React, { useState } from "react";
import SubjectTopicPicker from "../../components/questions/SubjectTopicPicker";
import { useQuestionScope } from "../../context/QuestionScopeContext";
import { startExam } from "../../lib/api";
import { useNavigate } from "react-router-dom";
import { FiPlayCircle, FiList } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import { Gamepad } from "lucide-react";

const TYPES = [
  { value: "mcq-single", label: "MCQ — Single Correct" },
  { value: "mcq-multi", label: "MCQ — Multiple Correct" },
  { value: "choice-matrix", label: "Choice Matrix" },
  { value: "essay-plain", label: "Essay — Plain Text" },
  { value: "cloze-drag", label: "Cloze — Drag & Drop" },
  { value: "cloze-select", label: "Cloze — Drop-Down" },
];

export default function ExamsIndex() {
  const { scope } = useQuestionScope();
  const [type, setType] = useState("mcq-single");
  const [limit] = useState(10);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onStart(e) {
    e.preventDefault();
    if (!scope.subject || !scope.topic) {
      return toast.warn("🎯 Pick Subject & Topic first!");
    }
    setBusy(true);
    try {
      const data = await startExam({
        stage: "stage-1",
        subject: scope.subject,
        topic: scope.topic,
        type,
        limit,
      });

      navigate(`/dashboard/exams/take/${data.attemptId}`, {
        state: data,
      });
    } catch (err) {
      toast.info(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative space-y-8 p-8 bg-gradient-to-br from-emerald-50 via-sky-50 to-indigo-50 shadow-2xl overflow-hidden">
      <ToastContainer />

      {/* Decorative blobs */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-pink-300/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-yellow-300/30 rounded-full blur-3xl" />

      {/* Header */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-xl">
          <Gamepad size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Level — Basic
          </h1>
          <p className="text-sm text-slate-600">
            Learn by playing & have fun 
          </p>
        </div>
      </div>

      {/* Subject & Topic Picker */}
      <SubjectTopicPicker />

      {/* Exam Settings */}
      <form
        onSubmit={onStart}
        className="relative z-10 rounded-[2rem] p-6 bg-white/70 backdrop-blur-xl shadow-xl grid sm:grid-cols-3 gap-6"
      >
        {/* Question Type */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <FiList className="text-indigo-600" />
            Question Type
          </label>

          <select
            className="w-full rounded-xl px-4 py-3 bg-white shadow-md focus:ring-2 focus:ring-indigo-500 transition-all"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Button */}
        <div className="flex items-end sm:col-span-2">
          <button
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-lg font-extrabold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 shadow-xl transition-all disabled:opacity-50"
          >
            <FiPlayCircle />
            {busy ? "Starting..." : "Start Exam"}
          </button>
        </div>
      </form>
    </div>
  );
}
