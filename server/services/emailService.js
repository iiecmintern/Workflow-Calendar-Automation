const nodemailer = require("nodemailer");

// Create transporter (configure with your email service)
const createTransporter = () => {
  // For development, you can use a service like Mailtrap or configure with your email provider
  if (process.env.NODE_ENV === "development") {
    // Use Mailtrap for development
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.mailtrap.io",
      port: process.env.EMAIL_PORT || 2525,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Production email configuration
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
};

// Send booking confirmation to guest
const sendBookingConfirmation = async (
  booking,
  page,
  guestEmail,
  guestName
) => {
  try {
    const transporter = createTransporter();

    const startDate = new Date(booking.start);
    const endDate = new Date(booking.end);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Booking Confirmed!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your meeting has been scheduled successfully</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Meeting Details</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #667eea; margin: 0 0 15px 0;">${
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
              }" style="color: #667eea; text-decoration: none; font-weight: bold; background: #f0f4ff; padding: 8px 16px; border-radius: 6px; display: inline-block; margin-top: 5px;" target="_blank">
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
            
            ${
              booking.meetingInstructions
                ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Instructions:</strong> 
              <br>
              <span style="color: #333; white-space: pre-line; background: #f9f9f9; padding: 8px; border-radius: 4px; display: block; margin-top: 5px;">${booking.meetingInstructions}</span>
            </div>
            `
                : ""
            }
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
            <p style="margin: 0; color: #1976d2;">
              <strong>Note:</strong> Please arrive on time for your meeting. 
              If you need to reschedule or cancel, please contact us as soon as possible.
            </p>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #f1f3f4;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            This booking was made through ${page.title}
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@workflowsuite.com",
      to: guestEmail,
      subject: `Booking Confirmed: ${booking.title}`,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent to ${guestEmail}`);
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    // Don't throw error to avoid breaking the booking process
  }
};

// Send notification to booking page owner
const sendOwnerNotification = async (booking, page, ownerEmail, ownerName) => {
  try {
    const transporter = createTransporter();

    const startDate = new Date(booking.start);
    const endDate = new Date(booking.end);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">New Booking!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone has booked a meeting with you</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Booking Details</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #4caf50; margin: 0 0 15px 0;">${
              booking.title
            }</h3>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Guest:</strong> 
              <span style="color: #333;">${booking.guestName}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Guest Email:</strong> 
              <span style="color: #333;">${booking.guestEmail}</span>
            </div>
            
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
              }" style="color: #4caf50; text-decoration: none; font-weight: bold; background: #f0f8f0; padding: 8px 16px; border-radius: 6px; display: inline-block; margin-top: 5px;" target="_blank">
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
            
            ${
              booking.meetingInstructions
                ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Instructions:</strong> 
              <br>
              <span style="color: #333; white-space: pre-line; background: #f9f9f9; padding: 8px; border-radius: 4px; display: block; margin-top: 5px;">${booking.meetingInstructions}</span>
            </div>
            `
                : ""
            }
          </div>
          
          <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
            <p style="margin: 0; color: #e65100;">
              <strong>Action Required:</strong> Please prepare for this meeting and ensure you're available at the scheduled time.
            </p>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #f1f3f4;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            This booking was made through your booking page: ${page.title}
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@workflowsuite.com",
      to: ownerEmail,
      subject: `New Booking: ${booking.title}`,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Owner notification email sent to ${ownerEmail}`);
  } catch (error) {
    console.error("Error sending owner notification email:", error);
    // Don't throw error to avoid breaking the booking process
  }
};

// Send survey invitation to meeting participant
const sendSurveyInvitation = async (
  survey,
  booking,
  recipientEmail,
  recipientName,
  surveyResponseId
) => {
  try {
    const transporter = createTransporter();

    const startDate = new Date(booking.start);
    const surveyUrl = `${
      process.env.CLIENT_URL || "http://localhost:3000"
    }/survey/${surveyResponseId}`;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Meeting Feedback Request</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">We'd love to hear about your experience</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${recipientName},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Thank you for attending our meeting on <strong>${startDate.toLocaleDateString()}</strong>. 
            We hope it was valuable and informative.
          </p>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            To help us improve our services and provide better experiences, we'd appreciate if you could 
            take a moment to share your feedback through our brief survey.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #667eea; margin: 0 0 15px 0;">${survey.name}</h3>
            <p style="color: #666; margin: 0 0 15px 0;">${
              survey.description ||
              "Please share your thoughts about the meeting."
            }</p>
            
            <div style="text-align: center;">
              <a href="${surveyUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 10px 0;">
                📝 Take Survey
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; margin: 15px 0 0 0; text-align: center;">
              This survey will take approximately ${Math.ceil(
                survey.questions.length / 2
              )} minutes to complete.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Your feedback is incredibly valuable to us and will help us enhance our services for future meetings.
          </p>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            If you have any questions or concerns, please don't hesitate to reach out to us.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 14px; margin: 0;">
              Thank you for your time and feedback!
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@workflowsuite.com",
      to: recipientEmail,
      subject: `Feedback Request: ${survey.name}`,
      html: emailContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Survey invitation email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending survey invitation email:", error);
    throw error;
  }
};

// Send survey reminder email
const sendSurveyReminder = async (
  survey,
  booking,
  recipientEmail,
  recipientName,
  surveyResponseId,
  reminderNumber = 1
) => {
  try {
    const transporter = createTransporter();

    const startDate = new Date(booking.start);
    const surveyUrl = `${
      process.env.CLIENT_URL || "http://localhost:3000"
    }/survey/${surveyResponseId}`;

    const reminderText =
      reminderNumber === 1
        ? "We noticed you haven't completed our feedback survey yet."
        : "This is a friendly reminder to complete our feedback survey.";

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Survey Reminder</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your feedback is important to us</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${recipientName},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            ${reminderText} We'd really appreciate hearing about your experience from our meeting on 
            <strong>${startDate.toLocaleDateString()}</strong>.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #667eea; margin: 0 0 15px 0;">${survey.name}</h3>
            <p style="color: #666; margin: 0 0 15px 0;">${
              survey.description ||
              "Please share your thoughts about the meeting."
            }</p>
            
            <div style="text-align: center;">
              <a href="${surveyUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 10px 0;">
                📝 Complete Survey Now
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; margin: 15px 0 0 0; text-align: center;">
              This survey will take approximately ${Math.ceil(
                survey.questions.length / 2
              )} minutes to complete.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Your feedback helps us improve and provide better experiences for everyone.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 14px; margin: 0;">
              Thank you for your time!
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@workflowsuite.com",
      to: recipientEmail,
      subject: `Reminder: ${survey.name} (${
        reminderNumber === 1 ? "1st" : "2nd"
      } reminder)`,
      html: emailContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `Survey reminder email (${reminderNumber}) sent successfully:`,
      result.messageId
    );
    return result;
  } catch (error) {
    console.error("Error sending survey reminder email:", error);
    throw error;
  }
};

// Send reschedule notification
const sendRescheduleNotification = async (
  originalBooking,
  newBooking,
  recipientEmail,
  recipientName,
  recipientType
) => {
  try {
    const transporter = createTransporter();

    const originalStart = new Date(originalBooking.start);
    const newStart = new Date(newBooking.start);
    const originalEnd = new Date(originalBooking.end);
    const newEnd = new Date(newBooking.end);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Meeting Rescheduled</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your meeting has been automatically rescheduled</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${recipientName},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Your meeting <strong>"${
              originalBooking.title
            }"</strong> has been automatically rescheduled.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #ff6b6b; margin: 0 0 15px 0;">Original Meeting</h3>
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Date:</strong> 
              <span style="color: #333;">${originalStart.toLocaleDateString()}</span>
            </div>
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Time:</strong> 
              <span style="color: #333;">${originalStart.toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )} - ${originalEnd.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}</span>
            </div>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #28a745; margin: 0 0 15px 0;">New Meeting Time</h3>
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Date:</strong> 
              <span style="color: #333;">${newStart.toLocaleDateString()}</span>
            </div>
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Time:</strong> 
              <span style="color: #333;">${newStart.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })} - ${newEnd.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}</span>
            </div>
            
            ${
              newBooking.meetingLink
                ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Meeting Link:</strong> 
              <br>
              <a href="${
                newBooking.meetingLink
              }" style="color: #667eea; text-decoration: none; font-weight: bold; background: #f0f4ff; padding: 8px 16px; border-radius: 6px; display: inline-block; margin-top: 5px;" target="_blank">
                ${
                  newBooking.meetingType === "google-meet"
                    ? "🎥 Join Google Meet"
                    : newBooking.meetingType === "zoom"
                    ? "📹 Join Zoom Meeting"
                    : newBooking.meetingType === "teams"
                    ? "💻 Join Teams Meeting"
                    : "🔗 Join Meeting"
                }
              </a>
            </div>
            `
                : ""
            }
          </div>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            <strong>Reason for rescheduling:</strong> ${
              newBooking.rescheduleReason || "Automatic rescheduling"
            }
          </p>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            If this new time doesn't work for you, please contact us to arrange an alternative time.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 14px; margin: 0;">
              Thank you for your understanding!
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@workflowsuite.com",
      to: recipientEmail,
      subject: `Meeting Rescheduled: ${originalBooking.title}`,
      html: emailContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      "Reschedule notification email sent successfully:",
      result.messageId
    );
    return result;
  } catch (error) {
    console.error("Error sending reschedule notification email:", error);
    throw error;
  }
};

module.exports = {
  sendBookingConfirmation,
  sendOwnerNotification,
  sendSurveyInvitation,
  sendSurveyReminder,
  sendRescheduleNotification,
};
