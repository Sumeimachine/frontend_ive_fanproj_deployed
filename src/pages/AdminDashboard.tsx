import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "30px" }}>
      <h1>Admin Dashboard</h1>

      <button onClick={() => navigate("/admin/events")}>
        Manage Events
      </button>

      <button onClick={() => navigate("/admin/upload")}>
        Upload Images
      </button>

      <button onClick={() => navigate("/admin/members")}>
        Edit Members
      </button>
    </div>
  );
}