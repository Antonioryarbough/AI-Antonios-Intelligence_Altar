// GraduationSection — browser-global React component (no ES imports)
// Loaded via <script type="text/babel"> before main.jsx
//
// After students complete their training at the Lobby Music Production School,
// this component renders the graduation path to the other studios.

function GraduationSection() {
  const studios = [
    { label: "🎤 Main Stage", desc: "Perform your track — video calls, beats, gifts", url: "https://studio-9757662699-74931.web.app" },
    { label: "🎬 Camera Studio", desc: "Scene tabs, desktop sharing, advanced WebRTC", url: "https://studio-2fb13.web.app" },
    { label: "👥 Community", desc: "AI Zodiac Council, gifts, leaderboard", url: "https://raydent-16571.web.app" }
  ];

  return (
    <div className="graduation-section">
      <h2>🎓 Graduation Path</h2>
      <p>
        Ready to graduate from the Lobby Music Production School? Click a studio to
        continue your journey. Each studio has its own vibe — bring your bars and
        rap your arguments to interest the crowd.
      </p>
      <div className="graduation-grid">
        {studios.map((s) => (
          <a
            key={s.url}
            href={s.url}
            className="graduation-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            {s.label}
            <span className="grad-label">{s.desc}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
