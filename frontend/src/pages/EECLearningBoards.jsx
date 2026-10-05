import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, ChevronRight, GraduationCap, Layers, FileText, ArrowLeft } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const BOARD_INFO = {
  cbse: "Central Board of Secondary Education",
  icse: "Indian Certificate of Secondary Education",
  isc: "Indian School Certificate",
  ib: "International Baccalaureate",
  igcse: "International General Certificate of Secondary Education",
  "wb board": "West Bengal Board of Secondary Education",
  wbbse: "West Bengal Board of Secondary Education",
  "state board": "State Council of Educational Research and Training",
  telangana: "State Council of Educational Research and Training, Telangana",
};

function boardDescription(name) {
  const key = String(name || "").toLowerCase();
  const match = Object.keys(BOARD_INFO).find((k) => key === k || key.startsWith(k));
  return match ? BOARD_INFO[match] : "Board-aligned subjects, notes and practice";
}

function classNumber(name) {
  const n = String(name || "").match(/\d+/);
  return n ? Number(n[0]) : 999;
}

async function fetchJSON(path) {
  const token = localStorage.getItem("jwt") || "";
  const res = await fetch(`${API}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const data = await res.json().catch(() => []);
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}

const PALETTE = ["#F4736E", "#4ECDC4", "#6C63FF", "#FF9F1C", "#22c55e", "#3b82f6", "#d946ef", "#f97316"];
const HEADING_FONT = { fontFamily: "'Balsamiq Sans', cursive" };

function Card({ icon: Icon, title, subtitle, meta, onClick, index = 0, badge }) {
  const color = PALETTE[index % PALETTE.length];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full flex-col overflow-hidden rounded-3xl border-2 p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-4"
      style={{ borderColor: `${color}33`, "--tw-ring-color": `${color}55` }}
    >
      <span
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-15 transition-transform duration-500 group-hover:scale-150"
        style={{ background: color }}
      />
      <div className="relative flex items-center justify-between">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-300 group-hover:rotate-6"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
        >
          {badge ? <span className="text-lg font-black" style={HEADING_FONT}>{badge}</span> : <Icon className="h-7 w-7" strokeWidth={2.2} />}
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 group-hover:translate-x-1"
          style={{ background: `${color}18`, color }}
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
        </span>
      </div>
      <span className="relative mt-4 block text-xl font-black text-[#1B1F3B]" style={HEADING_FONT}>
        {title}
      </span>
      {subtitle && <span className="relative mt-1 block text-sm leading-relaxed text-slate-600">{subtitle}</span>}
      {meta && (
        <span
          className="relative mt-3 inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
          style={{ background: `${color}15`, color }}
        >
          {meta}
        </span>
      )}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-3xl border-2 border-slate-100 bg-white" />
      ))}
    </div>
  );
}

const STEPS = [
  { label: "Board", icon: BookOpen },
  { label: "Class", icon: GraduationCap },
  { label: "Subject", icon: Layers },
  { label: "Chapter", icon: FileText },
];

function Stepper({ step, onJump }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              disabled={!done}
              onClick={() => onJump(n)}
              className="flex flex-col items-center gap-1.5 disabled:cursor-default"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${
                  active
                    ? "scale-110 border-[#FFD23F] bg-[#FFD23F] text-[#1B1F3B] shadow-lg shadow-[#FFD23F]/40"
                    : done
                      ? "border-[#4ECDC4] bg-[#4ECDC4] text-white hover:brightness-110"
                      : "border-white/25 bg-white/5 text-white/50"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span className={`text-xs font-bold ${active ? "text-[#FFD23F]" : done ? "text-[#4ECDC4]" : "text-white/50"}`}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span className="mx-2 mb-5 h-1 flex-1 rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full bg-[#4ECDC4] transition-all duration-500"
                  style={{ width: done ? "100%" : "0%" }}
                />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function EECLearningBoards() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const boardId = params.get("board") || "";
  const classId = params.get("class") || "";
  const subjectId = params.get("subjectId") || "";
  const subjectHint = (params.get("subject") || "").trim().toLowerCase();

  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchJSON("/api/boards"), fetchJSON("/api/classes")])
      .then(([b, c]) => {
        setBoards(b);
        setClasses([...c].sort((x, y) => classNumber(x.name) - classNumber(y.name)));
      })
      .catch(() => setError("Failed to load boards. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSubjects([]);
    if (!boardId || !classId) return;
    setLoading(true);
    setError("");
    fetchJSON(`/api/subject?board=${encodeURIComponent(boardId)}&class=${encodeURIComponent(classId)}`)
      .then((rows) => setSubjects(rows.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => setError("Failed to load subjects."))
      .finally(() => setLoading(false));
  }, [boardId, classId]);

  useEffect(() => {
    setTopics([]);
    if (!boardId || !classId || !subjectId) return;
    setLoading(true);
    setError("");
    fetchJSON(
      `/api/topic/${encodeURIComponent(subjectId)}?board=${encodeURIComponent(boardId)}&class=${encodeURIComponent(classId)}`
    )
      .then((rows) => setTopics(rows))
      .catch(() => setError("Failed to load topics."))
      .finally(() => setLoading(false));
  }, [boardId, classId, subjectId]);

  const board = boards.find((b) => b._id === boardId);
  const cls = classes.find((c) => c._id === classId);
  const subject = subjects.find((s) => s._id === subjectId);

  // Arriving from a homepage subject card: show that subject first.
  const orderedSubjects = useMemo(() => {
    if (!subjectHint) return subjects;
    const hit = (s) => {
      const n = s.name.toLowerCase();
      return n.includes(subjectHint) || subjectHint.includes(n);
    };
    return [...subjects.filter(hit), ...subjects.filter((s) => !hit(s))];
  }, [subjects, subjectHint]);

  const step = !boardId ? 1 : !classId ? 2 : !subjectId ? 3 : 4;

  function go(next) {
    const p = new URLSearchParams();
    if (subjectHint) p.set("subject", params.get("subject"));
    Object.entries(next).forEach(([k, v]) => v && p.set(k, v));
    setParams(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const heading = {
    1: { title: "Indian Education Boards", text: `Study resources for ${boards.length || ""} education boards across India. Select your board to find class-wise subjects, syllabus, notes, and practice material.` },
    2: { title: board?.name || "Select your class", text: "Choose your class to see the subjects available for it." },
    3: { title: `${cls?.name || ""} Subjects`, text: `Subjects for ${board?.name || ""} ${cls?.name || ""}. Pick one to see its chapters.` },
    4: { title: subject?.name || "Topics", text: `Chapters for ${board?.name || ""} · ${cls?.name || ""}. Open one to start learning.` },
  }[step];

  const crumbs = [
    { label: "Boards", onClick: () => go({}) },
    board && { label: board.name, onClick: () => go({ board: boardId }) },
    cls && { label: cls.name, onClick: () => go({ board: boardId, class: classId }) },
    subject && { label: subject.name },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <title>Board and Class Wise Study Topics | Edify Eight</title>
      <meta name="description" content="Browse board and class wise subjects and topics with summaries and learning outcomes. Study smarter with Edify Eight." />
      <link rel="canonical" href="https://www.edifyeight.com/boards" />

      {/* Hero with progress stepper */}
      <div className="relative overflow-hidden bg-linear-to-br from-[#1B1F3B] to-[#2d3561] px-4 pb-16 pt-10 md:pt-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#4ECDC4]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-[#F4736E]/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-xl">
            <Stepper
              step={step}
              onJump={(n) =>
                go(n === 1 ? {} : n === 2 ? { board: boardId } : { board: boardId, class: classId })
              }
            />
          </div>

          <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#4ECDC4]/30 bg-[#4ECDC4]/15 px-4 py-1.5 text-sm font-bold text-[#4ECDC4]">
                Step {step} of 4
              </span>
              <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl" style={HEADING_FONT}>
                {heading.title}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-300">{heading.text}</p>
            </div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
          </div>

          {crumbs.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {crumbs.slice(1).map((c, i) => (
                <button
                  key={c.label + i}
                  type="button"
                  disabled={!c.onClick || i === crumbs.length - 2}
                  onClick={c.onClick}
                  className="rounded-full px-4 py-1.5 text-sm font-bold text-[#1B1F3B] transition hover:brightness-110 disabled:cursor-default"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative mx-auto -mt-8 max-w-6xl px-4 pb-16">
        <div className="rounded-[2rem] bg-[#FEF4E8] p-4 shadow-sm md:p-8">
          {error ? (
            <p className="rounded-2xl border-2 border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600">{error}</p>
          ) : loading ? (
            <Skeleton />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {step === 1 &&
                boards.map((b, i) => (
                  <Card
                    key={b._id}
                    index={i}
                    icon={BookOpen}
                    title={b.name}
                    subtitle={boardDescription(b.name)}
                    meta={classes.length ? `Classes ${classes[0].name.replace(/\D/g, "")}–${classes[classes.length - 1].name.replace(/\D/g, "")}` : ""}
                    onClick={() => go({ board: b._id })}
                  />
                ))}

              {step === 2 &&
                classes.map((c, i) => (
                  <Card
                    key={c._id}
                    index={i}
                    badge={c.name.replace(/\D/g, "") || undefined}
                    icon={GraduationCap}
                    title={c.name}
                    subtitle={`${board?.name || ""} syllabus`}
                    meta="Subjects, notes and practice"
                    onClick={() => go({ board: boardId, class: c._id })}
                  />
                ))}

              {step === 3 &&
                (orderedSubjects.length ? (
                  orderedSubjects.map((s, i) => (
                    <Card
                      key={s._id}
                      index={i}
                      icon={Layers}
                      title={s.name}
                      subtitle={`${board?.name || ""} · ${cls?.name || ""}`}
                      meta="View chapters"
                      onClick={() => go({ board: boardId, class: classId, subjectId: s._id })}
                    />
                  ))
                ) : (
                  <p className="col-span-full text-slate-500">No subjects available for this class yet.</p>
                ))}

              {step === 4 &&
                (topics.length ? (
                  topics.map((t, i) => (
                    <Card
                      key={t._id}
                      index={i}
                      badge={String(i + 1)}
                      icon={FileText}
                      title={t.name}
                      subtitle={t.shortDescription || `Chapter ${i + 1}`}
                      meta="Read content"
                      onClick={() =>
                        navigate(`/learn/topic/${subjectId}/${t._id}`, {
                          state: {
                            subject,
                            topic: t,
                            boardLabel: board?.name,
                            classLabel: cls?.name,
                            previewMode: !localStorage.getItem("jwt"),
                          },
                        })
                      }
                    />
                  ))
                ) : (
                  <p className="col-span-full text-slate-500">No chapters available for this subject yet.</p>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
