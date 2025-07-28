const nodemailer = require("nodemailer");
const axios = require("axios");
const cron = require("node-cron");

// Email transporter setup
const createEmailTransporter = () => {
  if (process.env.NODE_ENV === "development") {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.mailtrap.io",
      port: process.env.EMAIL_PORT || 2525,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
};

// Send email reminder
const sendEmailReminder = async (booking, reminderType) => {
  try {
    const transporter = createEmailTransporter();
    const startDate = new Date(booking.start);
    const endDate = new Date(booking.end);

    const reminderText =
      {
        "15min": "15 minutes",
        "1hour": "1 hour",
        "1day": "1 day",
        "1week": "1 week",
      }[reminderType] || reminderType;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Meeting Reminder!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your meeting starts in ${reminderText}</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Meeting Details</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #ff6b6b; margin: 0 0 15px 0;">${
              booking.title
            }</h3>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Date:</strong> 
              <span style="color: #333;">${startDate.toLocaleDateString()}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Time:</strong> 
              <span style="color: #333;">${startDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })} - ${endDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Duration:</strong> 
              <span style="color: #333;">${Math.round(
                (endDate - startDate) / (1000 * 60)
              )} minutes</span>
            </div>
            
            ${
              booking.meetingLink
                ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Meeting Link:</strong> 
              <br>
              <a href="${
                booking.meetingLink
              }" style="color: #ff6b6b; text-decoration: none; font-weight: bold; background: #fff5f5; padding: 8px 16px; border-radius: 6px; display: inline-block; margin-top: 5px;" target="_blank">
                ${
                  booking.meetingType === "google-meet"
                    ? "🎥 Join Google Meet"
                    : booking.meetingType === "zoom"
                    ? "📹 Join Zoom Meeting"
                    : booking.meetingType === "teams"
                    ? "💻 Join Teams Meeting"
                    : "🔗 Join Meeting"
                }
              </a>
            </div>
            `
                : ""
            }
            
            ${
              booking.meetingPassword
                ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Meeting Password:</strong> 
              <span style="color: #333; font-family: monospace; background: #f5f5f5; padding: 4px 8px; border-radius: 4px; border: 1px solid #ddd;">${booking.meetingPassword}</span>
            </div>
            `
                : ""
            }
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>Reminder:</strong> Please join the meeting on time. If you need to reschedule, please contact the meeting organizer as soon as possible.
            </p>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #f1f3f4;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            This is an automated reminder for your scheduled meeting.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@workflowsuite.com",
      to: booking.guestEmail,
      subject: `Meeting Reminder: ${booking.title} (${reminderText})`,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(
      `Email reminder sent to ${booking.guestEmail} for ${reminderType} reminder`
    );
    return true;
  } catch (error) {
    console.error("Error sending email reminder:", error);
    return false;
  }
};

// Send SMS reminder using Twilio
const sendSMSReminder = async (booking, reminderType, phoneNumber) => {
  try {
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      console.log("Twilio credentials not configured, skipping SMS reminder");
      return false;
    }

    const startDate = new Date(booking.start);
    const reminderText =
      {
        "15min": "15 minutes",
        "1hour": "1 hour",
        "1day": "1 day",
        "1week": "1 week",
      }[reminderType] || reminderType;

    const message = `Meeting Reminder: ${
      booking.title
    } starts in ${reminderText} at ${startDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}. ${booking.meetingLink ? `Join: ${booking.meetingLink}` : ""}`;

    const response = await axios({
      method: "post",
      url: `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID,
        password: process.env.TWILIO_AUTH_TOKEN,
      },
      data: `To=${encodeURIComponent(phoneNumber)}&From=${encodeURIComponent(
        process.env.TWILIO_PHONE_NUMBER
      )}&Body=${encodeURIComponent(message)}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log(
      `SMS reminder sent to ${phoneNumber} for ${reminderType} reminder`
    );
    return true;
  } catch (error) {
    console.error("Error sending SMS reminder:", error);
    return false;
  }
};

// Send WhatsApp reminder using WhatsApp Business API
const sendWhatsAppReminder = async (booking, reminderType, phoneNumber) => {
  try {
    if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.log(
        "WhatsApp credentials not configured, skipping WhatsApp reminder"
      );
      return false;
    }

    const startDate = new Date(booking.start);
    const reminderText =
      {
        "15min": "15 minutes",
        "1hour": "1 hour",
        "1day": "1 day",
        "1week": "1 week",
      }[reminderType] || reminderType;

    const message = `Meeting Reminder: ${
      booking.title
    } starts in ${reminderText} at ${startDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}. ${booking.meetingLink ? `Join: ${booking.meetingLink}` : ""}`;

    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      `WhatsApp reminder sent to ${phoneNumber} for ${reminderType} reminder`
    );
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp reminder:", error);
    return false;
  }
};

// Send call reminder using Twilio Voice API
const sendCallReminder = async (booking, reminderType, phoneNumber) => {
  try {
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      console.log("Twilio credentials not configured, skipping call reminder");
      return false;
    }

    const startDate = new Date(booking.start);
    const reminderText =
      {
        "15min": "15 minutes",
        "1hour": "1 hour",
        "1day": "1 day",
        "1week": "1 week",
      }[reminderType] || reminderType;

    // Create TwiML for the call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">
    Hello! This is your meeting reminder. Your meeting "${
      booking.title
    }" starts in ${reminderText} at ${startDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}.
    ${
      booking.meetingLink
        ? `You can join the meeting at ${booking.meetingLink}`
        : ""
    }
    Thank you and have a great meeting!
  </Say>
</Response>`;

    // Make the call using Twilio Voice API
    const response = await axios({
      method: "post",
      url: `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Calls.json`,
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID,
        password: process.env.TWILIO_AUTH_TOKEN,
      },
      data: `To=${encodeURIComponent(phoneNumber)}&From=${encodeURIComponent(
        process.env.TWILIO_PHONE_NUMBER
      )}&Twiml=${encodeURIComponent(twiml)}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log(
      `Call reminder initiated to ${phoneNumber} for ${reminderType} reminder`
    );
    return true;
  } catch (error) {
    console.error("Error sending call reminder:", error);
    return false;
  }
};

// Schedule reminder for a booking
const scheduleReminder = async (booking, reminderType, reminderTime) => {
  try {
    const reminderDate = new Date(reminderTime);
    const now = new Date();

    // If reminder time is in the past, send immediately
    if (reminderDate <= now) {
      await sendReminder(booking, reminderType);
      return;
    }

    // Schedule the reminder
    const cronExpression = `${reminderDate.getMinutes()} ${reminderDate.getHours()} ${reminderDate.getDate()} ${
      reminderDate.getMonth() + 1
    } *`;

    cron.schedule(
      cronExpression,
      async () => {
        await sendReminder(booking, reminderType);
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );

    console.log(
      `Reminder scheduled for ${reminderType} at ${reminderDate.toISOString()}`
    );
  } catch (error) {
    console.error("Error scheduling reminder:", error);
  }
};

// Send reminder through all configured channels
const sendReminder = async (booking, reminderType) => {
  try {
    // Get user preferences to check if SMS/WhatsApp are enabled
    const User = require("../models/User");
    const user = await User.findById(booking.owner).select(
      "reminderPreferences"
    );

    let channelsUsed = [];

    // Send email reminder
    const emailResult = await sendEmailReminder(booking, reminderType);
    if (emailResult) {
      channelsUsed.push("email");
    }

    // Send SMS reminder if phone number is available and SMS is enabled
    if (booking.guestPhone && user?.reminderPreferences?.enableSMS) {
      const smsEnabled =
        reminderType === "15min"
          ? user.reminderPreferences.sms15min
          : user.reminderPreferences.sms1hour;

      if (smsEnabled) {
        const smsResult = await sendSMSReminder(
          booking,
          reminderType,
          booking.guestPhone
        );
        if (smsResult) {
          channelsUsed.push("sms");
        }
      }
    }

    // Send WhatsApp reminder if phone number is available and WhatsApp is enabled
    if (booking.guestPhone && user?.reminderPreferences?.enableWhatsApp) {
      const whatsappEnabled =
        reminderType === "15min"
          ? user.reminderPreferences.whatsapp15min
          : user.reminderPreferences.whatsapp1hour;

      if (whatsappEnabled) {
        const whatsappResult = await sendWhatsAppReminder(
          booking,
          reminderType,
          booking.guestPhone
        );
        if (whatsappResult) {
          channelsUsed.push("whatsapp");
        }
      }
    }

    // Send call reminder if phone number is available and call is enabled
    if (booking.guestPhone && user?.reminderPreferences?.enableCall) {
      const callEnabled =
        reminderType === "15min"
          ? user.reminderPreferences.call15min
          : user.reminderPreferences.call1hour;

      if (callEnabled) {
        const callResult = await sendCallReminder(
          booking,
          reminderType,
          booking.guestPhone
        );
        if (callResult) {
          channelsUsed.push("call");
        }
      }
    }

    // Update reminder status in database for each channel used
    for (const channel of channelsUsed) {
      await updateReminderStatus(booking._id, reminderType, "sent", channel);
    }

    console.log(`Reminders sent via channels: ${channelsUsed.join(", ")}`);
  } catch (error) {
    console.error("Error sending reminder:", error);
    await updateReminderStatus(booking._id, reminderType, "failed");
  }
};

// Update reminder status in database
const updateReminderStatus = async (
  bookingId,
  reminderType,
  status,
  channel = null
) => {
  try {
    const Booking = require("../models/Booking");
    const updateData = {
      type: reminderType,
      status: status,
      sentAt: new Date(),
    };

    if (channel) {
      updateData.channel = channel;
    }

    await Booking.findByIdAndUpdate(bookingId, {
      $push: {
        reminderHistory: updateData,
      },
    });
  } catch (error) {
    console.error("Error updating reminder status:", error);
  }
};

// Schedule all reminders for a booking
const scheduleAllReminders = async (booking, reminderSettings) => {
  try {
    const startTime = new Date(booking.start);

    // Get user preferences to check if SMS/WhatsApp are enabled
    const User = require("../models/User");
    const user = await User.findById(booking.owner).select(
      "reminderPreferences"
    );

    // Schedule email reminders
    if (reminderSettings.email15min) {
      const reminderTime = new Date(startTime.getTime() - 15 * 60 * 1000);
      await scheduleReminder(booking, "15min", reminderTime);
    }

    if (reminderSettings.email1hour) {
      const reminderTime = new Date(startTime.getTime() - 60 * 60 * 1000);
      await scheduleReminder(booking, "1hour", reminderTime);
    }

    if (reminderSettings.email1day) {
      const reminderTime = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
      await scheduleReminder(booking, "1day", reminderTime);
    }

    if (reminderSettings.email1week) {
      const reminderTime = new Date(
        startTime.getTime() - 7 * 24 * 60 * 60 * 1000
      );
      await scheduleReminder(booking, "1week", reminderTime);
    }

    // Schedule SMS reminders if enabled and phone number is available
    if (booking.guestPhone && user?.reminderPreferences?.enableSMS) {
      if (reminderSettings.sms15min || user.reminderPreferences.sms15min) {
        const reminderTime = new Date(startTime.getTime() - 15 * 60 * 1000);
        await scheduleReminder(booking, "15min", reminderTime);
      }

      if (reminderSettings.sms1hour || user.reminderPreferences.sms1hour) {
        const reminderTime = new Date(startTime.getTime() - 60 * 60 * 1000);
        await scheduleReminder(booking, "1hour", reminderTime);
      }
    }

    // Schedule WhatsApp reminders if enabled and phone number is available
    if (booking.guestPhone && user?.reminderPreferences?.enableWhatsApp) {
      if (
        reminderSettings.whatsapp15min ||
        user.reminderPreferences.whatsapp15min
      ) {
        const reminderTime = new Date(startTime.getTime() - 15 * 60 * 1000);
        await scheduleReminder(booking, "15min", reminderTime);
      }

      if (
        reminderSettings.whatsapp1hour ||
        user.reminderPreferences.whatsapp1hour
      ) {
        const reminderTime = new Date(startTime.getTime() - 60 * 60 * 1000);
        await scheduleReminder(booking, "1hour", reminderTime);
      }
    }

    // Schedule call reminders if enabled and phone number is available
    if (booking.guestPhone && user?.reminderPreferences?.enableCall) {
      if (reminderSettings.call15min || user.reminderPreferences.call15min) {
        const reminderTime = new Date(startTime.getTime() - 15 * 60 * 1000);
        await scheduleReminder(booking, "15min", reminderTime);
      }

      if (reminderSettings.call1hour || user.reminderPreferences.call1hour) {
        const reminderTime = new Date(startTime.getTime() - 60 * 60 * 1000);
        await scheduleReminder(booking, "1hour", reminderTime);
      }
    }

    console.log(`All reminders scheduled for booking ${booking._id}`);
  } catch (error) {
    console.error("Error scheduling all reminders:", error);
  }
};

module.exports = {
  sendEmailReminder,
  sendSMSReminder,
  sendWhatsAppReminder,
  sendCallReminder,
  scheduleReminder,
  scheduleAllReminders,
  sendReminder,
  updateReminderStatus,
};
