const bcrypt = require("bcrypt");
const User = require("../models/User");

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const listUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("name email role")
      .sort({ createdAt: -1 });
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load users." });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }
    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return res.status(400).json({ message: "A valid email is required." });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already in use." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
      role: "TEAM_MEMBER",
    });

    return res.status(201).json({
      message: "User created.",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create user." });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (String(req.user._id) === String(id)) {
      return res.status(400).json({ message: "You cannot delete yourself." });
    }

    const result = await User.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.status(200).json({ message: "User deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user." });
  }
};

module.exports = { listUsers, createUser, deleteUser };
