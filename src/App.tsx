import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";
import MainLayout from "./layouts/MainLayout";

const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const MemberInfo = lazy(() => import("./pages/MemberInfo"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const ContentPages = lazy(() => import("./pages/ContentPages"));
const DynamicContentPage = lazy(() => import("./pages/DynamicContentPage"));
const ContentEditor = lazy(() => import("./pages/ContentEditor"));
const EmailVerification = lazy(() => import("./pages/EmailVerification"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const QuizGame = lazy(() => import("./pages/QuizGame"));
const QuizLeaderboards = lazy(() => import("./pages/QuizLeaderboards"));
const AdminQuizManager = lazy(() => import("./pages/AdminQuizManager"));
const AdminQuizEditor = lazy(() => import("./pages/AdminQuizEditor"));
const SuperAdminUsers = lazy(() => import("./pages/SuperAdminUsers"));
const SuperAdminEvents = lazy(() => import("./pages/SuperAdminEvents"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const AboutUsEditor = lazy(() => import("./pages/AboutUsEditor"));
const AdminMediaLibrary = lazy(() => import("./pages/AdminMediaLibrary"));

const routeFallback = (
  <div className="route-loading" role="status" aria-live="polite">
    Loading...
  </div>
);

function AppRoutes() {
  const { bootstrapProfile } = useAuth();

  useEffect(() => {
    void bootstrapProfile();
  }, [bootstrapProfile]);

  return (
    <Suspense fallback={routeFallback}>
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
    </Suspense>
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
