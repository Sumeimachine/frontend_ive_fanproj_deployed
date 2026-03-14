import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MainLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div
        style={{
          width: "220px",
          background: "#1A152A",
          color: "#fff",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2>IVE KPOP</h2>

        <button onClick={() => navigate("/dashboard")}>Dashboard</button>

        <button onClick={() => navigate("/")}>Members</button>

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          style={{ marginTop: "auto", background: "#8c2f39" }}
        >
          Logout
        </button>
      </div>

      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
// import React from "react";
// import { Outlet, useNavigate } from "react-router-dom";

// const MainLayout: React.FC = () => {
//   const navigate = useNavigate();

//   return (
//     <div style={{ display: "flex", minHeight: "100vh" }}>

//       {/* Sidebar */}
//       <div
//         style={{
//           width: "220px",
//           background: "#1A152A",
//           color: "#fff",
//           display: "flex",
//           flexDirection: "column",
//           padding: "20px",
//         }}
//       >
//         <h2 style={{ marginBottom: "40px", fontSize: "1.8rem" }}>IVE KPOP</h2>

//         <button
//           onClick={() => navigate("/dashboard")}
//           style={{
//             padding: "12px 20px",
//             borderRadius: "12px",
//             border: "none",
//             background: "#3A2D56",
//             color: "#fff",
//             fontWeight: 600,
//             marginBottom: "10px",
//             cursor: "pointer",
//             textAlign: "left",
//           }}
//         >
//           Dashboard
//         </button>

//         <button
//           onClick={() => navigate("/")}
//           style={{
//             padding: "12px 20px",
//             borderRadius: "12px",
//             border: "none",
//             background: "#3A2D56",
//             color: "#fff",
//             fontWeight: 600,
//             cursor: "pointer",
//             textAlign: "left",
//           }}
//         >
//           Members
//         </button>
//       </div>

//       {/* Page Content */}
//       <div style={{ flex: 1 }}>
//         <Outlet />
//       </div>

//     </div>
//   );
// };

// export default MainLayout;
