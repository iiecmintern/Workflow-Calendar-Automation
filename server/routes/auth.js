const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
require("dotenv").config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Explicitly select password for authentication
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
        isActive: user.isActive,
        preferences: user.preferences,
        lastActive: user.lastActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        googleCalendarConnected: user.googleCalendarConnected,
        defaultMeetingType: user.defaultMeetingType,
        meetingSettings: user.meetingSettings,
        customMeetingUrl: user.customMeetingUrl,
        reminderPreferences: user.reminderPreferences,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// Google OAuth
router.post("/google", async (req, res) => {
  try {
    const { tokenId } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenId,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub } = payload;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, password: sub });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(400).json({ message: "Google authentication failed." });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "No token provided." });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user }); // wrap in { user: ... }
  } catch (err) {
    res.status(401).json({ message: "Invalid token." });
  }
});

module.exports = router;
