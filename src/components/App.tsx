// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider, useAuth } from "../context/AuthContext";

// import ProtectedRoute from "./ProtectedRoute";
// import LoginForm from "./LoginForm";

// import Home from "../pages/Home";
// import MemberInfo from "../pages/MemberInfo";
// import MemberEdit from "../pages/MemberEdit";

// function AppRoutes() {
//   const { isAuthenticated } = useAuth();

//   return (
//     <Routes>
//       <Route
//         path="/login"
//         element={isAuthenticated ? <Navigate to="/" /> : <LoginForm />}
//       />

//       <Route
//         path="/"
//         element={
//           <ProtectedRoute>
//             <Home />
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/members"
//         element={
//           <ProtectedRoute>
//             <MemberInfo />
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/edit"
//         element={
//           <ProtectedRoute>
//             <MemberEdit />
//           </ProtectedRoute>
//         }
//       />
//     </Routes>
//   );
// }

// export default function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <AppRoutes />
//       </BrowserRouter>
//     </AuthProvider>
//   );
// }