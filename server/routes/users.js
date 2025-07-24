const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const router = express.Router();

// GET /api/users/profile - Get user profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/profile - Update user profile
router.put(
  "/profile",
  protect,
  [body("name").notEmpty().withMessage("Name is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, avatar } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { name, avatar },
        { new: true }
      ).select("-password");
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/users/meeting-preferences - Get meeting preferences
router.get("/meeting-preferences", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "defaultMeetingType customMeetingUrl meetingSettings"
    );
    res.json({
      defaultMeetingType: user.defaultMeetingType || "google-meet",
      customMeetingUrl: user.customMeetingUrl || "",
      autoGenerateLinks: user.meetingSettings?.autoGenerateLinks ?? true,
      includePassword: user.meetingSettings?.includePassword ?? true,
      defaultDuration: user.meetingSettings?.defaultDuration ?? 30,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/meeting-preferences - Update meeting preferences
router.put("/meeting-preferences", protect, async (req, res) => {
  try {
    const {
      defaultMeetingType,
      customMeetingUrl,
      autoGenerateLinks,
      includePassword,
      defaultDuration,
    } = req.body;

    const updateData = {
      defaultMeetingType: defaultMeetingType || "google-meet",
      customMeetingUrl: customMeetingUrl || "",
      meetingSettings: {
        autoGenerateLinks: autoGenerateLinks ?? true,
        includePassword: includePassword ?? true,
        defaultDuration: defaultDuration ?? 30,
      },
    };

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    }).select("-password");

    res.json({
      defaultMeetingType: user.defaultMeetingType,
      customMeetingUrl: user.customMeetingUrl,
      autoGenerateLinks: user.meetingSettings.autoGenerateLinks,
      includePassword: user.meetingSettings.includePassword,
      defaultDuration: user.meetingSettings.defaultDuration,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/reminder-preferences - Get reminder preferences
router.get("/reminder-preferences", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "reminderPreferences"
    );
    res.json({
      email15min: user.reminderPreferences?.email15min ?? true,
      email1hour: user.reminderPreferences?.email1hour ?? true,
      email1day: user.reminderPreferences?.email1day ?? false,
      email1week: user.reminderPreferences?.email1week ?? false,
      sms15min: user.reminderPreferences?.sms15min ?? false,
      sms1hour: user.reminderPreferences?.sms1hour ?? false,
      whatsapp15min: user.reminderPreferences?.whatsapp15min ?? false,
      whatsapp1hour: user.reminderPreferences?.whatsapp1hour ?? false,
      enableSMS: user.reminderPreferences?.enableSMS ?? false,
      enableWhatsApp: user.reminderPreferences?.enableWhatsApp ?? false,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/reminder-preferences - Update reminder preferences
router.put("/reminder-preferences", protect, async (req, res) => {
  try {
    const {
      email15min,
      email1hour,
      email1day,
      email1week,
      sms15min,
      sms1hour,
      whatsapp15min,
      whatsapp1hour,
      enableSMS,
      enableWhatsApp,
    } = req.body;

    const updateData = {
      reminderPreferences: {
        email15min: email15min ?? true,
        email1hour: email1hour ?? true,
        email1day: email1day ?? false,
        email1week: email1week ?? false,
        sms15min: sms15min ?? false,
        sms1hour: sms1hour ?? false,
        whatsapp15min: whatsapp15min ?? false,
        whatsapp1hour: whatsapp1hour ?? false,
        enableSMS: enableSMS ?? false,
        enableWhatsApp: enableWhatsApp ?? false,
      },
    };

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    }).select("-password");

    res.json({
      email15min: user.reminderPreferences.email15min,
      email1hour: user.reminderPreferences.email1hour,
      email1day: user.reminderPreferences.email1day,
      email1week: user.reminderPreferences.email1week,
      sms15min: user.reminderPreferences.sms15min,
      sms1hour: user.reminderPreferences.sms1hour,
      whatsapp15min: user.reminderPreferences.whatsapp15min,
      whatsapp1hour: user.reminderPreferences.whatsapp1hour,
      enableSMS: user.reminderPreferences.enableSMS,
      enableWhatsApp: user.reminderPreferences.enableWhatsApp,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
