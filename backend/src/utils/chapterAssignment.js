import ChapterAssignment from "../models/ChapterAssignment.js";
import Question from "../models/Question.js";

// A chapter-level assignment (assignment.topic set) only matches when the
// caller is acting on that exact topic — it never matches topic creation
// (topicId undefined) or a different topic. A board/class/subject-level
// assignment (topic left null) matches anything within that scope,
// including creating brand-new topics in it.
function scopeMatches(assignment, board, classId, subject, topicId) {
  if (String(assignment.board) !== String(board)) return false;
  if (assignment.class && String(assignment.class) !== String(classId)) return false;
  if (assignment.subject && String(assignment.subject) !== String(subject)) return false;
  if (assignment.topic && (!topicId || String(assignment.topic) !== String(topicId))) return false;
  return true;
}

// A writer may create/edit content or questions for a given board/class/
// subject(/topic) scope when either:
//  - nobody has claimed that scope AND the writer has no assignments of
//    their own (fully open, same as before this feature existed), or
//  - the writer holds an assignment that covers that scope.
// Once any assignment exists for a scope, only its assigned writer(s) may
// touch it. Once a writer holds any assignment, they're limited to their
// assigned scopes only — they can no longer roam into unclaimed areas.
export async function assertScopeWriteAccess({ board, classId, subject, topicId }, user) {
  const role = String(user?.role || "").toLowerCase();
  if (role === "admin") return { ok: true };
  if (!board) return { ok: true };

  const candidates = await ChapterAssignment.find({ board }).select("writer board class subject topic").lean();
  const scopeAssignments = candidates.filter((a) => scopeMatches(a, board, classId, subject, topicId));

  if (scopeAssignments.length > 0) {
    const allowed = scopeAssignments.some((a) => String(a.writer) === String(user?.id));
    if (!allowed) {
      return { ok: false, message: "This board, class, subject, and chapter is assigned to another writer." };
    }
    return { ok: true };
  }

  const hasAnyAssignment = await ChapterAssignment.exists({ writer: user?.id });
  if (hasAnyAssignment) {
    return { ok: false, message: "You can only add content within your assigned board, class, and subject." };
  }

  return { ok: true };
}

// Finds the writer's assignment covering a scope, if any — used to
// auto-fill a new chapter's budget from the agreed rate. Only
// board/class/subject-level grants apply here since the chapter doesn't
// exist yet (no topicId to match a chapter-level grant against).
export async function findMatchingAssignment({ board, classId, subject }, writerId) {
  if (!board || !writerId) return null;
  const candidates = await ChapterAssignment.find({ board, writer: writerId, topic: null }).lean();
  return candidates.find((a) => scopeMatches(a, board, classId, subject)) || null;
}

// A chapter is payable once its content is approved and at least one
// practice question ("tryout") has been approved for it.
export async function computeChapterCompletion(topic) {
  const contentDone = Boolean(
    topic?.contentStatus === "approved" &&
      stripHtml(topic?.topicSummary) &&
      stripHtml(topic?.learningOutcome)
  );
  const questionsDone = await Question.exists({
    topic: String(topic?._id || ""),
    status: "approved",
  }).then(Boolean);

  return { contentDone, questionsDone };
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
}
