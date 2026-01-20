const express = require("express");
const {
  listUsers,
  createUser,
  deleteUser,
} = require("../controllers/usersController");
const { authMiddleware, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", authMiddleware, requireRole("ADMIN"), listUsers);
router.post("/", authMiddleware, requireRole("ADMIN"), createUser);
router.delete("/:id", authMiddleware, requireRole("ADMIN"), deleteUser);

module.exports = router;
