const express = require("express");
const { protect } = require("../middleware/auth");
const Workflow = require("../models/Workflow");
const Booking = require("../models/Booking");
const Form = require("../models/Form");
const Survey = require("../models/Survey");
const AutoReschedule = require("../models/AutoReschedule");
const router = express.Router();

router.use(protect);

// GET /api/dashboard/summary
router.get("/summary", async (req, res) => {
  try {
    const [workflows, bookings, forms, surveys, autoReschedules] =
      await Promise.all([
        Workflow.find({ owner: req.user._id }),
        Booking.find({ owner: req.user._id }).sort({ start: -1 }),
        Form.find({ owner: req.user._id }),
        Survey.find({ owner: req.user._id }),
        AutoReschedule.find({ owner: req.user._id }),
      ]);

    // Recent activities: last 5 workflows and bookings
    const recentActivities = [
      ...workflows.slice(-3).map((w) => ({
        type: "workflow",
        title: w.name,
        description: w.description || "Workflow created or updated",
        time: w.updatedAt || w.createdAt,
        status: "completed",
      })),
      ...bookings.slice(0, 2).map((b) => ({
        type: "booking",
        title: b.title,
        description: `Meeting with ${b.guestName || "-"}`,
        time: b.start,
        status: "upcoming",
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5);

    // Upcoming tasks: next 5 bookings
    const now = new Date();
    const upcomingTasks = bookings
      .filter((b) => new Date(b.start) > now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 5)
      .map((b) => ({
        title: b.title,
        time: new Date(b.start).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: new Date(b.start).toLocaleDateString(),
        priority: "medium",
        type: "meeting",
      }));

    res.json({
      stats: {
        workflows: workflows.length,
        bookings: bookings.length,
        forms: forms.length,
        surveys: surveys.length,
        autoReschedules: autoReschedules.length,
      },
      recentActivities,
      upcomingTasks,
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard summary" });
  }
});

module.exports = router;
