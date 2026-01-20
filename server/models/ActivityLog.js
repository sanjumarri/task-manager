const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board" },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true },
  oldStatus: { type: String },
  newStatus: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);
