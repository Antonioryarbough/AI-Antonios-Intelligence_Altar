# 🌊 AI Antonio's Intelligence Altar

**SeniorBMafias Bangahs&BadDGirls**

> *"AI" = Antonio's Intelligence, NOT Artificial Intelligence*

A Pisces-centered music coaching and creative platform where Antonio's Intelligence guides your rhyme journey through intuition, empathy, and creative flow.

## ✨ Features

- 🎵 **AI-Powered Rhyme Coaching** - Get personalized guidance from Antonio's digital twin
- 🎧 **Beat Marketplace** - Professional beats for your creative projects  
- 📹 **Live Camera Streaming** - Share your creative process in real-time
- 🎙️ **Audio Recording** - Capture your rhymes and verses
- 💬 **Real-time AI Chat** - Instant feedback and encouragement
- ♓ **Pisces Philosophy** - Creativity flows like water through this platform
- 🌟 **Zodiac Council** - Spiritual guidance for all signs

## 🚀 Quick Start

### Option 1: Demo Mode (No Setup Required)
Just open `index.html` in a modern browser! The platform works in demo mode with limited features - perfect for exploring the interface.

### Option 2: Full Setup (5 minutes)
Get the complete experience with AI features and cloud sync:

1. **Get API Keys** (see [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions)
   - [Firebase Console](https://console.firebase.google.com) - for real-time data
   - [Google AI Studio](https://makersuite.google.com/app/apikey) - for AI coaching

2. **Configure Locally**
   ```bash
   cp config.example.js config.js
   # Edit config.js with your API keys
   ```

3. **Run Locally**
   ```bash
   npm run serve
   # Visit http://localhost:8000
   ```

4. **Deploy to Vercel** (optional)
   - See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step guide
   - Add environment variables in Vercel dashboard
   - Deploy with one click!

## 📖 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete setup and deployment guide
- **[.env.local.example](.env.local.example)** - Environment variables template
- **[config.example.js](config.example.js)** - Client-side configuration template

## 🔒 Security

- API keys are never committed to git
- Configuration files are in `.gitignore`
- Environment variables for production
- Firebase security rules included in deployment guide

## 🎨 The Pisces Philosophy

This platform embodies Antonio's creative perspective through Pisces characteristics:
- **Intuition** over rigid rules
- **Empathy** in every interaction
- **Creativity** flowing like water
- **Flow state** cultivation
- **Emotional depth** in guidance

## 🌊 Development

```bash
# Install dependencies (optional - none required for basic use)
npm install

# Start local server
npm run serve

# Open in browser
# Visit http://localhost:8000
```

## 🐛 Troubleshooting

**Site loads but features don't work?**
- You're in demo mode! Add API keys for full functionality
- Check browser console for specific messages

**Camera/microphone not working?**
- Allow permissions when prompted
- Check browser settings if denied
- Use Chrome, Firefox, or Safari for best compatibility

**"Firebase not initialized" error?**
- Check your Firebase configuration
- Verify API keys are correct
- See [DEPLOYMENT.md](DEPLOYMENT.md) for setup help

## 💡 Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Styling**: Tailwind CSS
- **Video**: Video.js player
- **Backend**: Firebase (Firestore + Authentication)
- **AI**: Google Generative AI (Gemini)
- **Deployment**: Vercel-ready

## 📱 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ⚠️ Requires WebRTC for camera streaming
- ⚠️ Requires MediaRecorder API for audio recording

## 🤝 Contributing

This platform channels Antonio's creative vision. Feel free to explore and adapt the Pisces philosophy to your own creative journey.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Antonioryarbough/AI-Antonios-Intelligence_Altar/issues)
- **Firebase Docs**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)

---

*Let your creativity flow like water* 🌊✨
