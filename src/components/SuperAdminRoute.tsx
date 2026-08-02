import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SuperAdminRoute() {
  const { role, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return <div className="route-loading" role="status" aria-live="polite">Loading...</div>;
  }

  if (role !== "Super-Admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
