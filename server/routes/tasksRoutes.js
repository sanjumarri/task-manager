const express = require("express");
const {
  createTask,
  listTasks,
  updateTask,
  deleteTask,
} = require("../controllers/tasksController");
const { authMiddleware, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/boards/:boardId/tasks", authMiddleware, createTask);
router.get("/boards/:boardId/tasks", authMiddleware, listTasks);
router.put("/tasks/:taskId", authMiddleware, updateTask);
router.delete("/tasks/:taskId", authMiddleware, requireRole("ADMIN"), deleteTask);

module.exports = router;
