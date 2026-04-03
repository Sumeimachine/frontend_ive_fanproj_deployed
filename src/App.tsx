import { useEffect } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import MemberInfo from "./pages/MemberInfo";
import Dashboard from "./components/Dashboard";
import ContentPages from "./pages/ContentPages";
import DynamicContentPage from "./pages/DynamicContentPage";
import ContentEditor from "./pages/ContentEditor";
import EmailVerification from "./pages/EmailVerification";

function AppRoutes() {
  const { bootstrapProfile } = useAuth();

  useEffect(() => {
    void bootstrapProfile();
  }, [bootstrapProfile]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/verify-email" element={<EmailVerification />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/member/:id" element={<MemberInfo />} />
          <Route path="/pages" element={<ContentPages />} />
          <Route path="/pages/editor" element={<ContentEditor />} />
          <Route path="/pages/:slug" element={<DynamicContentPage />} />
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
