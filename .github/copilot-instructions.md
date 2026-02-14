# AI ANTONIOS INTELLIGENCE Copilot Instructions

## Project intent
- “AI” = Antonio’s Intelligence (Pisces-centered creative coaching, empathy, flow). Keep tone aligned with that vision.

## Architecture (single-page app)
- Main app is [index.html](index.html): all UI, CSS, and JS live inline; no bundler.
- Firebase (Auth + Firestore) is the backend. WebRTC for calls, Video.js for beat playback, MediaRecorder for local recording.
- Gemini coaching is called client-side in `generateRhymeCoaching()` with a direct fetch.

## Runtime configuration
- App expects injected globals: `window.__firebase_config`, `window.__app_id`, `window.__initial_auth_token`.
- On hosting, [index.html](index.html#L940-L2345) attempts `/__/firebase/init.json` if globals are missing.
- Local dev server injects config from `.firebase_config.json` or `FIREBASE_CONFIG`.

## Firestore data patterns (preserve paths)
- Base path: `artifacts/{appId}` (appId = `__app_id` or `firebaseConfig.projectId`).
- Profiles/balance: `users/{userId}/profile/data`.
- Camera chat: `public/data/camera_chat` (ordered by `timestamp`).
- Presence: `presence/{userId}` with `devices.{deviceId}.lastSeen` heartbeats.
- Calls: `calls/{callId}` + subcollections `offerCandidates` / `answerCandidates`.

## Key flows in index.html
- Auth: anonymous by default; optional email/password + Google popup.
- Admin mode: gated by email + prompt password in `toggleAdminMode()`.
- Gifts/balance: `GIFTS` use videos in [assets/](assets/) (see [assets/README.md](assets/README.md)); balance uses Stripe checkout URLs.
- Zodiac lyrics: fetch from [assets/lyrics/](assets/lyrics/) JSON files.

## Dev workflows
- Node dev server injects Firebase globals: [dev-server.js](dev-server.js). Run `npm install` → `npm run dev` (see [README.dev.md](README.dev.md)).
- Python alternative: [dev-server.py](dev-server.py).
- Stripe checkout API (optional): [stripe-server.js](stripe-server.js) with `STRIPE_SECRET_KEY`.

## Conventions & gotchas
- Keep changes in [index.html](index.html); no build step, ES module imports from gstatic CDN.
- Firestore uses `setDoc(..., { merge: true })` and `serverTimestamp()`; avoid breaking schema.
- WebRTC signaling is Firestore-backed; don’t change collection names without updating both caller/callee logic.
