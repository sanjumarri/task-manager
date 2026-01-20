import { Navigate } from "react-router-dom";
import { getStoredUser } from "../services/api";

export default function AdminRoute({ children }) {
  const user = getStoredUser();
  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/app" replace />;
  }
  return children;
}
