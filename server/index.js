const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/database");
const { initializeCronJobs } = require("./services/cronService");
require("dotenv").config();
const path = require("path");

const app = express();
app.set("trust proxy", 1); // trust first proxy for rate limiting and proxy headers
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve avatar images statically
app.use("/avatar", express.static(path.join(__dirname, "../avatar")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/workflows", require("./routes/workflows"));
app.use("/api/webhooks", require("./routes/webhooks"));
app.use("/api/calendar", require("./routes/calendar"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/booking-pages", require("./routes/bookingPages"));
app.use("/api/forms", require("./routes/forms"));
app.use("/api/surveys", require("./routes/surveys"));
app.use("/api/survey-responses", require("./routes/surveyResponses"));
app.use("/api/auto-reschedule", require("./routes/autoReschedule"));
app.use("/api/integrations", require("./routes/integrations"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Workflow + Calendar Automation API is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Connect to database
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);

    // Initialize cron jobs
    initializeCronJobs();
  });
});
