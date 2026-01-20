const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ["Ready", "In Progress", "Testing", "Completed"],
      default: "Ready",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("Task", taskSchema);
