# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "workout-tracker" (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

## Step 2: Register Your App

1. In your Firebase project overview (home page), look for **"Get started by adding Firebase to your app"**
2. You should see platform icons - if you see them, click the **`</>`** icon (Web)
3. **If you don't see icons:**
   - Click the **gear icon** (⚙️) next to "Project Overview" at the top left
   - Select **"Project settings"**
   - Scroll down to **"Your apps"** section
   - Click the **`</>`** button (it says "Web" when you hover)
4. Give your app a nickname: "Workout Tracker PWA"
5. **Check the box** "Also set up Firebase Hosting" (optional but recommended)
6. Click **"Register app"**
7. You'll see code with a `firebaseConfig` object - **copy everything between the curly braces `{}`**
8. Click "Continue to console"

## Step 3: Set Up Realtime Database

1. In Firebase Console, go to **Build** → **Realtime Database**
2. Click "Create Database"
3. Choose a location (e.g., `us-central1`)
4. Start in **test mode** for now
5. Click "Enable"

## Step 4: Configure Rules (Security)

In the Realtime Database Rules tab, paste this:

```json
{
  "rules": {
    "leaderboard": {
      "$monthKey": {
        "$userId": {
          ".read": true,
          ".write": true
        }
      }
    }
  }
}
```

Click "Publish" to save.

## Step 5: Add Config to Your App

Open `app.js` and replace the firebaseConfig section (around line 4) with your actual values:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",  // Your actual API key
    authDomain: "workout-tracker-xxxxx.firebaseapp.com",
    databaseURL: "https://workout-tracker-xxxxx-default-rtdb.firebaseio.com",
    projectId: "workout-tracker-xxxxx",
    storageBucket: "workout-tracker-xxxxx.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

## Step 6: Test

1. Refresh your app
2. Check browser console - should see "Firebase initialized successfully"
3. Log in and add a challenge
4. Check Firebase Console → Realtime Database - you should see your data appear!
5. Have a friend log in on their device - they'll see your score automatically!

## Notes

- The app works offline - data syncs when back online
- Test mode rules allow anyone to read/write for 30 days
- For production, implement proper authentication and rules
- Free tier includes: 1GB storage, 10GB/month downloads, 100 simultaneous connections

## Troubleshooting

If you see "Firebase not configured" in console:
- Make sure you replaced ALL placeholder values in firebaseConfig
- Check that the databaseURL matches your database region
- Verify rules are published in Firebase Console
