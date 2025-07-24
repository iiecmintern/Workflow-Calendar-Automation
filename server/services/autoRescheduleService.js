const AutoReschedule = require("../models/AutoReschedule");
const Booking = require("../models/Booking");
const Availability = require("../models/Availability");
const { sendEmail } = require("./emailService");

class AutoRescheduleService {
  // Evaluate if conditions are met for a booking
  static async evaluateConditions(booking, conditions) {
    for (const condition of conditions) {
      const isMet = await this.evaluateCondition(booking, condition);
      if (!isMet) return false;
    }
    return true;
  }

  // Evaluate a single condition
  static async evaluateCondition(booking, condition) {
    switch (condition.type) {
      case "rating_below":
        return this.evaluateRatingCondition(booking, condition);
      case "sentiment_negative":
        return this.evaluateSentimentCondition(booking, condition);
      case "no_show":
        return this.evaluateNoShowCondition(booking, condition);
      case "cancelled":
        return this.evaluateCancelledCondition(booking, condition);
      case "feedback_missing":
        return this.evaluateFeedbackMissingCondition(booking, condition);
      default:
        return false;
    }
  }

  static evaluateRatingCondition(booking, condition) {
    if (!booking.feedback?.overallRating) return false;

    const rating = booking.feedback.overallRating;
    const threshold = condition.value;

    switch (condition.operator) {
      case "less_than":
        return rating < threshold;
      case "greater_than":
        return rating > threshold;
      case "equals":
        return rating === threshold;
      case "not_equals":
        return rating !== threshold;
      default:
        return rating < threshold;
    }
  }

  static evaluateSentimentCondition(booking, condition) {
    if (!booking.feedback?.sentiment) return false;

    const sentiment = booking.feedback.sentiment;
    const targetSentiment = condition.value;

    switch (condition.operator) {
      case "equals":
        return sentiment === targetSentiment;
      case "not_equals":
        return sentiment !== targetSentiment;
      default:
        return sentiment === targetSentiment;
    }
  }

  static evaluateNoShowCondition(booking, condition) {
    // Check if booking was marked as no-show
    // This would need to be implemented based on your no-show tracking logic
    return booking.status === "no_show" || booking.noShow === true;
  }

  static evaluateCancelledCondition(booking, condition) {
    return booking.status === "cancelled";
  }

  static evaluateFeedbackMissingCondition(booking, condition) {
    // Check if feedback is missing after a certain time
    const hoursAfterMeeting = condition.value || 24;
    const meetingEndTime = new Date(booking.end);
    const feedbackDeadline = new Date(
      meetingEndTime.getTime() + hoursAfterMeeting * 60 * 60 * 1000
    );

    return !booking.feedback && new Date() > feedbackDeadline;
  }

  // Find next available slot for rescheduling
  static async findNextAvailableSlot(ownerId, currentBooking, settings) {
    const availability = await Availability.findOne({ user: ownerId });
    if (!availability) return null;

    const now = new Date();
    const withinDays = settings.withinDays || 7;
    const bufferDays = settings.bufferDays || 1;
    const preferredTimeSlots = settings.preferredTimeSlots || [
      "09:00",
      "14:00",
    ];
    const avoidDays = settings.avoidDays || ["Saturday", "Sunday"];

    // Start searching from tomorrow (with buffer)
    const searchStartDate = new Date(
      now.getTime() + bufferDays * 24 * 60 * 60 * 1000
    );
    const searchEndDate = new Date(
      now.getTime() + withinDays * 24 * 60 * 60 * 1000
    );

    // Get existing bookings in the search period
    const existingBookings = await Booking.find({
      owner: ownerId,
      start: { $gte: searchStartDate, $lte: searchEndDate },
      status: { $ne: "cancelled" },
    });

    // Generate potential slots
    const potentialSlots = this.generateTimeSlots(
      searchStartDate,
      searchEndDate,
      availability,
      preferredTimeSlots,
      avoidDays
    );

    // Filter out conflicting slots
    const availableSlots = this.filterAvailableSlots(
      potentialSlots,
      existingBookings
    );

    return availableSlots.length > 0 ? availableSlots[0] : null;
  }

  // Generate time slots based on availability
  static generateTimeSlots(
    startDate,
    endDate,
    availability,
    preferredTimes,
    avoidDays
  ) {
    const slots = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayName = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
      });

      // Skip avoided days
      if (avoidDays.includes(dayName)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Find working hours for this day
      const workingHours = availability.workingHours.find(
        (wh) => wh.dayOfWeek === dayName
      );
      if (!workingHours) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Generate slots for preferred times
      for (const preferredTime of preferredTimes) {
        const slotTime = new Date(currentDate);
        const [hours, minutes] = preferredTime.split(":").map(Number);
        slotTime.setHours(hours, minutes, 0, 0);

        // Check if slot is within working hours
        if (this.isWithinWorkingHours(slotTime, workingHours)) {
          slots.push(slotTime);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots.sort((a, b) => a - b);
  }

  // Check if time is within working hours
  static isWithinWorkingHours(time, workingHours) {
    const timeString = time.toTimeString().slice(0, 5);
    return (
      timeString >= workingHours.startTime && timeString <= workingHours.endTime
    );
  }

  // Filter out slots that conflict with existing bookings
  static filterAvailableSlots(slots, existingBookings) {
    return slots.filter((slot) => {
      const slotEnd = new Date(slot.getTime() + 30 * 60 * 1000); // 30 min default duration

      return !existingBookings.some((booking) => {
        const bookingStart = new Date(booking.start);
        const bookingEnd = new Date(booking.end);

        return (
          (slot >= bookingStart && slot < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slot <= bookingStart && slotEnd >= bookingEnd)
        );
      });
    });
  }

  // Execute actions for a booking
  static async executeActions(booking, actions, ownerId) {
    const results = [];

    for (const action of actions) {
      try {
        const result = await this.executeAction(booking, action, ownerId);
        results.push({ action: action.type, success: true, result });
      } catch (error) {
        results.push({
          action: action.type,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  // Execute a single action
  static async executeAction(booking, action, ownerId) {
    switch (action.type) {
      case "reschedule":
        return await this.executeRescheduleAction(booking, action, ownerId);
      case "follow_up":
        return await this.executeFollowUpAction(booking, action, ownerId);
      case "refund":
        return await this.executeRefundAction(booking, action, ownerId);
      case "compensation":
        return await this.executeCompensationAction(booking, action, ownerId);
      case "escalate":
        return await this.executeEscalateAction(booking, action, ownerId);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Execute reschedule action
  static async executeRescheduleAction(booking, action, ownerId) {
    const newSlot = await this.findNextAvailableSlot(
      ownerId,
      booking,
      action.rescheduleSettings
    );

    if (!newSlot) {
      throw new Error("No available slots found for rescheduling");
    }

    // Create new booking
    const newBooking = new Booking({
      owner: ownerId,
      title: `Rescheduled: ${booking.title}`,
      start: newSlot,
      end: new Date(newSlot.getTime() + 30 * 60 * 1000), // 30 min default
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      bookingPage: booking.bookingPage,
      meetingType: booking.meetingType,
      meetingLink: booking.meetingLink,
      meetingPassword: booking.meetingPassword,
      meetingInstructions: booking.meetingInstructions,
      reminderSettings: booking.reminderSettings,
      status: "scheduled",
    });

    await newBooking.save();

    // Cancel or mark original booking
    booking.status = "cancelled";
    booking.cancelledReason = "Auto-rescheduled due to conditions";
    await booking.save();

    // Send notification emails
    if (booking.guestEmail) {
      await sendEmail({
        to: booking.guestEmail,
        subject: "Meeting Rescheduled",
        html: `
          <h2>Your meeting has been rescheduled</h2>
          <p>Your meeting "${
            booking.title
          }" has been automatically rescheduled to:</p>
          <p><strong>New Time:</strong> ${newSlot.toLocaleString()}</p>
          <p>We apologize for any inconvenience.</p>
        `,
      });
    }

    return { newBookingId: newBooking._id, newSlot };
  }

  // Execute follow-up action
  static async executeFollowUpAction(booking, action, ownerId) {
    const delayHours = action.followUpSettings.delayHours || 24;
    const scheduledTime = new Date(Date.now() + delayHours * 60 * 60 * 1000);

    // Schedule follow-up email
    if (booking.guestEmail) {
      const followUpMessage =
        action.followUpSettings.message ||
        "We hope your meeting went well. Please let us know if you need anything else.";

      // Schedule email (you'd need a job scheduler like node-cron)
      // For now, we'll send immediately
      await sendEmail({
        to: booking.guestEmail,
        subject: "Follow-up: " + booking.title,
        html: `
          <h2>Meeting Follow-up</h2>
          <p>${followUpMessage}</p>
          ${
            action.followUpSettings.includeSurvey
              ? '<p><a href="/survey">Please take a moment to provide feedback</a></p>'
              : ""
          }
        `,
      });
    }

    return { scheduledTime, message: "Follow-up scheduled" };
  }

  // Execute refund action
  static async executeRefundAction(booking, action, ownerId) {
    // This would integrate with your payment processor
    // For now, we'll just log the action
    console.log(`Refund requested for booking ${booking._id}`);

    return { message: "Refund request logged" };
  }

  // Execute compensation action
  static async executeCompensationAction(booking, action, ownerId) {
    const compensation = action.compensationSettings;

    if (booking.guestEmail) {
      const message =
        compensation.message ||
        `We're offering you a ${compensation.value}% discount on your next booking.`;

      await sendEmail({
        to: booking.guestEmail,
        subject: "Compensation Offer",
        html: `
          <h2>Compensation Offer</h2>
          <p>${message}</p>
          <p>Type: ${compensation.type}</p>
          <p>Value: ${compensation.value}${
          compensation.type === "discount" ? "%" : ""
        }</p>
        `,
      });
    }

    return { compensation };
  }

  // Execute escalate action
  static async executeEscalateAction(booking, action, ownerId) {
    const escalation = action.escalateSettings;

    if (escalation.escalateTo) {
      await sendEmail({
        to: escalation.escalateTo,
        subject: `Escalation: ${booking.title} (${escalation.priority})`,
        html: `
          <h2>Meeting Escalation</h2>
          <p><strong>Priority:</strong> ${escalation.priority}</p>
          <p><strong>Booking:</strong> ${booking.title}</p>
          <p><strong>Guest:</strong> ${booking.guestName} (${booking.guestEmail})</p>
          <p><strong>Message:</strong> ${escalation.message}</p>
        `,
      });
    }

    return { escalation };
  }

  // Process auto-reschedule for a booking
  static async processBooking(bookingId) {
    const booking = await Booking.findById(bookingId).populate("owner");
    if (!booking) throw new Error("Booking not found");

    // Find applicable auto-reschedule rules
    const autoRescheduleRules = await AutoReschedule.find({
      owner: booking.owner._id,
      isActive: true,
      $or: [
        { bookingPages: { $in: [booking.bookingPage] } },
        { bookingPages: { $size: 0 } }, // Global rules
      ],
    });

    for (const rule of autoRescheduleRules) {
      try {
        // Check if conditions are met
        const conditionsMet = await this.evaluateConditions(
          booking,
          rule.conditions
        );

        if (conditionsMet) {
          // Execute actions
          const results = await this.executeActions(
            booking,
            rule.actions,
            booking.owner._id
          );

          // Update rule statistics
          rule.stats.totalExecutions += 1;
          rule.stats.lastExecuted = new Date();
          rule.stats.successfulActions += results.filter(
            (r) => r.success
          ).length;
          rule.stats.failedActions += results.filter((r) => !r.success).length;

          await rule.save();

          console.log(
            `Auto-reschedule rule "${rule.name}" executed for booking ${bookingId}`
          );
        }
      } catch (error) {
        console.error(
          `Error executing auto-reschedule rule "${rule.name}":`,
          error
        );
      }
    }
  }

  // Process all pending bookings for auto-reschedule
  static async processPendingActions() {
    // Find bookings from the last 30 days that are not cancelled
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const bookings = await Booking.find({
      start: { $gte: since },
      status: { $ne: "cancelled" },
    });
    for (const booking of bookings) {
      try {
        await this.processBooking(booking._id);
      } catch (err) {
        console.error(`Error processing booking ${booking._id}:`, err);
      }
    }
  }
}

module.exports = AutoRescheduleService;
