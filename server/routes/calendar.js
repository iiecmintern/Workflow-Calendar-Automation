const express = require("express");
const { body, validationResult } = require("express-validator");
const Availability = require("../models/Availability");
const Booking = require("../models/Booking");
const { protect } = require("../middleware/auth");
const { google } = require("googleapis");
const axios = require("axios");
const router = express.Router();

// Google OAuth configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${
    process.env.SERVER_URL || "http://localhost:5000"
  }/api/calendar/google/callback`
);

// ---------------- OUTLOOK CALENDAR ----------------
const OUTLOOK_CLIENT_ID = process.env.OUTLOOK_CLIENT_ID;
const OUTLOOK_CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET;
const OUTLOOK_REDIRECT_URI = `${
  process.env.SERVER_URL || "http://localhost:5000"
}/api/calendar/outlook/callback`;
const OUTLOOK_SCOPES = [
  "openid",
  "profile",
  "offline_access",
  "https://graph.microsoft.com/Calendars.ReadWrite",
];

// GET /api/calendar/google/auth - Start Google OAuth flow
router.get("/google/auth", protect, (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    state: req.user._id.toString(), // Pass user ID as state
  });

  res.json({ authUrl });
});

// GET /api/calendar/google/callback - Handle OAuth callback
router.get("/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.redirect(
        `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/profile?error=no_code`
      );
    }

    if (!state) {
      return res.redirect(
        `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/profile?error=no_state`
      );
    }

    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in user document using the state parameter as user ID
    await User.findByIdAndUpdate(state, {
      googleTokens: tokens,
      googleCalendarConnected: true,
      googleCalendarConnectedAt: new Date(),
    });

    res.redirect(
      `${
        process.env.CLIENT_URL || "http://localhost:3000"
      }/profile?success=connected`
    );
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.redirect(
      `${
        process.env.CLIENT_URL || "http://localhost:3000"
      }/profile?error=oauth_failed`
    );
  }
});

// GET /api/calendar/google/status - Check connection status
router.get("/google/status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      connected: user.googleCalendarConnected || false,
      connectedAt: user.googleCalendarConnectedAt,
    });
  } catch (error) {
    console.error("Google status error:", error);
    res.status(500).json({ message: "Failed to check Google Calendar status" });
  }
});

// POST /api/calendar/google/disconnect - Disconnect Google Calendar
router.post("/google/disconnect", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      googleTokens: null,
      googleCalendarConnected: false,
      googleCalendarConnectedAt: null,
    });

    res.json({ message: "Google Calendar disconnected successfully" });
  } catch (error) {
    console.error("Google disconnect error:", error);
    res.status(500).json({ message: "Failed to disconnect Google Calendar" });
  }
});

// GET /api/calendar/google/events - Fetch Google Calendar events
router.get("/google/events", protect, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user._id);

    if (!user.googleCalendarConnected || !user.googleTokens) {
      return res.status(400).json({ message: "Google Calendar not connected" });
    }

    oauth2Client.setCredentials(user.googleTokens);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const { timeMin, timeMax } = req.query;
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin || new Date().toISOString(),
      timeMax:
        timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json(response.data.items || []);
  } catch (error) {
    console.error("Google Calendar API error:", error);
    res.status(500).json({ message: "Failed to fetch Google Calendar events" });
  }
});

// POST /api/calendar/google/sync - Sync local bookings to Google Calendar
router.post("/google/sync", protect, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user._id);

    if (!user.googleCalendarConnected || !user.googleTokens) {
      return res.status(400).json({ message: "Google Calendar not connected" });
    }

    oauth2Client.setCredentials(user.googleTokens);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Get local bookings
    const bookings = await Booking.find({ owner: req.user._id });

    let syncedCount = 0;
    for (const booking of bookings) {
      try {
        await calendar.events.insert({
          calendarId: "primary",
          resource: {
            summary: booking.title,
            start: {
              dateTime: booking.start.toISOString(),
              timeZone: "UTC",
            },
            end: {
              dateTime: booking.end.toISOString(),
              timeZone: "UTC",
            },
          },
        });
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync booking ${booking._id}:`, error);
      }
    }

    res.json({ message: `Synced ${syncedCount} bookings to Google Calendar` });
  } catch (error) {
    console.error("Google Calendar sync error:", error);
    res.status(500).json({ message: "Failed to sync with Google Calendar" });
  }
});

// GET /api/calendar/outlook/auth - Start Outlook OAuth flow
router.get("/outlook/auth", protect, (req, res) => {
  const params = new URLSearchParams({
    client_id: OUTLOOK_CLIENT_ID,
    response_type: "code",
    redirect_uri: OUTLOOK_REDIRECT_URI,
    response_mode: "query",
    scope: OUTLOOK_SCOPES.join(" "),
    state: req.user._id.toString(),
  });
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  res.json({ authUrl });
});

// GET /api/calendar/outlook/callback - Handle Outlook OAuth callback
router.get("/outlook/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.redirect(
        `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/profile?error=outlook_oauth`
      );
    }
    // Exchange code for tokens
    const tokenRes = await axios.post(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      new URLSearchParams({
        client_id: OUTLOOK_CLIENT_ID,
        client_secret: OUTLOOK_CLIENT_SECRET,
        code,
        redirect_uri: OUTLOOK_REDIRECT_URI,
        grant_type: "authorization_code",
        scope: OUTLOOK_SCOPES.join(" "),
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    // Store tokens in user
    const User = require("../models/User");
    await User.findByIdAndUpdate(state, {
      outlookTokens: tokenRes.data,
      outlookCalendarConnected: true,
      outlookCalendarConnectedAt: new Date(),
    });
    res.redirect(
      `${
        process.env.CLIENT_URL || "http://localhost:3000"
      }/profile?success=outlook_connected`
    );
  } catch (error) {
    console.error("Outlook OAuth error:", error);
    res.redirect(
      `${
        process.env.CLIENT_URL || "http://localhost:3000"
      }/profile?error=outlook_oauth_failed`
    );
  }
});

// GET /api/calendar/outlook/status
router.get("/outlook/status", protect, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user._id);
    res.json({
      connected: user.outlookCalendarConnected || false,
      connectedAt: user.outlookCalendarConnectedAt,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to check Outlook Calendar status" });
  }
});

// POST /api/calendar/outlook/disconnect
router.post("/outlook/disconnect", protect, async (req, res) => {
  try {
    const User = require("../models/User");
    await User.findByIdAndUpdate(req.user._id, {
      $unset: {
        outlookTokens: 1,
        outlookCalendarConnected: 1,
        outlookCalendarConnectedAt: 1,
      },
    });
    res.json({ message: "Outlook Calendar disconnected successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to disconnect Outlook Calendar" });
  }
});

// GET /api/calendar/outlook/events
router.get("/outlook/events", protect, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user._id);
    if (!user.outlookTokens?.access_token) {
      return res.status(400).json({ message: "Outlook not connected" });
    }
    const eventsRes = await axios.get(
      "https://graph.microsoft.com/v1.0/me/events",
      {
        headers: { Authorization: `Bearer ${user.outlookTokens.access_token}` },
      }
    );
    res.json(eventsRes.data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch Outlook events" });
  }
});

// ---------------- ZOHO CALENDAR ----------------
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REDIRECT_URI = `${
  process.env.SERVER_URL || "http://localhost:5000"
}/api/calendar/zoho/callback`;
const ZOHO_SCOPES = ["ZohoCalendar.events.ALL"];

// GET /api/calendar/zoho/auth
router.get("/zoho/auth", protect, (req, res) => {
  const params = new URLSearchParams({
    client_id: ZOHO_CLIENT_ID,
    response_type: "code",
    redirect_uri: ZOHO_REDIRECT_URI,
    scope: ZOHO_SCOPES.join(","),
    access_type: "offline",
    prompt: "consent",
    state: req.user._id.toString(),
  });
  const authUrl = `https://accounts.zoho.com/oauth/v2/auth?${params.toString()}`;
  res.json({ authUrl });
});

// GET /api/calendar/zoho/callback
router.get("/zoho/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.redirect(
        `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/profile?error=zoho_oauth`
      );
    }
    // Exchange code for tokens
    const tokenRes = await axios.post(
      "https://accounts.zoho.com/oauth/v2/token",
      new URLSearchParams({
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        code,
        redirect_uri: ZOHO_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    // Store tokens in user
    const User = require("../models/User");
    await User.findByIdAndUpdate(state, {
      zohoTokens: tokenRes.data,
      zohoCalendarConnected: true,
      zohoCalendarConnectedAt: new Date(),
    });
    res.redirect(
      `${
        process.env.CLIENT_URL || "http://localhost:3000"
      }/profile?success=zoho_connected`
    );
  } catch (error) {
    console.error("Zoho OAuth error:", error);
    res.redirect(
      `${
        process.env.CLIENT_URL || "http://localhost:3000"
      }/profile?error=zoho_oauth_failed`
    );
  }
});

// GET /api/calendar/zoho/status
router.get("/zoho/status", protect, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user._id);
    res.json({
      connected: user.zohoCalendarConnected || false,
      connectedAt: user.zohoCalendarConnectedAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to check Zoho Calendar status" });
  }
});

// POST /api/calendar/zoho/disconnect
router.post("/zoho/disconnect", protect, async (req, res) => {
  try {
    const User = require("../models/User");
    await User.findByIdAndUpdate(req.user._id, {
      $unset: {
        zohoTokens: 1,
        zohoCalendarConnected: 1,
        zohoCalendarConnectedAt: 1,
      },
    });
    res.json({ message: "Zoho Calendar disconnected successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to disconnect Zoho Calendar" });
  }
});

// GET /api/calendar/zoho/events
router.get("/zoho/events", protect, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user._id);
    if (!user.zohoTokens?.access_token) {
      return res.status(400).json({ message: "Zoho not connected" });
    }
    const eventsRes = await axios.get(
      "https://calendar.zoho.com/api/v1/calendars",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${user.zohoTokens.access_token}`,
        },
      }
    );
    res.json(eventsRes.data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch Zoho events" });
  }
});

// GET /api/availability - Get current user's availability
router.get("/availability", protect, async (req, res) => {
  try {
    let availability = await Availability.findOne({ user: req.user._id });
    if (!availability) {
      // Return default structure if not set
      availability = {
        user: req.user._id,
        workingHours: [],
        bufferBefore: 0,
        bufferAfter: 0,
        holidays: [],
        timezone: "UTC",
      };
    }
    res.json(availability);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/availability - Set/update current user's availability
router.post("/availability", protect, async (req, res) => {
  try {
    const { workingHours, bufferBefore, bufferAfter, holidays, timezone } =
      req.body;
    let availability = await Availability.findOne({ user: req.user._id });
    if (!availability) {
      availability = new Availability({ user: req.user._id });
    }
    if (workingHours !== undefined) availability.workingHours = workingHours;
    if (bufferBefore !== undefined) availability.bufferBefore = bufferBefore;
    if (bufferAfter !== undefined) availability.bufferAfter = bufferAfter;
    if (holidays !== undefined) availability.holidays = holidays;
    if (timezone !== undefined) availability.timezone = timezone;
    await availability.save();
    res.json(availability);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/calendar/bookings?date=YYYY-MM-DD - Get bookings for a specific date
router.get("/bookings", protect, async (req, res) => {
  try {
    const { date } = req.query;
    let query = { owner: req.user._id };
    if (date) {
      const start = new Date(date + "T00:00:00.000Z");
      const end = new Date(date + "T23:59:59.999Z");
      query.start = { $lt: end };
      query.end = { $gt: start };
    }
    const bookings = await Booking.find(query).sort({ start: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/calendar/bookings - Create a booking (with conflict and availability enforcement)
router.post("/bookings", protect, async (req, res) => {
  try {
    const { title, start, end } = req.body;
    const owner = req.user._id;
    const startDate = new Date(start);
    const endDate = new Date(end);
    // Fetch user availability
    const availability = await Availability.findOne({ user: owner });
    if (availability) {
      // Check holiday
      const dateStr = startDate.toISOString().slice(0, 10);
      if (
        availability.holidays.some(
          (h) => h.toISOString().slice(0, 10) === dateStr
        )
      ) {
        return res.status(400).json({ message: "Cannot book on a holiday." });
      }
      // Check working hours for the day
      const dayOfWeek = startDate.toLocaleString("en-US", {
        weekday: "long",
        timeZone: availability.timezone || "UTC",
      });
      const slot = availability.workingHours.find(
        (s) => s.dayOfWeek === dayOfWeek
      );
      if (!slot) {
        return res
          .status(400)
          .json({ message: `No working hours set for ${dayOfWeek}.` });
      }
      // Convert slot times to Date objects in user's timezone
      const [slotStartHour, slotStartMin] = slot.startTime
        .split(":")
        .map(Number);
      const [slotEndHour, slotEndMin] = slot.endTime.split(":").map(Number);
      const slotStart = new Date(startDate);
      slotStart.setHours(slotStartHour, slotStartMin, 0, 0);
      const slotEnd = new Date(startDate);
      slotEnd.setHours(slotEndHour, slotEndMin, 0, 0);
      if (startDate < slotStart || endDate > slotEnd) {
        return res.status(400).json({
          message: `Booking must be within working hours: ${slot.startTime} - ${slot.endTime}`,
        });
      }
      // Check buffer before/after
      const bufferBefore = availability.bufferBefore || 0;
      const bufferAfter = availability.bufferAfter || 0;
      // Find bookings on this day
      const dayStart = new Date(startDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(startDate);
      dayEnd.setHours(23, 59, 59, 999);
      const bookings = await Booking.find({
        owner,
        start: { $gte: dayStart, $lt: dayEnd },
      });
      for (const b of bookings) {
        // Buffer logic: new booking must not start within bufferAfter of previous booking's end, or end within bufferBefore of next booking's start
        if (
          (startDate >= b.start &&
            startDate < new Date(b.end.getTime() + bufferAfter * 60000)) ||
          (endDate > new Date(b.start.getTime() - bufferBefore * 60000) &&
            endDate <= b.end)
        ) {
          return res
            .status(400)
            .json({ message: `Buffer time conflict with another booking.` });
        }
      }
    }
    // Check for overlap
    const overlap = await Booking.findOne({
      owner,
      $or: [{ start: { $lt: endDate }, end: { $gt: startDate } }],
    });
    if (overlap) {
      return res.status(400).json({
        message: "Select another time: overlaps with an existing booking.",
      });
    }
    const booking = await Booking.create({ owner, title, start, end });
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/calendar/bookings/:id - Edit a booking (with conflict and availability enforcement)
router.put("/bookings/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, start, end } = req.body;
    const owner = req.user._id;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const booking = await Booking.findOne({ _id: id, owner });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    // Fetch user availability
    const availability = await Availability.findOne({ user: owner });
    if (availability) {
      // Check holiday
      const dateStr = startDate.toISOString().slice(0, 10);
      if (
        availability.holidays.some(
          (h) => h.toISOString().slice(0, 10) === dateStr
        )
      ) {
        return res.status(400).json({ message: "Cannot book on a holiday." });
      }
      // Check working hours for the day
      const dayOfWeek = startDate.toLocaleString("en-US", {
        weekday: "long",
        timeZone: availability.timezone || "UTC",
      });
      const slot = availability.workingHours.find(
        (s) => s.dayOfWeek === dayOfWeek
      );
      if (!slot) {
        return res
          .status(400)
          .json({ message: `No working hours set for ${dayOfWeek}.` });
      }
      // Convert slot times to Date objects in user's timezone
      const [slotStartHour, slotStartMin] = slot.startTime
        .split(":")
        .map(Number);
      const [slotEndHour, slotEndMin] = slot.endTime.split(":").map(Number);
      const slotStart = new Date(startDate);
      slotStart.setHours(slotStartHour, slotStartMin, 0, 0);
      const slotEnd = new Date(startDate);
      slotEnd.setHours(slotEndHour, slotEndMin, 0, 0);
      if (startDate < slotStart || endDate > slotEnd) {
        return res.status(400).json({
          message: `Booking must be within working hours: ${slot.startTime} - ${slot.endTime}`,
        });
      }
      // Check buffer before/after
      const bufferBefore = availability.bufferBefore || 0;
      const bufferAfter = availability.bufferAfter || 0;
      // Find bookings on this day (exclude this booking)
      const dayStart = new Date(startDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(startDate);
      dayEnd.setHours(23, 59, 59, 999);
      const bookings = await Booking.find({
        owner,
        _id: { $ne: id },
        start: { $gte: dayStart, $lt: dayEnd },
      });
      for (const b of bookings) {
        if (
          (startDate >= b.start &&
            startDate < new Date(b.end.getTime() + bufferAfter * 60000)) ||
          (endDate > new Date(b.start.getTime() - bufferBefore * 60000) &&
            endDate <= b.end)
        ) {
          return res
            .status(400)
            .json({ message: `Buffer time conflict with another booking.` });
        }
      }
    }
    // Check for overlap (exclude this booking)
    const overlap = await Booking.findOne({
      owner,
      _id: { $ne: id },
      $or: [{ start: { $lt: endDate }, end: { $gt: startDate } }],
    });
    if (overlap) {
      return res.status(400).json({
        message: "Select another time: overlaps with an existing booking.",
      });
    }
    booking.title = title;
    booking.start = start;
    booking.end = end;
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/calendar/bookings/:id - Delete a booking
router.delete("/bookings/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.user._id;
    const booking = await Booking.findOne({ _id: id, owner });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    await booking.deleteOne();
    res.json({ message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
