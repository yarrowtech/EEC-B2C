// import React, { useState } from "react";
// import { NavLink } from "react-router-dom";
// import { GraduationCap, ChevronDown, ListChecks } from "lucide-react";

// const linkBase = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 transition-colors";
// const linkActive = "bg-gradient-to-br from-slate-200 to-slate-100 text-slate-900 shadow-[inset_0_0_0_1px_rgba(2,6,23,0.06)]";

// const stageNames = {
//   1: "Basic Level",
//   2: "Intermediate Level",
//   3: "Advanced Level",
// };

// export default function ExamSidebarBlock({ role = "student" }) {
//   if (role !== "student") return null;
//   const [open, setOpen] = useState(false);
//   const [stages, setStages] = useState([]);

//   useEffect(() => {
//     loadStages();
//   }, []);

//   async function loadStages() {
//     try {
//       const res = await getJSON("/questions/stages");
//       setStages(res.stages || []);
//     } catch (err) {
//       console.error("Failed loading stages", err);
//     }
//   }
//   return (
//     <div className="mt-1">
//       <button
//         onClick={() => setOpen((s) => !s)}
//         className={`${linkBase} w-full text-left text-slate-700`}
//         aria-expanded={open}
//         aria-controls="emenu"
//       >
//         <GraduationCap size={18} className="text-slate-700" />
//         <span className="flex-1 truncate">Exams</span>
//         <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
//       </button>

//       <div
//         id="emenu"
//         className={`overflow-hidden transition-[max-height,opacity] duration-300 ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
//       >
//         <div className="ml-2 mt-1 pl-2 border-l border-slate-200 space-y-1">
//           <NavLink to="/dashboard/exams" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : "text-slate-700"}`}>
//             <ListChecks size={18} className="text-slate-700" />
//             <span>Basic Level</span>
//           </NavLink>
//           {/* If you add Stage 2/3 later, add more parents similar to this */}
//         </div>
//       </div>
//     </div>
//   );
// }

// // import React, { useState } from "react";
// // import { NavLink } from "react-router-dom";
// // import { GraduationCap, ChevronDown, ListChecks, Lock } from "lucide-react";

// // const linkBase =
// //   "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
// // const linkActive =
// //   "bg-gradient-to-br from-slate-200 to-slate-100 text-slate-900 shadow-[inset_0_0_0_1px_rgba(2,6,23,0.06)]";

// // export default function ExamSidebarBlock({ role = "student" }) {
// //   if (role !== "student") return null;

// //   const [open, setOpen] = useState(false);

// //   const stages = [
// //     { id: 1, name: "Stage 1", locked: false },
// //     { id: 2, name: "Stage 2", locked: false },
// //     { id: 3, name: "Stage 3", locked: false },
// //     { id: 4, name: "Stage 4", locked: true },
// //     { id: 5, name: "Stage 5", locked: true },
// //     { id: 6, name: "Stage 6", locked: true },
// //     { id: 7, name: "Stage 7", locked: true },
// //     { id: 8, name: "Stage 8", locked: true },
// //     { id: 9, name: "Stage 9", locked: true },
// //   ];

// //   return (
// //     <div className="mt-1">
// //       <button
// //         onClick={() => setOpen((s) => !s)}
// //         className={`${linkBase} w-full text-left text-slate-700 hover:bg-slate-100`}
// //         aria-expanded={open}
// //         aria-controls="emenu"
// //       >
// //         <GraduationCap size={18} className="text-slate-700" />
// //         <span className="flex-1 truncate">Exams</span>
// //         <ChevronDown
// //           size={16}
// //           className={`transition-transform ${open ? "rotate-180" : ""}`}
// //         />
// //       </button>

// //       <div
// //         id="emenu"
// //         className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
// //           open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
// //         }`}
// //       >
// //         <div className="ml-2 mt-1 pl-2 border-l border-slate-200 space-y-1">
// //           {stages.map((stage) =>
// //             stage.locked ? (
// //               /* 🔒 Locked Stage (non-clickable) */
// //               <div
// //                 key={stage.id}
// //                 className={`${linkBase} cursor-not-allowed text-slate-400 bg-slate-50`}
// //               >
// //                 <Lock size={16} className="text-slate-400" />
// //                 <span>{stage.name}</span>
// //               </div>
// //             ) : (
// //               /* 🔓 Unlocked Stage (clickable) */
// //               <NavLink
// //                 key={stage.id}
// //                 to={`/dashboard/exams/stage-${stage.id}`}
// //                 className={({ isActive }) =>
// //                   `${linkBase} ${
// //                     isActive
// //                       ? linkActive
// //                       : "text-slate-700 hover:bg-slate-100"
// //                   }`
// //                 }
// //               >
// //                 <ListChecks size={18} className="text-slate-700" />
// //                 <span>{stage.name}</span>
// //               </NavLink>
// //             )
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }


import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { GraduationCap, ChevronDown, ListChecks } from "lucide-react";
import { getJSON } from "../../lib/api"; // <-- IMPORTANT

const linkBase =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 transition-colors";
const linkActive =
  "bg-gradient-to-br from-slate-200 to-slate-100 text-slate-900 shadow-[inset_0_0_0_1px_rgba(2,6,23,0.06)]";

// Stage Labels
const stageNames = {
  1: "Basic Level",
  2: "Intermediate Level",
  3: "Advanced Level",
};

export default function ExamSidebarBlock({ role = "student" }) {
  if (role !== "student") return null;

  const [open, setOpen] = useState(false);
  const [stages, setStages] = useState([]);

  useEffect(() => {
    loadStages();
  }, []);

  async function loadStages() {
    try {
      const res = await getJSON("/api/questions/stages");
      setStages(res.stages || []);
    } catch (err) {
      console.error("Failed loading stages", err);
    }
  }

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((s) => !s)}
        className={`${linkBase} w-full text-left text-slate-700`}
        aria-expanded={open}
        aria-controls="emenu"
      >
        <GraduationCap size={18} className="text-slate-700" />
        <span className="flex-1 truncate">Exams</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id="emenu"
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="ml-2 mt-1 pl-2 border-l border-slate-200 space-y-1">
          {/* Render dynamic stages */}
          {stages.length === 0 && (
            <div className={`${linkBase} text-slate-400`}>
              No exam stages available
            </div>
          )}

          {stages.map((stage) => {
            const label = stageNames[stage] || `Stage ${stage}`;

            // Correct URL format:
            // Stage 1 → /dashboard/exams
            // Others → /dashboard/exams/{stage}
            const url =
              stage === 1
                ? "/dashboard/exams"
                : `/dashboard/exams/${stage}`;

            return (
              <NavLink
                key={stage}
                to={url}
                className={({ isActive }) =>
                  `${linkBase} ${isActive
                    ? linkActive
                    : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                <ListChecks size={18} className="text-slate-700" />
                <span>{label}</span>
              </NavLink>
            );
          })}

        </div>
      </div>
    </div>
  );
}
