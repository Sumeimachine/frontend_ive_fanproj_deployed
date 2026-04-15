import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SuperAdminRoute() {
  const { role } = useAuth();

  if (role !== "Super-Admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
