import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, getStoredUser } from "../services/api";

export default function BoardsPage() {
  const user = getStoredUser();
  const isAdmin = user?.role === "ADMIN";
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadBoards = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/boards");
      setBoards(data.boards || []);
    } catch (err) {
      setError(err.message || "Failed to load boards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setFormError("Board name is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    setFormError("");
    try {
      await apiFetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      setNewName("");
      setShowCreate(false);
      await loadBoards();
    } catch (err) {
      setError(err.message || "Failed to create board.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRename = async (board) => {
    const name = window.prompt("New board name:", board.name);
    if (!name) return;
    setError("");
    try {
      await apiFetch(`/api/boards/${board._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await loadBoards();
    } catch (err) {
      setError(err.message || "Failed to update board.");
    }
  };

  const handleDelete = async (board) => {
    const ok = window.confirm(`Delete "${board.name}"?`);
    if (!ok) return;
    setError("");
    try {
      await apiFetch(`/api/boards/${board._id}`, { method: "DELETE" });
      setBoards((prev) => prev.filter((item) => item._id !== board._id));
    } catch (err) {
      setError(err.message || "Failed to delete board.");
    }
  };

  const openMembersModal = async (board) => {
    setSelectedBoard(board);
    setSelectedMembers(board.members || []);
    setShowMembers(true);
    if (users.length === 0) {
      try {
        const data = await apiFetch("/api/users");
        setUsers(data.users || []);
      } catch (err) {
        setError(err.message || "Failed to load users.");
      }
    }
  };

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const saveMembers = async () => {
    if (!selectedBoard) return;
    setSubmitting(true);
    setError("");
    try {
      await apiFetch(`/api/boards/${selectedBoard._id}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: selectedMembers }),
      });
      setShowMembers(false);
      setSelectedBoard(null);
      await loadBoards();
    } catch (err) {
      setError(err.message || "Failed to update members.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <h1>Boards</h1>
      {isAdmin && (
        <button type="button" onClick={() => setShowCreate(true)}>
          Create Board
        </button>
      )}
      {error && (
        <div role="alert" style={{ color: "#b91c1c", marginBottom: "0.75rem" }}>
          {error}
        </div>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : boards.length === 0 ? (
        <p>No boards yet.</p>
      ) : (
        <ul>
          {boards.map((board) => (
            <li key={board._id}>
              <Link to={`/boards/${board._id}`}>{board.name}</Link>
              {isAdmin && (
                <>
                  <button type="button" onClick={() => handleRename(board)}>
                    Rename
                  </button>
                  <button type="button" onClick={() => openMembersModal(board)}>
                    Manage Members
                  </button>
                  <button type="button" onClick={() => handleDelete(board)}>
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {showCreate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ background: "#fff", padding: "1rem", minWidth: "320px" }}>
            <h2>Create Board</h2>
            {formError && (
              <div role="alert" style={{ color: "#b91c1c", marginBottom: "0.5rem" }}>
                {formError}
              </div>
            )}
            <form onSubmit={handleCreate}>
              <div>
                <label htmlFor="board-name">Name</label>
                <input
                  id="board-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewName("");
                    setShowCreate(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMembers && selectedBoard && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ background: "#fff", padding: "1rem", minWidth: "320px" }}>
            <h2>Manage Members</h2>
            <p>{selectedBoard.name}</p>
            <ul>
              {users.map((member) => (
                <li key={member.id || member._id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id || member._id)}
                      onChange={() => toggleMember(member.id || member._id)}
                    />
                    {member.name} ({member.email})
                  </label>
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" disabled={submitting} onClick={saveMembers}>
                {submitting ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMembers(false);
                  setSelectedBoard(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
