const mongoose = require("mongoose");

const SurveyQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["rating", "text", "multiple_choice", "yes_no", "scale"],
      required: true,
    },
    options: [
      {
        label: String,
        value: String,
      },
    ],
    required: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    // For rating questions
    maxRating: {
      type: Number,
      default: 5,
    },
    // For scale questions
    scaleLabels: {
      min: String,
      max: String,
    },
  },
  { _id: false }
);

const SurveySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    questions: [SurveyQuestionSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    // Survey triggers
    triggers: {
      sendAfterMeeting: {
        type: Boolean,
        default: true,
      },
      sendAfterHours: {
        type: Number,
        default: 1, // Send 1 hour after meeting
      },
      sendReminders: {
        type: Boolean,
        default: true,
      },
      maxReminders: {
        type: Number,
        default: 2,
      },
    },
    // Survey settings
    settings: {
      allowAnonymous: {
        type: Boolean,
        default: false,
      },
      showProgress: {
        type: Boolean,
        default: true,
      },
      allowPartial: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Survey", SurveySchema);
