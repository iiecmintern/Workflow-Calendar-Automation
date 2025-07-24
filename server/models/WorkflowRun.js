const mongoose = require("mongoose");

const StepLogSchema = new mongoose.Schema(
  {
    nodeId: String,
    type: String,
    label: String,
    config: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ["pending", "running", "success", "error"],
      default: "pending",
    },
    result: mongoose.Schema.Types.Mixed,
    startedAt: Date,
    finishedAt: Date,
    error: String,
  },
  { _id: false }
);

const WorkflowRunSchema = new mongoose.Schema(
  {
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "running", "success", "error"],
      default: "pending",
    },
    steps: [StepLogSchema],
    result: mongoose.Schema.Types.Mixed,
    startedAt: { type: Date, default: Date.now },
    finishedAt: Date,
    error: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkflowRun", WorkflowRunSchema);
