import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch, getStoredUser } from "../services/api";
import { suggestTitleFromDescription } from "../services/ai";

const STATUS_VALUES = ["All", "Ready", "In Progress", "Testing", "Completed"];
const PRIORITY_VALUES = ["All", "Low", "Medium", "High"];

const statusColors = {
  Ready: "#2563eb",
  "In Progress": "#ea580c",
  Testing: "#7c3aed",
  Completed: "#16a34a",
};

const priorityColors = {
  Low: "#16a34a",
  Medium: "#ca8a04",
  High: "#dc2626",
};

export default function BoardDetailPage() {
  const { id } = useParams();
  const user = getStoredUser();
  const isAdmin = user?.role === "ADMIN";
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    category: "",
    priority: "Low",
    status: "Ready",
    dueDate: "",
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [suggestInput, setSuggestInput] = useState("");
  const [suggestedTitle, setSuggestedTitle] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  const getAssigneeName = (task) => {
    const assigned = task.assignedTo;
    if (!assigned) return "Unassigned";
    if (typeof assigned === "object") {
      return assigned.name || assigned.email || "Assigned";
    }
    if (user && (assigned === user.id || assigned === user._id)) {
      return user.name;
    }
    return "Assigned";
  };

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filterStatus !== "All") params.set("status", filterStatus);
    if (filterPriority !== "All") params.set("priority", filterPriority);
    return params.toString();
  }, [filterStatus, filterPriority]);

  const loadBoard = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/boards");
      const found = (data.boards || []).find((item) => item._id === id);
      setBoard(found || null);
    } catch (err) {
      setError(err.message || "Failed to load board.");
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    setError("");
    try {
      const qs = queryString ? `?${queryString}` : "";
      const data = await apiFetch(`/api/boards/${id}/tasks${qs}`);
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.message || "Failed to load tasks.");
    }
  };

  useEffect(() => {
    loadBoard();
  }, [id]);

  useEffect(() => {
    loadTasks();
  }, [id, queryString]);

  const resetForm = () => {
    setFormState({
      title: "",
      description: "",
      category: "",
      priority: "Low",
      status: "Ready",
      dueDate: "",
    });
  };

  const openCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const handleSuggest = async () => {
    setSuggesting(true);
    setError("");
    if (!suggestInput.trim()) {
      setError("Add a short description first.");
      setSuggesting(false);
      return;
    }
    try {
      const title = await suggestTitleFromDescription(suggestInput);
      setSuggestedTitle(title);
    } catch (err) {
      setError(err.message || "Failed to suggest title.");
    } finally {
      setSuggesting(false);
    }
  };

  const useSuggestedTitle = () => {
    setFormState((prev) => ({
      ...prev,
      title: suggestedTitle,
      description: suggestInput,
    }));
    setShowCreate(true);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!formState.title.trim()) {
      setError("Task title is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiFetch(`/api/boards/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formState.title,
          description: formState.description,
          category: formState.category,
          priority: formState.priority,
          status: formState.status,
          dueDate: formState.dueDate || undefined,
        }),
      });
      setShowCreate(false);
      await loadTasks();
    } catch (err) {
      setError(err.message || "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (task) => {
    setSelectedTask(task);
    setFormState({
      title: task.title || "",
      description: task.description || "",
      category: task.category || "",
      priority: task.priority || "Low",
      status: task.status || "Ready",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
    setShowEdit(true);
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    if (!selectedTask) return;
    if (!formState.title.trim()) {
      setError("Task title is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiFetch(`/api/tasks/${selectedTask._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formState.title,
          description: formState.description,
          category: formState.category,
          priority: formState.priority,
          status: formState.status,
          dueDate: formState.dueDate || undefined,
        }),
      });
      setShowEdit(false);
      setSelectedTask(null);
      await loadTasks();
    } catch (err) {
      setError(err.message || "Failed to update task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (task) => {
    const ok = window.confirm(`Delete "${task.title}"?`);
    if (!ok) return;
    setError("");
    try {
      await apiFetch(`/api/tasks/${task._id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((item) => item._id !== task._id));
    } catch (err) {
      setError(err.message || "Failed to delete task.");
    }
  };

  const badgeStyle = (color) => ({
    background: color,
    color: "#fff",
    padding: "0.1rem 0.4rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
  });

  return (
    <main>
      <style>{`
        .board-columns {
          display: grid;
          grid-template-columns: repeat(4, minmax(200px, 1fr));
          gap: 1rem;
          align-items: start;
        }
        .board-column {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.75rem;
          min-height: 200px;
        }
        .task-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .task-meta {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.25rem;
          flex-wrap: wrap;
        }
        .task-actions {
          margin-top: 0.5rem;
          display: flex;
          gap: 0.5rem;
        }
        @media (max-width: 900px) {
          .board-columns {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 600px) {
          .board-columns {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <h1>Board</h1>
      {loading && <p>Loading...</p>}
      {error && (
        <div role="alert" style={{ color: "#b91c1c", marginBottom: "0.75rem" }}>
          {error}
        </div>
      )}
      {!loading && !board && <p>Board not found.</p>}
      {board && (
        <>
          <div>
            <h2>{board.name}</h2>
            <p>Members: {board.members?.length || 0}</p>
          </div>

          <section style={{ margin: "1rem 0" }}>
            <h3>Suggest Task Title</h3>
            <textarea
              rows={3}
              value={suggestInput}
              onChange={(e) => setSuggestInput(e.target.value)}
              placeholder="Describe the task..."
            />
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button type="button" onClick={handleSuggest} disabled={suggesting}>
                {suggesting ? "Suggesting..." : "Suggest"}
              </button>
              {suggestedTitle && (
                <button type="button" onClick={useSuggestedTitle}>
                  Use this title
                </button>
              )}
            </div>
            {suggestedTitle && (
              <p>
                Suggested: <strong>{suggestedTitle}</strong>
              </p>
            )}
          </section>

          <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0" }}>
            <button type="button" onClick={openCreate}>
              Create Task
            </button>
            <label>
              Status
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                {STATUS_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                {PRIORITY_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {tasks.length === 0 ? (
            <p>No tasks yet.</p>
          ) : (
            <div className="board-columns">
              {STATUS_VALUES.filter((value) => value !== "All").map((status) => {
                const columnTasks = tasks.filter((task) => task.status === status);
                return (
                  <div className="board-column" key={status}>
                    <h3>{status}</h3>
                    {columnTasks.length === 0 ? (
                      <p>No tasks</p>
                    ) : (
                      columnTasks.map((task) => (
                        <div className="task-card" key={task._id}>
                          <strong>{task.title}</strong>
                          <div className="task-meta">
                            <span style={badgeStyle(priorityColors[task.priority] || "#6b7280")}>
                              {task.priority}
                            </span>
                            <span style={badgeStyle(statusColors[task.status] || "#6b7280")}>
                              {task.status}
                            </span>
                          </div>
                          <div style={{ marginTop: "0.4rem" }}>
                            Assigned: {getAssigneeName(task)}
                          </div>
                          <div className="task-actions">
                            <button type="button" onClick={() => openEdit(task)}>
                              Edit
                            </button>
                            {isAdmin && (
                              <button type="button" onClick={() => handleDelete(task)}>
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
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
            <h2>Create Task</h2>
            <form onSubmit={handleCreate}>
              <div>
                <label htmlFor="task-title">Title</label>
                <input
                  id="task-title"
                  type="text"
                  value={formState.title}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label htmlFor="task-description">Description</label>
                <textarea
                  id="task-description"
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label htmlFor="task-category">Category</label>
                <input
                  id="task-category"
                  type="text"
                  value={formState.category}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, category: e.target.value }))
                  }
                />
              </div>
              <div>
                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  value={formState.priority}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, priority: e.target.value }))
                  }
                >
                  {PRIORITY_VALUES.filter((value) => value !== "All").map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="task-status">Status</label>
                <select
                  id="task-status"
                  value={formState.status}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  {STATUS_VALUES.filter((value) => value !== "All").map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="task-due-date">Due Date</label>
                <input
                  id="task-due-date"
                  type="date"
                  value={formState.dueDate}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEdit && selectedTask && (
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
            <h2>Edit Task</h2>
            <form onSubmit={handleEdit}>
              <div>
                <label htmlFor="edit-title">Title</label>
                <input
                  id="edit-title"
                  type="text"
                  value={formState.title}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label htmlFor="edit-category">Category</label>
                <input
                  id="edit-category"
                  type="text"
                  value={formState.category}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, category: e.target.value }))
                  }
                />
              </div>
              <div>
                <label htmlFor="edit-priority">Priority</label>
                <select
                  id="edit-priority"
                  value={formState.priority}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, priority: e.target.value }))
                  }
                >
                  {PRIORITY_VALUES.filter((value) => value !== "All").map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  value={formState.status}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  {STATUS_VALUES.filter((value) => value !== "All").map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-due-date">Due Date</label>
                <input
                  id="edit-due-date"
                  type="date"
                  value={formState.dueDate}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEdit(false);
                    setSelectedTask(null);
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
