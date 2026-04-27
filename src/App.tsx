import { useEffect } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import MemberInfo from "./pages/MemberInfo";
import Dashboard from "./components/Dashboard";
import ContentPages from "./pages/ContentPages";
import DynamicContentPage from "./pages/DynamicContentPage";
import ContentEditor from "./pages/ContentEditor";
import EmailVerification from "./pages/EmailVerification";
import ResetPassword from "./pages/ResetPassword";
import QuizGame from "./pages/QuizGame";
import QuizLeaderboards from "./pages/QuizLeaderboards";
import AdminQuizManager from "./pages/AdminQuizManager";
import AdminQuizEditor from "./pages/AdminQuizEditor";
import SuperAdminUsers from "./pages/SuperAdminUsers";
import SuperAdminEvents from "./pages/SuperAdminEvents";
import AboutUs from "./pages/AboutUs";
import AboutUsEditor from "./pages/AboutUsEditor";
import AdminMediaLibrary from "./pages/AdminMediaLibrary";

function AppRoutes() {
  const { bootstrapProfile } = useAuth();

  useEffect(() => {
    void bootstrapProfile();
  }, [bootstrapProfile]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/verify-email" element={<EmailVerification />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/quiz/daily" element={<QuizGame />} />
          <Route path="/quiz/leaderboards" element={<QuizLeaderboards />} />
          <Route path="/member/:id" element={<MemberInfo />} />
          <Route element={<AdminRoute />}>
            <Route path="/about/edit" element={<AboutUsEditor />} />
            <Route path="/pages" element={<ContentPages />} />
            <Route path="/pages/editor" element={<ContentEditor />} />
            <Route path="/pages/:slug" element={<DynamicContentPage />} />
            <Route path="/admin/quizzes" element={<AdminQuizManager />} />
            <Route path="/admin/quizzes/:quizId" element={<AdminQuizEditor />} />
            <Route path="/admin/media" element={<AdminMediaLibrary />} />
          </Route>
          <Route element={<SuperAdminRoute />}>
            <Route path="/super-admin/users" element={<SuperAdminUsers />} />
            <Route path="/super-admin/events" element={<SuperAdminEvents />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
