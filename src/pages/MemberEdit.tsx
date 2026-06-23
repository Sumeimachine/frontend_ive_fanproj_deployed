import { Navigate, useParams } from "react-router-dom";

export default function MemberEdit() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/member/${id}?edit=1` : "/"} replace />;
}
