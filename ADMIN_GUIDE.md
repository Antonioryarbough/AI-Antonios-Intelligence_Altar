# AI ANTONIOS INTELLIGENCE - Admin Guide

## Quick Start

**Your Live Site:** https://raydent-16571.web.app  
**Admin Password:** `pisces2024`

---

## Admin Features

### 🔓 How to Enable Admin Mode

1. Visit https://raydent-16571.web.app
2. Scroll down to "The Zodiac Council" section
3. Click the **🔓 Admin Mode** button
4. Enter password: `pisces2024`
5. Admin controls will appear (camera buttons 📷)

### 📷 How to Change Pictures

#### Change First Lady Picture (GoodDGirl):
1. Enable Admin Mode (see above)
2. Find the **📷 Change Photo** button under GoodDGirl's avatar
3. Click it
4. Select an image file (JPG, PNG, etc.) from your computer
5. Image updates instantly for everyone!

#### Change Zodiac Council Member Pictures:
1. Enable Admin Mode
2. Each zodiac sign will show a **📷** button
3. Click the 📷 button for the sign you want to update
4. Select an image file
5. Image updates instantly for all visitors!

### 🔒 Lock Admin Mode
- Click **🔒 Lock Admin** to hide the edit buttons
- No password needed to lock
- Pictures remain visible to everyone

---

## Important Notes

✅ **Public Visibility:**
- All uploaded pictures are **visible to everyone** who visits the site
- Perfect for showcasing your business and artists
- Changes appear instantly for all visitors

🔒 **Admin Protection:**
- Only you can **change** pictures (requires password)
- Visitors can **see** pictures but cannot edit them

💾 **Automatic Saving:**
- Pictures are automatically saved to the cloud (Firestore)
- They persist across sessions
- No need to re-upload when you refresh the page

---

## Deploying Updates

If you make code changes to `index.html`, deploy them with this command:

```bash
FIREBASE_HOSTING_UPLOAD_CONCURRENCY=1 npx -y node@20 ./node_modules/firebase-tools/lib/bin/firebase.js deploy --only hosting
```

**What this does:**
- Uploads your changes to Firebase Hosting
- Makes them live at https://raydent-16571.web.app
- Takes about 30-60 seconds

---

## Changing the Admin Password

1. Open `index.html` in your editor
2. Find line 947: `const ADMIN_PASSWORD = "pisces2024";`
3. Change `"pisces2024"` to your new password
4. Save the file
5. Deploy using the command above

---

## App Features Overview

### 🎥 Video Call (P2P)
- **Start Call:** Creates a call ID you can share
- **Answer Call:** Paste someone's call ID to join
- **Hang Up:** Ends the call

### 🎵 Beats for Sale
- **Purchase to Unlock:** Simulates buying a beat
- Unlocks the studio section

### 🎤 AI ANTONIOS INTELLIGENCE Chat
- Chat with your AI twin "Gemini"
- Provides rhyme coaching and creative feedback
- **🔊 Text-to-Speech:** Click speaker icon on AI messages to hear them
- **✨ Generate Rhyme:** Creates a custom Pisces-themed rhyme

### 📹 Record & Master
- **Record:** Records audio from your microphone
- **Stop:** Stops recording
- **Save Recording:** Downloads the audio file

### 👤 Avatar Generation
- **✨ Generate New Look:** AI creates a new Pisces Ghost avatar
- Uses Google's Imagen API

### 🌟 GoodDGirl Approval
- **Approve GoodDGirl:** Grants camera stream access
- Changes status from "Waiting" to "Approved"

---

## Troubleshooting

### "Incorrect password" message
- Make sure you're typing exactly: `pisces2024` (lowercase)
- No spaces before or after

### Pictures not showing after upload
- Hard refresh the page: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+F5** (Windows)
- Check browser console (F12) for errors

### Can't deploy changes
- Make sure you're in the project folder: `/Users/tonebone/Projects/AI-Antonios-Intelligence_Altar-main`
- Check that Node.js is installed: `node --version`

### Camera not working
- Allow camera permissions in your browser
- Close other apps using the camera (Zoom, FaceTime, etc.)
- Try refreshing the page

---

## Technical Details

### Where Pictures Are Stored
- **Firestore Database Path:** `artifacts/{appId}/public/data/avatars/`
- **First Lady:** `firstlady` document
- **Zodiac Signs:** `zodiac_aries`, `zodiac_taurus`, etc.

### Image Format
- Images are stored as **base64 data URLs**
- No separate file hosting needed
- Embedded directly in Firestore

### Firestore Rules
```javascript
// Public read/write access for avatars
match /artifacts/{appId}/public/data/{document=**} {
  allow read, write: if true;
}
```

---

## Support & Resources

- **Firebase Console:** https://console.firebase.google.com/project/raydent-16571/overview
- **Documentation Files:** 
  - `README_WEBRTC_FIX.md` - WebRTC video calling guide
  - `WEBRTC_COMPLETE_GUIDE.md` - Detailed technical reference
  - `DEPLOY_WEBRTC_FIX.md` - Deployment instructions

---

## Quick Reference

| Action | Steps |
|--------|-------|
| Enable Admin | Click 🔓 Admin Mode → Enter `pisces2024` |
| Change First Lady | Admin Mode → 📷 Change Photo → Select image |
| Change Zodiac Sign | Admin Mode → Click 📷 on sign → Select image |
| Lock Admin | Click 🔒 Lock Admin |
| Deploy Changes | Run deploy command in terminal |
| Change Password | Edit line 947 in index.html → Deploy |

---

**Need help?** All uploaded pictures are instantly visible to everyone at https://raydent-16571.web.app - perfect for personalizing your business and showcasing your artists!
