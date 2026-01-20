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
    <nav className="nav">
      <div className="nav__brand">
        <Link to="/">Task Manager</Link>
      </div>
      <div className="nav__links">
        {user && <Link to="/app">App</Link>}
        {user && <Link to="/boards">Boards</Link>}
        {user?.role === "ADMIN" && <Link to="/admin/users">Team</Link>}
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
      </div>
      <div className="nav__user">
        {user && (
          <>
            <span className="pill">
              {user.name} ({user.email})
            </span>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
