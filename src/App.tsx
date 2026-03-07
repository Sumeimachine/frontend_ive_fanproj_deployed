import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./components/Dashboard";
import MemberInfo from "./pages/MemberInfo"; // ✅ import the member info page

const App: React.FC = () => {
  return (
    <Router>
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
            onClick={() => (window.location.href = "/dashboard")}
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
            onClick={() => (window.location.href = "/")}
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

        {/* Main content */}
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* ✅ Member info route */}
            <Route path="/member/:id" element={<MemberInfo />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
// import React from "react";
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import Home from "./pages/Home";
// import Dashboard from "./components/Dashboard";

// const App: React.FC = () => {
//   return (
//     <Router>
//       <div style={{ display: "flex", minHeight: "100vh" }}>
//         {/* Sidebar */}
//         <div
//           style={{
//             width: "220px",
//             background: "#1A152A",
//             color: "#fff",
//             display: "flex",
//             flexDirection: "column",
//             padding: "20px",
//           }}
//         >
//           <h2 style={{ marginBottom: "40px", fontSize: "1.8rem" }}>IVE KPOP</h2>
//           <button
//             onClick={() => (window.location.href = "/dashboard")}
//             style={{
//               padding: "12px 20px",
//               borderRadius: "12px",
//               border: "none",
//               background: "#3A2D56",
//               color: "#fff",
//               fontWeight: 600,
//               marginBottom: "10px",
//               cursor: "pointer",
//               textAlign: "left",
//             }}
//           >
//             Dashboard
//           </button>
//           <button
//             onClick={() => (window.location.href = "/")}
//             style={{
//               padding: "12px 20px",
//               borderRadius: "12px",
//               border: "none",
//               background: "#3A2D56",
//               color: "#fff",
//               fontWeight: 600,
//               cursor: "pointer",
//               textAlign: "left",
//             }}
//           >
//             Members
//           </button>
//         </div>

//         {/* Main content */}
//         <div style={{ flex: 1 }}>
//           <Routes>
//             <Route path="/" element={<Home />} />
//             {/* Dashboard */}
//             <Route path="/dashboard" element={<Dashboard />} />
//             <Route path="*" element={<Navigate to="/" />} />
//           </Routes>
//         </div>
//       </div>
//     </Router>
//   );
// };

// export default App;
