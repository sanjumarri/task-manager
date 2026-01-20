const bcrypt = require("bcrypt");
const User = require("../models/User");

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

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

    let resolvedRole = "TEAM_MEMBER";
    if (role === "ADMIN") {
      const allowAdmin = process.env.ALLOW_ADMIN_REG === "true";
      if (!allowAdmin) {
        return res
          .status(403)
          .json({ message: "Admin registration is disabled." });
      }
      resolvedRole = "ADMIN";
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
      role: resolvedRole,
    });

    return res.status(201).json({
      message: "Registration successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed." });
  }
};

module.exports = { register };
