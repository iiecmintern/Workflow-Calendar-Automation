const express = require("express");
const { protect } = require("../middleware/auth");
const Webhook = require("../models/Webhook");
const Workflow = require("../models/Workflow");
const axios = require("axios");
const crypto = require("crypto");

const router = express.Router();
router.use(protect);

// GET /api/webhooks - Get all webhooks for the authenticated user
router.get("/", async (req, res) => {
  try {
    const webhooks = await Webhook.find({ owner: req.user.id })
      .populate("workflow", "name")
      .sort({ createdAt: -1 });
    res.json(webhooks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch webhooks" });
  }
});

// GET /api/webhooks/:id - Get a specific webhook
router.get("/:id", async (req, res) => {
  try {
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      owner: req.user.id,
    }).populate("workflow", "name");

    if (!webhook) {
      return res.status(404).json({ message: "Webhook not found" });
    }

    res.json(webhook);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch webhook" });
  }
});

// POST /api/webhooks - Create a new webhook
router.post("/", async (req, res) => {
  try {
    const { workflowId, nodeId, name, type, inbound, outbound } = req.body;

    // Validate workflow ownership
    const workflow = await Workflow.findOne({
      _id: workflowId,
      owner: req.user.id,
    });

    if (!workflow) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    // Generate unique endpoint for inbound webhooks
    let endpoint = null;
    if (type === "inbound") {
      const uniqueId = crypto.randomBytes(8).toString("hex");
      endpoint = `/webhook/${uniqueId}`;
    }

    const webhook = new Webhook({
      owner: req.user.id,
      workflow: workflowId,
      nodeId,
      name,
      type,
      inbound: type === "inbound" ? { ...inbound, endpoint } : undefined,
      outbound: type === "outbound" ? outbound : undefined,
    });

    await webhook.save();
    res.status(201).json(webhook);
  } catch (error) {
    console.error("Error creating webhook:", error);
    res.status(500).json({ message: "Failed to create webhook" });
  }
});

// PUT /api/webhooks/:id - Update a webhook
router.put("/:id", async (req, res) => {
  try {
    const { name, inbound, outbound } = req.body;

    const webhook = await Webhook.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      {
        name,
        inbound: webhook.type === "inbound" ? inbound : undefined,
        outbound: webhook.type === "outbound" ? outbound : undefined,
      },
      { new: true }
    );

    if (!webhook) {
      return res.status(404).json({ message: "Webhook not found" });
    }

    res.json(webhook);
  } catch (error) {
    res.status(500).json({ message: "Failed to update webhook" });
  }
});

// DELETE /api/webhooks/:id - Delete a webhook
router.delete("/:id", async (req, res) => {
  try {
    const webhook = await Webhook.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!webhook) {
      return res.status(404).json({ message: "Webhook not found" });
    }

    res.json({ message: "Webhook deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete webhook" });
  }
});

// POST /api/webhooks/:id/test - Test an outbound webhook
router.post("/:id/test", async (req, res) => {
  try {
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      owner: req.user.id,
      type: "outbound",
    });

    if (!webhook) {
      return res.status(404).json({ message: "Outbound webhook not found" });
    }

    const startTime = Date.now();
    let response, error;

    try {
      response = await axios({
        method: webhook.outbound.method,
        url: webhook.outbound.url,
        headers: Object.fromEntries(webhook.outbound.headers),
        data: webhook.outbound.body,
        timeout: webhook.outbound.timeout,
      });
    } catch (err) {
      error = {
        message: err.message,
        code: err.code || "UNKNOWN_ERROR",
      };
    }

    const duration = Date.now() - startTime;
    const execution = {
      timestamp: new Date(),
      status: error ? "failed" : "success",
      response: response
        ? {
            statusCode: response.status,
            headers: response.headers,
            body: response.data,
          }
        : undefined,
      error,
      duration,
    };

    // Update webhook statistics
    webhook.executions.push(execution);
    webhook.stats.totalExecutions += 1;
    webhook.stats.lastExecuted = new Date();

    if (error) {
      webhook.stats.failedExecutions += 1;
    } else {
      webhook.stats.successfulExecutions += 1;
    }

    // Calculate average response time
    const totalTime = webhook.executions.reduce(
      (sum, exec) => sum + exec.duration,
      0
    );
    webhook.stats.averageResponseTime = totalTime / webhook.executions.length;

    await webhook.save();

    res.json({
      success: !error,
      execution,
      stats: webhook.stats,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to test webhook" });
  }
});

// GET /api/webhooks/:id/executions - Get webhook execution history
router.get("/:id/executions", async (req, res) => {
  try {
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!webhook) {
      return res.status(404).json({ message: "Webhook not found" });
    }

    res.json(webhook.executions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch executions" });
  }
});

// Public endpoint for inbound webhooks (no auth required)
router.post("/inbound/:endpoint", async (req, res) => {
  try {
    const { endpoint } = req.params;

    // Find the webhook by endpoint
    const webhook = await Webhook.findOne({
      "inbound.endpoint": `/webhook/${endpoint}`,
      type: "inbound",
      "inbound.isActive": true,
    });

    if (!webhook) {
      return res.status(404).json({ message: "Webhook not found" });
    }

    // Verify webhook secret if provided
    if (webhook.inbound.secret) {
      const signature = req.headers["x-webhook-signature"];
      if (!signature) {
        return res.status(401).json({ message: "Missing webhook signature" });
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhook.inbound.secret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (signature !== expectedSignature) {
        return res.status(401).json({ message: "Invalid webhook signature" });
      }
    }

    // Record the inbound webhook execution
    const execution = {
      timestamp: new Date(),
      status: "success",
      response: {
        statusCode: 200,
        headers: req.headers,
        body: req.body,
      },
      duration: 0,
    };

    webhook.executions.push(execution);
    webhook.stats.totalExecutions += 1;
    webhook.stats.successfulExecutions += 1;
    webhook.stats.lastExecuted = new Date();
    await webhook.save();

    // TODO: Trigger workflow execution here
    // This would integrate with the workflow execution engine

    res.json({
      success: true,
      message: "Webhook received successfully",
      webhookId: webhook._id,
    });
  } catch (error) {
    console.error("Error processing inbound webhook:", error);
    res.status(500).json({ message: "Failed to process webhook" });
  }
});

module.exports = router;
