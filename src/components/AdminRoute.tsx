import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute() {
  const { role } = useAuth();

  if (role !== "Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
