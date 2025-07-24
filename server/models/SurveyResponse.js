const mongoose = require("mongoose");

const SurveyResponseSchema = new mongoose.Schema(
  {
    survey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    respondent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // For anonymous responses
    respondentEmail: {
      type: String,
      trim: true,
    },
    respondentName: {
      type: String,
      trim: true,
    },
    responses: [
      {
        questionIndex: {
          type: Number,
          required: true,
        },
        question: {
          type: String,
          required: true,
        },
        questionType: {
          type: String,
          required: true,
        },
        answer: mongoose.Schema.Types.Mixed, // Can be string, number, array, etc.
        answeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Survey completion status
    status: {
      type: String,
      enum: ["started", "completed", "abandoned"],
      default: "started",
    },
    // Timing information
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    // Survey session info
    sessionId: {
      type: String,
      trim: true,
    },
    // Analytics
    timeSpent: {
      type: Number, // in seconds
    },
    // Feedback analysis
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
SurveyResponseSchema.index({ survey: 1, booking: 1 });
SurveyResponseSchema.index({ respondent: 1, createdAt: -1 });
SurveyResponseSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("SurveyResponse", SurveyResponseSchema);
