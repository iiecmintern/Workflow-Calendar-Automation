const mongoose = require("mongoose");

const ConditionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["rating_below", "sentiment_negative", "no_show", "cancelled", "feedback_missing"],
      required: true
    },
    value: mongoose.Schema.Types.Mixed, // threshold value (e.g., rating < 3)
    operator: {
      type: String,
      enum: ["less_than", "greater_than", "equals", "not_equals", "contains"],
      default: "less_than"
    }
  },
  { _id: false }
);

const ActionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["reschedule", "follow_up", "refund", "compensation", "escalate"],
      required: true
    },
    // For reschedule action
    rescheduleSettings: {
      findNextSlot: { type: Boolean, default: true },
      withinDays: { type: Number, default: 7 },
      preferredTimeSlots: [String], // e.g., ["09:00", "14:00"]
      avoidDays: [String], // e.g., ["Saturday", "Sunday"]
      bufferDays: { type: Number, default: 1 } // minimum days between meetings
    },
    // For follow-up action
    followUpSettings: {
      delayHours: { type: Number, default: 24 },
      message: { type: String, trim: true },
      includeSurvey: { type: Boolean, default: true }
    },
    // For compensation action
    compensationSettings: {
      type: {
        type: String,
        enum: ["discount", "credit", "refund", "free_session"],
        default: "discount"
      },
      value: { type: Number, default: 0 }, // percentage or amount
      message: { type: String, trim: true }
    },
    // For escalate action
    escalateSettings: {
      escalateTo: { type: String, trim: true }, // email or user ID
      priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium"
      },
      message: { type: String, trim: true }
    }
  },
  { _id: false }
);

const AutoRescheduleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Trigger conditions
    conditions: [ConditionSchema],
    // Actions to take
    actions: [ActionSchema],
    // Execution settings
    settings: {
      executeImmediately: { type: Boolean, default: false },
      executeAfterHours: { type: Number, default: 1 },
      maxExecutions: { type: Number, default: 1 }, // prevent infinite loops
      requireConfirmation: { type: Boolean, default: false }
    },
    // Statistics
    stats: {
      totalExecutions: { type: Number, default: 0 },
      successfulActions: { type: Number, default: 0 },
      failedActions: { type: Number, default: 0 },
      lastExecuted: { type: Date }
    },
    // Associated booking pages
    bookingPages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookingPage"
    }],
    // Associated surveys (for feedback-based triggers)
    surveys: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey"
    }]
  },
  { timestamps: true }
);

// Indexes for efficient queries
AutoRescheduleSchema.index({ owner: 1, isActive: 1 });
AutoRescheduleSchema.index({ "stats.lastExecuted": -1 });

module.exports = mongoose.model("AutoReschedule", AutoRescheduleSchema); 