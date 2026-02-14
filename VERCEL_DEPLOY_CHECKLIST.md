# Vercel Deploy Checklist (GitHub + Firebase)

Use this each time you deploy updates.

## 1) Confirm repo is ready
- Ensure `vercel.json` exists in project root.
- Ensure your latest code is committed and pushed to the correct GitHub branch.

## 2) Deploy from Vercel
- Open Vercel dashboard.
- Select this project (or import it once if needed).
- Confirm branch tracking (usually `main`).
- Trigger deploy (or let auto-deploy run after push).

## 3) Wait for deploy success
- Open the latest deployment log.
- Confirm status is **Ready** (no build/runtime errors).
- Open the generated production or preview URL.

## 4) Firebase auth domain setup (required)
- In Firebase Console, go to Authentication > Settings > Authorized domains.
- Add your Vercel domain(s):
  - `your-project.vercel.app`
  - any preview domain you actually test on (optional)

## 5) App smoke test on Vercel URL
- Open app in browser and verify page loads.
- Test sign-in/auth state.
- Allow camera + microphone permissions.
- Test WebRTC call flow (join + receive stream).
- Test chat and Firestore reads/writes.

## 6) If using Wix as main site
- Keep Wix for landing pages.
- Add a button/link to your Vercel app URL (open in new tab).
- Do not embed in ways that block camera/mic permissions.

## 7) Quick rollback plan
- If a deploy breaks, open Vercel Deployments.
- Promote/revert to the last known good deployment.
- Re-test camera + auth immediately.

## Notes for this project
- Hosting can move to Vercel without moving Firebase backend.
- Keep Firestore paths unchanged (`artifacts/{appId}/...`).
- HTTPS is required for reliable camera/mic access.
