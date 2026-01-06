// src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import Topbar from "./components/Topbar";
import Navbar from "./components/Navbar";
import EECFooter from "./components/EECFooter";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import Analytics from "./pages/Analytics";
import AI from "./pages/AI";
import ProductAdvantages from "./pages/ProductAdvantages";
import TailoredLearning from "./pages/TailoredLearning";
import LearningWellbeing from "./pages/LearningWellbeing";
import EECCommitment from "./pages/EECCommitment";
import EECCareers from "./pages/EECCareers";
import EECOffice from "./pages/EECOffice";
import EECLearningBoards from "./pages/EECLearningBoards";
import EECPartner from "./pages/EECMarketing";
import EECMarketing from "./pages/EECMarketing";
import SupportCenter from "./pages/SupportCenter";
import ScrollToTopButton from "./components/ScrollToTopButton";
import GlobalLoginModal from "./components/GlobalLoginModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Dashboard from "./pages/Dashboard";
import StudentsList from "./pages/StudentsList";
import DashboardLayout from "./layouts/DashboardLayout";
import QuestionsIndex from "./pages/questions/QuestionsIndex";
import QuestionsMCQUpload from "./pages/questions/QuestionsMCQUpload";
import { QuestionScopeProvider } from "./context/QuestionScopeContext";
import QuestionsMCQSingle from "./pages/questions/QuestionsMCQSingle";
import QuestionsMCQMulti from "./pages/questions/QuestionsMCQMulti";
import QuestionsChoiceMatrix from "./pages/questions/QuestionsChoiceMatrix";
import QuestionsTrueFalse from "./pages/questions/QuestionsTrueFalse";
import QuestionsClozeDrag from "./pages/questions/QuestionsClozeDrag";
import QuestionsClozeSelect from "./pages/questions/QuestionsClozeSelect";
import QuestionsClozeText from "./pages/questions/QuestionsClozeText";
import QuestionsMatchList from "./pages/questions/QuestionsMatchList";
import QuestionsEssayRich from "./pages/questions/QuestionsEssayRich";
import QuestionsEssayPlain from "./pages/questions/QuestionsEssayPlain";
import QuestionsList from "./pages/questions/QuestionsList";
import QuestionsEdit from "./pages/questions/QuestionsEdit";
import RequireAdmin from "./components/auth/RequireAdmin";
import ExamsIndex from "./pages/exams/ExamsIndex";
import ExamTake from "./pages/exams/ExamTake";
import ResultsList from "./pages/admin/ResultsList";
import ResultDetail from "./pages/admin/ResultDetail";
import HeroSettings from "./components/settings/HeroSettings";
import WhyEecSettings from "./components/settings/WhyEecSettings";
import FeaturesSettings from "./components/settings/FeaturesSettings";
import AboutUsSettings from "./components/settings/AboutUsSettings";
import CareerSettings from "./components/settings/CareerSettings";
import OfficeSettings from "./components/settings/OfficeSettings";
import B2B from "./pages/B2B/pages/B2B";
import TeachersList from "./pages/TeachersList";
import ProfilePage from "./pages/ProfilePage";
import AddSubject from "./pages/questions/AddSubject";
import AddTopic from "./pages/questions/AddTopic";
import SubjectsList from "./pages/questions/SubjectsList";
import TopicsList from "./pages/questions/TopicsList";
import ChatBox from "./pages/ChatBox";
import ResultsView from "./pages/ResultsView";
import AchievementsView from "./pages/AchievementsView";
import StudyMaterialsPage from "./pages/StudyMaterialsPage";
import UploadStudyMaterial from "./pages/UploadStudyMaterial";
import ResetPassword from "./pages/ResetPassword";
import CreateNotification from "./pages/CreateNotification";
import NotificationDetails from "./pages/NotificationDetails";
import AddClass from "./pages/questions/AddClass";
import AddBoard from "./pages/questions/AddBoard";
import Swal from "sweetalert2";
import Leaderboard from "./pages/Leaderboard";
import MindTrainingGames from "./games/MindTrainingGames";
import AdminGiftCardsPage from './pages/AdminGiftCardsPage';
import AdminPurchasesPage from './pages/AdminPurchasesPage';
import AIQuestionGenerator from "./pages/AIQuestionGenerator";
import SelfStudy from "./pages/SelfStudy";
import SelfStudyResults from "./pages/SelfStudyResults";
import SelfStudyResultDetail from "./pages/SelfStudyResultDetail";
import SyllabusPage from "./pages/syllabus/SyllabusPage";


function getToken() {
  return localStorage.getItem("jwt") || "";
}
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}
function isTokenValid(token) {
  if (!token) return false;
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1] || ""));
    return typeof exp === "number" && Date.now() < exp * 1000;
  } catch {
    return false;
  }
}

/* ---------- guard: must have valid token + admin role ---------- */
function AdminGuard({ children }) {
  const token = getToken();
  const user = getUser();

  const ok = isTokenValid(token) && user?.role === "admin"; // role is set by server on login
  if (!ok) {
    // hard logout if token invalid/expired or role mismatch
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
    return <Navigate to="/" replace />;
  }
  return children;
}

function RoleGuard({ requireRole, children }) {
  const token = getToken();
  const user = getUser();
  const ok = isTokenValid(token) && user?.role === requireRole;
  if (!ok) {
    // same hard logout behavior you already use
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
    return <Navigate to="/" replace />;
  }
  return children;
}

function RoleRedirect() {
  const user = getUser();
  if (!isTokenValid(getToken()) || !user?.role) {
    return <Navigate to="/" replace />;
  }
  if (user.role === "admin") return <Navigate to="/admin-dashboard" replace />;
  if (user.role === "teacher") return <Navigate to="/teacher-dashboard" replace />;
  return <Navigate to="/student-dashboard" replace />; // default → student
}


function ShellLayout() {

  const location = useLocation();
  const hideFooter = location.pathname.startsWith("/dashboard");

  return (
    <div className="min-h-screen bg-white text-blue-950">
      <ToastContainer position="bottom-right" />
      {/* Fixed Header */}
      {/* <div className="fixed inset-x-0 top-0 z-50"> */}
      <Topbar />
      <Navbar />
      {/* </div> */}

      {/* Main Scrollable Area */}
      {/* <main className="pt-[7.5rem] pb-[6rem]"> */}
      <Outlet />
      {/* </main> */}
      <GlobalLoginModal />

      {/* Fixed Footer */}
      {/* <div className="fixed inset-x-0 bottom-0 z-40"> */}
      {/* <EECFooter /> */}
      {!hideFooter && <EECFooter />}
      <ScrollToTopButton />
      {/* </div> */}
    </div>
  );
}

export default function App() {

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (!token) return;

    try {
      const { exp } = JSON.parse(atob(token.split(".")[1]));
      const expiry = exp * 1000;
      const now = Date.now();
      if (now >= expiry) {
        // token already expired → logout immediately
        logoutUser();
      } else {
        // auto logout when it expires
        const timeout = setTimeout(logoutUser, expiry - now);
        return () => clearTimeout(timeout);
      }
    } catch (e) {
      console.error("Invalid token", e);
      logoutUser();
    }

    function logoutUser() {
      localStorage.removeItem("jwt");
      localStorage.removeItem("user");
      window.dispatchEvent(new CustomEvent("eec:auth", { detail: { type: "logout" } }));
    }
  }, []);

  useEffect(() => {
    const razorpayKeys = [
      "rzp_checkout_anon_id",
      "rzp_device_id",
      "rzp_stored_checkout_id",
    ];

    razorpayKeys.forEach((k) => localStorage.removeItem(k));
  }, []);

  // Push Notification Subscription
  useEffect(() => {
    const subscribeToPushNotifications = async () => {
      try {
        const token = getToken();
        const user = getUser();

        // Only subscribe if user is logged in and has push notifications enabled
        if (!token || !user || user.pushNotifications === false) {
          return;
        }

        // Check if service workers are supported
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          console.log("Push notifications are not supported");
          return;
        }

        // Check current permission status
        if (Notification.permission === "denied") {
          console.log("Notification permission denied");
          return;
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered");

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;

        // Check if already subscribed
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log("Already subscribed to push notifications");
          return;
        }

        // If permission is default (not granted yet), we'll subscribe on first login
        // The permission will be requested when they interact with the site
        if (Notification.permission === "default") {
          // Store a flag to request permission on next user interaction
          sessionStorage.setItem("needsPushPermission", "true");

          // Listen for any user interaction to request permission
          const requestPermissionOnInteraction = async () => {
            if (sessionStorage.getItem("needsPushPermission") === "true") {
              sessionStorage.removeItem("needsPushPermission");

              const permission = await Notification.requestPermission();
              if (permission === "granted") {
                // Now subscribe
                await subscribeUserToPush(registration);
              }
            }
            // Remove listeners after first interaction
            document.removeEventListener("click", requestPermissionOnInteraction);
            document.removeEventListener("keydown", requestPermissionOnInteraction);
          };

          document.addEventListener("click", requestPermissionOnInteraction, { once: true });
          document.addEventListener("keydown", requestPermissionOnInteraction, { once: true });
          return;
        }

        // If already granted, subscribe immediately
        if (Notification.permission === "granted") {
          await subscribeUserToPush(registration);
        }

        async function subscribeUserToPush(registration) {
          try {
            // Get VAPID public key from backend
            const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
            const vapidResponse = await fetch(`${API}/api/push/vapid-public-key`);
            const { publicKey } = await vapidResponse.json();

            // Subscribe to push notifications
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicKey),
            });

            // Send subscription to backend
            await fetch(`${API}/api/push/subscribe`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
                  auth: arrayBufferToBase64(subscription.getKey("auth")),
                },
              }),
            });

            console.log("Successfully subscribed to push notifications");
          } catch (error) {
            console.error("Failed to subscribe to push:", error);
          }
        }
      } catch (error) {
        console.error("Failed to subscribe to push notifications:", error);
      }
    };

    subscribeToPushNotifications();
  }, []);

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Helper function to convert ArrayBuffer to Base64
  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  function AuthExpiryHandler() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      const onAuthEvent = (e) => {
        // Only show session expired modal for automatic logout (token expired)
        if (e?.detail?.type === "logout") {
          // Only show modal if user is in dashboard/protected route
          if (location.pathname.startsWith("/dashboard")) {
            Swal.fire({
              icon: "warning",
              title: "Session Expired",
              text: "Please login again to continue",
              confirmButtonColor: "#f59e0b",
              confirmButtonText: "OK",
              allowOutsideClick: false,
            }).then(() => {
              navigate("/", { replace: true });
            });
          } else {
            navigate("/", { replace: true });
          }
        }
        // For manual logout, just navigate without showing modal
        else if (e?.detail?.type === "manual-logout") {
          // Do nothing, Header already handles navigation and toast
        }
      };

      window.addEventListener("eec:auth", onAuthEvent);
      return () => window.removeEventListener("eec:auth", onAuthEvent);
    }, [navigate, location]);

    return null;
  }


  return (
    <BrowserRouter>
    <AuthExpiryHandler />
      <Routes>
        <Route element={<ShellLayout />}>
          <Route index element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai" element={<AI />} />
          <Route path="/product-advantages" element={<ProductAdvantages />} />
          <Route path="/tollered" element={<TailoredLearning />} />
          <Route path="/e-learn-well" element={<LearningWellbeing />} />
          <Route path="/aim" element={<EECCommitment />} />
          <Route path="/careers" element={<EECCareers />} />
          <Route path="/office" element={<EECOffice />} />
          <Route path="/boards" element={<EECLearningBoards />} />
          <Route path="/support" element={<SupportCenter />} />
          <Route path="/marketing" element={<EECMarketing />} />
          <Route path="/eec-b2c" element={<B2B />} />
          <Route path="/dashboard" element={<QuestionScopeProvider>
            <DashboardLayout />
          </QuestionScopeProvider>}>
            <Route path="profile" element={<ProfilePage />} />
            {/* index route = your current Dashboard.jsx content */}
            <Route index element={<Dashboard />} />
            {/* more outlet pages */}
            <Route path="add-subject" element={<AddSubject />} />
            <Route path="add-topic" element={<AddTopic />} />
            <Route path="/dashboard/add-class" element={<AddClass />} />
            <Route path="/dashboard/add-board" element={<AddBoard />} />
            <Route path="students" element={<StudentsList />} />
            <Route path="subjects" element={<SubjectsList />} />
            <Route path="topics" element={<TopicsList />} />
            <Route path="chat/:userId" element={<ChatBox />} />
            <Route path="result" element={<ResultsView />} />
            <Route path="achievements" element={<AchievementsView />} />
            <Route path="study-materials" element={<StudyMaterialsPage />} />
            <Route path="study-materials/upload" element={<RequireAdmin><UploadStudyMaterial /> </RequireAdmin>} />
            <Route path="teachers" element={<RequireAdmin><TeachersList /></RequireAdmin>} />
            <Route path="notifications/create" element={<RequireAdmin><CreateNotification /></RequireAdmin>} />
            <Route path="/dashboard/notification/:id" element={<NotificationDetails />} />
            <Route path="/dashboard/leaderboard" element={<Leaderboard />} />
            <Route path="games/mind-training" element={<MindTrainingGames />} />
            <Route path="gift-cards" element={<AdminGiftCardsPage />} />
            <Route path="purchases" element={<RequireAdmin><AdminPurchasesPage /></RequireAdmin>} />
            <Route path="self-study" element={<SelfStudy />} />
            <Route path="self-study/results" element={<SelfStudyResults />} />
            <Route path="self-study/results/:id" element={<SelfStudyResultDetail />} />
            <Route path="syllabus" element={<SyllabusPage />} />
            <Route path="questions" element={
              <RequireAdmin><QuestionsIndex /></RequireAdmin>
            } />
            <Route path="questions/list" element={<RequireAdmin><QuestionsList /></RequireAdmin>} />
            <Route path="questions/edit/:id" element={<RequireAdmin><QuestionsEdit /></RequireAdmin>} />
            <Route path="questions/ai-generator" element={<RequireAdmin><AIQuestionGenerator /></RequireAdmin>} />

            <Route path="questions/mcq-single" element={
              <RequireAdmin><QuestionsMCQUpload /></RequireAdmin>
            } />

            <Route path="questions/mcq-multi" element={
              <RequireAdmin><QuestionsMCQMulti /></RequireAdmin>
            } />

            <Route path="questions/choice-matrix" element={
              <RequireAdmin><QuestionsChoiceMatrix /></RequireAdmin>
            } />

            <Route path="questions/true-false" element={
              <RequireAdmin><QuestionsTrueFalse /></RequireAdmin>
            } />

            <Route path="questions/cloze-drag" element={
              <RequireAdmin><QuestionsClozeDrag /></RequireAdmin>
            } />

            <Route path="questions/cloze-select" element={
              <RequireAdmin><QuestionsClozeSelect /></RequireAdmin>
            } />

            <Route path="questions/cloze-text" element={
              <RequireAdmin><QuestionsClozeText /></RequireAdmin>
            } />

            <Route path="questions/match-list" element={
              <RequireAdmin><QuestionsMatchList /></RequireAdmin>
            } />

            <Route path="questions/essay-rich" element={
              <RequireAdmin><QuestionsEssayRich /></RequireAdmin>
            } />

            <Route path="questions/essay-plain" element={
              <RequireAdmin><QuestionsEssayPlain /></RequireAdmin>
            } />

            <Route path="results" element={<RequireAdmin><ResultsList /></RequireAdmin>} />
            <Route path="results/:id" element={<RequireAdmin><ResultDetail /></RequireAdmin>} />

            {/* Setttings */}
            <Route path="settings/home" element={<RequireAdmin><HeroSettings /></RequireAdmin>} />
            <Route path="settings/why-eec" element={<RequireAdmin><WhyEecSettings /></RequireAdmin>} />
            <Route path="settings/features" element={<RequireAdmin><FeaturesSettings /></RequireAdmin>} />
            <Route path="settings/about-us" element={<RequireAdmin><AboutUsSettings /></RequireAdmin>} />
            <Route path="settings/contact-career" element={<RequireAdmin><CareerSettings /></RequireAdmin>} />
            <Route path="settings/contact-office" element={<RequireAdmin><OfficeSettings /></RequireAdmin>} />

            {/* You can add these placeholders now (static pages later) */}
            <Route path="questions/mcq-multi" element={<div>MCQ — Multiple Correct (static)</div>} />
            <Route path="questions/true-false" element={<div>True/False (static)</div>} />
            <Route path="questions/import" element={<div>Import Question Bank (static)</div>} />
            <Route path="exams" element={<ExamsIndex />} />
            <Route path="exams/take/:attemptId" element={<ExamTake />} />

            {/* Add more, e.g.: */}
            {/* <Route path="classes" element={<Classes />} /> */}
            {/* <Route path="approvals" element={<Approvals />} /> */}
          </Route>

          {/* legacy links → one UI (keep these if you still have old links) */}
          <Route path="/admin-dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/teacher-dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/student-dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
