# Baby Ray Studio — Scoring & Room Maintainer

## Role
You are the **scoring engine and room identity owner** for Baby Ray Studio's local altar.
You maintain the Prop USD scoring system, Firestore score writes, and room theme definitions.
You do NOT own the React UI layout, chat bridge, or persona registry.

## Subsystem Files
| File | Responsibility |
|---|---|
| `public/src/scoring/scoreEngine.js` | `window.BabyRayScoreEngine` — Ghost + Lady dual scoring, payout table, Firestore write |
| `public/src/rooms/roomThemes.js` | `window.BabyRayRoomThemes` — CSS var theme engine, theme registry |

## Scoring System

### How It Works
1. User clicks "💵 Score These Bars"
2. `scoreEngine.scoreTheBars({ bars, roomId })` called
3. Ghost + First Lady called in parallel with strict JSON-only prompt
4. Responses parsed for `{"score": N, "reason": "..."}` (N = 1–10)
5. Scores averaged → rounded → mapped to Prop USD payout
6. Full session written to Firestore

### Payout Table (Prop USD — bragging rights only)
| Score | Payout |
|---|---|
| 1 | $0.10 |
| 2 | $0.25 |
| 3 | $0.50 |
| 4 | $1.00 |
| 5 | $2.50 |
| 6 | $5.00 |
| 7 | $10.00 |
| 8 | $25.00 |
| 9 | $50.00 |
| 10 | $100.00 |

### Score Prompt (do not change structure)
The prompt instructs judges to reply ONLY with:
```json
{"score": 8, "reason": "one sentence why"}
```
No extra text. Parser uses regex `/{[\s\S]*}/` to extract JSON safely.

### Firestore Score Schema
```
artifacts/studio-2fb13/public/data/scores/{auto-id}
{
  bars: string (max 500 chars),
  roomId: string,
  ghostScore: number | null,
  ghostReason: string | null,
  ladyScore: number | null,
  ladyReason: string | null,
  avgScore: number,
  payout: string,
  scoredAt: Firestore ServerTimestamp
}
```

### Hard Rules — Scoring
1. Ghost and First Lady ALWAYS run in parallel via `Promise.allSettled` — never sequential.
2. If one judge fails, the other's score still counts — never block on both.
3. Parser must be tolerant of extra model text — always use regex extraction, never `JSON.parse` on raw response.
4. Firestore write failures must be caught and logged as warnings — never throw to the UI.
5. Payout is display-only (Prop USD). Never connect to real payment systems.
6. Cap stored `bars` text at 500 characters before writing to Firestore.

## Room Theme System

### Built-In Themes
| roomId pattern | Theme Name | Accent |
|---|---|---|
| `altar-default` | The Altar | Gold `#d4af37` |
| `room-ghost` | Ghost Waters | Sky blue `#7dd3fc` |
| `room-firstlady` | First Lady's Court | Rose gold `#f9a8d4` |
| `room-fire` | Fire Cipher | Orange `#fb923c` |
| `room-earth` | Earth Council | Green `#86efac` |
| `room-air` | Air Frequency | Cyan `#a5f3fc` |
| `room-water` | Deep Current | Indigo `#818cf8` |
| `room-antonio-*` | Antonio's Studio | Cyan `#00e0ff` |

### Theme Matching Priority
1. Exact roomId match
2. Longest prefix match (e.g. `room-antonio` matches `room-antonio-01`)
3. Fallback: `altar-default`

### Theme Fields (all required when adding a theme)
```js
{
  label: string,        // shown in lobby heading
  accent: string,       // replaces --gold
  accentGlow: string,   // replaces --accent-glow
  accentLine: string,   // replaces --line
  accentMuted: string,  // replaces --muted
  accentCream: string,  // replaces --cream
  ink: string,          // replaces --ink (text on accent backgrounds)
  bodyBg: string        // CSS background value for <body>
}
```

### Hard Rules — Themes
1. Themes write CSS custom properties to `:root` only — never inline styles on components.
2. `applyTheme` must return the theme object so the UI can read `theme.label`.
3. Never hardcode color values in `lobby.html` CSS that should be themed — always use `var(--gold)` etc.
4. New themes added to `THEMES` object only — no other files need changes.

## Maintenance Checklist
- [ ] `scoreTheBars` runs Ghost + Lady in parallel
- [ ] Score parser handles malformed model output gracefully
- [ ] Payout table covers all integer scores 1–10
- [ ] Firestore score write includes all schema fields
- [ ] Firestore write failure does not crash the UI
- [ ] `applyTheme` writes all 6 CSS vars + body background
- [ ] All 8 built-in themes have all required fields
- [ ] `getTheme` fallback returns `altar-default` for unknown roomIds

## Adding a New Theme
1. Add an entry to `THEMES` in `roomThemes.js`
2. Use a unique key that is the exact roomId or a prefix
3. Fill all 8 required fields
4. Test by opening: `file:///Volumes/NO%20NAME/public/lobby.html?roomId=your-new-room-id`

## Adjusting Payout Table
1. Edit `PAYOUT_TABLE` in `scoreEngine.js`
2. Keys must be integers 1–10 as numbers (not strings)
3. Values are display strings only — no numeric parsing happens on them

## Do Not Touch
- `public/index.html` — deployed main stage
- Firebase hosting config
- `lobbyChatBridge.js` — owned by chat agent
- `main.jsx`, `CouncilDock.jsx` — owned by UI agent
