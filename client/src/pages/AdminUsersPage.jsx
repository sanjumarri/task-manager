import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadUsers = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/users");
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!email.includes("@")) {
      setFormError("Enter a valid email.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setError("");
    setFormError("");
    try {
      await apiFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      resetForm();
      setShowModal(false);
      await loadUsers();
    } catch (err) {
      setError(err.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this user?");
    if (!ok) return;
    setError("");
    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((user) => user.id !== id && user._id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete user.");
    }
  };

  return (
    <main className="page">
      <div className="card">
        <div className="list-item" style={{ background: "transparent", border: "none" }}>
          <h1>Team Members</h1>
          <button type="button" className="btn" onClick={() => setShowModal(true)}>
            Add Member
          </button>
        </div>
        {error && (
          <div role="alert" className="alert">
            {error}
          </div>
        )}
        {loading ? (
          <p>Loading...</p>
        ) : users.length === 0 ? (
          <p className="empty">No members yet.</p>
        ) : (
          <ul className="list">
            {users.map((user) => (
              <li className="list-item" key={user.id || user._id}>
                <span>
                  {user.name} - {user.email} ({user.role})
                </span>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDelete(user.id || user._id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal__content">
            <h2>Add Member</h2>
            {formError && (
              <div role="alert" className="alert">
                {formError}
              </div>
            )}
            <form onSubmit={handleAdd}>
              <div>
                <label htmlFor="member-name">Name</label>
                <input
                  id="member-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="member-email">Email</label>
                <input
                  id="member-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="member-password">Password</label>
                <input
                  id="member-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="list-actions">
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
