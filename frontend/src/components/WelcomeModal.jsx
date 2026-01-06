import React, { useState, useEffect } from "react";
import { X, BookOpen, GraduationCap, CheckCircle } from "lucide-react";
import { myAttempts } from "../lib/api";

export default function WelcomeModal() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    checkIfNewUser();
  }, []);

  async function checkIfNewUser() {
    try {
      // Check if user has taken any exams
      const { items } = await myAttempts();

      // Only show modal if user has NO exam attempts (truly new user)
      if (!items || items.length === 0) {
        // Show modal after a short delay for better UX
        setTimeout(() => {
          setShowModal(true);
        }, 500);
      }
    } catch (err) {
      console.error("Failed to check user attempts", err);
    }
  }

  function handleClose() {
    setShowModal(false);
  }

  if (!showModal) return null;

  return (
    <div className="h-[100vh] fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-500 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 p-4 sm:p-6 md:p-8 text-white relative overflow-hidden flex-shrink-0">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm">
                  <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Welcome to EEC!</h2>
                  <p className="text-orange-100 text-xs sm:text-sm mt-0.5 sm:mt-1">Electronic Educare</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
                aria-label="Close welcome modal"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <p className="text-orange-50 text-sm sm:text-base md:text-lg">
              Let's get you started on your learning journey!
            </p>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
            Here's how to begin:
          </h3>

          <div className="space-y-4 sm:space-y-6">
            {/* Step 1 */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md">
                1
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 shrink-0" />
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Browse the Syllabus</h4>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Click on "Syllabus" in the sidebar to explore all available subjects and topics organized by your class and board.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md">
                2
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 shrink-0" />
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Choose a Topic</h4>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Select any subject to expand and view topics. Click on a topic you want to practice.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md">
                3
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 shrink-0" />
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Start Your Exam</h4>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm">
                  When you click a topic, you'll see exam details. Review them and click "Start Exam" when ready!
                </p>
              </div>
            </div>
          </div>

          {/* Tips Box */}
          <div className="mt-4 sm:mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-200 rounded-xl sm:rounded-2xl p-3 sm:p-5">
            <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
              <span className="text-lg sm:text-xl">💡</span>
              Pro Tips
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-orange-800">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5 shrink-0">•</span>
                <span>Take your time - there's no time limit on most exams</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5 shrink-0">•</span>
                <span>Track your progress with the progress bar during exams</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5 shrink-0">•</span>
                <span>Check "My Results" to see your scores and improve</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8 shrink-0">
          <button
            onClick={handleClose}
            className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 font-bold text-white text-base sm:text-lg hover:from-orange-600 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            Got it! Let's Start Learning
          </button>
        </div>
      </div>
    </div>
  );
}
