const mongoose = require("mongoose");

const WorkingHourSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },
    startTime: { type: String, required: true }, // e.g. '09:00'
    endTime: { type: String, required: true }, // e.g. '17:00'
  },
  { _id: false }
);

const AvailabilitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    workingHours: [WorkingHourSchema],
    bufferBefore: { type: Number, default: 0 }, // minutes
    bufferAfter: { type: Number, default: 0 }, // minutes
    holidays: [{ type: Date }],
    timezone: { type: String, default: "UTC" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Availability", AvailabilitySchema);
