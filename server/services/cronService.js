const cron = require("node-cron");
const AutoRescheduleService = require("./autoRescheduleService");
const Workflow = require("../models/Workflow");
const WorkflowRun = require("../models/WorkflowRun");
const { runWorkflowGraph } = require("../routes/workflows");

// Helper: Find the first schedule node in a workflow
function findScheduleNode(workflow) {
  return (workflow.nodes || []).find((n) => n.type === "schedule");
}

// Register a workflow with node-cron
function registerWorkflowSchedule(workflow) {
  const scheduleNode = findScheduleNode(workflow);
  if (!scheduleNode) return;
  const config = scheduleNode.config || {};
  let cronExpr = null;
  if (config.scheduleType === "Interval" && config.interval) {
    // Every X minutes
    cronExpr = `*/${config.interval} * * * *`;
  } else if (config.scheduleType === "Time of Day" && config.timeOfDay) {
    // At specific time each day (HH:mm)
    const [h, m] = (config.timeOfDay || "0:0").split(":");
    cronExpr = `${parseInt(m, 10) || 0} ${parseInt(h, 10) || 0} * * *`;
  } else if (config.scheduleType === "Cron Expression" && config.cron) {
    cronExpr = config.cron;
  }
  if (!cronExpr) return;
  cron.schedule(cronExpr, async () => {
    console.log(
      `⏰ Scheduled run for workflow ${workflow._id} (${workflow.name})`
    );
    try {
      const run = new WorkflowRun({
        workflow: workflow._id,
        user: workflow.owner,
        status: "running",
        steps: [],
        startedAt: new Date(),
      });
      const { nodeMap, outgoing } = buildGraph(workflow.nodes, workflow.edges);
      await runWorkflowGraph({
        workflow,
        run,
        context: {},
        startNodeId: scheduleNode.id,
        nodeMap,
        outgoing,
      });
      run.status = "success";
      run.finishedAt = new Date();
      await run.save();
      console.log(`✅ Scheduled workflow ${workflow._id} run complete`);
    } catch (err) {
      console.error(
        `❌ Error running scheduled workflow ${workflow._id}:`,
        err
      );
    }
  });
}

// Initialize cron jobs
const initializeCronJobs = async () => {
  console.log("🕐 Initializing cron jobs...");

  // Register scheduled workflows
  const workflows = await Workflow.find({ status: "active" });
  workflows.forEach(registerWorkflowSchedule);

  // Process auto-reschedule actions every hour
  cron.schedule("0 * * * *", async () => {
    console.log("🔄 Processing auto-reschedule actions...");
    try {
      await AutoRescheduleService.processPendingActions();
      console.log("✅ Auto-reschedule actions processed successfully");
    } catch (error) {
      console.error("❌ Error processing auto-reschedule actions:", error);
    }
  });

  // Process auto-reschedule actions every 15 minutes during business hours
  cron.schedule("*/15 9-17 * * 1-5", async () => {
    console.log("🔄 Processing auto-reschedule actions (business hours)...");
    try {
      await AutoRescheduleService.processPendingActions();
      console.log(
        "✅ Auto-reschedule actions processed successfully (business hours)"
      );
    } catch (error) {
      console.error(
        "❌ Error processing auto-reschedule actions (business hours):",
        error
      );
    }
  });

  // Daily cleanup and maintenance
  cron.schedule("0 2 * * *", async () => {
    console.log("🧹 Running daily maintenance...");
    try {
      // Add any daily maintenance tasks here
      console.log("✅ Daily maintenance completed");
    } catch (error) {
      console.error("❌ Error during daily maintenance:", error);
    }
  });

  console.log("✅ Cron jobs initialized successfully");
};

module.exports = {
  initializeCronJobs,
};
