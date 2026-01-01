# 💪 Workout Challenge Tracker PWA

A Progressive Web App for tracking monthly workout challenges with friends!

## 🚀 Features

- ✅ Password-protected login (no signup required)
- 📱 Works offline as a PWA on iOS and Android
- 📊 Track multiple challenges with counters
- 🎯 Set daily goals for each challenge
- 📈 View stats and progress
- 💾 Data stored locally on each device
- 🎨 Mobile-first responsive design

## 🔐 Default Password

The default group password is: **workout2026**

To change it, edit the `GROUP_PASSWORD` variable in [app.js](app.js#L2):

```javascript
const GROUP_PASSWORD = 'workout2026'; // Change this to your desired password
```

## 📦 Setup Instructions

### Quick Start (Local Testing)

1. Open `icon-generator.html` in your browser
2. Download the generated `icon-192.png` and `icon-512.png` files
3. Save them in the project root folder
4. Open `index.html` in your browser to test the app

### Deploy to Web

The app needs to be served over HTTPS for PWA features to work on mobile devices.

#### Option 1: GitHub Pages (Free)

1. Create a new GitHub repository
2. Upload all files to the repository
3. Go to Settings → Pages
4. Select your branch and save
5. Your app will be live at `https://yourusername.github.io/repository-name/`

#### Option 2: Netlify (Free)

1. Go to [Netlify](https://netlify.com)
2. Drag and drop your project folder
3. Your app will be live instantly with a custom URL

#### Option 3: Vercel (Free)

1. Go to [Vercel](https://vercel.com)
2. Import your project
3. Deploy with one click

### Alternative: Local Server with ngrok

For quick testing with real PWA features:

```powershell
# Install a simple HTTP server (if you have Python)
python -m http.server 8000

# Or use Node.js http-server
npx http-server -p 8000

# Then use ngrok to expose it
ngrok http 8000
```

Visit the HTTPS URL provided by ngrok on your phone.

## 📱 Installing on Mobile

### iOS (iPhone/iPad)

1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android

1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Install app" or "Add to Home Screen"
4. Tap "Install"

## 🎮 How to Use

### For Users

1. **Login**: Enter your name and the group password
2. **Add Challenge**: Click "+ Add New Challenge" to create a counter
3. **Track Progress**: Use + and - buttons to update your count
4. **View Stats**: Check your total reps and goals reached
5. **Reset/Delete**: Manage your challenges as needed

### For Admin (You)

- Share the group password with your friends
- Each person picks their own name
- Data is stored separately for each user on their device
- To reset everything, users can clear browser data or logout

## 🗂️ File Structure

```
Counter/
├── index.html              # Main HTML file
├── styles.css             # All styles
├── app.js                 # App logic and state management
├── manifest.json          # PWA configuration
├── service-worker.js      # Offline support
├── icon.svg               # Source icon
├── icon-192.png          # App icon (192x192)
├── icon-512.png          # App icon (512x512)
├── icon-generator.html   # Tool to generate PNG icons
└── README.md             # This file
```

## 🔧 Customization

### Change Password

Edit [app.js](app.js#L2):
```javascript
const GROUP_PASSWORD = 'your-new-password';
```

### Change Colors

Edit CSS variables in [styles.css](styles.css#L7):
```css
:root {
    --primary-color: #4CAF50;
    --primary-dark: #388E3C;
    --secondary-color: #2196F3;
    /* ... */
}
```

### Change App Name

Edit [manifest.json](manifest.json):
```json
{
  "name": "Your App Name",
  "short_name": "App Name"
}
```

## 💾 Data Storage

- All data is stored in browser localStorage
- Each user's data is separate based on their username
- Data persists across sessions
- To backup data: Use browser DevTools → Application → Local Storage
- To clear data: Logout or clear browser data

## 🐛 Troubleshooting

### App won't install on mobile
- Make sure you're using HTTPS (not HTTP or file://)
- Try using Chrome on Android or Safari on iOS
- Check that icon files exist and are valid PNG files

### Data not saving
- Check if localStorage is enabled in browser
- Make sure you're logged in
- Try refreshing the page

### Password not working
- Check that you edited the `GROUP_PASSWORD` in app.js correctly
- Clear browser cache and try again

### Icons not showing
- Run icon-generator.html and download the PNG files
- Make sure icon-192.png and icon-512.png are in the root folder
- Or use an online tool to convert icon.svg to PNG

## 📝 License

Free to use and modify for personal use.

## 🤝 Support

Have fun tracking your workouts with friends! 💪

---

Made with ❤️ for fitness enthusiasts
