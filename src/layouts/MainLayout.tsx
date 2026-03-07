import React from "react";
import { Outlet, useNavigate } from "react-router-dom";

const MainLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* Sidebar */}
      <div
        style={{
          width: "220px",
          background: "#1A152A",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          padding: "20px",
        }}
      >
        <h2 style={{ marginBottom: "40px", fontSize: "1.8rem" }}>IVE KPOP</h2>

        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "12px 20px",
            borderRadius: "12px",
            border: "none",
            background: "#3A2D56",
            color: "#fff",
            fontWeight: 600,
            marginBottom: "10px",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          Dashboard
        </button>

        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 20px",
            borderRadius: "12px",
            border: "none",
            background: "#3A2D56",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          Members
        </button>
      </div>

      {/* Page Content */}
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>

    </div>
  );
};

export default MainLayout;