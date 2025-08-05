# Firestore Database Setup Guide

## Overview

This project has been converted from MongoDB to Google Firestore. Follow these steps to complete the setup.

## Prerequisites

1. **Firebase Project**: You already have a Firebase project (`calender-automation-d6216`)
2. **Service Account**: You need to create a service account for server-side access

## Setup Steps

### 1. Create Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `calender-automation-d6216`
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file and replace the content in `serviceAccountKey.json`

### 2. Enable Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Choose **Start in test mode** (for development)
4. Select a location (preferably close to your users)

### 3. Configure Security Rules

In Firestore Console, update the security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Workflows - users can only access their own
    match /workflows/{workflowId} {
      allow read, write: if request.auth != null && 
        resource.data.owner == request.auth.uid;
    }
    
    // Bookings - users can only access their own
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && 
        resource.data.owner == request.auth.uid;
      // Allow public read for booking pages
      allow read: if true;
    }
    
    // Forms - users can only access their own
    match /forms/{formId} {
      allow read, write: if request.auth != null && 
        resource.data.owner == request.auth.uid;
    }
    
    // Surveys - users can only access their own
    match /surveys/{surveyId} {
      allow read, write: if request.auth != null && 
        resource.data.owner == request.auth.uid;
    }
    
    // Survey responses - allow public write for submissions
    match /surveyResponses/{responseId} {
      allow read, write: if request.auth != null;
      allow create: if true; // Allow anonymous survey submissions
    }
    
    // Auto-reschedule rules
    match /autoReschedules/{ruleId} {
      allow read, write: if request.auth != null && 
        resource.data.owner == request.auth.uid;
    }
    
    // Booking pages - allow public read
    match /bookingPages/{pageId} {
      allow read: if true;
      allow write: if request.auth != null && 
        resource.data.owner == request.auth.uid;
    }
    
    // Availability settings
    match /availability/{availabilityId} {
      allow read, write: if request.auth != null && 
        resource.data.user == request.auth.uid;
    }
    
    // Workflow runs
    match /workflowRuns/{runId} {
      allow read, write: if request.auth != null && 
        resource.data.user == request.auth.uid;
    }
    
    // Webhooks
    match /webhooks/{webhookId} {
      allow read, write: if request.auth != null && 
        resource.data.owner == request.auth.uid;
    }
    
    // Form responses
    match /formResponses/{responseId} {
      allow read, write: if request.auth != null;
      allow create: if true; // Allow public form submissions
    }
    
    // Health check
    match /_health/{document} {
      allow read, write: if true;
    }
  }
}
```

### 4. Environment Variables

Update your `.env` file with:

```env
FIREBASE_PROJECT_ID=calender-automation-d6216
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

### 5. Collections Structure

The following Firestore collections will be created automatically:

- `users` - User accounts and profiles
- `workflows` - Workflow definitions
- `workflowRuns` - Workflow execution history
- `bookings` - Meeting bookings
- `bookingPages` - Public booking pages
- `forms` - Custom forms
- `formResponses` - Form submissions
- `surveys` - Feedback surveys
- `surveyResponses` - Survey submissions
- `autoReschedules` - Auto-reschedule rules
- `availability` - User availability settings
- `webhooks` - Webhook configurations

### 6. Key Changes from MongoDB

1. **Document IDs**: Firestore uses string IDs instead of ObjectIds
2. **Queries**: Limited query capabilities compared to MongoDB
3. **Relationships**: No built-in populate - implemented manually
4. **Transactions**: Different syntax for atomic operations
5. **Indexes**: Automatically created for simple queries

### 7. Testing the Setup

1. Start the server: `npm run dev`
2. Check the console for "✅ Firestore Connected"
3. Try creating a user account
4. Verify data appears in Firestore Console

## Important Notes

- **Service Account Key**: Keep `serviceAccountKey.json` secure and never commit it to version control
- **Security Rules**: Start with test mode, then implement proper security rules for production
- **Indexes**: Firestore will suggest creating indexes for complex queries
- **Billing**: Monitor usage as Firestore has different pricing than MongoDB

## Troubleshooting

1. **Connection Issues**: Verify service account key and project ID
2. **Permission Errors**: Check Firestore security rules
3. **Query Errors**: Some MongoDB queries may need adjustment for Firestore
4. **Performance**: Consider denormalizing data for better Firestore performance

## Migration from MongoDB

If you have existing MongoDB data, you'll need to:

1. Export data from MongoDB
2. Transform the data structure (ObjectIds → strings)
3. Import into Firestore using the Firebase Admin SDK
4. Update any hardcoded ObjectId references in your code