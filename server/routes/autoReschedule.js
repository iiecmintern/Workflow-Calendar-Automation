const express = require("express");
const { body, validationResult } = require("express-validator");
const { protect } = require("../middleware/auth");
const AutoReschedule = require("../models/AutoReschedule");
const Booking = require("../models/Booking");
const BookingPage = require("../models/BookingPage");
const Survey = require("../models/Survey");
const AutoRescheduleService = require("../services/autoRescheduleService");

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// GET /api/auto-reschedule - Get all auto-reschedule rules for user
router.get("/", async (req, res) => {
  try {
    const rules = await AutoReschedule.find({ owner: req.user.id })
      .populate("bookingPages", "title slug")
      .populate("surveys", "name")
      .sort({ createdAt: -1 });

    res.json(rules);
  } catch (error) {
    console.error("Error fetching auto-reschedule rules:", error);
    res.status(500).json({ message: "Failed to fetch auto-reschedule rules" });
  }
});

// GET /api/auto-reschedule/:id - Get specific auto-reschedule rule
router.get("/:id", async (req, res) => {
  try {
    const rule = await AutoReschedule.findOne({
      _id: req.params.id,
      owner: req.user.id,
    })
      .populate("bookingPages", "title slug")
      .populate("surveys", "name");

    if (!rule) {
      return res
        .status(404)
        .json({ message: "Auto-reschedule rule not found" });
    }

    res.json(rule);
  } catch (error) {
    console.error("Error fetching auto-reschedule rule:", error);
    res.status(500).json({ message: "Failed to fetch auto-reschedule rule" });
  }
});

// POST /api/auto-reschedule - Create new auto-reschedule rule
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("conditions").isArray().withMessage("Conditions must be an array"),
    body("actions").isArray().withMessage("Actions must be an array"),
    body("conditions.*.type")
      .isIn([
        "rating_below",
        "sentiment_negative",
        "no_show",
        "cancelled",
        "feedback_missing",
      ])
      .withMessage("Invalid condition type"),
    body("actions.*.type")
      .isIn(["reschedule", "follow_up", "refund", "compensation", "escalate"])
      .withMessage("Invalid action type"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        description,
        conditions,
        actions,
        settings,
        bookingPages,
        surveys,
      } = req.body;

      // Validate booking pages belong to user
      if (bookingPages && bookingPages.length > 0) {
        const userBookingPages = await BookingPage.find({
          _id: { $in: bookingPages },
          owner: req.user.id,
        });

        if (userBookingPages.length !== bookingPages.length) {
          return res.status(400).json({ message: "Invalid booking pages" });
        }
      }

      // Validate surveys belong to user
      if (surveys && surveys.length > 0) {
        const userSurveys = await Survey.find({
          _id: { $in: surveys },
          owner: req.user.id,
        });

        if (userSurveys.length !== surveys.length) {
          return res.status(400).json({ message: "Invalid surveys" });
        }
      }

      const rule = new AutoReschedule({
        owner: req.user.id,
        name,
        description,
        conditions,
        actions,
        settings: settings || {},
        bookingPages: bookingPages || [],
        surveys: surveys || [],
      });

      await rule.save();

      const populatedRule = await AutoReschedule.findById(rule._id)
        .populate("bookingPages", "title slug")
        .populate("surveys", "name");

      res.status(201).json(populatedRule);
    } catch (error) {
      console.error("Error creating auto-reschedule rule:", error);
      res
        .status(500)
        .json({ message: "Failed to create auto-reschedule rule" });
    }
  }
);

// PUT /api/auto-reschedule/:id - Update auto-reschedule rule
router.put(
  "/:id",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("conditions").isArray().withMessage("Conditions must be an array"),
    body("actions").isArray().withMessage("Actions must be an array"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const rule = await AutoReschedule.findOne({
        _id: req.params.id,
        owner: req.user.id,
      });

      if (!rule) {
        return res
          .status(404)
          .json({ message: "Auto-reschedule rule not found" });
      }

      const {
        name,
        description,
        conditions,
        actions,
        settings,
        bookingPages,
        surveys,
        isActive,
      } = req.body;

      // Validate booking pages belong to user
      if (bookingPages && bookingPages.length > 0) {
        const userBookingPages = await BookingPage.find({
          _id: { $in: bookingPages },
          owner: req.user.id,
        });

        if (userBookingPages.length !== bookingPages.length) {
          return res.status(400).json({ message: "Invalid booking pages" });
        }
      }

      // Validate surveys belong to user
      if (surveys && surveys.length > 0) {
        const userSurveys = await Survey.find({
          _id: { $in: surveys },
          owner: req.user.id,
        });

        if (userSurveys.length !== surveys.length) {
          return res.status(400).json({ message: "Invalid surveys" });
        }
      }

      rule.name = name;
      rule.description = description;
      rule.conditions = conditions;
      rule.actions = actions;
      rule.settings = settings || rule.settings;
      rule.bookingPages = bookingPages || rule.bookingPages;
      rule.surveys = surveys || rule.surveys;
      if (typeof isActive === "boolean") {
        rule.isActive = isActive;
      }

      await rule.save();

      const updatedRule = await AutoReschedule.findById(rule._id)
        .populate("bookingPages", "title slug")
        .populate("surveys", "name");

      res.json(updatedRule);
    } catch (error) {
      console.error("Error updating auto-reschedule rule:", error);
      res
        .status(500)
        .json({ message: "Failed to update auto-reschedule rule" });
    }
  }
);

// DELETE /api/auto-reschedule/:id - Delete auto-reschedule rule
router.delete("/:id", async (req, res) => {
  try {
    const rule = await AutoReschedule.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!rule) {
      return res
        .status(404)
        .json({ message: "Auto-reschedule rule not found" });
    }

    res.json({ message: "Auto-reschedule rule deleted successfully" });
  } catch (error) {
    console.error("Error deleting auto-reschedule rule:", error);
    res.status(500).json({ message: "Failed to delete auto-reschedule rule" });
  }
});

// POST /api/auto-reschedule/:id/toggle - Toggle rule active status
router.post("/:id/toggle", async (req, res) => {
  try {
    const rule = await AutoReschedule.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!rule) {
      return res
        .status(404)
        .json({ message: "Auto-reschedule rule not found" });
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    res.json({
      message: `Rule ${
        rule.isActive ? "activated" : "deactivated"
      } successfully`,
      isActive: rule.isActive,
    });
  } catch (error) {
    console.error("Error toggling auto-reschedule rule:", error);
    res.status(500).json({ message: "Failed to toggle auto-reschedule rule" });
  }
});

// POST /api/auto-reschedule/:id/test - Test rule with a booking
router.post(
  "/:id/test",
  [body("bookingId").notEmpty().withMessage("Booking ID is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const rule = await AutoReschedule.findOne({
        _id: req.params.id,
        owner: req.user.id,
      });

      if (!rule) {
        return res
          .status(404)
          .json({ message: "Auto-reschedule rule not found" });
      }

      const booking = await Booking.findOne({
        _id: req.body.bookingId,
        owner: req.user.id,
      });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Test conditions without executing actions
      const conditionsMet = await AutoRescheduleService.evaluateConditions(
        booking,
        rule.conditions
      );

      // Simulate what actions would be taken
      const actionPreview = rule.actions.map((action) => {
        const preview = {
          type: action.type,
          description: `Would execute ${action.type} action`,
        };

        if (action.type === "reschedule") {
          preview.description += ` - Find slot within ${
            action.rescheduleSettings?.withinDays || 7
          } days`;
        } else if (action.type === "follow_up") {
          preview.description += ` - Send follow-up after ${
            action.followUpSettings?.delayHours || 24
          } hours`;
        } else if (action.type === "compensation") {
          preview.description += ` - Offer ${
            action.compensationSettings?.value || 0
          }% ${action.compensationSettings?.type || "discount"}`;
        }

        return preview;
      });

      res.json({
        conditionsMet,
        actionPreview,
        booking: {
          id: booking._id,
          title: booking.title,
          start: booking.start,
          end: booking.end,
          status: booking.status,
          feedback: booking.feedback,
        },
      });
    } catch (error) {
      console.error("Error testing auto-reschedule rule:", error);
      res.status(500).json({ message: "Failed to test auto-reschedule rule" });
    }
  }
);

// POST /api/auto-reschedule/:id/execute - Manually execute rule for a booking
router.post(
  "/:id/execute",
  [body("bookingId").notEmpty().withMessage("Booking ID is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const rule = await AutoReschedule.findOne({
        _id: req.params.id,
        owner: req.user.id,
      });

      if (!rule) {
        return res
          .status(404)
          .json({ message: "Auto-reschedule rule not found" });
      }

      const booking = await Booking.findOne({
        _id: req.body.bookingId,
        owner: req.user.id,
      });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if conditions are met
      const conditionsMet = await AutoRescheduleService.evaluateConditions(
        booking,
        rule.conditions
      );

      if (!conditionsMet) {
        return res.status(400).json({
          message: "Conditions not met for this booking",
          conditions: rule.conditions,
        });
      }

      // Execute actions
      const results = await AutoRescheduleService.executeActions(
        booking,
        rule.actions,
        req.user.id
      );

      // Update rule statistics
      rule.stats.totalExecutions += 1;
      rule.stats.lastExecuted = new Date();
      rule.stats.successfulActions += results.filter((r) => r.success).length;
      rule.stats.failedActions += results.filter((r) => !r.success).length;

      await rule.save();

      res.json({
        message: "Rule executed successfully",
        results,
        updatedStats: rule.stats,
      });
    } catch (error) {
      console.error("Error executing auto-reschedule rule:", error);
      res
        .status(500)
        .json({ message: "Failed to execute auto-reschedule rule" });
    }
  }
);

// GET /api/auto-reschedule/:id/stats - Get rule statistics
router.get("/:id/stats", async (req, res) => {
  try {
    const rule = await AutoReschedule.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!rule) {
      return res
        .status(404)
        .json({ message: "Auto-reschedule rule not found" });
    }

    res.json({
      stats: rule.stats,
      ruleName: rule.name,
      isActive: rule.isActive,
    });
  } catch (error) {
    console.error("Error fetching auto-reschedule stats:", error);
    res.status(500).json({ message: "Failed to fetch auto-reschedule stats" });
  }
});

module.exports = router;
