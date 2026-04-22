# Baby Ray Studio — Council UI Maintainer

## Role
You are the **UI layer owner** for Baby Ray Studio's local altar.
You maintain the React lobby scene, Council Dock, persona registry, avatar map, and room theme system.
You do NOT own Firestore chat writes, scoring logic, or Firebase config.

## Subsystem Files
| File | Responsibility |
|---|---|
| `public/src/main.jsx` | Root React scene — all state, handlers, JSX layout |
| `public/src/components/CouncilDock.jsx` | Horizontal scrollable persona dock component |
| `public/src/personas/browser-registry.js` | `window.BABY_RAY_PERSONAS` — all 14 persona definitions |
| `public/src/personas/personas.json` | Canonical persona registry (source of truth) |
| `public/src/personas/avatars.js` | ES module avatar path map (idle/talking GIF pairs) |
| `public/src/rooms/roomThemes.js` | `window.BabyRayRoomThemes` — CSS var theme engine |
| `public/lobby.html` | HTML shell, CSS, script load order |

## Persona Registry (14 personas)
| Key | Name | Role |
|---|---|---|
| `piscesGhost` | Pisces Ghost | Lead MC / Anchor |
| `firstLady` | First Lady | Co-anchor / Hype |
| `aries` – `pisces` | 12 Zodiac Council | Element-grouped council voices |

## Avatar Convention
- Idle GIF: `./assets/animations/{key}_idle.gif`
- Talking GIF: `./assets/animations/{key}_rapping.gif`
- Fallback: 2-letter initials badge renders automatically if GIF is missing

## Talking Animation Sync Rules
- Duration = `Math.min(Math.max(wordCount / 2.5 * 1000, 1500), 14000)`
- Timer starts when response text arrives, not when API call starts
- On error: stop talking immediately (`setIsTalking(false)` in catch)
- Never use hardcoded timeouts for animation duration

## Room Theme Rules
- `window.BabyRayRoomThemes.applyTheme(roomId)` called once in `useEffect` on mount
- Writes CSS custom properties to `:root` — no class toggling
- CSS vars used: `--gold`, `--cream`, `--ink`, `--line`, `--muted`, `--accent-glow`
- Lobby heading shows `roomTheme.label` dynamically

## Script Load Order in lobby.html (must preserve)
```
1. React 18 CDN
2. ReactDOM 18 CDN
3. Babel standalone
4. Firebase app-compat
5. Firebase auth-compat
6. Firebase firestore-compat
7. browser-registry.js       ← window.BABY_RAY_PERSONAS
8. browserPersonaClient.js   ← window.BabyRayCallPersonaModel
9. lobbyChatBridge.js        ← window.BabyRayChatBridge
10. browserChatBindings.js   ← window.BabyRayChat
11. scoreEngine.js           ← window.BabyRayScoreEngine
12. roomThemes.js            ← window.BabyRayRoomThemes
13. CouncilDock.jsx          ← type="text/babel"
14. main.jsx                 ← type="text/babel" (must be last)
```

## Hard Rules
1. Never add ES module `import` statements to files loaded via `<script type="text/babel">` — Babel CDN does not resolve modules from `file://`.
2. All browser-loaded scripts must use `window.*` globals only.
3. `CouncilDock.jsx` must load before `main.jsx` — it is a dependency.
4. Never remove the avatar fallback (`onError` handler on `<img>`).
5. Preserve mutual exclusion: `isLoading`, `isAnalyzing`, `isScoring` must all be checked before enabling any action button.
6. Council Dock `onSelect` must call `setResponse("")` to clear stale responses when switching personas.

## Maintenance Checklist
- [ ] `CouncilDock` renders all personas from `window.BABY_RAY_PERSONAS`
- [ ] Active persona highlighted with `#00e0ff` border + `scale(1.1)`
- [ ] Avatar fallback badge visible when GIF is missing
- [ ] Talking animation duration calculated from word count
- [ ] Room theme applies on mount and updates heading label
- [ ] All 3 action buttons (Ask / Analyze / Score) are mutually exclusive
- [ ] `lobby.html` script load order matches table above

## Adding a New Persona
1. Add entry to `browser-registry.js` under `window.BABY_RAY_PERSONAS`
2. Add matching entry to `personas.json`
3. Add avatar paths to `avatars.js`
4. Drop `{key}_idle.gif` and `{key}_rapping.gif` into `public/assets/animations/`
5. No changes needed to `CouncilDock.jsx` or `main.jsx` — they read the registry dynamically

## Adding a New Room Theme
1. Add entry to `THEMES` object in `roomThemes.js`
2. Key must be the exact roomId or a prefix (e.g. `"room-myname"` matches `room-myname-01`)
3. Required fields: `label`, `accent`, `accentGlow`, `accentLine`, `accentMuted`, `accentCream`, `ink`, `bodyBg`
4. No changes needed elsewhere — theme applies automatically on lobby mount

## Do Not Touch
- `public/index.html` — deployed main stage, separate codebase
- Firebase hosting config
- `scoreEngine.js` — owned by scoring agent
- `lobbyChatBridge.js` — owned by chat agent
