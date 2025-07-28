# Call Reminder Setup Guide

## Overview

The call reminder feature allows the system to automatically make phone calls to meeting participants as a reminder before their scheduled meetings. This feature uses Twilio's Voice API to make automated calls with a pre-recorded message.

## Prerequisites

1. **Twilio Account**: You need a Twilio account with Voice API enabled
2. **Twilio Credentials**:
   - Account SID
   - Auth Token
   - Phone Number (for making outbound calls)

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Twilio Configuration (for SMS and Call reminders)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# WhatsApp Configuration (optional)
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
```

## How to Enable Call Reminders

### 1. User Profile Settings

1. Navigate to your Profile page
2. Scroll down to the "Reminder Preferences" section
3. Find the "Call Reminders" section
4. Check the "Enable Call" checkbox
5. Select your preferred reminder times:
   - 15 minutes before meeting
   - 1 hour before meeting
6. Click "Save Reminder Preferences"

### 2. Booking Requirements

For call reminders to work, the booking must include:

- Guest phone number (`guestPhone` field)
- Meeting details (title, start time, end time)

## How It Works

### Call Flow

1. **Scheduling**: When a booking is created, the system schedules call reminders based on user preferences
2. **Execution**: At the scheduled time, the system:
   - Checks if call reminders are enabled for the user
   - Verifies the guest has a phone number
   - Makes an automated call using Twilio Voice API
3. **Message Content**: The call includes:
   - Meeting title
   - Reminder timing (15 min or 1 hour before)
   - Meeting start time
   - Meeting link (if available)

### TwiML Message Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">
    Hello! This is your meeting reminder. Your meeting "Project Review" starts in 15 minutes at 2:00 PM.
    You can join the meeting at https://meet.google.com/abc-defg-hij
    Thank you and have a great meeting!
  </Say>
</Response>
```

## Configuration Options

### Voice Settings

- **Voice**: Alice (female voice)
- **Language**: English (US)
- **Speed**: Normal

### Reminder Timing

- **15 minutes before**: Short notice for immediate preparation
- **1 hour before**: Longer notice for travel/preparation time

## Troubleshooting

### Common Issues

1. **Calls not being made**

   - Check Twilio credentials in environment variables
   - Verify phone number format (should include country code)
   - Check Twilio account balance

2. **Invalid phone numbers**

   - Ensure phone numbers include country code (e.g., +1234567890)
   - Verify phone number format is valid for the region

3. **Call delivery failures**
   - Check if the phone number is reachable
   - Verify Twilio account has sufficient credits
   - Check Twilio logs for specific error messages

### Debugging

Enable debug logging by checking the server console for:

- "Call reminder initiated to [phone] for [type] reminder"
- "Error sending call reminder: [error details]"

## Cost Considerations

### Twilio Pricing

- **Voice calls**: Varies by country (typically $0.01-$0.05 per minute)
- **Account setup**: Free
- **Phone number**: ~$1/month per number

### Optimization Tips

- Only enable call reminders for important meetings
- Use 15-minute reminders instead of 1-hour for cost savings
- Consider combining with email/SMS for redundancy

## Security & Privacy

### Data Protection

- Phone numbers are stored securely in the database
- Calls are made only to verified booking participants
- No call recordings are stored by default

### Compliance

- Ensure compliance with local calling regulations
- Respect Do Not Call lists
- Provide opt-out mechanisms for users

## API Integration

### Making Manual Call Reminders

```javascript
const { sendCallReminder } = require("./services/reminderService");

// Send a call reminder
await sendCallReminder(booking, "15min", "+1234567890");
```

### Customizing Call Messages

Modify the `sendCallReminder` function in `server/services/reminderService.js` to customize the TwiML message content.

## Support

For issues with call reminders:

1. Check server logs for error messages
2. Verify Twilio account status
3. Test with a known good phone number
4. Contact support with specific error details
