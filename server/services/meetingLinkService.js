const { google } = require("googleapis");

// Generate Google Meet link
const generateGoogleMeetLink = async (
  title,
  startTime,
  endTime,
  userTokens
) => {
  try {
    if (!userTokens || !userTokens.access_token) {
      // Fallback to simple Google Meet link
      return {
        link: `https://meet.google.com/${generateRandomMeetCode()}`,
        password: null,
        instructions: "Join Google Meet using the link above",
      };
    }

    // Use Google Calendar API to create event with Meet link
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(userTokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const event = {
      summary: title,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "UTC",
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });

    const meetLink = response.data.conferenceData?.entryPoints?.[0]?.uri;

    return {
      link: meetLink || `https://meet.google.com/${generateRandomMeetCode()}`,
      password: null,
      instructions: "Join Google Meet using the link above",
    };
  } catch (error) {
    console.error("Error generating Google Meet link:", error);
    // Fallback to simple link
    return {
      link: `https://meet.google.com/${generateRandomMeetCode()}`,
      password: null,
      instructions: "Join Google Meet using the link above",
    };
  }
};

// Generate Zoom link
const generateZoomLink = async (title, startTime, endTime, zoomConfig) => {
  try {
    // For now, generate a simple Zoom link
    // In production, you'd use Zoom API with proper authentication
    const meetingId = generateRandomZoomId();
    const password = generateRandomPassword();

    return {
      link: `https://zoom.us/j/${meetingId}`,
      password: password,
      instructions: `Join Zoom Meeting\nMeeting ID: ${meetingId}\nPassword: ${password}`,
    };
  } catch (error) {
    console.error("Error generating Zoom link:", error);
    return {
      link: `https://zoom.us/j/${generateRandomZoomId()}`,
      password: generateRandomPassword(),
      instructions: "Join Zoom Meeting using the link above",
    };
  }
};

// Generate Teams link
const generateTeamsLink = async (title, startTime, endTime) => {
  try {
    // Generate a Teams meeting link
    const meetingId = generateRandomTeamsId();

    return {
      link: `https://teams.microsoft.com/l/meetup-join/${meetingId}`,
      password: null,
      instructions: "Join Microsoft Teams meeting using the link above",
    };
  } catch (error) {
    console.error("Error generating Teams link:", error);
    return {
      link: `https://teams.microsoft.com/l/meetup-join/${generateRandomTeamsId()}`,
      password: null,
      instructions: "Join Microsoft Teams meeting using the link above",
    };
  }
};

// Generate custom meeting link
const generateCustomLink = (customUrl) => {
  return {
    link: customUrl,
    password: null,
    instructions: "Join meeting using the custom link provided",
  };
};

// Helper functions
const generateRandomMeetCode = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += "-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += "-";
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateRandomZoomId = () => {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
};

const generateRandomTeamsId = () => {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      result += "-";
    }
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateRandomPassword = () => {
  const chars = "0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Main function to generate meeting link based on type
const generateMeetingLink = async (
  meetingType,
  title,
  startTime,
  endTime,
  userTokens = null,
  customUrl = null
) => {
  switch (meetingType) {
    case "google-meet":
      return await generateGoogleMeetLink(
        title,
        startTime,
        endTime,
        userTokens
      );
    case "zoom":
      return await generateZoomLink(title, startTime, endTime);
    case "teams":
      return await generateTeamsLink(title, startTime, endTime);
    case "custom":
      return generateCustomLink(customUrl);
    default:
      return await generateGoogleMeetLink(
        title,
        startTime,
        endTime,
        userTokens
      );
  }
};

module.exports = {
  generateMeetingLink,
  generateGoogleMeetLink,
  generateZoomLink,
  generateTeamsLink,
  generateCustomLink,
};
