const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    start: {
      type: Date,
      required: [true, "Start time is required"],
    },
    end: {
      type: Date,
      required: [true, "End time is required"],
    },
    type: {
      type: String,
      enum: ["meeting", "presentation", "review", "task", "reminder", "other"],
      default: "meeting",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    attendees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "declined", "tentative"],
          default: "pending",
        },
        responseTime: Date,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, "Location cannot be more than 200 characters"],
    },
    isVirtual: {
      type: Boolean,
      default: false,
    },
    meetingUrl: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    recurrence: {
      pattern: {
        type: String,
        enum: ["none", "daily", "weekly", "monthly", "yearly"],
        default: "none",
      },
      interval: {
        type: Number,
        default: 1,
      },
      endDate: Date,
      occurrences: Number,
    },
    reminders: [
      {
        type: {
          type: String,
          enum: ["email", "push", "sms"],
          required: true,
        },
        time: {
          type: Number, // minutes before event
          required: true,
        },
        sent: {
          type: Boolean,
          default: false,
        },
      },
    ],
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes cannot be more than 2000 characters"],
    },
    attachments: [
      {
        name: String,
        url: String,
        size: Number,
        type: String,
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for event duration in minutes
eventSchema.virtual("duration").get(function () {
  return Math.round((this.end - this.start) / (1000 * 60));
});

// Virtual for event status
eventSchema.virtual("isUpcoming").get(function () {
  return this.start > new Date() && this.status !== "cancelled";
});

// Virtual for event status
eventSchema.virtual("isPast").get(function () {
  return this.end < new Date();
});

// Virtual for event status
eventSchema.virtual("isOngoing").get(function () {
  const now = new Date();
  return this.start <= now && this.end >= now && this.status === "confirmed";
});

// Indexes for better query performance
eventSchema.index({ start: 1 });
eventSchema.index({ end: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ "attendees.user": 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ isPrivate: 1 });

// Pre-save middleware to validate end time
eventSchema.pre("save", function (next) {
  if (this.end <= this.start) {
    return next(new Error("End time must be after start time"));
  }
  next();
});

// Method to add attendee
eventSchema.methods.addAttendee = function (userId) {
  const existingAttendee = this.attendees.find(
    (a) => a.user.toString() === userId.toString()
  );
  if (!existingAttendee) {
    this.attendees.push({ user: userId });
  }
  return this.save();
};

// Method to remove attendee
eventSchema.methods.removeAttendee = function (userId) {
  this.attendees = this.attendees.filter(
    (a) => a.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to update attendee status
eventSchema.methods.updateAttendeeStatus = function (userId, status) {
  const attendee = this.attendees.find(
    (a) => a.user.toString() === userId.toString()
  );
  if (attendee) {
    attendee.status = status;
    attendee.responseTime = new Date();
  }
  return this.save();
};

// Method to confirm event
eventSchema.methods.confirm = function () {
  this.status = "confirmed";
  return this.save();
};

// Method to cancel event
eventSchema.methods.cancel = function () {
  this.status = "cancelled";
  return this.save();
};

// Method to complete event
eventSchema.methods.complete = function () {
  this.status = "completed";
  return this.save();
};

// Static method to find events by date range
eventSchema.statics.findByDateRange = function (start, end, userId = null) {
  const query = {
    start: { $gte: start },
    end: { $lte: end },
  };

  if (userId) {
    query.$or = [{ createdBy: userId }, { "attendees.user": userId }];
  }

  return this.find(query)
    .populate("createdBy", "name email avatar")
    .populate("attendees.user", "name email avatar")
    .sort({ start: 1 });
};

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function (userId, limit = 10) {
  return this.find({
    $and: [
      { start: { $gt: new Date() } },
      { status: { $ne: "cancelled" } },
      {
        $or: [{ createdBy: userId }, { "attendees.user": userId }],
      },
    ],
  })
    .populate("createdBy", "name email avatar")
    .populate("attendees.user", "name email avatar")
    .sort({ start: 1 })
    .limit(limit);
};

// Static method to find events by user
eventSchema.statics.findByUser = function (userId) {
  return this.find({
    $or: [{ createdBy: userId }, { "attendees.user": userId }],
  })
    .populate("createdBy", "name email avatar")
    .populate("attendees.user", "name email avatar")
    .sort({ start: -1 });
};

// Static method to search events
eventSchema.statics.search = function (query, userId = null) {
  const searchQuery = {
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { tags: { $in: [new RegExp(query, "i")] } },
    ],
  };

  if (userId) {
    searchQuery.$and = [
      searchQuery,
      {
        $or: [
          { createdBy: userId },
          { "attendees.user": userId },
          { isPrivate: false },
        ],
      },
    ];
  }

  return this.find(searchQuery)
    .populate("createdBy", "name email avatar")
    .populate("attendees.user", "name email avatar")
    .sort({ start: -1 });
};

module.exports = mongoose.model("Event", eventSchema);
