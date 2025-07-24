const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [{ type: mongoose.Schema.Types.Mixed }], // { user: ObjectId, email: String, name: String }
    type: {
      type: String,
      enum: ["one-on-one", "group", "panel", "round-robin"],
      default: "one-on-one",
    },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "missed"],
      default: "scheduled",
    },
    meetingLink: { type: String, default: "" },
    videoProvider: {
      type: String,
      enum: ["zoom", "meet", "teams", "none"],
      default: "none",
    },
    timezone: { type: String, default: "UTC" },
    reminders: [{ type: String, enum: ["email", "sms", "whatsapp"] }],
    formResponses: [{ field: String, value: mongoose.Schema.Types.Mixed }],
    documents: [{ url: String, name: String, uploadedBy: String }],
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String },
      survey: { type: mongoose.Schema.Types.Mixed },
    },
    tags: [{ type: String }],
    funnelStage: { type: String, default: "" },
    result: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", MeetingSchema);
