# AI Enterprise Studio - Copilot Instructions

## Architecture Overview

**Single-Page Application (SPA)** - Everything lives in `public/index.html` with Firebase SDKs loaded via ESM imports. No build step for JS; Tailwind CSS pipeline (`src/tailwind.css` → `public/styles.css`).

**Key Components:**
- **Firebase Firestore**: Realtime database with `experimentalAutoDetectLongPolling: true` for network resilience.
- **PeerJS**: WebRTC signaling (cloud `0.peerjs.com` for production, local `localhost:9000` for dev).
- **Video.js**: Beat/media playback.
- **Shepherd.js**: Guided user tour.
- **Stripe**: Payment links (no backend webhooks yet; simulated unlock for demo).
- **Anonymous Auth**: Users auto-login via `signInAnonymously()` on page load.

**Version Constraints:**
- **Firebase SDK**: Must use version **11.6.1** (ESM CDN) to ensure compatibility.
- **Tailwind CSS**: v3.x (via build step).

## Data Architecture

### Firestore Schema Pattern
```
artifacts/{appId}/
  ├── users/{userId}/
  │   ├── profile/main (name, imageUrl, zodiacName)
  │   ├── gifts/unlocked (giftId: true/false map)
  │   └── chat_messages/ (realtime chat)
  └── public/data/
      ├── characters/{characterId} (gooddgirl, producer)
      ├── zodiac_council/{signId} (12 zodiac avatars, assignedUserId)
      ├── sent_gifts/ (gift transaction log)
      ├── custom_gifts/{giftId} (admin MP4 uploads)
      └── status/gooddgirl (approval state)
```

**Critical**: Always use `appId` constant from `config.js` in Firestore paths. Security rules enforce user-owned data separation.

## Development Workflows

### Deploy to Firebase Hosting
```powershell
firebase deploy --only hosting
```
**Do this after any HTML/CSS changes**. Build CSS first if Tailwind modified.

### CSS Development
```powershell
npm run dev:css    # Watch mode for Tailwind compilation
npm run build:css  # Production minified build
```
Never edit `public/styles.css` directly—it's auto-generated from `src/tailwind.css`.

### Local PeerJS Testing
```powershell
npm run peer:server  # Starts signaling server on localhost:9000
```
App auto-detects `localhost` hostname and switches to local PeerJS config.

### Firestore Rules Deployment
```powershell
firebase deploy --only firestore:rules
```

## Project-Specific Conventions

### Image URL Normalization
`normalizeImageUrl()` function converts user-pasted links (Imgur, Dropbox, GitHub, GDrive) into direct image URLs. **Always call this before saving image URLs to Firestore**.

Example: `https://imgur.com/abc123` → `https://i.imgur.com/abc123.jpg`

### Gift Shop Pattern
1. **Purchase Flow**: `data-stripe-url` on Buy button → Stripe checkout → (webhook needed for production) → `unlockGift(giftId)` sets `{giftId: true}` in Firestore
2. **Send Flow**: User selects recipient + gift → `addDoc()` to `sent_gifts` collection → **lock gift again** via `setDoc({giftId: false})`
3. **Receive Flow**: `onSnapshot()` listener detects new gifts → `playGiftAnimation()` shows overlay

**Key**: Gifts are consumable (re-lock after send). User must repurchase to send again.

### Admin Features
- **Admin User ID**: Hardcoded as `Joiqo90r7wWQ920NFesvAGMroFJ2`.
- **Zodiac Assignment**: Admin can assign specific users to "sit" on the Zodiac Council (promotes user profile to public zodiac slot).
- **Custom Gifts**: Admin can upload MP4s via the UI, which saves to Firebase Storage and creates a Firestore entry.

### Error Handling Strategy
- **Camera/Mic**: Specific handling for `NotAllowedError` (permission denied), `NotFoundError` (no device), and `NotReadableError` (in use).
- **Images**: `img` tags have `onerror` handlers to replace broken links with placeholders and alert the user about CORS/hotlinking.
- **Global**: `window.addEventListener('error')` and `unhandledrejection` handlers catch all errors.
- **UI**: Use `showMessage()` for user-friendly popups instead of `alert()`.

### PeerJS Reconnection
Automatic reconnect on disconnect:
```javascript
peer.on('disconnected', () => {
  try { peer.reconnect(); } catch (e) { console.error('Reconnect failed', e); }
});
```

## Critical Files & Their Roles

- **`public/config.js`**: Single source of truth for Firebase, PeerJS, and app constants (`appId`, `GOODDGIRL_USER_ID`).
- **`firestore.rules`**: Auth-gated access; `users/{userId}` = private, `public/data` = shared.
- **`GIFT_SHOP.md`**: Complete gift system documentation.
- **`DYNAMIC_RECIPIENTS.md`**: Dynamic recipient system for open gifting.
- **`ENABLE_STORAGE.md`**: Instructions for enabling Firebase Storage.

## Testing & Debugging

### Common Issues
1. **Images not loading**: Check CORS (use direct links like `i.imgur.com`). Error handler guides users.
2. **PeerJS disconnects**: Cloud host can be flaky; suggest local server for dev (`npm run peer:server`).
3. **Storage AccessDenied**: Firebase Storage not enabled. Show `ENABLE_STORAGE.md` instructions.
4. **Gifts not unlocking**: Check Firestore rules, verify `appId` matches, inspect `unlocked` document.

### Local Testing
```powershell
firebase serve  # Hosts on http://localhost:5000
```
Use localhost PeerJS server alongside this for full local testing.

## Important Constraints

- **No TypeScript/JSX**: Pure HTML + vanilla JS with ES modules.
- **No Backend**: Serverless architecture; all logic in client + Firestore.
- **Storage Optional**: Built-in gifts use GIFs; custom MP4s require Storage setup.
- **Stripe Webhooks**: Currently simulated; production needs webhook endpoint to call `unlockGift()`.
- **Mobile First**: Tailwind responsive classes (`sm:`, `md:`) used throughout.

## Making Changes

### Adding New Gifts
1. Add HTML gift item in `#gift-gallery` with unique `data-gift-id`.
2. Update `giftNames` object in `updateUnlockedGiftsUI()`.
3. Add fallback GIF in `giftAnimations` object in `playGiftAnimation()`.
4. Create Stripe product + add payment URL to `data-stripe-url`.

### Modifying Firestore Schema
1. Update `firestore.rules` if new paths added.
2. Deploy rules: `firebase deploy --only firestore:rules`.
3. Update all `doc()` and `collection()` references in HTML.
4. Consider backward compatibility (use `merge: true` in `setDoc()`).

### Styling Changes
1. Edit `src/tailwind.css` (not `public/styles.css`).
2. Run `npm run build:css`.
3. Test locally with `firebase serve`.
4. Deploy with `firebase deploy --only hosting`.

## External Dependencies

- **PeerJS Cloud**: Free but no SLA; can switch to self-hosted.
- **Stripe**: Payment links only (no API integration yet).
- **Firebase Free Tier**: Sufficient for moderate use; monitor quotas.
- **Video.js CDN**: No local copy; requires internet.
- **Shepherd.js CDN**: For guided tours.

## Key Gotchas

- `appId` constant must match across all Firestore queries.
- Gifts lock after sending—this is intentional (monetization pattern).
- Anonymous auth UIDs persist per browser (clear cookies to reset).
- Video autoplay may fail on mobile without user gesture.
- Firestore `serverTimestamp()` used for all timestamps (client time unreliable).
- **Dynamic recipients**: Dropdown is populated by `upsertRecipient()` called from Firestore listeners; do not hardcode recipient options in HTML.
