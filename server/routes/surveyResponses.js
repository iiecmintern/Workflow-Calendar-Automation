const express = require("express");
const { body, validationResult } = require("express-validator");
const Survey = require("../models/Survey");
const SurveyResponse = require("../models/SurveyResponse");
const Booking = require("../models/Booking");
const router = express.Router();

// GET /api/survey-responses/:sessionId - Get survey for response
router.get("/:sessionId", async (req, res) => {
  try {
    const surveyResponse = await SurveyResponse.findOne({
      sessionId: req.params.sessionId,
      status: { $in: ["started", "completed"] },
    }).populate("survey");

    if (!surveyResponse || !surveyResponse.survey) {
      return res.status(404).json({ message: "Survey not found or expired" });
    }

    // Return survey data without sensitive information
    const survey = surveyResponse.survey;
    res.json({
      surveyId: survey._id,
      name: survey.name,
      description: survey.description,
      questions: survey.questions.sort((a, b) => a.order - b.order),
      settings: survey.settings,
      responseId: surveyResponse._id,
      sessionId: surveyResponse.sessionId,
      progress: surveyResponse.responses.length / survey.questions.length,
    });
  } catch (err) {
    console.error("Error fetching survey for response:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/survey-responses/:sessionId/answer - Submit survey answer
router.post(
  "/:sessionId/answer",
  [
    body("questionIndex")
      .isInt({ min: 0 })
      .withMessage("Valid question index is required"),
    body("answer").notEmpty().withMessage("Answer is required"),
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
      const { questionIndex, answer } = req.body;

      const surveyResponse = await SurveyResponse.findOne({
        sessionId: req.params.sessionId,
        status: { $in: ["started", "completed"] },
      }).populate("survey");

      if (!surveyResponse || !surveyResponse.survey) {
        return res.status(404).json({ message: "Survey not found or expired" });
      }

      const survey = surveyResponse.survey;
      const question = survey.questions[questionIndex];

      if (!question) {
        return res.status(400).json({ message: "Invalid question index" });
      }

      // Validate answer based on question type
      let validatedAnswer = answer;
      switch (question.type) {
        case "rating":
          const rating = parseInt(answer);
          if (isNaN(rating) || rating < 1 || rating > question.maxRating) {
            return res.status(400).json({
              message: `Rating must be between 1 and ${question.maxRating}`,
            });
          }
          validatedAnswer = rating;
          break;
        case "yes_no":
          if (!["yes", "no"].includes(answer.toLowerCase())) {
            return res
              .status(400)
              .json({ message: "Answer must be 'yes' or 'no'" });
          }
          validatedAnswer = answer.toLowerCase();
          break;
        case "multiple_choice":
          const validOptions = question.options.map((opt) => opt.value);
          if (!validOptions.includes(answer)) {
            return res.status(400).json({ message: "Invalid option selected" });
          }
          break;
        case "scale":
          const scale = parseInt(answer);
          if (isNaN(scale) || scale < 1 || scale > 10) {
            return res
              .status(400)
              .json({ message: "Scale must be between 1 and 10" });
          }
          validatedAnswer = scale;
          break;
      }

      // Update or add response
      const existingResponseIndex = surveyResponse.responses.findIndex(
        (r) => r.questionIndex === questionIndex
      );

      if (existingResponseIndex >= 0) {
        surveyResponse.responses[existingResponseIndex].answer =
          validatedAnswer;
        surveyResponse.responses[existingResponseIndex].answeredAt = new Date();
      } else {
        surveyResponse.responses.push({
          questionIndex,
          question: question.question,
          questionType: question.type,
          answer: validatedAnswer,
          answeredAt: new Date(),
        });
      }

      // Check if survey is completed
      const totalQuestions = survey.questions.length;
      const answeredQuestions = surveyResponse.responses.length;

      if (answeredQuestions >= totalQuestions) {
        surveyResponse.status = "completed";
        surveyResponse.completedAt = new Date();

        // Calculate overall rating and sentiment
        const ratingQuestions = surveyResponse.responses.filter(
          (r) => r.questionType === "rating"
        );
        if (ratingQuestions.length > 0) {
          const averageRating =
            ratingQuestions.reduce((sum, r) => sum + r.answer, 0) /
            ratingQuestions.length;
          surveyResponse.overallRating = Math.round(averageRating * 10) / 10;

          // Simple sentiment analysis based on rating
          if (averageRating >= 4) {
            surveyResponse.sentiment = "positive";
          } else if (averageRating >= 3) {
            surveyResponse.sentiment = "neutral";
          } else {
            surveyResponse.sentiment = "negative";
          }
        }

        // Update booking with feedback
        if (surveyResponse.booking) {
          const booking = await Booking.findById(surveyResponse.booking);
          if (booking) {
            booking.feedback = {
              overallRating: surveyResponse.overallRating,
              sentiment: surveyResponse.sentiment,
              comments:
                surveyResponse.responses.find((r) => r.questionType === "text")
                  ?.answer || "",
              submittedAt: new Date(),
            };
            booking.surveyResponse = surveyResponse._id;
            await booking.save();
          }
        }
      }

      await surveyResponse.save();

      res.json({
        message: "Answer submitted successfully",
        progress: answeredQuestions / totalQuestions,
        completed: surveyResponse.status === "completed",
      });
    } catch (err) {
      console.error("Error submitting survey answer:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// POST /api/survey-responses/:sessionId/complete - Complete survey
router.post("/:sessionId/complete", async (req, res) => {
  try {
    const surveyResponse = await SurveyResponse.findOne({
      sessionId: req.params.sessionId,
      status: "started",
    }).populate("survey");

    if (!surveyResponse || !surveyResponse.survey) {
      return res
        .status(404)
        .json({ message: "Survey not found or already completed" });
    }

    const survey = surveyResponse.survey;
    const totalQuestions = survey.questions.length;
    const answeredQuestions = surveyResponse.responses.length;

    // Check if all required questions are answered
    const requiredQuestions = survey.questions.filter((q) => q.required);
    const answeredRequiredQuestions = surveyResponse.responses.filter((r) => {
      const question = survey.questions[r.questionIndex];
      return question && question.required;
    });

    if (answeredRequiredQuestions.length < requiredQuestions.length) {
      return res.status(400).json({
        message:
          "Please answer all required questions before completing the survey",
      });
    }

    surveyResponse.status = "completed";
    surveyResponse.completedAt = new Date();

    // Calculate analytics
    const ratingQuestions = surveyResponse.responses.filter(
      (r) => r.questionType === "rating"
    );
    if (ratingQuestions.length > 0) {
      const averageRating =
        ratingQuestions.reduce((sum, r) => sum + r.answer, 0) /
        ratingQuestions.length;
      surveyResponse.overallRating = Math.round(averageRating * 10) / 10;

      if (averageRating >= 4) {
        surveyResponse.sentiment = "positive";
      } else if (averageRating >= 3) {
        surveyResponse.sentiment = "neutral";
      } else {
        surveyResponse.sentiment = "negative";
      }
    }

    await surveyResponse.save();

    // Update booking with feedback
    if (surveyResponse.booking) {
      const booking = await Booking.findById(surveyResponse.booking);
      if (booking) {
        booking.feedback = {
          overallRating: surveyResponse.overallRating,
          sentiment: surveyResponse.sentiment,
          comments:
            surveyResponse.responses.find((r) => r.questionType === "text")
              ?.answer || "",
          submittedAt: new Date(),
        };
        booking.surveyResponse = surveyResponse._id;
        await booking.save();
      }
    }

    res.json({
      message: "Survey completed successfully",
      overallRating: surveyResponse.overallRating,
      sentiment: surveyResponse.sentiment,
    });
  } catch (err) {
    console.error("Error completing survey:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
