# 🎬 AI Antonios Intelligence — Central Studio Directory

One repo, **five** studios + a Vercel front page. This doc is the canonical
"central directory" + the exact commands to mint each studio's URL so they can
discover and call one another (Copilot's rhyme: *one source of truth, one
routing booth*).

## The directory (also in `hubs.config.js`)

| Studio | URL | Project (alias) | Platform | Status | Deploy |
|---|---|---|---|---|---|
| **Front page / Music Video Maker** ("AI Antonios Intelligence") | `https://<your-vercel-project>.vercel.app` | `studio-9757662699-74931` (mainstage) | **Vercel** | ✅ live (after Vercel deploy) | `npx vercel --prod` |
| BabyRay Studio — Camera / Scene tabs | `https://studio-2fb13.web.app` | `studio-2fb13` (alias `studio`) | Firebase Hosting | ✅ live | `npm run deploy:studio` |
| Community | `https://raydent-16571.web.app` | `raydent-16571` (alias `default`) | Firebase Hosting | ✅ live | `firebase deploy --only hosting --config firebase.json` |
| Video Chat / Lobby | `https://lobby-raydent.web.app` | `raydent-16571` (alias `lobby`) | Firebase Hosting | ⚠️ mint URL below | `npm run deploy:lobby` |
| `babyray-front` (alias `frontpage`) | — | `babyray-front` | — | ❌ orphaned (no config; the front page uses Vercel instead) | n/a |

## How the front page links the other apps
`public/index.html` (served by Vercel via `mainstage-build/`) has a sticky
hub bar `#ai-hubs-launcher` under the header that links **Studio (Camera)**,
**Community**, **BabyRay Studio**, and **Video Chat (Lobby)** — all as
`target="_blank" rel="noopener noreferrer"` so they open alongside the hub.

## 🆕 Minting the Lobby URL (this is the missing URL)

`firebase.lobby.json` previously had **no `"site"`**, so the Lobby deployed to
`raydent-16571`'s **default** site — the *same* site as Community
(`firebase.json` sets `site: "raydent-16571"`). They collided and the Lobby had
no distinct URL. Fixed by giving it a **named Hosting site** `lobby-raydent`.

From the repo root, in a terminal (you have the only auth'd shell here):

```bash
firebase login                       # only once
# 1) Create the named site ONCE (console is simplest):
#    Firebase console -> your `raydent-16571` project -> Hosting -> "Add site" -> name it lobby-raydent
#    (or, if your firebase-tools supports it: firebase hosting:sites:create lobby-raydent)
# 2) Build + deploy the Lobby app to that site:
npm run deploy:lobby                  # = npm run build:videochat && firebase deploy --only hosting --project lobby -c firebase.lobby.json
# 3) Verify:
open https://lobby-raydent.web.app
```

That mints `https://lobby-raydent.web.app` as the Lobby's permanent URL. The
front-page launcher already points at it.

## Deploy everything (order matters — front page depends on nothing; others are standalone)

```bash
# Front page (Vercel) — run once Vercel is linked/authed:
npx vercel --prod

# All four Firebase studios:
npm run deploy:all                  # mainstage + studio + videochat(lobby)

# Or individually:
npm run deploy:studio             # https://studio-2fb13.web.app
firebase deploy --only hosting --config firebase.json      # https://raydent-16571.web.app (Community)
npm run deploy:lobby              # https://lobby-raydent.web.app (Video Chat / Lobby)
```

## Discovery / cross-studio calls
Every Firebase app shares `appId: 'ai-enterprise-studio'` and the PeerJS cloud
host (`0.peerjs.com`), so all four studios share **one PeerJS room namespace**
by design. That is the mechanism behind "studios can discover and call each
other" — a peer that appears in Studio (Camera) can be called from the Lobby,
etc. To make the directory a *runtime* registry (so apps read `window.HUBS`
instead of hard-coded hrefs), add `"hubs.config.js:hubs.config.js"` to the
`babyray-classic` build profile's `extra` in `scripts/build-target.mjs` and drop
`<script src="hubs.config.js">` in the front page `<head>`.

## Notes / gotchas
- `.vercelignore` deliberately keeps `mainstage-build` deployable on Vercel while
  ignoring `studio-build`, `videochat-build`, `public`, and `src` there.
- `babyray-front` is an orphaned alias in `.firebaserc`; do not deploy to it —
  the front page belongs on Vercel (`mainstage`).
- Anonymous auth + Firestore (test mode) must be enabled in each Firebase
  console project's settings.
