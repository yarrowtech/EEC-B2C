// // utils/autoPromoteStudent.js
// import { PROMOTION_RULES } from "../config/promotionRules.js";

// export function autoPromoteStudent(user) {
//   if (user.role !== "student") return user;
//   if (!user.board || !user.className) return user;

//   const rule = PROMOTION_RULES[user.board];
//   if (!rule) return user;

//   const now = new Date();
//   const currentMonth = now.getMonth() + 1; // 1-12
//   const currentYear = now.getFullYear();

//   // Already promoted this year
//   if (user.lastPromotedYear === currentYear) return user;

//   // Not promotion time yet
//   if (currentMonth < rule.promoteMonth) return user;

//   // Extract class number
//   const match = user.className.match(/\d+/);
//   if (!match) return user;

//   const currentClass = parseInt(match[0], 10);
//   if (currentClass >= 12) return user; // max class

//   user.className = `Class ${currentClass + 1}`;
//   user.lastPromotedYear = currentYear;

//   return user;
// }


// utils/autoPromoteStudent.js
// utils/autoPromoteStudent.js
import { PROMOTION_RULES } from "../config/promotionRules.js";

/**
 * Auto-promotes a student based on board rules.
 * Runs safely on every profile load.
 * Returns true only when promotion actually happens.
 */
export function autoPromoteStudent(user) {
  // Only students are eligible
  if (user.role !== "student") return false;

  // Support legacy `class` field
  const currentClassName = user.className || user.class;
  if (!user.board || !currentClassName) return false;

  // Normalize board key
  const boardKey = String(user.board).toUpperCase().trim();
  const rule = PROMOTION_RULES[boardKey];
  if (!rule) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1–12

  // Prevent double promotion in same academic year
  if (user.lastPromotedYear === currentYear) return false;

  // Respect board-specific promotion month
  if (currentMonth < rule.promoteMonth) return false;

  // Extract class number
  const match = currentClassName.match(/\d+/);
  if (!match) return false;

  const currentClass = parseInt(match[0], 10);
  if (Number.isNaN(currentClass) || currentClass >= 12) return false;

  // 🔼 Promote student
  const nextClassName = `Class ${currentClass + 1}`;
  user.className = nextClassName;
  user.class = nextClassName; // keep legacy field in sync
  user.lastPromotedYear = currentYear;

  return true; // promotion happened
}





