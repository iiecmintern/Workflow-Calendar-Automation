const mongoose = require("mongoose");

const TaskNodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String },
    config: { type: mongoose.Schema.Types.Mixed },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    data: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const EdgeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    label: { type: String },
    data: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const WorkflowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nodes: [TaskNodeSchema],
    edges: [EdgeSchema],
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workflow", WorkflowSchema);
