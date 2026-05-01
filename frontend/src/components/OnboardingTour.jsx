// src/components/OnboardingTour.jsx
import { useEffect, useRef, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function getTourKey() {
  const u = getUser();
  const uid = String(u?._id || u?.id || u?.email || "anon");
  const role = String(u?.role || "student");
  return `eec:tour-done:${uid}:${role}`;
}

export function isTourDone() {
  return localStorage.getItem(getTourKey()) === "1";
}

export function markTourDone() {
  localStorage.setItem(getTourKey(), "1");
}

export function resetTour() {
  localStorage.removeItem(getTourKey());
}

/* ── Role-specific step definitions ── */

const STUDENT_STEPS = [
  {
    popover: {
      title: "Welcome to your Dashboard! 🎉",
      description: "This is your personal learning hub. Let me walk you through everything so you know exactly where to go.",
    },
  },
  {
    element: "#tour-nav-dashboard",
    popover: {
      title: "Dashboard Home",
      description: "Always come back here to see your progress overview, daily stats, and recent activity.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-exam-block",
    popover: {
      title: "Practice, Exams & Study Materials 📚",
      description: "Take subject-wise tests, access study notes from your teachers, play brain games, and check your past results — all from this section.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-daily-challenge",
    popover: {
      title: "Daily Challenge 🔥",
      description: "Answer one question every day to build your streak! Consistent practice earns you badges and bonus points.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#tour-profile-card",
    popover: {
      title: "Your Profile",
      description: "View your level, accumulated points, and manage your account settings from here.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#tour-mobile-nav",
    popover: {
      title: "Quick Navigation Bar 📱",
      description: "Use this bottom bar to instantly switch between Home, Study Materials, Results, Practice, and more.",
      side: "top",
      align: "center",
    },
  },
];

const TEACHER_STEPS = [
  {
    popover: {
      title: "Welcome, Teacher! 👩‍🏫",
      description: "This is your teaching dashboard. Let me show you where everything is so you can hit the ground running.",
    },
  },
  {
    element: "#tour-nav-dashboard",
    popover: {
      title: "Your Dashboard Overview",
      description: "See your upload trends for the last 7 days and a summary of all your questions and materials here.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-nav-upload-materials",
    popover: {
      title: "Upload Study Materials 📄",
      description: "Share PDFs, notes, and learning resources with your students. They'll get notified automatically.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-questions-block",
    popover: {
      title: "Manage Questions ❓",
      description: "Create MCQs, essays, true/false, and many other question types for exams and practice sets.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-exam-block",
    popover: {
      title: "Exams & Syllabus",
      description: "Set up exams and manage the syllabus structure your students follow.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-profile-card",
    popover: {
      title: "Your Profile",
      description: "Manage your teacher profile and account settings here.",
      side: "top",
      align: "start",
    },
  },
];

const ADMIN_STEPS = [
  {
    popover: {
      title: "Welcome, Admin! 🛡️",
      description: "This is the admin control panel. Here's a quick tour of all the key sections you'll need.",
    },
  },
  {
    element: "#tour-nav-dashboard",
    popover: {
      title: "Admin Overview",
      description: "Monitor total students, teachers, questions uploaded, study materials, and recent exam activity at a glance.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-nav-students",
    popover: {
      title: "Manage Students 👥",
      description: "View, search, and manage all registered students on the platform.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-nav-teachers",
    popover: {
      title: "Manage Teachers 🏫",
      description: "View and verify teacher accounts. Monitor their content contributions and activity.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-questions-block",
    popover: {
      title: "Question Bank",
      description: "Manage the entire question bank — browse, edit, or delete any question uploaded by teachers.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-settings-block",
    popover: {
      title: "Website Settings ⚙️",
      description: "Customize homepage content, hero sections, features, and overall site branding from here.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-profile-card",
    popover: {
      title: "Admin Profile",
      description: "Manage your admin account and safely log out from here.",
      side: "top",
      align: "start",
    },
  },
];

function getSteps(role) {
  if (role === "teacher") return TEACHER_STEPS;
  if (role === "admin") return ADMIN_STEPS;
  return STUDENT_STEPS;
}

// Fixed elements that sit below driver.js overlay (z-10000) and need z-boost when highlighted
const FIXED_CONTAINER_IDS = ["tour-sidebar", "tour-mobile-nav"];

function getFixedContainer(el) {
  if (!el) return null;
  for (const id of FIXED_CONTAINER_IDS) {
    const container = document.getElementById(id);
    if (container && (container === el || container.contains(el))) return container;
  }
  return null;
}

function boostContainer(el) {
  const container = getFixedContainer(el);
  if (container) container.style.setProperty("z-index", "10001", "important");
}

function resetContainers() {
  FIXED_CONTAINER_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.removeProperty("z-index");
  });
}

export default function OnboardingTour({ role = "student", onDone }) {
  const driverRef = useRef(null);

  const startTour = useCallback(() => {
    const allSteps = getSteps(role);

    // Only include steps whose target element actually exists in the DOM
    const validSteps = allSteps.filter(
      (step) => !step.element || !!document.querySelector(step.element)
    );

    if (validSteps.length === 0) {
      onDone?.();
      return;
    }

    driverRef.current = driver({
      showProgress: true,
      animate: true,
      overlayColor: "rgba(15, 23, 42, 0.55)",
      stagePadding: 8,
      stageRadius: 16,
      allowClose: true,
      popoverClass: "eec-tour-popover",
      progressText: "Step {{current}} of {{total}}",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Got it! 🎉",
      // Boost fixed sidebar/nav above the overlay (z-10000) when they're highlighted
      onHighlightStarted: (el) => boostContainer(el),
      onDeselected: () => resetContainers(),
      onDestroyStarted: () => {
        resetContainers();
        driverRef.current?.destroy();
        onDone?.();
      },
      steps: validSteps,
    });

    driverRef.current.drive();
  }, [role, onDone]);

  useEffect(() => {
    const timer = setTimeout(startTour, 500);
    return () => {
      clearTimeout(timer);
      driverRef.current?.destroy();
    };
  }, [startTour]);

  return null;
}
