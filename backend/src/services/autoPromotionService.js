import User from "../models/User.js";

/**
 * Board-specific promotion rules
 * - CBSE: Academic year starts April 1st
 * - ICSE: Academic year starts April 1st
 * - WB Board: Academic year starts January 1st
 * - State Board: Academic year starts June 1st (varies by state, using June as default)
 */

const BOARD_PROMOTION_CONFIG = {
  CBSE: { promotionMonth: 4, promotionDay: 1 }, // April 1st
  ICSE: { promotionMonth: 4, promotionDay: 1 }, // April 1st
  "WB Board": { promotionMonth: 1, promotionDay: 1 }, // January 1st
  "State Board": { promotionMonth: 6, promotionDay: 1 }, // June 1st
};

/**
 * Get the next class based on current class
 * @param {string} currentClass - Current class (e.g., "1", "2", "10", "11", "12")
 * @returns {string|null} - Next class or null if final class
 */
function getNextClass(currentClass) {
  const classNum = parseInt(currentClass);

  if (isNaN(classNum)) {
    return null; // Invalid class
  }

  if (classNum >= 12) {
    return null; // Already in final class
  }

  return String(classNum + 1);
}

/**
 * Check if promotion should happen for a user
 * @param {Object} user - User document
 * @param {Date} currentDate - Current date
 * @returns {boolean} - True if user should be promoted
 */
function shouldPromote(user, currentDate) {
  if (!user.board || !user.className || !user.registrationYear || !user.registrationMonth) {
    return false; // Missing required data
  }

  const config = BOARD_PROMOTION_CONFIG[user.board];
  if (!config) {
    return false; // Unknown board
  }

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JS months are 0-indexed
  const currentDay = currentDate.getDate();

  // Check if we've passed the promotion date this year
  const promotionDateThisYear = new Date(currentYear, config.promotionMonth - 1, config.promotionDay);

  // If user was last promoted this year, don't promote again
  if (user.lastPromotedYear === currentYear) {
    return false;
  }

  // Calculate years since registration
  const registrationDate = new Date(user.registrationYear, user.registrationMonth - 1, 1);

  // Check if we're past the promotion date
  if (currentDate >= promotionDateThisYear) {
    // Check if this is the first promotion or if a year has passed since last promotion
    if (!user.lastPromotedYear) {
      // First promotion: check if at least one promotion cycle has passed since registration
      return currentDate >= new Date(user.registrationYear, config.promotionMonth - 1, config.promotionDay);
    } else {
      // Not first promotion: check if we've passed this year's promotion date and haven't promoted yet
      return user.lastPromotedYear < currentYear;
    }
  }

  return false;
}

/**
 * Promote a single user to next class
 * @param {Object} user - User document
 * @returns {Promise<Object|null>} - Updated user or null if not promoted
 */
export async function promoteUser(user) {
  const currentDate = new Date();

  if (!shouldPromote(user, currentDate)) {
    return null;
  }

  const nextClass = getNextClass(user.className);

  if (!nextClass) {
    // console.log(`User ${user.email} is already in final class (${user.className})`);
    return null;
  }

  // Update user's class and last promoted year
  user.className = nextClass;
  user.class = nextClass; // Update old field too for compatibility
  user.lastPromotedYear = currentDate.getFullYear();

  await user.save();

  // console.log(`Promoted user ${user.email} from class ${user.className} to ${nextClass}`);
  return user;
}

/**
 * Run auto-promotion for all eligible students
 * @returns {Promise<Object>} - Promotion statistics
 */
export async function runAutoPromotion() {
  try {
    // console.log("Starting auto-promotion process...");

    const students = await User.find({
      role: "student",
      board: { $in: Object.keys(BOARD_PROMOTION_CONFIG) },
      className: { $exists: true, $ne: "" },
      registrationYear: { $exists: true, $ne: null },
      registrationMonth: { $exists: true, $ne: null },
    });

    // console.log(`Found ${students.length} students eligible for promotion check`);

    let promoted = 0;
    let skipped = 0;
    let errors = 0;

    for (const student of students) {
      try {
        const result = await promoteUser(student);
        if (result) {
          promoted++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error promoting user ${student.email}:`, error);
        errors++;
      }
    }

    const stats = {
      total: students.length,
      promoted,
      skipped,
      errors,
      timestamp: new Date(),
    };

    // console.log("Auto-promotion completed:", stats);
    return stats;
  } catch (error) {
    console.error("Auto-promotion error:", error);
    throw error;
  }
}

/**
 * Schedule auto-promotion to run daily
 * Checks are performed daily, but promotions only happen on the configured dates
 */
export function scheduleAutoPromotion() {
  // Run once immediately on startup
  runAutoPromotion().catch(console.error);

  // Then run daily at midnight
  const DAILY_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  setInterval(() => {
    runAutoPromotion().catch(console.error);
  }, DAILY_INTERVAL);

  // console.log("Auto-promotion scheduler started (runs daily at startup time)");
}
