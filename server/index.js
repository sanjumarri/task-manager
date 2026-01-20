const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { authMiddleware } = require("./middleware/auth");
const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/usersRoutes");
const boardsRoutes = require("./routes/boardsRoutes");
const tasksRoutes = require("./routes/tasksRoutes");

const app = express();

dotenv.config();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/boards", boardsRoutes);
app.use("/api", tasksRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/me", authMiddleware, (req, res) => {
  const { _id, email, role, name } = req.user;
  res.status(200).json({ id: _id, email, role, name });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
