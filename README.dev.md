Dev server for local testing

1) Add a Firebase web config file (optional) named `.firebase_config.json` with your project's firebase config JSON. Example:

{
  "apiKey": "...",
  "authDomain": "raydent-16571.firebaseapp.com",
  "projectId": "raydent-16571",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}

2) Install dependencies and run the dev server:

```bash
npm install
npm run build:css
npm run dev
```

3) Open http://localhost:8000 in your browser. The server injects `window.__firebase_config` and `window.__app_id` so the app boots without editing `index.html`.

Notes:
- Keep `.firebase_config.json` out of source control (add to `.gitignore`).
- If you still have peer-to-peer/network issues, check browser console for WebRTC ICE candidate errors and ensure the Firebase project uses appropriate Firestore rules and hosting origins (https://raydent-16571.web.app) are allowed.

## Pre-push checklist (Vercel + Firebase)

Before pushing changes to GitHub (which triggers Vercel deploy):

1) Run local app check
- Build Tailwind production CSS: `npm run build:css`
- One-command pre-deploy run (build + auto-port smoke): `npm run predeploy:check`
- `npm run smoke:start`
- If port 8000 is busy: `npm run smoke:start:8080`
- Auto-pick open port (falls back to any free port if common ports are busy): `npm run smoke:auto`
- Open `http://localhost:8000`
- Verify sign-in, camera/mic permissions, chat, and WebRTC call flow.

2) Verify Vercel readiness
- Confirm `vercel.json` exists in project root.
- Confirm changes are committed to the correct branch.

3) Verify Firebase auth domains
- In Firebase Console → Authentication → Settings → Authorized domains
- Ensure your Vercel production domain is listed (for example `your-project.vercel.app`).

4) Push and validate deployment
- Push to GitHub.
- Wait for Vercel deployment status `Ready`.
- Run a smoke test on the Vercel URL (auth + camera/mic + WebRTC).

## Known non-blocking diagnostics

Some editor diagnostics are expected in this project and do not block deployment:

- `playsinline` compatibility warning for Firefox: kept intentionally for better iOS/Safari video behavior.
- `backdrop-filter` compatibility advisory: `-webkit-backdrop-filter` has been added where used.

Treat these as informational unless your target browser matrix changes.
