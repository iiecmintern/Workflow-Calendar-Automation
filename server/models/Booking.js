const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    // Guest information for public bookings
    guestName: { type: String, trim: true },
    guestEmail: { type: String, trim: true },
    guestPhone: { type: String, trim: true }, // For SMS/WhatsApp reminders
    bookingPage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookingPage",
    },
    // Meeting link information
    meetingType: {
      type: String,
      enum: ["zoom", "google-meet", "teams", "custom"],
      default: "google-meet",
    },
    meetingLink: { type: String, trim: true },
    meetingPassword: { type: String, trim: true },
    meetingInstructions: { type: String, trim: true },
    // Reminder settings
    reminderSettings: {
      email15min: { type: Boolean, default: true },
      email1hour: { type: Boolean, default: true },
      email1day: { type: Boolean, default: false },
      email1week: { type: Boolean, default: false },
      sms15min: { type: Boolean, default: false },
      sms1hour: { type: Boolean, default: false },
      whatsapp15min: { type: Boolean, default: false },
      whatsapp1hour: { type: Boolean, default: false },
      call15min: { type: Boolean, default: false },
      call1hour: { type: Boolean, default: false },
    },
    // Reminder history
    reminderHistory: [
      {
        type: { type: String, enum: ["15min", "1hour", "1day", "1week"] },
        status: { type: String, enum: ["scheduled", "sent", "failed"] },
        sentAt: { type: Date },
        channel: { type: String, enum: ["email", "sms", "whatsapp", "call"] },
      },
    ],
    // Form responses
    preBookingFormResponse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormResponse",
    },
    postBookingFormResponse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormResponse",
    },
    // Survey and feedback
    survey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
    },
    surveyResponse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SurveyResponse",
    },
    // Feedback summary
    feedback: {
      overallRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      sentiment: {
        type: String,
        enum: ["positive", "neutral", "negative"],
      },
      comments: {
        type: String,
        trim: true,
      },
      submittedAt: {
        type: Date,
      },
    },
    // Auto-reschedule settings
    autoReschedule: {
      enabled: {
        type: Boolean,
        default: false,
      },
      conditions: [
        {
          type: {
            type: String,
            enum: [
              "rating_below",
              "sentiment_negative",
              "no_show",
              "cancelled",
            ],
          },
          value: mongoose.Schema.Types.Mixed, // threshold value
          action: {
            type: String,
            enum: ["reschedule", "follow_up", "refund", "compensation"],
          },
        },
      ],
    },
    // For future: type, participants, location, etc.
  },
  { timestamps: true }
);

// Pre-save hook to prevent overlapping bookings
BookingSchema.pre("save", async function (next) {
  if (!this.isModified("start") && !this.isModified("end")) {
    return next();
  }
  const Booking = this.constructor;
  const overlapping = await Booking.findOne({
    bookingPage: this.bookingPage,
    _id: { $ne: this._id },
    $or: [{ start: { $lt: this.end }, end: { $gt: this.start } }],
  });
  if (overlapping) {
    return next(new Error("Booking time overlaps with an existing booking."));
  }
  next();
});

module.exports = mongoose.model("Booking", BookingSchema);
