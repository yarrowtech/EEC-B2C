// src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";

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

  return (
    <BrowserRouter>
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
            <Route path="questions" element={
              <RequireAdmin><QuestionsIndex /></RequireAdmin>
            } />
            <Route path="questions/list" element={<RequireAdmin><QuestionsList /></RequireAdmin>} />
            <Route path="questions/edit/:id" element={<RequireAdmin><QuestionsEdit /></RequireAdmin>} />

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
