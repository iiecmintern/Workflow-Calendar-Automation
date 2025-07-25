const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    avatar: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["online", "away", "offline"],
      default: "offline",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      timezone: {
        type: String,
        default: "UTC",
      },
      language: {
        type: String,
        default: "en",
      },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    googleTokens: { type: Object, default: null },
    googleCalendarConnected: { type: Boolean, default: false },
    googleCalendarConnectedAt: { type: Date, default: null },
    // Outlook Calendar integration
    outlookTokens: { type: Object, default: null },
    outlookCalendarConnected: { type: Boolean, default: false },
    outlookCalendarConnectedAt: { type: Date, default: null },
    // Zoho Calendar integration
    zohoTokens: { type: Object, default: null },
    zohoCalendarConnected: { type: Boolean, default: false },
    zohoCalendarConnectedAt: { type: Date, default: null },
    // Meeting preferences
    defaultMeetingType: {
      type: String,
      enum: ["google-meet", "zoom", "teams", "custom"],
      default: "google-meet",
    },
    customMeetingUrl: { type: String, trim: true },
    meetingSettings: {
      autoGenerateLinks: { type: Boolean, default: true },
      includePassword: { type: Boolean, default: true },
      defaultDuration: { type: Number, default: 30 }, // minutes
    },
    // Reminder preferences
    reminderPreferences: {
      email15min: { type: Boolean, default: true },
      email1hour: { type: Boolean, default: true },
      email1day: { type: Boolean, default: false },
      email1week: { type: Boolean, default: false },
      sms15min: { type: Boolean, default: false },
      sms1hour: { type: Boolean, default: false },
      whatsapp15min: { type: Boolean, default: false },
      whatsapp1hour: { type: Boolean, default: false },
      enableSMS: { type: Boolean, default: false },
      enableWhatsApp: { type: Boolean, default: false },
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for user's full profile (without sensitive data)
userSchema.virtual("profile").get(function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    status: this.status,
    isActive: this.isActive,
    lastActive: this.lastActive,
    preferences: this.preferences,
    emailVerified: this.emailVerified,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last active
userSchema.methods.updateLastActive = function () {
  this.lastActive = new Date();
  return this.save();
};

// Static method to find users by role
userSchema.statics.findByRole = function (role) {
  return this.find({ role, isActive: true });
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// Static method to search users
userSchema.statics.search = function (query) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      },
    ],
  }).select("-password");
};

module.exports = mongoose.model("User", userSchema);
