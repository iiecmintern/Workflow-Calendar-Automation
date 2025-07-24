const express = require("express");
const { google } = require("googleapis");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
require("dotenv").config();
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "profile",
  "email",
];

// GET /api/integrations/google/auth - Start OAuth flow
router.get("/google/auth", protect, (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: req.user._id.toString(),
  });
  res.redirect(url);
});

// GET /api/integrations/google/callback - OAuth callback
router.get("/google/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send("Missing code or state");
  try {
    const { tokens } = await oauth2Client.getToken(code);
    // Save tokens to user
    const user = await User.findById(state);
    if (!user) return res.status(404).send("User not found");
    user.googleTokens = tokens;
    await user.save();
    // Optionally, redirect to frontend with success message
    res.send("Google Calendar connected! You can close this window.");
  } catch (err) {
    res.status(500).send("Failed to connect Google Calendar");
  }
});

// DELETE /api/integrations/google/disconnect - Remove Google tokens from user profile
router.delete("/google/disconnect", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.googleTokens = null;
    await user.save();
    res.json({ message: "Google Calendar disconnected" });
  } catch (err) {
    res.status(500).json({ message: "Failed to disconnect Google Calendar" });
  }
});

module.exports = router;
