import { Navigate } from "react-router-dom";

export default function AboutUsEditor() {
  return <Navigate to="/pages/editor?slug=about" replace />;
}
