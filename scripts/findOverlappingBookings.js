// Usage: node scripts/findOverlappingBookings.js
const mongoose = require("mongoose");
const Booking = require("../server/models/Booking");
require("dotenv").config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to MongoDB");

  const allBookings = await Booking.find({}).sort({ bookingPage: 1, start: 1 });
  let overlaps = [];

  for (let i = 0; i < allBookings.length; i++) {
    const a = allBookings[i];
    for (let j = i + 1; j < allBookings.length; j++) {
      const b = allBookings[j];
      if (String(a.bookingPage) !== String(b.bookingPage)) break;
      if (a.end > b.start && a.start < b.end) {
        overlaps.push({
          bookingPage: a.bookingPage,
          bookings: [a, b],
        });
      }
    }
  }

  if (overlaps.length === 0) {
    console.log("No overlapping bookings found.");
  } else {
    console.log(`Found ${overlaps.length} overlapping booking pairs:`);
    overlaps.forEach((pair, idx) => {
      console.log(`\n[${idx + 1}] BookingPage: ${pair.bookingPage}`);
      pair.bookings.forEach((bk, i) => {
        console.log(
          `  Booking ${i + 1}: _id=${bk._id}, start=${bk.start}, end=${
            bk.end
          }, guest=${bk.guestName || bk.title}`
        );
      });
    });
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
