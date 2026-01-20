import { Link, useNavigate } from "react-router-dom";
import { getStoredUser, clearAuth } from "../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <nav style={{ display: "flex", gap: "1rem", padding: "1rem" }}>
      <Link to="/">Home</Link>
      {user && <Link to="/app">App</Link>}
      {user && <Link to="/boards">Boards</Link>}
      {user?.role === "ADMIN" && <Link to="/admin/users">Team</Link>}
      {!user && <Link to="/login">Login</Link>}
      {!user && <Link to="/register">Register</Link>}
      {user && (
        <>
          <span>
            {user.name} ({user.email})
          </span>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </>
      )}
    </nav>
  );
}
