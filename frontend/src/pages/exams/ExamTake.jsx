import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getJSON, submitExam } from "../../lib/api";

export default function ExamTake() {
  const { attemptId } = useParams();
  const nav = useNavigate();
  const state = useLocation().state; // {attemptId, questions,total,...} from start
  const [meta, setMeta] = useState(state || null);
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const WORD_LIMIT = 500;


  useEffect(() => {
    if (!meta) {
      // F5 case: fetch attempt meta by id (simple version: refetch questions info from start endpoint is not public)
      // For now, re-fetch via questions ids embedded isn’t available — recommend starting from /exams again if missing state
      (async () => {
        try {
          // Minimal fallback: tell them to re-start
          setMeta(null);
        } catch {
          setMeta(null);
        }
      })();
    }
  }, [meta]);

  if (!meta) {
    return (
      <div className="space-y-3">
        <div className="text-slate-700">Exam context missing.</div>
        <button onClick={() => nav("/dashboard/exams")} className="rounded-lg border px-3 py-2 hover:bg-slate-50">Back to Stage 1</button>
      </div>
    );
  }

  const { questions = [], type, total } = meta;

  function setAns(qid, payload) {
    setAnswers(prev => ({ ...prev, [qid]: { ...(prev[qid] || {}), ...payload } }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      // build answers array to match backend
      // const arr = questions.map(q => {
      //   const a = answers[q._id] || {};
      //   if (type === "mcq-single") return { qid: q._id, mcq: a.mcq ? [a.mcq] : [] };
      //   if (type === "mcq-multi") return { qid: q._id, mcq: Array.isArray(a.mcq) ? a.mcq : [] };
      //   if (type === "true-false") return { qid: q._id, trueFalse: a.trueFalse || "" };
      //   if (type === "essay-plain") return { qid: q._id, essay: a.essay || "" };
      //   return { qid: q._id }; // (not used yet)
      // });

      const arr = questions.map(q => {
        const a = answers[q._id] || {};

        if (q.type === "mcq-single")
          return { qid: q._id, mcq: a.mcq ? [a.mcq] : [] };

        if (q.type === "mcq-multi")
          return { qid: q._id, mcq: Array.isArray(a.mcq) ? a.mcq : [] };

        if (q.type === "true-false")
          return { qid: q._id, trueFalse: a.trueFalse || "" };

        if (q.type === "essay-plain")
          return { qid: q._id, essay: a.essay || "" };

        if (q.type === "choice-matrix")
          return { qid: q._id, matrix: a.matrix || {} };

        if (q.type === "cloze-drag")
          return { qid: q._id, cloze: a.cloze || {} };

        if (q.type === "cloze-select")
          return { qid: q._id, clozeSelect: a.clozeSelect || {} };

        return { qid: q._id };
      });




      const res = await submitExam(attemptId, arr);
      setResult(res); // {score,total,percent}
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  function parseCloze(q) {
    const text = q.clozeDrag?.text || "";
    const parts = [];
    const regex = /\[\[(blank\d+)\]\]/g;
    let last = 0, match;

    while ((match = regex.exec(text)) !== null) {
      const before = text.slice(last, match.index);
      if (before) parts.push({ type: "text", value: before });

      parts.push({ type: "blank", id: match[1] });
      last = regex.lastIndex;
    }

    const after = text.slice(last);
    if (after) parts.push({ type: "text", value: after });

    return {
      clozeText: parts,
      options: q.clozeDrag?.tokens || [],
      correct: q.clozeDrag?.correctMap || {}
    };
  }

  function parseClozeSelect(q) {
    const text = q.clozeSelect?.text || "";
    const blanks = q.clozeSelect?.blanks || {};

    const parts = [];
    const regex = /\[\[(blank\d+)\]\]/g;
    let last = 0, match;

    while ((match = regex.exec(text)) !== null) {
      const before = text.slice(last, match.index);
      if (before) parts.push({ type: "text", value: before });

      parts.push({ type: "blank", id: match[1] });
      last = regex.lastIndex;
    }

    const after = text.slice(last);
    if (after) parts.push({ type: "text", value: after });

    return { parts, blanks };
  }


  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Stage 1 — {type}</h1>
          <div className="text-xs text-slate-500">Questions: {total}</div>
        </div>
        {result && (
          <div className="rounded-lg border bg-white px-4 py-2">
            <div className="text-sm font-semibold text-slate-800">Score: {result.score} / {result.total}</div>
            <div className="text-xs text-slate-600">{result.percent}%</div>
          </div>
        )}
      </div>

      {/* RENDER QUESTIONS */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q._id} className="rounded-xl bg-white p-4">
            <div className="text-sm text-slate-500 mb-1">Q{idx + 1}.</div>
            {/* <div className="font-medium text-slate-800">{q.question || "(no text)"}</div> */}
            <div className="font-medium text-slate-800">
              {q.question ||
                q.prompt ||
                q.plainText ||
                // q.clozeSelect?.text ||
                q.choiceMatrix?.prompt}
            </div>



            {/* Per type renderers */}
            {/* {type === "mcq-single" && (
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {q.options.map((o) => (
                  <label key={o.key} className="flex items-center gap-2 border rounded-lg px-3 py-2 hover:bg-slate-50">
                    <input
                      type="radio" name={`q-${q._id}`}
                      checked={(answers[q._id]?.mcq || "") === o.key}
                      onChange={() => setAns(q._id, { mcq: o.key })}
                    />
                    <span className="text-sm">{o.key}) {o.text}</span>
                  </label>
                ))}
              </div>
            )} */}

            {type === "mcq-single" && (
              <div className="mt-3 space-y-2">
                {q.options.map((o) => {
                  const checked = (answers[q._id]?.mcq || "") === o.key;
                  return (
                    <label
                      key={o.key}
                      className={`
            flex items-center justify-between 
            px-4 py-2 cursor-pointer 
            transition-all 
            ${checked ? "bg-yellow-200 border-yellow-800" : "bg-white hover:bg-slate-50"}
          `}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`q-${q._id}`}
                          checked={checked}
                          onChange={() => setAns(q._id, { mcq: o.key })}
                          className="h-4 w-4 accent-indigo-600"
                        />
                        <span className="text-sm">{o.key}) {o.text}</span>
                      </div>
                    </label>
                  );
                })}

                {/* 🔥 ADD THIS HERE */}
                {result && q.explanation && (
                  <div className="mt-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-3 py-2 shadow-sm">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
                {result && (
                  <div className="relative mt-2 text-sm h-12">

                    {result.detail?.[q._id] === "correct" && (
                      <div className="
        absolute left-0 top-0 
        bg-green-100 border border-green-300 
        rounded-xl px-4 py-2 
        text-green-800 font-semibold 
        popupBounce shadow-md flex items-center gap-2
      ">
                        <span className="text-2xl">🎉</span>
                        Yay! You are correct!
                      </div>
                    )}

                    {result.detail?.[q._id] === "partial" && (
                      <div className="
        absolute left-0 top-0 
        bg-blue-100 border border-blue-300 
        rounded-xl px-4 py-2 
        text-blue-800 font-semibold 
        popupBounce shadow-md flex items-center gap-2
      ">
                        <span className="text-2xl">👍</span>
                        Almost correct! Good try!
                      </div>
                    )}

                    {result.detail?.[q._id] === "wrong" && (
                      <div className="
        absolute left-0 top-0 
        bg-red-100 border border-red-300 
        rounded-xl px-4 py-2 
        text-red-700 font-semibold 
        shakeWrong shadow-md flex items-center gap-2
      ">
                        <span className="text-2xl">❌</span>
                        Not correct! Try again!
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}


            {type === "mcq-multi" && (
              <div className="mt-3 space-y-2">

                {q.options.map((o) => {
                  const sel = new Set(answers[q._id]?.mcq || []);
                  const checked = sel.has(o.key);

                  return (
                    <label
                      key={o.key}
                      className={`
            flex items-center justify-between
            px-4 py-2 cursor-pointer
            transition-all
            ${checked ? "bg-yellow-200 border-yellow-800" : "bg-white hover:bg-slate-50"}
          `}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = new Set(answers[q._id]?.mcq || []);
                            e.target.checked ? next.add(o.key) : next.delete(o.key);
                            setAns(q._id, { mcq: Array.from(next) });
                          }}
                          className="h-4 w-4 accent-indigo-600"
                        />
                        <span className="text-sm">{o.key}) {o.text}</span>
                      </div>
                    </label>
                  );
                })}

                {/* 🔥 SHOW EXPLANATION ONLY AFTER SUBMISSION */}
                {result && q.explanation && (
                  <div className="mt-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-3 py-2 shadow-sm">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}

                {/* 🔥 Existing greeting stays exactly same */}
                {result && (
                  <div className="relative mt-2 text-sm h-12">

                    {result.detail?.[q._id] === "correct" && (
                      <div className="
            absolute left-0 top-0
            bg-green-100 border border-green-300
            rounded-xl px-4 py-2
            text-green-800 font-semibold
            popupBounce shadow-md flex items-center gap-2
          ">
                        <span className="text-2xl">🎉</span>
                        Great job! All answers correct!
                      </div>
                    )}

                    {result.detail?.[q._id] === "partial" && (
                      <div className="
            absolute left-0 top-0
            bg-blue-100 border border-blue-300
            rounded-xl px-4 py-2
            text-blue-800 font-semibold
            popupBounce shadow-md flex items-center gap-2
          ">
                        <span className="text-2xl">👍</span>
                        Good try! Some answers matched!
                      </div>
                    )}

                    {result.detail?.[q._id] === "wrong" && (
                      <div className="
            absolute left-0 top-0
            bg-red-100 border border-red-300
            rounded-xl px-4 py-2
            text-red-700 font-semibold
            shakeWrong shadow-md flex items-center gap-2
          ">
                        <span className="text-2xl">❌</span>
                        Oops! Try again!
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}


            {type === "choice-matrix" && (
              <div className="mt-3 space-y-4">

                {/* Question Prompt */}
                {/* {q.matrix?.prompt && (
                  <div className="font-medium text-slate-800 mb-2">
                    {q.matrix.prompt}
                  </div>
                )} */}

                {/* MATRIX TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full border border-slate-300 rounded-lg text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 px-3 py-2 text-left">Statements</th>

                        {q.matrix?.cols?.map((col, cIndex) => (
                          <th key={cIndex} className="border border-slate-300 px-3 py-2 text-center">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {q.matrix?.rows?.map((row, rIndex) => (
                        <tr key={rIndex} className="odd:bg-white even:bg-slate-50">

                          {/* ROW TITLE */}
                          <td className="border border-slate-300 px-3 py-2 text-slate-800">
                            {row.title}
                          </td>

                          {/* RADIO BUTTONS */}
                          {q.matrix.cols.map((col, cIndex) => {
                            const selected = answers[q._id]?.matrix?.[rIndex] === col;

                            return (
                              <td
                                key={cIndex}
                                className={`
                      border border-slate-300 px-3 py-2 text-center cursor-pointer
                      ${selected ? "bg-yellow-200" : ""}
                    `}
                                onClick={() => {
                                  const prev = answers[q._id]?.matrix || {};
                                  setAns(q._id, { matrix: { ...prev, [rIndex]: col } });
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`matrix-${q._id}-${rIndex}`}
                                  checked={selected}
                                  onChange={() => {
                                    const prev = answers[q._id]?.matrix || {};
                                    setAns(q._id, { matrix: { ...prev, [rIndex]: col } });
                                  }}
                                  className="h-4 w-4 accent-indigo-600 cursor-pointer"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Explanation after submit */}
                {result && q.explanation && (
                  <div className="mt-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-3 py-2 shadow-sm">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}

                {/* Greetings */}
                {result && (
                  <div className="relative mt-2 text-sm h-12">

                    {result.detail?.[q._id] === "correct" && (
                      <div className="
            absolute left-0 top-0 bg-green-100 border border-green-300 px-4 py-2 
            rounded-xl text-green-800 font-semibold popupBounce shadow-md flex items-center gap-2
          ">
                        <span className="text-2xl">🎉</span>
                        Great! All matrix answers correct!
                      </div>
                    )}

                    {result.detail?.[q._id] === "partial" && (
                      <div className="
            absolute left-0 top-0 bg-blue-100 border border-blue-300 px-4 py-2 
            rounded-xl text-blue-800 font-semibold popupBounce shadow-md flex items-center gap-2
          ">
                        <span className="text-2xl">👍</span>
                        Some answers matched!
                      </div>
                    )}

                    {result.detail?.[q._id] === "wrong" && (
                      <div className="
            absolute left-0 top-0 bg-red-100 border border-red-300 px-4 py-2 
            rounded-xl text-red-700 font-semibold shakeWrong shadow-md flex items-center gap-2
          ">
                        <span className="text-2xl">❌</span>
                        Wrong! Try again!
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}



            {type === "true-false" && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["true", "false"].map(v => (
                  <label key={v} className="flex items-center gap-2 border rounded-lg px-3 py-2 hover:bg-slate-50">
                    <input
                      type="radio" name={`q-${q._id}`}
                      checked={(answers[q._id]?.trueFalse || "") === v}
                      onChange={() => setAns(q._id, { trueFalse: v })}
                    />
                    <span className="text-sm capitalize">{v}</span>
                  </label>
                ))}
              </div>
            )}

            {type === "essay-plain" && (
              <div className="mt-3 space-y-4">

                {/* Show the question body */}
                {q.plainText && (
                  <div className="text-sm text-slate-700 leading-relaxed">
                    {q.plainText}
                  </div>
                )}

                {/* Toolbar + Word Count */}
                <div className="flex items-center justify-between">

                  {/* Toolbar */}
                  {/* Toolbar */}
                  <div className="flex gap-4 text-xs text-indigo-600 font-semibold">

                    {/* COPY BUTTON */}
                    <button
                      type="button"
                      className="hover:underline relative"
                      onClick={async (e) => {
                        const btn = e.target;
                        const text = answers[q._id]?.essay || "";
                        await navigator.clipboard.writeText(text);

                        const old = btn.innerText;
                        btn.innerText = "Copied!";
                        setTimeout(() => (btn.innerText = old), 1200);
                      }}
                    >
                      Copy
                    </button>

                    {/* CUT BUTTON */}
                    <button
                      type="button"
                      className="hover:underline relative"
                      onClick={async (e) => {
                        const btn = e.target;
                        const text = answers[q._id]?.essay || "";
                        await navigator.clipboard.writeText(text);
                        setAns(q._id, { essay: "" });

                        const old = btn.innerText;
                        btn.innerText = "Cut!";
                        setTimeout(() => (btn.innerText = old), 1200);
                      }}
                    >
                      Cut
                    </button>

                    {/* PASTE BUTTON */}
                    <button
                      type="button"
                      className="hover:underline relative"
                      onClick={async (e) => {
                        const btn = e.target;
                        const clip = await navigator.clipboard.readText();
                        setAns(q._id, { essay: (answers[q._id]?.essay || "") + clip });

                        const old = btn.innerText;
                        btn.innerText = "Pasted!";
                        setTimeout(() => (btn.innerText = old), 1200);
                      }}
                    >
                      Paste
                    </button>

                  </div>


                  {/* Word Counter */}
                  <div className="text-xs text-slate-100 tracking-wide bg-gray-400 px-1 rounded-full">
                    {((answers[q._id]?.essay || "")
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean)).length}{" "}
                    / {WORD_LIMIT} words
                  </div>
                </div>

                {/* Borderless Textarea */}
                <textarea
                  rows={7}
                  placeholder="Write your answer here..."
                  className="
        w-full 
        bg-slate-100 
        rounded-xl 
        px-4 py-3 
        text-sm 
        focus:outline-none 
        focus:ring-2 
        focus:ring-indigo-300 
        transition-all
      "
                  value={answers[q._id]?.essay || ""}
                  onChange={(e) => setAns(q._id, { essay: e.target.value })}
                />

                {result && (
                  <div className="mt-2 text-sm">
                    {result.detail && result.detail[q._id] === "correct" && (
                      <div className="text-emerald-600 font-medium">🎉 Yay! You are correct!</div>
                    )}

                    {result.detail && result.detail[q._id] === "partial" && (
                      <div className="text-blue-600 font-medium">👍 Almost correct! Good try.</div>
                    )}

                    {result.detail && result.detail[q._id] === "wrong" && (
                      <div className="text-red-500 font-medium">❌ Not correct. Try again!</div>
                    )}
                  </div>
                )}

              </div>
            )}

            {type === "cloze-drag" && (
              <div className="mt-4 space-y-6">

                {/* TEXT WITH INLINE BLANKS (DROP HERE) */}
                <div className="text-sm leading-relaxed flex flex-wrap">
                  {q.clozeText?.map((part, index) => (
                    <span key={index} className="mr-1">

                      {part.type === "text" && part.value}

                      {/* {part.type === "blank" && (
                        <span
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            const value = e.dataTransfer.getData("text/plain");
                            const prev = answers[q._id]?.cloze || {};
                            // setAns(q._id, { cloze: { ...prev, [index]: value } });
                            setAns(q._id, { cloze: { ...prev, [`blank${index + 1}`]: value } });
                          }}
                          className="
                inline-block min-w-[90px] px-2 py-1 
                border-2 border-dashed 
                bg-gray-100 rounded-sm 
                text-center cursor-pointer
              "
                        >
                          {answers[q._id]?.cloze?.[index] || "_______"}
                        </span>
                      )} */}

                      {part.type === "blank" && (
                        <span
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            const value = e.dataTransfer.getData("text/plain");
                            const prev = answers[q._id]?.cloze || {};
                            setAns(q._id, { cloze: { ...prev, [part.id]: value } });
                          }}
                          className="inline-block min-w-[90px] px-2 py-1 border-2 border-dashed bg-gray-100 rounded-sm text-center cursor-pointer"
                        >
                          {answers[q._id]?.cloze?.[part.id] || "_______"}
                        </span>
                      )}




                    </span>
                  ))}
                </div>

                {/* WORD BANK (BOTTOM BAR LIKE IMAGE) */}
                <div className="
      flex flex-wrap gap-2 justify-center
      border border-gray-300 bg-gray-50 
      p-3
    ">
                  {q.options?.map((opt) => (
                    <div
                      key={opt}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", opt);
                      }}
                      className="
            px-4 py-1 
            border border-gray-400 
            bg-white shadow-sm 
            cursor-grab text-sm hover:bg-gray-100
          "
                    >
                      {opt}
                    </div>
                  ))}
                </div>

                {/* Explanation After Submit */}
                {result && q.explanation && (
                  <div className="mt-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded px-3 py-2">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}

                {/* Feedback */}
                {result && (
                  <div className="relative mt-2 text-sm h-12">

                    {result.detail?.[q._id] === "correct" && (
                      <div className="absolute left-0 top-0 bg-green-100 border border-green-300 rounded-xl px-4 py-2 text-green-800 font-semibold popupBounce shadow-md flex items-center gap-2">
                        🎉 Perfect! All blanks correct!
                      </div>
                    )}

                    {result.detail?.[q._id] === "partial" && (
                      <div className="absolute left-0 top-0 bg-blue-100 border border-blue-300 rounded-xl px-4 py-2 text-blue-800 font-semibold popupBounce shadow-md flex items-center gap-2">
                        👍 Good try! Some blanks matched!
                      </div>
                    )}

                    {result.detail?.[q._id] === "wrong" && (
                      <div className="absolute left-0 top-0 bg-red-100 border border-red-300 rounded-xl px-4 py-2 text-red-700 font-semibold shakeWrong shadow-md flex items-center gap-2">
                        ❌ Wrong! Try again!
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

            {type === "cloze-select" && (
              <div className="mt-4 space-y-4">
                <p>Choose the correct option from the dropdown menu in order to make each statement true.</p>
                <h1 className="font-medium text-slate-800">
                  {(q.clozeSelect?.text || "").replace(/\[\[(blank\d+)\]\]/g, "______")}
                </h1>

                {(() => {
                  const parsed = parseClozeSelect(q);

                  return (
                    <div className="text-sm leading-relaxed flex flex-wrap">
                      {parsed.parts.map((p, i) => (
                        <span key={i} className="mr-1">
                          {p.type === "text" && p.value}

                          {p.type === "blank" && (
                            <select
                              className="
                    w-[55px]
                    h-[30px]
                    border border-gray-600 
                    rounded-md 
                    bg-white 
                    shadow-sm 
                    text-sm 
                    text-center
                    appearance-none
                    cursor-pointer
                    pr-6
                  "
                              style={{
                                backgroundImage:
                                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path fill='black' d='M0 0 L5 6 L10 0'/></svg>\")",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "right 6px center",
                              }}
                              value={answers[q._id]?.clozeSelect?.[p.id] || ""}
                              onChange={(e) => {
                                const prev = answers[q._id]?.clozeSelect || {};
                                setAns(q._id, {
                                  clozeSelect: { ...prev, [p.id]: e.target.value },
                                });
                              }}
                            >
                              <option value=""></option>
                              {(q.clozeSelect?.blanks?.[p.id]?.options || []).map(
                                (opt, oi) => (
                                  <option key={oi} value={opt}>
                                    {opt}
                                  </option>
                                )
                              )}
                            </select>
                          )}
                        </span>
                      ))}
                    </div>
                  );
                })()}

                {/* Explanation after submit */}
                {result && q.explanation && (
                  <div className="mt-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded px-3 py-2">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}

                {/* Feedback */}
                {result && (
                  <div className="relative mt-2 text-sm h-12">
                    {result.detail?.[q._id] === "correct" && (
                      <div className="absolute left-0 top-0 bg-green-100 border border-green-300 rounded-xl px-4 py-2 text-green-800 font-semibold popupBounce shadow-md flex items-center gap-2">
                        🎉 All dropdown answers correct!
                      </div>
                    )}

                    {result.detail?.[q._id] === "partial" && (
                      <div className="absolute left-0 top-0 bg-blue-100 border border-blue-300 rounded-xl px-4 py-2 text-blue-800 font-semibold popupBounce shadow-md flex items-center gap-2">
                        👍 Some answers correct!
                      </div>
                    )}

                    {result.detail?.[q._id] === "wrong" && (
                      <div className="absolute left-0 top-0 bg-red-100 border border-red-300 rounded-xl px-4 py-2 text-red-700 font-semibold shakeWrong shadow-md flex items-center gap-2">
                        ❌ Incorrect! Try again!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}



          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button disabled={busy || !!result}
          className="rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 disabled:opacity-50">
          {busy ? "Submitting..." : "Submit Exam"}
        </button>
        {result && (
          <button type="button" onClick={() => window.location.assign("/dashboard/exams")}
            className="rounded-lg border px-4 py-2 hover:bg-slate-50">
            Back to Stage 1
          </button>
        )}
      </div>
    </form>
  );
}
