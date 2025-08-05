const express = require("express");
const { body, validationResult } = require("express-validator");
const Workflow = require("../models/Workflow");
const WorkflowRun = require("../models/WorkflowRun");
const { protect } = require("../middleware/auth");
const router = express.Router();
const nodemailer = require("nodemailer");
const axios = require("axios");
const fetch = require("node-fetch");

// Owner check middleware
const ownerCheck = async (req, res, next) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow)
      return res.status(404).json({ message: "Workflow not found" });
    if (workflow.owner !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    req.workflow = workflow;
    next();
  } catch (err) {
    console.error("Owner check error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create workflow
router.post("/", protect, [body("name").notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  try {
    const workflow = await Workflow.create({
      name: req.body.name,
      description: req.body.description,
      owner: req.user.id,
      nodes: req.body.nodes || [],
      edges: req.body.edges || [],
      status: req.body.status || "draft",
    });
    res.status(201).json(workflow);
  } catch (err) {
    console.error("Create workflow error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all workflows for user
router.get("/", protect, async (req, res) => {
  try {
    const workflows = await Workflow.find({ owner: req.user.id });
    res.json(workflows);
  } catch (err) {
    console.error("Get workflows error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get workflow by id
router.get("/:id", protect, ownerCheck, async (req, res) => {
  res.json(req.workflow);
});

// Update workflow
router.put("/:id", protect, ownerCheck, async (req, res) => {
  try {
    const { name, description, nodes, edges, status } = req.body;
    if (name !== undefined) req.workflow.name = name;
    if (description !== undefined) req.workflow.description = description;
    if (nodes !== undefined) req.workflow.nodes = nodes;
    if (edges !== undefined) req.workflow.edges = edges;
    if (status !== undefined) req.workflow.status = status;
    await req.workflow.save();
    res.json(req.workflow);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete workflow
router.delete("/:id", protect, ownerCheck, async (req, res) => {
  try {
    await req.workflow.deleteOne();
    res.json({ message: "Workflow deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Helper: send email (mock SMTP config)
async function sendEmail({ to, subject, text }) {
  // Use a test SMTP service like Ethereal for dev
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER || "ethereal_user", // set in .env
      pass: process.env.ETHEREAL_PASS || "ethereal_pass",
    },
  });
  let info = await transporter.sendMail({
    from: "WorkflowSuite <noreply@workflow-suite.com>",
    to,
    subject,
    text,
  });
  return info;
}

// Helper: Evaluate JS expression safely
function evalCondition(expression, context = {}) {
  try {
    // eslint-disable-next-line no-new-func
    return Function(
      ...Object.keys(context),
      `return (${expression})`
    )(...Object.values(context));
  } catch {
    return false;
  }
}

// Helper: Recursively resolve {{variable}} references in config using context
function resolveConfig(config, context) {
  if (typeof config === "string") {
    return config.replace(/{{(.*?)}}/g, (_, key) => {
      try {
        // Support dot notation, e.g., api1.response.data.id
        const path = key.trim().split(".");
        let value = context;
        for (const p of path) {
          value = value?.[p];
          if (value === undefined) break;
        }
        return value !== undefined ? value : "";
      } catch {
        return "";
      }
    });
  } else if (Array.isArray(config)) {
    return config.map((item) => resolveConfig(item, context));
  } else if (typeof config === "object" && config !== null) {
    const resolved = {};
    for (const k in config) {
      resolved[k] = resolveConfig(config[k], context);
    }
    return resolved;
  }
  return config;
}

// Helper: Build node/edge maps for traversal
function buildGraph(nodes, edges) {
  const nodeMap = {};
  nodes.forEach((n) => (nodeMap[n.id] = n));
  const outgoing = {};
  edges.forEach((e) => {
    if (!outgoing[e.source]) outgoing[e.source] = [];
    outgoing[e.source].push(e);
  });
  return { nodeMap, outgoing };
}

// Main runner (supports IF/ELSE and Loop)
async function runWorkflowGraph({
  workflow,
  run,
  context = {},
  startNodeId = null,
  nodeMap,
  outgoing,
}) {
  let currentId = startNodeId || (workflow.nodes[0] && workflow.nodes[0].id);
  let loopStack = [];
  while (currentId) {
    const node = nodeMap[currentId];
    if (!node) break;
    // Resolve config with current context
    const resolvedConfig = resolveConfig(node.config, context);
    const step = {
      nodeId: node.id,
      type: node.type,
      label: node.label,
      config: resolvedConfig,
      status: "running",
      startedAt: new Date(),
    };
    try {
      if (node.type === "condition") {
        // IF/ELSE node
        const result = evalCondition(
          resolvedConfig?.expression || "false",
          context
        );
        step.result = { evaluated: result };
        // Find outgoing edge with label 'true' or 'false'
        const outs = outgoing[node.id] || [];
        const trueEdge = outs.find(
          (e) => (e.label || "").toLowerCase() === "true"
        );
        const falseEdge = outs.find(
          (e) => (e.label || "").toLowerCase() === "false"
        );
        currentId = result
          ? trueEdge && trueEdge.target
          : falseEdge && falseEdge.target;
      } else if (node.type === "loop") {
        // Loop node
        const count = parseInt(resolvedConfig?.count, 10) || 1;
        if (
          !loopStack.length ||
          loopStack[loopStack.length - 1].nodeId !== node.id
        ) {
          loopStack.push({ nodeId: node.id, remaining: count });
        }
        const loop = loopStack[loopStack.length - 1];
        if (loop.remaining > 0) {
          loop.remaining--;
          // Go to next node (first outgoing edge)
          const outs = outgoing[node.id] || [];
          currentId = outs[0] && outs[0].target;
        } else {
          loopStack.pop();
          // After loop, go to next after loop node (second outgoing edge if exists)
          const outs = outgoing[node.id] || [];
          currentId = outs[1] && outs[1].target;
        }
        step.result = { loopCount: count };
      } else if (node.type === "parallel") {
        // Parallel: execute each branch node ID in config.branches (sequentially for now)
        const branches = (resolvedConfig?.branches || "")
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
        step.result = { branches: [] };
        for (const branchId of branches) {
          if (nodeMap[branchId]) {
            const branchRun = { steps: [] };
            await runWorkflowGraph({
              workflow,
              run: branchRun,
              context,
              startNodeId: branchId,
              nodeMap,
              outgoing,
            });
            step.result.branches.push({ branchId, steps: branchRun.steps });
          }
        }
        // After all branches, go to next node (first outgoing edge not in branches)
        const outs = outgoing[node.id] || [];
        const next = outs.find((e) => !branches.includes(e.target));
        currentId = next && next.target;
      } else if (node.type === "subflow") {
        // Subflow: load and execute referenced workflow
        const subflowId = resolvedConfig?.subflowId;
        if (subflowId) {
          const Workflow = require("../models/Workflow");
          const subflow = await Workflow.findById(subflowId);
          if (subflow) {
            const { nodeMap: subNodeMap, outgoing: subOutgoing } = buildGraph(
              subflow.nodes,
              subflow.edges
            );
            const subRun = { steps: [] };
            await runWorkflowGraph({
              workflow: subflow,
              run: subRun,
              context,
              nodeMap: subNodeMap,
              outgoing: subOutgoing,
            });
            step.result = { subflowId, steps: subRun.steps };
          } else {
            step.status = "error";
            step.error = "Subflow not found";
            run.status = "error";
            run.error = "Subflow not found";
            currentId = null;
          }
        }
        // After subflow, go to next node (first outgoing edge)
        const outs = outgoing[node.id] || [];
        currentId = outs[0] && outs[0].target;
      } else if (node.type === "approval") {
        // Approval: pause execution, mark as pending
        step.status = "pending";
        step.result = { approver: resolvedConfig?.approver };
        run.status = "pending";
        run.finishedAt = new Date();
        run.steps.push(step);
        await run.save();
        // Stop execution until approved
        return;
      } else {
        // Fallback to previous logic for other node types
        if (node.type === "action") {
          if (resolvedConfig?.actionType === "Send Email") {
            const info = await sendEmail({
              to: resolvedConfig.emailTo,
              subject: node.label || "Workflow Email",
              text: resolvedConfig.emailBody || "",
            });
            step.result = { messageId: info.messageId };
          } else if (resolvedConfig?.actionType === "HTTP Request") {
            const response = await axios.post(
              resolvedConfig.endpoint,
              resolvedConfig.payload || {},
              { timeout: 10000 }
            );
            step.result = { status: response.status, data: response.data };
          } else {
            step.result = { message: "Unknown action type" };
          }
        } else if (node.type === "delay") {
          const ms = (parseInt(resolvedConfig.duration, 10) || 1) * 60 * 1000;
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(ms, 5000))
          );
          step.result = { waitedMs: Math.min(ms, 5000) };
        } else {
          step.result = { message: `Executed node type: ${node.type}` };
        }
        // Go to next node (first outgoing edge)
        const outs = outgoing[node.id] || [];
        currentId = outs[0] && outs[0].target;
      }
      step.status = step.status || "success";
      // Store node output in context for variable mapping
      context[node.id] = step.result;
    } catch (err) {
      step.status = "error";
      step.error = err.message;
      run.status = "error";
      run.error = err.message;
      currentId = null;
    }
    step.finishedAt = new Date();
    run.steps.push(step);
    if (step.status === "error") break;
  }
}

// Run workflow (graph-based, supports IF/ELSE and Loop)
router.post("/:id/run", protect, ownerCheck, async (req, res) => {
  try {
    const workflow = req.workflow;
    const run = new WorkflowRun({
      workflow: workflow._id,
      user: req.user._id,
      status: "running",
      steps: [],
      startedAt: new Date(),
    });
    const { nodeMap, outgoing } = buildGraph(workflow.nodes, workflow.edges);
    await runWorkflowGraph({ workflow, run, nodeMap, outgoing });
    // Only set to success if not paused for approval
    if (run.status === "running") {
      run.status = "success";
      run.finishedAt = new Date();
    } else if (run.status === "pending") {
      // Paused for approval, do not set finishedAt
    } else if (run.status === "error") {
      run.finishedAt = new Date();
    }
    await run.save();
    res.json({
      message:
        run.status === "pending"
          ? "Workflow paused for approval"
          : "Workflow run completed",
      run,
    });
  } catch (err) {
    console.error("Workflow run error:", err);
    res
      .status(500)
      .json({ message: "Workflow run failed", error: err.message });
  }
});

// Get workflow run history
router.get("/:id/runs", protect, ownerCheck, async (req, res) => {
  try {
    const runs = await WorkflowRun.find({ workflow: req.workflow._id })
      .sort({ startedAt: -1 })
      .limit(20);
    res.json(runs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch run history" });
  }
});

// Get all pending approvals for the current user
router.get("/approvals/pending", protect, async (req, res) => {
  try {
    // Find runs with status 'pending' and a step of type 'approval' assigned to this user
    const userEmail = req.user.email;
    const runs = await WorkflowRun.find({
      status: "pending",
      "steps.type": "approval",
      "steps.status": "pending",
      "steps.result.approver": userEmail,
    })
      .populate("workflow")
      .sort({ startedAt: -1 });
    res.json(runs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pending approvals" });
  }
});

// Approve a pending workflow run and resume execution
router.post("/approvals/:runId/approve", protect, async (req, res) => {
  try {
    const run = await WorkflowRun.findById(req.params.runId).populate(
      "workflow"
    );
    if (!run) return res.status(404).json({ message: "Run not found" });
    if (run.status !== "pending")
      return res.status(400).json({ message: "Run is not pending approval" });
    // Find the pending approval step assigned to this user
    const step = run.steps.find(
      (s) =>
        s.type === "approval" &&
        s.status === "pending" &&
        s.result &&
        s.result.approver === req.user.email
    );
    if (!step)
      return res
        .status(403)
        .json({ message: "No pending approval for you in this run" });
    // Mark step as approved
    step.status = "success";
    step.finishedAt = new Date();
    step.result.approvedBy = req.user.email;
    step.result.approvedAt = new Date();
    // Resume workflow execution
    run.status = "running";
    run.finishedAt = undefined;
    await run.save();
    // Resume workflow from next node after approval
    const { nodeMap, outgoing } = buildGraph(
      run.workflow.nodes,
      run.workflow.edges
    );
    // Find the next node after the approval node
    const outs = outgoing[step.nodeId] || [];
    const nextNodeId = outs[0] && outs[0].target;
    await runWorkflowGraph({
      workflow: run.workflow,
      run,
      nodeMap,
      outgoing,
      startNodeId: nextNodeId,
    });
    if (run.status !== "error") {
      run.status = "success";
    }
    run.finishedAt = new Date();
    await run.save();
    res.json({ message: "Approval complete, workflow resumed", run });
  } catch (err) {
    console.error("Approval error:", err);
    res.status(500).json({ message: "Failed to approve and resume workflow" });
  }
});

// AI Workflow Debugger (Groq API)
router.post("/:id/debug/:runId", protect, ownerCheck, async (req, res) => {
  try {
    const { runId } = req.params;
    const run = await WorkflowRun.findById(runId);
    if (!run) return res.status(404).json({ message: "Run not found" });
    const workflow = req.workflow;
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return res
        .status(500)
        .json({ message: "GROQ_API_KEY is not set in .env" });
    }
    // Prepare prompt for Groq
    const prompt = `You are an expert workflow automation debugger.\n\nHere is a workflow definition (nodes and edges):\n${JSON.stringify(
      workflow.nodes
    )}\n${JSON.stringify(
      workflow.edges
    )}\n\nHere is a run log (steps, errors, context):\n${JSON.stringify(
      run.steps
    )}\n\nIf the run failed, explain in plain English what went wrong and why.\nIf the run succeeded, summarize what happened.\nSuggest specific fixes or improvements to the workflow.\nIf possible, point out which node(s) caused issues.\nBe concise, clear, and actionable.`;
    // Call Groq API with axios
    let groqRes, groqData;
    try {
      groqRes = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are an expert workflow automation debugger." },
            { role: "user", content: prompt }
          ],
          max_tokens: 512,
          temperature: 0.2
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqApiKey}`
          }
        }
      );
      groqData = groqRes.data;
    } catch (apiErr) {
      console.error("Groq API error:", apiErr?.response?.data || apiErr);
      return res.status(500).json({
        message: "AI Debugger failed (Groq API error)",
        error:
          apiErr?.response?.data?.error || apiErr.message || apiErr.toString(),
      });
    }
    const aiResponse =
      groqData.choices?.[0]?.message?.content || "No response from AI.";
    res.json({ explanation: aiResponse });
  } catch (err) {
    console.error("AI Debugger error:", err);
    res.status(500).json({ message: "AI Debugger failed", error: err.message });
  }
});

module.exports = router;
