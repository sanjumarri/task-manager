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
    <main className="page">
      <div className="card">
        <div className="list-item" style={{ background: "transparent", border: "none" }}>
          <h1>Boards</h1>
          {isAdmin && (
            <button type="button" className="btn" onClick={() => setShowCreate(true)}>
              Create Board
            </button>
          )}
        </div>
        {error && (
          <div role="alert" className="alert">
            {error}
          </div>
        )}
        {loading ? (
          <p>Loading...</p>
        ) : boards.length === 0 ? (
          <p className="empty">No boards yet.</p>
        ) : (
          <ul className="list">
            {boards.map((board) => (
              <li className="list-item" key={board._id}>
                <Link to={`/boards/${board._id}`}>{board.name}</Link>
                {isAdmin && (
                  <div className="list-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => handleRename(board)}>
                      Rename
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => openMembersModal(board)}>
                      Manage Members
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => handleDelete(board)}>
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showCreate && (
        <div className="modal">
          <div className="modal__content">
            <h2>Create Board</h2>
            {formError && (
              <div role="alert" className="alert">
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
              <div className="list-actions">
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
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
        <div className="modal">
          <div className="modal__content">
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
            <div className="list-actions">
              <button type="button" className="btn" disabled={submitting} onClick={saveMembers}>
                {submitting ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
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
