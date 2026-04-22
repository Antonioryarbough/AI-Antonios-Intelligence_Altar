# AI Enterprise Studio - Setup Guide

## 🚀 Free Deployment Setup (Step by Step)

### Prerequisites
- Node.js installed (download from nodejs.org)
- A Google account (for Firebase)

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Create Firebase Project (FREE)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it (e.g., "ai-enterprise-studio")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 3: Enable Firebase Services

#### Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable "Anonymous" sign-in
5. Click "Save"

#### Enable Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll apply rules later)
4. Select a location (choose closest to you)
5. Click "Enable"

#### Enable Hosting
1. Go to "Hosting"
2. Click "Get started"
3. Follow the setup wizard

### Step 4: Get Firebase Configuration
1. In Firebase Console, go to "Project Settings" (gear icon)
2. Scroll down to "Your apps"
3. Click the Web icon (</>)
4. Register your app (name it anything)
5. Copy the `firebaseConfig` object

### Step 5: Configure Your App
1. Open `public/config.js`
2. Replace the placeholder values with your Firebase config:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

3. Open `.firebaserc` and replace `YOUR_PROJECT_ID` with your actual Firebase project ID

### Step 6: Login to Firebase
```bash
firebase login
```

### Step 7: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Step 8: Deploy Your App (FREE!)
```bash
firebase deploy
```

Your app will be live at: `https://YOUR_PROJECT_ID.web.app`

## 🎥 Video Calling Setup

The app uses **PeerJS** (free cloud service) for video calls. No additional setup needed!

### How Video Calls Work:
1. When you click "Call Studio", your PeerJS ID is shared
2. Other users can connect using that ID
3. Peer-to-peer video streams directly between browsers (no server costs!)

### Sharing Your App:
1. Get your app URL: `https://YOUR_PROJECT_ID.web.app`
2. Click "🔗 Invite / Share App" button in the app
3. Share the link with others
4. They can join, chat, and video call with you!

## 💰 Cost Breakdown (All FREE!)

### Firebase Free Tier Includes:
- ✅ **Hosting**: 10 GB storage, 360 MB/day bandwidth
- ✅ **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- ✅ **Authentication**: Unlimited users
- ✅ **PeerJS**: Free cloud signaling server

**Total Monthly Cost: $0** 🎉

### Limitations:
- ~1000 daily active users (Firebase limits)
- 360 MB/day bandwidth (about 30-50 concurrent users)
- Video calls are peer-to-peer (no recording storage in cloud)

## 🔧 Local Development

To test locally before deploying:
```bash
firebase serve
```
Visit: `http://localhost:5000`

## 📱 Features Included

- ✅ Real-time video calls (WebRTC + PeerJS)
- ✅ Audio recording
- ✅ File upload/sharing
- ✅ Real-time chat
- ✅ User profiles & avatars
- ✅ Gift box system
- ✅ Zodiac council customization
- ✅ Payment links (Stripe)
- ✅ Mobile responsive

## 🆘 Troubleshooting

### "Permission denied" errors
- Check Firestore rules are deployed: `firebase deploy --only firestore:rules`
- Make sure Anonymous auth is enabled

### Video call not connecting
- Check browser permissions (camera/mic)
- Try a different browser (Chrome/Firefox recommended)
- PeerJS cloud server might be down (rare) - wait a few minutes

### Can't deploy
- Make sure you're logged in: `firebase login`
- Check `.firebaserc` has correct project ID
- Verify `public/config.js` has correct Firebase config

## 🎯 Next Steps

1. Customize character names and avatars in the app
2. Update Stripe payment links (for beat purchases)
3. Invite friends to test the app
4. Monitor usage in Firebase Console

## 📧 Support

For Firebase issues: [Firebase Documentation](https://firebase.google.com/docs)
For PeerJS issues: [PeerJS Documentation](https://peerjs.com/docs)

---

**Congratulations! Your app is now live and fully functional! 🎊**
