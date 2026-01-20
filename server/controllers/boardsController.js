const Board = require("../models/Board");

const listBoards = async (req, res) => {
  try {
    const query = req.user.role === "ADMIN" ? {} : { members: req.user._id };
    const boards = await Board.find(query)
      .select("name members createdBy createdAt")
      .sort({ createdAt: -1 });
    return res.status(200).json({ boards });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load boards." });
  }
};

const createBoard = async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Board name is required." });
    }

    const board = await Board.create({
      name: name.trim(),
      createdBy: req.user._id,
      members: [],
    });

    return res.status(201).json({
      message: "Board created.",
      board: {
        id: board._id,
        name: board.name,
        members: board.members,
        createdBy: board.createdBy,
        createdAt: board.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create board." });
  }
};

const updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body || {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Board name is required." });
    }

    const board = await Board.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    ).select("name members createdBy createdAt");

    if (!board) {
      return res.status(404).json({ message: "Board not found." });
    }

    return res.status(200).json({ message: "Board updated.", board });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update board." });
  }
};

const deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const board = await Board.findByIdAndDelete(id);
    if (!board) {
      return res.status(404).json({ message: "Board not found." });
    }
    return res.status(200).json({ message: "Board deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete board." });
  }
};

const updateBoardMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberIds } = req.body || {};
    if (!Array.isArray(memberIds)) {
      return res.status(400).json({ message: "memberIds must be an array." });
    }

    const board = await Board.findByIdAndUpdate(
      id,
      { members: memberIds },
      { new: true }
    ).select("name members createdBy createdAt");

    if (!board) {
      return res.status(404).json({ message: "Board not found." });
    }

    return res.status(200).json({ message: "Members updated.", board });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update members." });
  }
};

module.exports = {
  listBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  updateBoardMembers,
};
