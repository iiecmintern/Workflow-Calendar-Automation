const mongoose = require("mongoose");

const WebhookSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
    },
    nodeId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },
    // For inbound webhooks
    inbound: {
      endpoint: {
        type: String,
        trim: true,
      },
      secret: {
        type: String,
        trim: true,
      },
      method: {
        type: String,
        enum: ["GET", "POST", "PUT", "DELETE"],
        default: "POST",
      },
      headers: {
        type: Map,
        of: String,
        default: {},
      },
      bodySchema: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    // For outbound webhooks
    outbound: {
      url: {
        type: String,
        trim: true,
      },
      method: {
        type: String,
        enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        default: "POST",
      },
      headers: {
        type: Map,
        of: String,
        default: {},
      },
      body: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      timeout: {
        type: Number,
        default: 30000, // 30 seconds
      },
      retryCount: {
        type: Number,
        default: 3,
      },
      retryDelay: {
        type: Number,
        default: 5000, // 5 seconds
      },
    },
    // Webhook execution history
    executions: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["success", "failed", "pending"],
          default: "pending",
        },
        response: {
          statusCode: Number,
          headers: mongoose.Schema.Types.Mixed,
          body: mongoose.Schema.Types.Mixed,
        },
        error: {
          message: String,
          code: String,
        },
        duration: Number, // milliseconds
      },
    ],
    // Statistics
    stats: {
      totalExecutions: {
        type: Number,
        default: 0,
      },
      successfulExecutions: {
        type: Number,
        default: 0,
      },
      failedExecutions: {
        type: Number,
        default: 0,
      },
      averageResponseTime: {
        type: Number,
        default: 0,
      },
      lastExecuted: {
        type: Date,
      },
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
WebhookSchema.index({ owner: 1, workflow: 1 });
WebhookSchema.index({ "inbound.endpoint": 1 }, { unique: true, sparse: true });
WebhookSchema.index({ "stats.lastExecuted": -1 });

module.exports = mongoose.model("Webhook", WebhookSchema);
