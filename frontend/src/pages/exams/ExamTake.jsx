import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getJSON, submitExam } from "../../lib/api";
import { ToastContainer, useToast } from "../../components/Toast";

export default function ExamTake() {
  const { attemptId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const state = useLocation().state; // {attemptId, questions,total,...} from start
  const STORAGE_KEY = `exam_${attemptId}_answers`;
  const META_STORAGE_KEY = `exam_${attemptId}_meta`;
  const WORD_LIMIT = 500;
  const RICH_WORD_LIMIT = 1000;
  const richEditorsRef = useRef({});

  // Try to restore from localStorage first
  const [meta, setMeta] = useState(() => {
    if (state) return state;
    // Try to restore meta from localStorage
    try {
      const saved = localStorage.getItem(META_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [answers, setAnswers] = useState(() => {
    // Try to restore answers from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [translatedQuestions, setTranslatedQuestions] = useState({});
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [matchTokenSelection, setMatchTokenSelection] = useState({});

  // Save meta to localStorage when it changes
  useEffect(() => {
    if (meta) {
      try {
        localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
      } catch (err) {
        console.error("Failed to save exam meta", err);
      }
    }
  }, [meta, META_STORAGE_KEY]);

  // Auto-save answers to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      } catch (err) {
        console.error("Failed to save answers", err);
      }
    }
  }, [answers, STORAGE_KEY]);

  // Clean up localStorage after successful submission
  useEffect(() => {
    if (result) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(META_STORAGE_KEY);
      } catch (err) {
        console.error("Failed to clear saved data", err);
      }
    }
  }, [result, STORAGE_KEY, META_STORAGE_KEY]);

  useEffect(() => {
    if (!meta) {
      setMeta(null);
    }
  }, [meta]);

  // Hydrate legacy/incomplete match-list payloads with full question docs.
  useEffect(() => {
    if (!meta?.questions?.length) return;
    let mounted = true;

    async function hydrateMatchListQuestions() {
      const needsHydration = meta.questions.filter((q) => {
        const qType = q?.type || meta.type;
        if (qType !== "match-list") return false;

        const left = Array.isArray(q?.matchList?.left) ? q.matchList.left : [];
        const right = Array.isArray(q?.matchList?.right) ? q.matchList.right : [];
        return left.length === 0 || right.length === 0;
      });

      if (!needsHydration.length) return;

      const fetched = await Promise.all(
        needsHydration.map((q) => getJSON(`/api/questions/${q._id}`).catch(() => null))
      );

      const fetchedMap = new Map(
        fetched.filter(Boolean).map((doc) => [String(doc._id), doc])
      );

      const nextQuestions = meta.questions.map((q) => {
        const full = fetchedMap.get(String(q._id));
        if (!full) return q;
        return {
          ...q,
          type: full.type || q.type,
          question: q.question || full.question,
          prompt: q.prompt || full.prompt || full.matchList?.prompt,
          matchList: full.matchList || q.matchList || {},
          explanation: q.explanation || full.explanation,
        };
      });

      if (mounted) {
        setMeta((prev) => (prev ? { ...prev, questions: nextQuestions } : prev));
      }
    }

    hydrateMatchListQuestions();
    return () => {
      mounted = false;
    };
  }, [meta]);

  if (!meta) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="max-w-md text-center space-y-4 p-6">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Not Found</h2>
          <p className="text-gray-600">
            We couldn't find this exam session. It may have expired or been completed already.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => nav("/dashboard/syllabus")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 font-semibold text-white hover:from-orange-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg"
            >
              Browse Syllabus
            </button>
            <button
              onClick={() => nav("/dashboard/exams")}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              View Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { questions = [], type, total } = meta;

  function setAns(qid, payload) {
    setAnswers(prev => ({ ...prev, [qid]: { ...(prev[qid] || {}), ...payload } }));
  }

  function countWords(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function applyRichCmd(qid, cmd, value = null) {
    const el = richEditorsRef.current[qid];
    if (!el) return;
    el.focus();
    document.execCommand(cmd, false, value);
    const html = el.innerHTML || "";
    const text = (el.innerText || "").trim();
    setAns(qid, { essay: text, essayRich: { html, text } });
  }

  async function translateText(text, targetLang) {
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      return data[0]?.map(item => item[0]).join('') || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  async function handleTranslateAllQuestions(targetLang) {
    if (targetLang === 'en') {
      setTranslatedQuestions({});
      return;
    }

    setIsTranslating(true);
    try {
      const translations = {};

      for (const q of questions) {
        const translatedQuestion = await translateText(q.question || q.prompt || q.plainText || '', targetLang);

        let translatedOptions = [];
        if (q.options && Array.isArray(q.options)) {
          translatedOptions = await Promise.all(
            q.options.map(async (opt) => ({
              ...opt,
              text: await translateText(opt.text, targetLang)
            }))
          );
        }

        const translatedExplanation = q.explanation ? await translateText(q.explanation, targetLang) : null;

        translations[q._id] = {
          question: translatedQuestion,
          options: translatedOptions,
          explanation: translatedExplanation
        };
      }

      setTranslatedQuestions(translations);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
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

        if (q.type === "essay-rich")
          return { qid: q._id, essay: a.essay || "", essayRich: a.essayRich || {} };

        if (q.type === "choice-matrix")
          return { qid: q._id, matrix: a.matrix || {} };

        if (q.type === "cloze-drag")
          return { qid: q._id, cloze: a.cloze || {} };

        if (q.type === "cloze-select")
          return { qid: q._id, clozeSelect: a.clozeSelect || {} };

        if (q.type === "cloze-text")
          return { qid: q._id, clozeText: a.clozeText || {} };

        if (q.type === "match-list")
          return { qid: q._id, matchList: a.matchList || {} };

        return { qid: q._id };
      });




      const res = await submitExam(attemptId, arr);
      setResult(res); // {score,total,percent}

      // Show feedback message based on score
      const percentage = res.percent || 0;
      if (percentage >= 80) {
        toast.success("🎉 Excellent work! You aced this exam!");
      } else if (percentage >= 60) {
        toast.success("✅ Good job! Keep practicing to improve further!");
      } else if (percentage >= 40) {
        toast.info("📚 You're very close to the answer! We recommend revising the study materials to improve your understanding.", {
          autoClose: 6000,
        });
      } else {
        toast.info("📖 Don't worry! Please revise the study materials and try again. You can do it!", {
          autoClose: 6000,
        });
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit exam. Please try again.");
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

  function parseClozeText(q) {
    const text = q.clozeText?.text || "";
    const parts = [];
    const regex = /\[\[(.*?)\]\]|\{\{(.*?)\}\}|\[(blank\d+)\]/gi;
    let last = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const before = text.slice(last, match.index);
      if (before) parts.push({ type: "text", value: before });
      const key = String(match[1] || match[2] || match[3] || "").trim();
      parts.push({ type: "blank", id: key });
      last = regex.lastIndex;
    }

    const after = text.slice(last);
    if (after) parts.push({ type: "text", value: after });
    return parts;
  }

  function assignMatchPair(qid, leftIndex, rightIndex) {
    setAnswers((prev) => {
      const current = { ...(prev[qid]?.matchList || {}) };
      Object.keys(current).forEach((k) => {
        if (String(current[k]) === String(rightIndex)) {
          delete current[k];
        }
      });
      current[String(leftIndex)] = String(rightIndex);
      return { ...prev, [qid]: { ...(prev[qid] || {}), matchList: current } };
    });
  }

  function clearMatchPair(qid, leftIndex) {
    setAnswers((prev) => {
      const current = { ...(prev[qid]?.matchList || {}) };
      delete current[String(leftIndex)];
      return { ...prev, [qid]: { ...(prev[qid] || {}), matchList: current } };
    });
  }


  return (
    <>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <form onSubmit={onSubmit} className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Stage {meta?.stage || 1} — {type}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {total} Questions
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Translation Dropdown */}
              {type === "mcq-single" && (
                <div className="flex items-center gap-2">
                  <select
                    value={targetLanguage}
                    onChange={(e) => {
                      const newLang = e.target.value;
                      setTargetLanguage(newLang);
                      handleTranslateAllQuestions(newLang);
                    }}
                    className="text-sm border-2 border-indigo-200 rounded-xl px-4 py-2 bg-white hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer shadow-sm transition-all font-medium text-slate-700"
                    disabled={isTranslating}
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="bn">🇧🇩 Bengali</option>
                    <option value="hi">🇮🇳 Hindi</option>
                    <option value="es">🇪🇸 Spanish</option>
                    <option value="fr">🇫🇷 French</option>
                    <option value="de">🇩🇪 German</option>
                    <option value="zh-CN">🇨🇳 Chinese</option>
                    <option value="ar">🇸🇦 Arabic</option>
                    <option value="ja">🇯🇵 Japanese</option>
                    <option value="ko">🇰🇷 Korean</option>
                    <option value="pt">🇵🇹 Portuguese</option>
                    <option value="ru">🇷🇺 Russian</option>
                    <option value="it">🇮🇹 Italian</option>
                  </select>
                  {isTranslating && (
                    <span className="text-sm text-indigo-600 font-medium animate-pulse">
                      Translating...
                    </span>
                  )}
                </div>
              )}

              {result && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl px-6 py-3 shadow-lg">
                  <div className="text-sm font-bold text-white">
                    Score: {result.score} / {result.total}
                  </div>
                  <div className="text-xs text-emerald-50 font-medium">{result.percent}%</div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {!result && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-indigo-700">
                  Progress: {Object.keys(answers).length} of {total} answered
                </span>
                <span className="text-sm font-medium text-indigo-600">
                  {Math.round((Object.keys(answers).length / total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-indigo-100 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out shadow-md"
                  style={{ width: `${(Object.keys(answers).length / total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* RENDER QUESTIONS */}
        <div className="space-y-5">
          {questions.map((q, idx) => {
            const renderType = q.type || type;
            const displayQuestionText =
              renderType === "cloze-text"
                ? String(q.clozeText?.text || "")
                    .replace(/\[\[(.*?)\]\]|\{\{(.*?)\}\}|\[(blank\d+)\]/gi, "______")
                : (translatedQuestions[q._id]?.question || q.question ||
                  q.prompt ||
                  q.plainText ||
                  q.choiceMatrix?.prompt ||
                  q.matchList?.prompt ||
                  q.clozeText?.text ||
                  q.clozeSelect?.text);
            return (
              <div key={q._id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-slate-100">
              {/* Question Number Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md">
                  Question {idx + 1} of {total}
                </span>
              </div>

              {/* Display Question Text */}
              <div className="font-semibold text-lg text-slate-800 mb-4 leading-relaxed">
                {displayQuestionText}
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

            {renderType === "mcq-single" && (
              <div className="space-y-3">
                {(translatedQuestions[q._id]?.options || q.options).map((o) => {
                  const checked = (answers[q._id]?.mcq || "") === o.key;
                  return (
                    <label
                      key={o.key}
                      className={`
            flex items-center gap-4
            px-5 py-4 cursor-pointer
            rounded-xl border-2
            transition-all duration-200
            ${checked
              ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-400 shadow-md scale-[1.02]"
              : "bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-white hover:shadow-sm"}
          `}
                    >
                      <span className={`
                          text-sm font-semibold px-2.5 py-1 rounded-lg
                          ${checked ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-700"}
                        `}>
                          {o.key}
                        </span>
                      <input
                        type="radio"
                        name={`q-${q._id}`}
                        checked={checked}
                        onChange={() => setAns(q._id, { mcq: o.key })}
                        className="h-5 w-5 accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        {/* <span className={`
                          text-sm font-semibold px-2.5 py-1 rounded-lg
                          ${checked ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-700"}
                        `}>
                          {o.key}
                        </span> */}
                        <span className={`text-base ${checked ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                          {o.text}
                        </span>
                      </div>
                      {checked && (
                        <span className="text-indigo-600 text-xl font-bold"></span>
                      )}
                    </label>
                  );
                })}

                {/* 🔥 Explanation with Translation Support */}
                {result && q.explanation && (
                  <div className="mt-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-xl px-5 py-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💡</span>
                      <div>
                        <strong className="text-amber-900 font-bold">Explanation:</strong>
                        <p className="text-amber-800 mt-1 leading-relaxed">
                          {translatedQuestions[q._id]?.explanation || q.explanation}
                        </p>
                      </div>
                    </div>
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


            {renderType === "mcq-multi" && (
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


            {renderType === "choice-matrix" && (
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
            rounded-xl text-red-700 font-semibold shakeWrong shadow-@keyframes option-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}@keyframes option-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes option-selected {
  0% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

.mcq-option-hover:hover {
  animation: option-pulse 0.6s ease infinite;
}

.mcq-option-selected {
  animation: option-selected 0.3s ease forwards;
}

@keyframes option-selected {
  0% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

.mcq-option-hover:hover {
  animation: option-pulse 0.6s ease infinite;
}

.mcq-option-selected {
  animation: option-selected 0.3s ease forwards;
}md flex items-center gap-2
          ">
                        <span className="text-2xl">❌</span>
                        Wrong! Try again!
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}



            {renderType === "true-false" && (
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

            {renderType === "essay-plain" && (
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

            {renderType === "cloze-drag" && (
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

            {renderType === "cloze-select" && (
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

            {renderType === "cloze-text" && (
              <div className="mt-4 space-y-4">
                {(() => {
                  const parts = parseClozeText(q);
                  const answerKeys = Object.keys(q.clozeText?.answers || {});
                  const noBlanks = !parts.some((p) => p.type === "blank");

                  if (noBlanks && !answerKeys.length) {
                    return (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
                        This cloze question has no detected blanks. Please contact admin.
                      </div>
                    );
                  }

                  if (noBlanks && answerKeys.length) {
                    return (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-700">Fill in the blanks:</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {answerKeys.map((k) => (
                            <label key={`${q._id}-fallback-${k}`} className="space-y-1">
                              <span className="text-xs font-semibold text-slate-600">{k}</span>
                              <input
                                type="text"
                                value={answers[q._id]?.clozeText?.[k] || ""}
                                onChange={(e) => {
                                  const prev = answers[q._id]?.clozeText || {};
                                  setAns(q._id, {
                                    clozeText: { ...prev, [k]: e.target.value },
                                  });
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Type..."
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="text-sm md:text-base leading-8 flex flex-wrap gap-1">
                      {parts.map((p, i) => (
                        <span key={`${q._id}-clozet-${i}`}>
                          {p.type === "text" ? (
                            p.value
                          ) : (
                            <input
                              type="text"
                              value={answers[q._id]?.clozeText?.[p.id] || ""}
                              onChange={(e) => {
                                const prev = answers[q._id]?.clozeText || {};
                                setAns(q._id, {
                                  clozeText: { ...prev, [p.id]: e.target.value },
                                });
                              }}
                              className="inline-block min-w-[120px] px-2 py-1 mx-1 border-b-2 border-indigo-400 bg-indigo-50/40 rounded-t-md outline-none focus:bg-white focus:border-indigo-600"
                              placeholder="Type..."
                            />
                          )}
                        </span>
                      ))}
                    </div>
                  );
                })()}

                {result && q.explanation && (
                  <div className="mt-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded px-3 py-2">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            )}

            {renderType === "essay-rich" && (
              <div className="mt-3 space-y-4">
                {q.richHtml && (
                  <div
                    className="text-sm text-slate-700 leading-relaxed rounded-xl bg-slate-50 border border-slate-200 p-4"
                    dangerouslySetInnerHTML={{ __html: q.richHtml }}
                  />
                )}

                <div className="border border-gray-300 rounded-sm bg-white overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-300 bg-[#f4f4f4]">
                    <button type="button" onClick={() => applyRichCmd(q._id, "bold")} className="w-7 h-7 rounded text-lg font-bold text-slate-700 hover:bg-gray-200">B</button>
                    <button type="button" onClick={() => applyRichCmd(q._id, "italic")} className="w-7 h-7 rounded text-lg italic font-semibold text-slate-700 hover:bg-gray-200">I</button>
                    <button type="button" onClick={() => applyRichCmd(q._id, "underline")} className="w-7 h-7 rounded text-lg underline font-semibold text-slate-700 hover:bg-gray-200">U</button>
                    <span className="w-px h-5 bg-gray-300 mx-1" />
                    <button type="button" onClick={() => applyRichCmd(q._id, "insertUnorderedList")} className="w-7 h-7 rounded text-lg text-slate-700 hover:bg-gray-200">•</button>
                    <button type="button" onClick={() => applyRichCmd(q._id, "insertOrderedList")} className="w-7 h-7 rounded text-sm font-bold text-slate-700 hover:bg-gray-200">1.</button>
                    <button type="button" onClick={() => applyRichCmd(q._id, "formatBlock", "blockquote")} className="w-7 h-7 rounded text-lg font-bold text-slate-700 hover:bg-gray-200">”</button>
                  </div>

                  <div
                    ref={(el) => {
                      if (!el) return;
                      richEditorsRef.current[q._id] = el;
                      if (el.dataset.initialized === "1") return;
                      const initialHtml =
                        answers[q._id]?.essayRich?.html ||
                        (answers[q._id]?.essay
                          ? String(answers[q._id].essay).replace(/\n/g, "<br/>")
                          : "");
                      el.innerHTML = initialHtml;
                      el.dataset.initialized = "1";
                    }}
                    contentEditable
                    suppressContentEditableWarning
                    className="min-h-[180px] md:min-h-[220px] p-4 text-[16px] text-slate-800 leading-relaxed outline-none"
                    onInput={(e) => {
                      const html = e.currentTarget.innerHTML || "";
                      const text = (e.currentTarget.innerText || "").trim();
                      setAns(q._id, { essay: text, essayRich: { html, text } });
                    }}
                  />

                  <div className="px-4 py-2 border-t border-gray-300 bg-[#f8f8f8] text-right text-[15px] text-slate-700">
                    {countWords(answers[q._id]?.essay || answers[q._id]?.essayRich?.text || "")} / {RICH_WORD_LIMIT} Word Limit
                  </div>
                </div>

                {result && (
                  <div className="mt-2 text-sm">
                    {result.detail && result.detail[q._id] === "correct" && (
                      <div className="text-emerald-600 font-medium">🎉 Great response!</div>
                    )}

                    {result.detail && result.detail[q._id] === "partial" && (
                      <div className="text-blue-600 font-medium">👍 Good attempt.</div>
                    )}

                    {result.detail && result.detail[q._id] === "wrong" && (
                      <div className="text-red-500 font-medium">❌ Try improving your answer.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {renderType === "match-list" && (
              <div className="mt-4 space-y-4">
                {(() => {
                  const leftItems = Array.isArray(q.matchList?.left) ? q.matchList.left : [];
                  const rightItems = Array.isArray(q.matchList?.right) ? q.matchList.right : [];

                  if (!leftItems.length || !rightItems.length) {
                    return (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
                        Match list data is loading. Please wait a moment and try again.
                      </div>
                    );
                  }

                  const currentMap = answers[q._id]?.matchList || {};
                  const selectedToken = matchTokenSelection[q._id] ?? null;

                  return (
                    <div className="rounded-sm border border-[#cfcfcf] bg-[#ededed] overflow-hidden">
                      <div className="p-4 md:p-6 space-y-3">
                        {leftItems.map((leftItem, li) => {
                          const assignedIndex = currentMap[String(li)];
                          const assignedText =
                            assignedIndex !== undefined ? rightItems[Number(assignedIndex)] : "";

                          return (
                            <div key={`ml-row-${q._id}-${li}`} className="grid grid-cols-[1fr_78px_1fr] gap-2 items-center">
                              <div className="h-11 border border-[#cfcfcf] bg-[#e8e8e8] flex items-center justify-center font-medium text-[#3d3d3d] px-2 text-sm">
                                {leftItem}
                              </div>

                              <div className="relative h-11 flex items-center justify-center">
                                <span className="absolute left-1 w-2.5 h-2.5 bg-[#707070] rounded-full" />
                                <div className="absolute left-3 right-3 h-1.5 bg-[#707070] rounded-full" />
                                <span className="absolute right-1 w-2.5 h-2.5 bg-[#707070] rounded-full" />
                              </div>

                              <div
                                role="button"
                                tabIndex={0}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  const ri = e.dataTransfer.getData("match-right-index");
                                  if (ri !== "") assignMatchPair(q._id, li, ri);
                                }}
                                onClick={() => {
                                  if (selectedToken !== null && selectedToken !== undefined) {
                                    assignMatchPair(q._id, li, selectedToken);
                                    setMatchTokenSelection((prev) => ({ ...prev, [q._id]: null }));
                                    return;
                                  }
                                  if (assignedIndex !== undefined) {
                                    clearMatchPair(q._id, li);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    if (selectedToken !== null && selectedToken !== undefined) {
                                      assignMatchPair(q._id, li, selectedToken);
                                      setMatchTokenSelection((prev) => ({ ...prev, [q._id]: null }));
                                      return;
                                    }
                                    if (assignedIndex !== undefined) {
                                      clearMatchPair(q._id, li);
                                    }
                                  }
                                }}
                                className={`h-11 border-2 border-dashed px-3 text-sm text-left transition-all
                                  relative flex items-center
                                  ${assignedIndex !== undefined
                                    ? "border-[#5ca86b] bg-[#e8f4eb] text-[#2f6e3a]"
                                    : "border-[#cfcfcf] bg-[#efefef] text-[#777777] hover:border-[#9e9e9e]"}`}
                              >
                                <span className="pr-6">{assignedText || "Drop answer here"}</span>
                                {assignedIndex !== undefined && (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      clearMatchPair(q._id, li);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        clearMatchPair(q._id, li);
                                      }
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#2f6e3a] bg-white border border-[#8dc29a] rounded-full w-5 h-5 inline-flex items-center justify-center cursor-pointer"
                                    aria-label="Clear match"
                                  >
                                    ×
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="relative bg-[#dfdfdf] border-t border-[#cfcfcf] p-4 md:p-5">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#dfdfdf] border-l border-t border-[#cfcfcf] rotate-45" />
                        <div className="flex flex-wrap justify-center gap-2">
                          {rightItems.map((rightItem, ri) => {
                            const isUsed = Object.values(currentMap).includes(String(ri));
                            const isSelected = String(selectedToken) === String(ri);

                            return (
                              <button
                                key={`ml-token-${q._id}-${ri}`}
                                type="button"
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData("match-right-index", String(ri))}
                                onClick={() =>
                                  setMatchTokenSelection((prev) => ({
                                    ...prev,
                                    [q._id]: isSelected ? null : String(ri),
                                  }))
                                }
                                className={`px-3 py-2 border text-sm font-medium transition-all
                                  ${isSelected
                                    ? "border-[#7a7a7a] bg-[#ececec] text-[#2f2f2f]"
                                    : isUsed
                                    ? "border-[#c8c8c8] bg-[#e6e6e6] text-[#8a8a8a]"
                                    : "border-[#d3d3d3] bg-[#ebebeb] text-[#5f5f5f] hover:border-[#9e9e9e]"}`}
                                title="Drag to a blank or tap then tap a blank"
                              >
                                <span className="mr-1 opacity-60">☷</span>
                                {rightItem}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {result && q.explanation && (
                  <div className="mt-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded px-3 py-2">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            )}



          </div>
            );
          })}
      </div>

        {/* Submit Button Section */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            disabled={busy || !!result}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
          >
            {busy ? "Submitting..." : "Submit Exam"}
          </button>
          {/* {result && (
            <button
              type="button"
              onClick={() => window.location.assign("/dashboard/exams")}
              className="bg-white border-2 border-slate-300 hover:border-indigo-400 text-slate-700 font-semibold px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Back to Stage 1
            </button>
          )} */}
        </div>
      </div>
      </form>
    </>
  );
}
