const Board = require("../models/Board");
const Task = require("../models/Task");
const ActivityLog = require("../models/ActivityLog");

const STATUS_VALUES = ["Ready", "In Progress", "Testing", "Completed"];
const PRIORITY_VALUES = ["Low", "Medium", "High"];

const canAccessBoard = async (boardId, user) => {
  const board = await Board.findById(boardId).select("members");
  if (!board) {
    return { allowed: false, board: null };
  }
  if (user.role === "ADMIN") {
    return { allowed: true, board };
  }
  const isMember = board.members.some(
    (memberId) => String(memberId) === String(user._id)
  );
  return { allowed: isMember, board };
};

const createLog = async ({ boardId, taskId, userId, action, oldStatus, newStatus }) => {
  if (!ActivityLog) return;
  await ActivityLog.create({
    boardId,
    taskId,
    userId,
    action,
    oldStatus,
    newStatus,
  });
};

const createTask = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title, description, category, priority, dueDate, status, assignedTo } =
      req.body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Task title is required." });
    }

    if (status && !STATUS_VALUES.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }
    if (priority && !PRIORITY_VALUES.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority value." });
    }

    const access = await canAccessBoard(boardId, req.user);
    if (!access.board) {
      return res.status(404).json({ message: "Board not found." });
    }
    if (!access.allowed) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const task = await Task.create({
      boardId,
      title: title.trim(),
      description: description || "",
      category: category || "",
      priority: priority || "Low",
      dueDate: dueDate || undefined,
      status: status || "Ready",
      assignedTo: assignedTo || req.user._id,
      createdBy: req.user._id,
    });

    await createLog({
      boardId,
      taskId: task._id,
      userId: req.user._id,
      action: "TASK_CREATED",
      oldStatus: null,
      newStatus: task.status,
    });

    return res.status(201).json({ message: "Task created.", task });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create task." });
  }
};

const listTasks = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { status, priority } = req.query;

    if (status && !STATUS_VALUES.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }
    if (priority && !PRIORITY_VALUES.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority value." });
    }

    const access = await canAccessBoard(boardId, req.user);
    if (!access.board) {
      return res.status(404).json({ message: "Board not found." });
    }
    if (!access.allowed) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const query = { boardId };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ tasks });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load tasks." });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body || {};

    if (updates.status && !STATUS_VALUES.includes(updates.status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }
    if (updates.priority && !PRIORITY_VALUES.includes(updates.priority)) {
      return res.status(400).json({ message: "Invalid priority value." });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    const access = await canAccessBoard(task.boardId, req.user);
    if (!access.allowed) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const oldStatus = task.status;
    if (typeof updates.title === "string" && updates.title.trim()) {
      task.title = updates.title.trim();
    }
    if (typeof updates.description === "string") {
      task.description = updates.description;
    }
    if (typeof updates.category === "string") {
      task.category = updates.category;
    }
    if (updates.priority) {
      task.priority = updates.priority;
    }
    if (updates.dueDate !== undefined) {
      task.dueDate = updates.dueDate || undefined;
    }
    if (updates.status) {
      task.status = updates.status;
    }
    if (updates.assignedTo) {
      task.assignedTo = updates.assignedTo;
    }

    await task.save();

    const statusChanged = updates.status && updates.status !== oldStatus;
    await createLog({
      boardId: task.boardId,
      taskId: task._id,
      userId: req.user._id,
      action: statusChanged ? "TASK_STATUS_CHANGED" : "TASK_UPDATED",
      oldStatus: statusChanged ? oldStatus : null,
      newStatus: statusChanged ? task.status : null,
    });

    return res.status(200).json({ message: "Task updated.", task });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update task." });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    await Task.deleteOne({ _id: taskId });

    await createLog({
      boardId: task.boardId,
      taskId: task._id,
      userId: req.user._id,
      action: "TASK_DELETED",
      oldStatus: task.status,
      newStatus: null,
    });

    return res.status(200).json({ message: "Task deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete task." });
  }
};

module.exports = { createTask, listTasks, updateTask, deleteTask };
