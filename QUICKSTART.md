# 🚀 Quick Start - Deploy in 5 Minutes!

## Step 1: Install Firebase Tools
```bash
npm install -g firebase-tools
```

## Step 2: Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project" → Name it → Create
3. Enable **Authentication** → Anonymous sign-in
4. Enable **Firestore Database** → Test mode
5. Enable **Hosting** → Get started

## Step 3: Get Your Firebase Config
1. Project Settings → Your apps → Web app icon
2. Copy the config values

## Step 4: Update Config File
Open `public/config.js` and paste your Firebase values:
```javascript
const firebaseConfig = {
    apiKey: "PASTE_YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

## Step 5: Update Project ID
Open `.firebaserc` and replace `YOUR_PROJECT_ID` with your actual project ID.

## Step 6: Deploy! 🎉
```bash
firebase login
firebase deploy
```

Your app is now LIVE at: `https://YOUR_PROJECT_ID.web.app`

---

## 📞 How to Video Call

1. Open your app in a browser
2. Copy your **Peer ID** (shown on screen)
3. Share the app URL + your Peer ID with a friend
4. They enter your Peer ID and click "Call Peer"
5. You're connected! 🎥

## 💰 100% FREE!
- Firebase Free Tier: ✅ Up to 10GB storage, 50K reads/day
- PeerJS Cloud Server: ✅ Completely free
- Total cost: **$0/month**

## ❓ Need Help?
See `SETUP.md` for detailed instructions.
