// Admin can grant a teacher a specific set of stages and question types
// they're allowed to create tryouts for (User.allowedStages /
// allowedQuestionTypes). An empty list on either field means unrestricted —
// this matches every teacher's default state, so existing teachers keep
// working exactly as before until an admin explicitly narrows them down.
export function assertQuestionPermission({ stage, type }, user) {
  const role = String(user?.role || "").toLowerCase();
  if (role !== "teacher") return { ok: true };

  const allowedStages = Array.isArray(user?.allowedStages) ? user.allowedStages : [];
  if (allowedStages.length > 0) {
    const stageNumber = Number(stage);
    if (!allowedStages.map(Number).includes(stageNumber)) {
      return { ok: false, message: `You're not permitted to add Stage ${stage} questions.` };
    }
  }

  const allowedTypes = Array.isArray(user?.allowedQuestionTypes) ? user.allowedQuestionTypes : [];
  if (allowedTypes.length > 0 && !allowedTypes.includes(String(type || ""))) {
    return { ok: false, message: "You're not permitted to add this question type." };
  }

  return { ok: true };
}
