# AI Enterprise Studio

A fully functional multimedia collaboration platform with video calling, recording, chat, and more.

## ✨ Features

- 📞 **Peer-to-peer video calling** (via PeerJS - FREE!)
- 🎤 **Audio recording** with download
- 💬 **Real-time chat** powered by Firebase
- 💝 **Dating-Friendly Gift Shop** - Buy & send animated gifts with custom MP4 support
- 👤 **Customizable avatars** and profiles
- ♈ **Zodiac Council** - 12 customizable characters
- 🎵 **Beat/audio playback** with Video.js
- 💳 **Payment integration** (Stripe links)
- 📱 **Mobile responsive**
- 🎬 **Live gift animations** - Recipients see MP4 animations when gifts arrive

## 🚀 Quick Deploy (5 minutes)

See [QUICKSTART.md](QUICKSTART.md) for fastest setup.

For detailed setup: [SETUP.md](SETUP.md)

## 💰 Cost

**100% FREE!** Uses Firebase free tier and free PeerJS cloud server.

### PeerJS Options

By default the app uses the public PeerJS cloud host (`0.peerjs.com`). For more control you can self-host:

1. Run `node peer-server/server.js` (creates a local signaling server).
2. Change `peerJsConfig` in `public/config.js` to:

```javascript
const peerJsConfig = { host: 'localhost', port: 9000, path: '/myapp', secure: false };
```
3. For remote users, place behind HTTPS (e.g. Nginx reverse proxy) and use that domain in `peerJsConfig`.
4. Keep the path value (`/myapp`) matching both sides.

Fallback logic (optional) you can implement:

```javascript
// Try public host first, then local
const peerJsConfig = navigator.onLine ?
  { host: '0.peerjs.com', port: 443, path: '/', secure: true } :
  { host: 'localhost', port: 9000, path: '/myapp', secure: false };
```

## 📂 Project Structure

```text
Studio/
├── public/
│   ├── index.html      # Main app
│   └── config.js       # Firebase & PeerJS config
├── firebase.json       # Firebase hosting config
├── firestore.rules     # Database security rules
├── .firebaserc         # Firebase project link
├── package.json        # Dependencies
├── SETUP.md           # Detailed setup guide
└── QUICKSTART.md      # 5-minute deploy guide
├── src/tailwind.css   # Tailwind input (with theme styles)
├── public/styles.css  # Built CSS output
├── tailwind.config.js # Tailwind configuration
└── postcss.config.js  # PostCSS (autoprefixer)
```

## 🎨 CSS & Tailwind Build

Inline styles were migrated into a proper build pipeline.

### Install Dependencies

```powershell
npm install
```

If Tailwind packages are not yet installed (first time after cloning):

```powershell
npm install tailwindcss postcss autoprefixer --save-dev
```

### Dev (Watch CSS)

```powershell
npm run dev:css
```

### Production Build

```powershell
npm run build:css
```
This generates/overwrites `public/styles.css` with a minified bundle.

### HTML Reference
`public/index.html` now links to `/styles.css` (no CDN script). Tailwind directives + custom theme live in `src/tailwind.css`.

### Customizing Theme Colors
Adjust `tailwind.config.js` under `theme.extend.colors` and rebuild.

## 🛠️ Local Development
```bash
firebase serve
```
Visit http://localhost:5000

## 🌐 Deploy
```bash
firebase deploy
```

## 📝 Configuration Required
1. Update `public/config.js` with your Firebase credentials
2. Update `.firebaserc` with your Firebase project ID

## 🤝 Contributing
This is a personal project but feel free to fork and customize!

## 📄 License
MIT
