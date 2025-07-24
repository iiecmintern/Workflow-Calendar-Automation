const express = require("express");
const { protect } = require("../middleware/auth");
const BookingPage = require("../models/BookingPage");
const Booking = require("../models/Booking");
const {
  sendBookingConfirmation,
  sendOwnerNotification,
} = require("../services/emailService");
const { scheduleAllReminders } = require("../services/reminderService");

const router = express.Router();

// GET /api/booking-pages - Get all booking pages for the authenticated user
router.get("/", protect, async (req, res) => {
  try {
    const pages = await BookingPage.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch booking pages" });
  }
});

// GET /api/booking-pages/me - Get current user's booking page (MUST come before /:slug)
router.get("/me", protect, async (req, res) => {
  try {
    const page = await BookingPage.findOne({ owner: req.user.id });
    if (!page) {
      return res
        .status(404)
        .json({ message: "No booking page found for user" });
    }
    res.json(page);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/booking-pages/fix-labels - Fix meeting type labels for all booking pages (MUST come before /:slug)
router.post("/fix-labels", protect, async (req, res) => {
  try {
    const pages = await BookingPage.find({ owner: req.user.id });
    let fixedCount = 0;
    for (const page of pages) {
      let changed = false;
      if (Array.isArray(page.meetingTypes)) {
        page.meetingTypes = page.meetingTypes.map((mt) => {
          if (!mt.label || mt.label === mt.type) {
            changed = true;
            switch (mt.type) {
              case "1-on-1":
                return { ...mt, label: "1-on-1 Meeting" };
              case "group":
                return { ...mt, label: "Group Meeting" };
              case "panel":
                return { ...mt, label: "Panel Discussion" };
              case "round-robin":
                return { ...mt, label: "Round Robin Meeting" };
              default:
                return {
                  ...mt,
                  label: `${
                    mt.type.charAt(0).toUpperCase() + mt.type.slice(1)
                  } Meeting`,
                };
            }
          }
          return mt;
        });
      }
      if (changed) {
        await page.save();
        fixedCount++;
      }
    }
    res.json({
      message: `Fixed meeting type labels for ${fixedCount} booking page(s)`,
      fixedCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/booking-pages/:slug/availability - Get available slots for a date (MUST come before /:slug)
router.get("/:slug/availability", async (req, res) => {
  try {
    const { slug } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date parameter is required" });
    }

    // Find the booking page
    const bookingPage = await BookingPage.findOne({ slug, isActive: true });
    if (!bookingPage) {
      return res.status(404).json({ message: "Booking page not found" });
    }

    // Parse the date
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get existing bookings for this date
    const existingBookings = await Booking.find({
      bookingPage: bookingPage._id,
      start: { $gte: startOfDay, $lte: endOfDay },
    });

    // Generate available slots (9 AM to 5 PM, 30-minute intervals)
    const availableSlots = [];
    const startHour = 9;
    const endHour = 17;
    const slotDuration = 30; // minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotStart = new Date(selectedDate);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

        // Check if this slot conflicts with existing bookings
        const hasConflict = existingBookings.some((booking) => {
          const bookingStart = new Date(booking.start);
          const bookingEnd = new Date(booking.end);
          return (
            (slotStart >= bookingStart && slotStart < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (slotStart <= bookingStart && slotEnd >= bookingEnd)
          );
        });

        if (!hasConflict) {
          availableSlots.push({
            start: slotStart,
            end: slotEnd,
            startTime: slotStart.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            endTime: slotEnd.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
          });
        }
      }
    }

    // --- AI Integration: Suggest best slots ---
    let aiSuggestions = [];
    try {
      const axios = require("axios");
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) throw new Error("GROQ_API_KEY is not set in .env");
      const prompt = `You are an expert meeting assistant.\n\nHere are the available time slots for a booking page on ${selectedDate.toDateString()}:\n${JSON.stringify(
        availableSlots
      )}\n\nHere are the existing bookings for the day:\n${JSON.stringify(
        existingBookings.map((b) => ({
          start: b.start,
          end: b.end,
          guestName: b.guestName,
        }))
      )}\n\nSuggest the top 3 best time slots for a new meeting, considering even distribution, avoiding clustering, and maximizing availability. Return a JSON array of the top 3 slot objects from the list above, sorted by your recommendation (most recommended first).`;
      const groqRes = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are an expert meeting assistant." },
            { role: "user", content: prompt },
          ],
          max_tokens: 512,
          temperature: 0.2,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
          },
        }
      );
      // Try to parse the AI's JSON response
      const aiText = groqRes.data.choices?.[0]?.message?.content || "";
      const match = aiText.match(/\[.*\]/s);
      if (match) {
        aiSuggestions = JSON.parse(match[0]);
      }
    } catch (aiErr) {
      console.error(
        "AI slot suggestion error:",
        aiErr?.response?.data || aiErr
      );
      // Fallback: no AI suggestions
      aiSuggestions = [];
    }

    res.json({ availableSlots, aiSuggestions });
  } catch (err) {
    console.error("Error fetching availability:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/booking-pages/:slug/book - Create a booking (MUST come before /:slug)
router.post("/:slug/book", async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, email, phone, start, end } = req.body;

    // Find the booking page
    const bookingPage = await BookingPage.findOne({ slug, isActive: true });
    if (!bookingPage) {
      return res.status(404).json({ message: "Booking page not found" });
    }

    // Validate required fields
    if (!name || !email || !start || !end) {
      return res.status(400).json({
        message: "Name, email, start time, and end time are required",
      });
    }

    // Check for conflicts
    const startTime = new Date(start);
    const endTime = new Date(end);

    const conflictingBooking = await Booking.findOne({
      bookingPage: bookingPage._id,
      $or: [
        {
          start: { $lt: endTime },
          end: { $gt: startTime },
        },
      ],
    });

    if (conflictingBooking) {
      return res.status(409).json({
        message:
          "This time slot is no longer available. Please select another time.",
      });
    }

    // Create the booking
    const booking = new Booking({
      owner: bookingPage.owner,
      bookingPage: bookingPage._id,
      title: `Meeting with ${name}`,
      start: startTime,
      end: endTime,
      guestName: name,
      guestEmail: email,
      guestPhone: phone || "",
      status: "confirmed",
    });

    await booking.save();

    // Send confirmation email to guest
    sendBookingConfirmation(booking, bookingPage, email, name);
    // Send notification to owner
    if (bookingPage.owner && bookingPage.owner.email) {
      sendOwnerNotification(
        booking,
        bookingPage,
        bookingPage.owner.email,
        bookingPage.owner.name || ""
      );
    }

    // Ensure reminderSettings includes at least one SMS reminder if guestPhone is provided
    if (
      booking.guestPhone &&
      (!booking.reminderSettings ||
        (!booking.reminderSettings.sms15min &&
          !booking.reminderSettings.sms1hour))
    ) {
      booking.reminderSettings = {
        ...booking.reminderSettings,
        sms15min: true,
      };
      await booking.save();
    }

    // Schedule reminders (email, SMS, WhatsApp)
    scheduleAllReminders(booking, booking.reminderSettings || {});

    res.status(201).json(booking);
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/booking-pages - Create a new booking page
router.post("/", protect, async (req, res) => {
  try {
    const { slug, title, description, color, meetingTypes } = req.body;

    // Check if slug already exists
    const existingPage = await BookingPage.findOne({ slug });
    if (existingPage) {
      return res.status(400).json({ message: "Slug already exists" });
    }

    // Create new booking page
    const bookingPage = new BookingPage({
      owner: req.user.id,
      slug,
      title,
      description,
      color,
      meetingTypes: meetingTypes || [
        {
          type: "1-on-1",
          label: "1-on-1 Meeting",
          duration: 30,
          maxParticipants: 1,
          roundRobin: false,
        },
        {
          type: "group",
          label: "Group Meeting",
          duration: 60,
          maxParticipants: 10,
          roundRobin: false,
        },
      ],
      isActive: true,
    });

    await bookingPage.save();
    res.status(201).json(bookingPage);
  } catch (err) {
    console.error("Error creating booking page:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/booking-pages/:slug - Public booking page info (no auth) - MUST come last
router.get("/:slug", async (req, res) => {
  try {
    const page = await BookingPage.findOne({
      slug: req.params.slug,
      isActive: true,
    });
    if (!page) {
      return res.status(404).json({ message: "Booking page not found" });
    }
    res.json(page);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
