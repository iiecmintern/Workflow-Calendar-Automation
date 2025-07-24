const mongoose = require("mongoose");

const MeetingTypeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["1-on-1", "group", "panel", "round-robin"],
      required: true,
    },
    label: { type: String, required: true },
    duration: { type: Number, default: 30 }, // minutes
    maxParticipants: { type: Number, default: 1 },
    roundRobin: { type: Boolean, default: false },
    // Add more fields as needed
  },
  { _id: false }
);

const BookingPageSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    logo: { type: String, default: "" }, // URL or file path
    color: { type: String, default: "#2563eb" }, // Brand color
    meetingTypes: { type: [MeetingTypeSchema], default: [] },
    settings: {
      buffer: { type: Number, default: 0 },
      allowGuests: { type: Boolean, default: true },
      // Add more settings as needed
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BookingPage", BookingPageSchema);
