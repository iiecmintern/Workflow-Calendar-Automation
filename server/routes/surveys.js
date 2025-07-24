const express = require("express");
const { body, validationResult } = require("express-validator");
const Survey = require("../models/Survey");
const SurveyResponse = require("../models/SurveyResponse");
const Booking = require("../models/Booking");
const { protect } = require("../middleware/auth");
const { sendSurveyInvitation } = require("../services/emailService");
const router = express.Router();

// GET /api/surveys - Get all surveys for the authenticated user
router.get("/", protect, async (req, res) => {
  try {
    const surveys = await Survey.find({ owner: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(surveys);
  } catch (err) {
    console.error("Error fetching surveys:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/surveys/:id - Get survey by ID
router.get("/:id", protect, async (req, res) => {
  try {
    const survey = await Survey.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    res.json(survey);
  } catch (err) {
    console.error("Error fetching survey:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/surveys - Create new survey
router.post(
  "/",
  protect,
  [
    body("name").notEmpty().withMessage("Survey name is required"),
    body("questions")
      .isArray({ min: 1 })
      .withMessage("At least one question is required"),
    body("questions.*.question")
      .notEmpty()
      .withMessage("Question text is required"),
    body("questions.*.type")
      .isIn(["rating", "text", "multiple_choice", "yes_no", "scale"])
      .withMessage("Invalid question type"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const { name, description, questions, triggers, settings } = req.body;

      // Add order to questions if not provided
      const orderedQuestions = questions.map((q, index) => ({
        ...q,
        order: q.order || index,
      }));

      const survey = await Survey.create({
        owner: req.user._id,
        name,
        description,
        questions: orderedQuestions,
        triggers: triggers || {},
        settings: settings || {},
      });

      res.status(201).json(survey);
    } catch (err) {
      console.error("Error creating survey:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// PUT /api/surveys/:id - Update survey
router.put("/:id", protect, async (req, res) => {
  try {
    const survey = await Survey.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    const { name, description, questions, triggers, settings, isActive } =
      req.body;

    if (name !== undefined) survey.name = name;
    if (description !== undefined) survey.description = description;
    if (questions !== undefined) {
      survey.questions = questions.map((q, index) => ({
        ...q,
        order: q.order || index,
      }));
    }
    if (triggers !== undefined)
      survey.triggers = { ...survey.triggers, ...triggers };
    if (settings !== undefined)
      survey.settings = { ...survey.settings, ...settings };
    if (isActive !== undefined) survey.isActive = isActive;

    await survey.save();
    res.json(survey);
  } catch (err) {
    console.error("Error updating survey:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /api/surveys/:id - Delete survey
router.delete("/:id", protect, async (req, res) => {
  try {
    const survey = await Survey.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    // Also delete associated responses
    await SurveyResponse.deleteMany({ survey: req.params.id });

    res.json({ message: "Survey deleted successfully" });
  } catch (err) {
    console.error("Error deleting survey:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/surveys/:id/responses - Get survey responses
router.get("/:id/responses", protect, async (req, res) => {
  try {
    const survey = await Survey.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    const responses = await SurveyResponse.find({ survey: req.params.id })
      .populate("booking", "title start end guestName guestEmail")
      .sort({ createdAt: -1 });

    res.json(responses);
  } catch (err) {
    console.error("Error fetching survey responses:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/surveys/:id/analytics - Get survey analytics
router.get("/:id/analytics", protect, async (req, res) => {
  try {
    const survey = await Survey.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    const responses = await SurveyResponse.find({
      survey: req.params.id,
      status: "completed",
    });

    // Calculate analytics
    const totalResponses = responses.length;
    const completionRate =
      totalResponses > 0
        ? (responses.filter((r) => r.status === "completed").length /
            totalResponses) *
          100
        : 0;

    // Average rating
    const ratings = responses
      .filter((r) => r.overallRating)
      .map((r) => r.overallRating);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0;

    // Sentiment analysis
    const sentimentCounts = responses.reduce((acc, r) => {
      if (r.sentiment) {
        acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
      }
      return acc;
    }, {});

    // Question-wise analytics
    const questionAnalytics = survey.questions.map((question, index) => {
      const questionResponses = responses
        .filter((r) => r.responses.some((resp) => resp.questionIndex === index))
        .map((r) => r.responses.find((resp) => resp.questionIndex === index));

      let analytics = {
        question: question.question,
        type: question.type,
        responseCount: questionResponses.length,
      };

      if (question.type === "rating") {
        const ratings = questionResponses
          .filter((r) => typeof r.answer === "number")
          .map((r) => r.answer);
        analytics.averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0;
      } else if (question.type === "multiple_choice") {
        const answerCounts = questionResponses.reduce((acc, r) => {
          if (r.answer) {
            acc[r.answer] = (acc[r.answer] || 0) + 1;
          }
          return acc;
        }, {});
        analytics.answerDistribution = answerCounts;
      }

      return analytics;
    });

    res.json({
      totalResponses,
      completionRate,
      averageRating,
      sentimentCounts,
      questionAnalytics,
      recentResponses: responses.slice(0, 10), // Last 10 responses
    });
  } catch (err) {
    console.error("Error fetching survey analytics:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/surveys/:id/send - Send survey to booking participants
router.post("/:id/send", protect, async (req, res) => {
  try {
    const { bookingId, recipientEmail, recipientName } = req.body;

    const survey = await Survey.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      owner: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Create survey response record
    const surveyResponse = await SurveyResponse.create({
      survey: survey._id,
      booking: booking._id,
      respondentEmail: recipientEmail,
      respondentName: recipientName,
      sessionId: `survey_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    });

    // Send survey invitation email
    await sendSurveyInvitation(
      survey,
      booking,
      recipientEmail,
      recipientName,
      surveyResponse._id
    );

    // Update booking with survey reference
    booking.survey = survey._id;
    await booking.save();

    res.json({
      message: "Survey sent successfully",
      surveyResponseId: surveyResponse._id,
    });
  } catch (err) {
    console.error("Error sending survey:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
