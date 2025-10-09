# AI Antonio's Intelligence - Where Magic Happens

A Pisces-centered music coaching and AI collaboration platform featuring real-time video streaming, rhyme coaching, beat marketplace, and zodiac-based creative development.

## 🌟 Features

- **Pisces-Centered AI Coaching**: Antonio's digital twin using Google's Generative AI
- **Real-time Video Streaming**: WebRTC camera integration
- **Beat Marketplace**: Upload, preview, and purchase beats
- **Voice Recording**: Audio recording with MediaRecorder API
- **Text-to-Speech**: AI voice synthesis
- **Zodiac Council**: Creative guidance based on astrological signs
- **Real-time Chat**: Firebase-powered live conversations

## 🚀 Quick Setup

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd ai-antonios-intelligence
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required API keys and services:
- **Firebase Project**: Create at [Firebase Console](https://console.firebase.google.com)
- **Google AI API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Firebase Setup

1. Create a new Firebase project
2. Enable Firestore Database
3. Enable Authentication (Anonymous auth)
4. Copy your Firebase config to `.env` file

### 4. Run Locally

```bash
# Development server
npm run dev

# Or simple HTTP server
npm run serve
```

### 5. Deploy to Vercel

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

## 🛠 Project Structure

```
├── index.html              # Main application file
├── assets/                 # Beat files and images
├── .env.example           # Environment variables template
├── vercel.json            # Vercel deployment config
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🎯 Environment Variables

| Variable | Description | Required |
|----------|-------------|-----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | ✅ |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | ✅ |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | ✅ |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | ✅ |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | ✅ |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | ✅ |
| `VITE_GOOGLE_AI_API_KEY` | Google Generative AI API key | ✅ |
| `VITE_APP_ID` | Application identifier | ✅ |

## 🎵 How It Works

### Pisces Philosophy
This platform embodies Antonio's creative perspective through a Pisces-centered approach:
- **Intuition over rigid structure**
- **Emotional depth in creative expression** 
- **Flow state cultivation**
- **Water element metaphors**
- **Empathetic feedback and encouragement**

### Technical Architecture
- **Single-page vanilla HTML/CSS/JavaScript application**
- **Firebase Realtime Database** for live chat and user status
- **Video.js** for beat previews and media handling
- **WebRTC** for live camera streaming
- **MediaRecorder API** for audio recording

## 🔧 Troubleshooting

### Camera/Microphone Issues
- Ensure HTTPS (required for WebRTC)
- Check browser permissions
- Close other applications using camera/mic

### Firebase Connection Issues
- Verify all environment variables are set
- Check Firebase project permissions
- Ensure Firestore and Auth are enabled

### API Rate Limits
- Google AI API has rate limits
- Implement retry logic (already included)
- Consider upgrading API quotas for production

## 🚀 Deployment Notes

### Vercel Configuration
- Uses `vercel.json` for routing configuration
- Environment variables must be set in Vercel dashboard
- Supports single-page application routing

### Security Considerations
- API keys should never be committed to git
- Use environment variables for all sensitive data
- Consider implementing server-side API proxy for production

## 📱 Browser Support

- **Chrome/Chromium**: Full support
- **Firefox**: Full support  
- **Safari**: WebRTC limitations on iOS
- **Edge**: Full support

## 🎨 Theming

The platform uses a dark gold/brown theme with:
- Primary: `#1f1b0a` (dark background)
- Accent: `#ffc400` (gold buttons/borders) 
- Cards: `rgba(80, 70, 30, 0.7)` with backdrop blur

## 📞 Support

For issues or questions about Antonio's Intelligence platform, please check the existing issues or create a new one in the GitHub repository.

---

**"AI" = Antonio's Intelligence, NOT Artificial Intelligence** 🌊✨
