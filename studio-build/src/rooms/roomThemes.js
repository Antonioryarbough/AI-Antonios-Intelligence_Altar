// roomThemes.js — browser global window.BabyRayRoomThemes
// Maps roomId patterns to CSS custom property overrides + a display name.
// Pattern matching: exact match first, then prefix match, then default.

(function () {
  // Each theme overrides the CSS vars defined in lobby.html :root
  const THEMES = {
    // ── Default altar (gold/black) ──────────────────────────────────────────
    "altar-default": {
      label: "The Altar",
      accent: "#d4af37",
      accentGlow: "rgba(212,175,55,0.12)",
      accentLine: "rgba(212,175,55,0.28)",
      accentMuted: "#b79b52",
      accentCream: "#f7e7b6",
      ink: "#20160a",
      bodyBg: "radial-gradient(circle at top, rgba(212,175,55,0.12), transparent 32%), linear-gradient(180deg,#050505 0%,#090909 100%)"
    },

    // ── Pisces Ghost room (deep ocean blue/violet) ──────────────────────────
    "room-ghost": {
      label: "Ghost Waters",
      accent: "#7dd3fc",
      accentGlow: "rgba(125,211,252,0.1)",
      accentLine: "rgba(125,211,252,0.25)",
      accentMuted: "#5ba8cc",
      accentCream: "#e0f2fe",
      ink: "#030d1a",
      bodyBg: "radial-gradient(circle at top, rgba(56,189,248,0.14), transparent 36%), linear-gradient(180deg,#020b17 0%,#06101e 100%)"
    },

    // ── First Lady room (rose gold / deep purple) ───────────────────────────
    "room-firstlady": {
      label: "First Lady's Court",
      accent: "#f9a8d4",
      accentGlow: "rgba(249,168,212,0.1)",
      accentLine: "rgba(249,168,212,0.28)",
      accentMuted: "#c084ab",
      accentCream: "#fdf2f8",
      ink: "#1a0514",
      bodyBg: "radial-gradient(circle at top, rgba(249,168,212,0.12), transparent 34%), linear-gradient(180deg,#0f0010 0%,#150018 100%)"
    },

    // ── Fire signs room (Aries / Leo / Sagittarius) ─────────────────────────
    "room-fire": {
      label: "Fire Cipher",
      accent: "#fb923c",
      accentGlow: "rgba(251,146,60,0.12)",
      accentLine: "rgba(251,146,60,0.3)",
      accentMuted: "#c2622a",
      accentCream: "#fff7ed",
      ink: "#1c0800",
      bodyBg: "radial-gradient(circle at top, rgba(251,146,60,0.15), transparent 35%), linear-gradient(180deg,#0d0300 0%,#120600 100%)"
    },

    // ── Earth signs room (Taurus / Virgo / Capricorn) ───────────────────────
    "room-earth": {
      label: "Earth Council",
      accent: "#86efac",
      accentGlow: "rgba(134,239,172,0.1)",
      accentLine: "rgba(134,239,172,0.25)",
      accentMuted: "#5a9e72",
      accentCream: "#f0fdf4",
      ink: "#021208",
      bodyBg: "radial-gradient(circle at top, rgba(74,222,128,0.12), transparent 34%), linear-gradient(180deg,#020e05 0%,#041008 100%)"
    },

    // ── Air signs room (Gemini / Libra / Aquarius) ──────────────────────────
    "room-air": {
      label: "Air Frequency",
      accent: "#a5f3fc",
      accentGlow: "rgba(165,243,252,0.1)",
      accentLine: "rgba(165,243,252,0.25)",
      accentMuted: "#67b8c4",
      accentCream: "#ecfeff",
      ink: "#011a1e",
      bodyBg: "radial-gradient(circle at top, rgba(103,232,249,0.12), transparent 34%), linear-gradient(180deg,#01101a 0%,#021520 100%)"
    },

    // ── Water signs room (Cancer / Scorpio / Pisces) ────────────────────────
    "room-water": {
      label: "Deep Current",
      accent: "#818cf8",
      accentGlow: "rgba(129,140,248,0.1)",
      accentLine: "rgba(129,140,248,0.25)",
      accentMuted: "#6066b8",
      accentCream: "#eef2ff",
      ink: "#05030f",
      bodyBg: "radial-gradient(circle at top, rgba(99,102,241,0.13), transparent 34%), linear-gradient(180deg,#04020e 0%,#070412 100%)"
    },

    // ── Antonio's personal room prefix: room-antonio-* (gold + cyan) ────────
    "room-antonio": {
      label: "Antonio's Studio",
      accent: "#00e0ff",
      accentGlow: "rgba(0,224,255,0.1)",
      accentLine: "rgba(0,224,255,0.25)",
      accentMuted: "#0099bb",
      accentCream: "#e0feff",
      ink: "#00080a",
      bodyBg: "radial-gradient(circle at top, rgba(0,224,255,0.12), transparent 34%), linear-gradient(180deg,#000d10 0%,#001215 100%)"
    }
  };

  /**
   * Match a roomId to the best theme.
   * Priority: exact → prefix (longest match) → default
   */
  function getTheme(roomId) {
    if (!roomId) return THEMES["altar-default"];
    if (THEMES[roomId]) return THEMES[roomId];

    // Prefix match — longest wins
    const prefixMatch = Object.keys(THEMES)
      .filter((k) => k !== "altar-default" && roomId.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];

    return prefixMatch ? THEMES[prefixMatch] : THEMES["altar-default"];
  }

  /**
   * Apply a theme by writing CSS custom properties onto :root.
   * Call this once on lobby mount with the resolved roomId.
   */
  function applyTheme(roomId) {
    const theme = getTheme(roomId);
    const root = document.documentElement;

    root.style.setProperty("--gold", theme.accent);
    root.style.setProperty("--cream", theme.accentCream);
    root.style.setProperty("--ink", theme.ink);
    root.style.setProperty("--line", theme.accentLine);
    root.style.setProperty("--muted", theme.accentMuted);
    root.style.setProperty("--accent-glow", theme.accentGlow);
    document.body.style.background = theme.bodyBg;

    return theme;
  }

  window.BabyRayRoomThemes = { getTheme, applyTheme, THEMES };
})();
