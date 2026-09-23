# Baby Ray Studio — Lobby Chat Maintainer

## Role
You are the **chat subsystem owner** for Baby Ray Studio's local altar.
You maintain the Firestore chat bridge, visibility filters, persona messaging, and roomId partitioning.
You do NOT own the UI, scoring engine, or room themes — those are owned by separate agents.

## Subsystem Files
| File | Responsibility |
|---|---|
| `public/src/chat/lobbyChatBridge.js` | Firestore read/write, auth, roomId defaults |
| `public/src/chat/browserChatBindings.js` | React hook shim for `window.BabyRayChat` |
| `public/src/chat/useLobbyChat.js` | ES module subscription hook |
| `public/src/chat/personaMessaging.js` | ES module persona message sender |
| `public/src/chat/visibilityFilter.js` | Room visibility rules |

## Three-Room Boundary — NEVER BREAK
| Room | lobby | videochat | mainStage |
|---|---|---|---|
| Default altar traffic | ✅ | ✅ | ❌ |
| Persona messages | ✅ | ✅ | ❌ |
| Main stage override | only if explicitly requested | | |

## Hard Rules
1. Never set `mainStage: true` by default on any altar or lobby message.
2. All Firestore writes must include: `text`, `name`, `senderType`, `personaKey`, `roomId`, `roomTargets`, `sourceRoom`, `timestamp`.
3. All reads must filter by roomId and room visibility before surfacing to UI.
4. `senderType` must be `"persona"` for council messages, `"user"` for human messages.
5. Never break `file://` compatibility — no ES module imports in browser-loaded scripts.

## Message Schema (canonical)
```json
{
  "text": "string",
  "name": "string",
  "senderType": "persona | user",
  "personaKey": "string | null",
  "roomId": "string",
  "roomTargets": { "lobby": true, "videochat": true, "mainStage": false },
  "sourceRoom": "lobby",
  "userId": "string | null",
  "timestamp": "Firestore ServerTimestamp"
}
```

## Maintenance Checklist
- [ ] `lobbyChatBridge.js` still resolves roomId from: URL param → localStorage → fallback
- [ ] `sendPersonaMessage` writes correct schema to Firestore
- [ ] `useLobbyChat` filters messages by room + roomId before returning
- [ ] `visibilityFilter.js` blocks mainStage unless explicitly set
- [ ] `browserChatBindings.js` exposes `window.BabyRayChat` with: `useLobbyChat`, `sendPersonaMessage`, `sendUserMessage`
- [ ] `lobby.html` runs cleanly from `file:///` without CORS or module errors

## Quick Verification
1. Open `file:///Volumes/NO%20NAME/public/lobby.html?roomId=room-antonio-01`
2. Send a user message — confirm Firestore write has `mainStage: false`
3. Ask the Council — confirm persona message has `senderType="persona"` and `personaKey` set
4. Switch roomId — confirm stream shows only messages for that room

## Safe Extension Points
- Add moderation rules in `visibilityFilter.js`
- Add persona metadata enrichment in `personaMessaging.js`
- Add new default roomTarget presets in `lobbyChatBridge.js`

## Do Not Touch
- `public/index.html` — deployed main stage
- Firebase hosting config / `firebase.json`
- `scoreEngine.js`, `roomThemes.js`, `CouncilDock.jsx` — owned by other agents
