const express = require("express");
const {
  listBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  updateBoardMembers,
} = require("../controllers/boardsController");
const { authMiddleware, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", authMiddleware, listBoards);
router.post("/", authMiddleware, requireRole("ADMIN"), createBoard);
router.put("/:id", authMiddleware, requireRole("ADMIN"), updateBoard);
router.delete("/:id", authMiddleware, requireRole("ADMIN"), deleteBoard);
router.put("/:id/members", authMiddleware, requireRole("ADMIN"), updateBoardMembers);

module.exports = router;
