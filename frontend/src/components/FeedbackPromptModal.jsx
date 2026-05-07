import { useEffect, useState } from "react";

export default function FeedbackPromptModal({
  open,
  initialName = "",
  initialSchool = "",
  onClose,
  onSubmit,
}) {
  const [name, setName] = useState(initialName);
  const [schoolName, setSchoolName] = useState(initialSchool);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initialName || "");
    setSchoolName(initialSchool || "");
  }, [open, initialName, initialSchool]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const payload = {
      name: String(name || "").trim(),
      schoolName: String(schoolName || "").trim(),
      rating: Number(rating),
      comment: String(comment || "").trim(),
    };

    if (!payload.name || !payload.schoolName || !payload.comment) {
      setError("Please fill all fields.");
      return;
    }

    if (payload.comment.length < 8) {
      setError("Comment must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      await onSubmit(payload);
      setComment("");
      setRating(5);
    } catch (err) {
      setError(err?.message || "Failed to submit feedback");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-slate-900">Share Your Tryout Feedback</h3>
        <p className="mt-1 text-sm text-slate-600">Visible publicly only after admin approval.</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600">School</span>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </label>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-600">Star Rating</span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl leading-none ${star <= rating ? "text-yellow-500" : "text-slate-300"}`}
                  aria-label={`Rate ${star}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <label className="space-y-1 block">
            <span className="text-xs font-semibold text-slate-600">Comment</span>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Tell us your tryout experience"
            />
          </label>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              disabled={busy}
            >
              Later
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              disabled={busy}
            >
              {busy ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
