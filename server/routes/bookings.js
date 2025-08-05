const express = require("express");
const { protect } = require("../middleware/auth");
const Booking = require("../models/Booking");

const router = express.Router();
router.use(protect);

// GET /api/bookings - Get all bookings for the authenticated user
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.user.id });
    // Sort by start date (newest first)
    bookings.sort((a, b) => new Date(b.start) - new Date(a.start));
    res.json(bookings);
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

module.exports = router;
