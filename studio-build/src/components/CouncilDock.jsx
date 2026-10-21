// CouncilDock — browser-global React component (no ES imports)
// Loaded via <script type="text/babel"> before main.jsx
// Depends on: window.BABY_RAY_PERSONAS

function CouncilDock({ activeKey, onSelect }) {
  const avatarBasePath = "./assets/animations";
  const personaMap = window.BABY_RAY_PERSONAS || {};
  const personas = Object.keys(personaMap).map((key) => ({
    key,
    ...personaMap[key]
  }));

  return (
    <div className="council-dock">
      {personas.map((p) => {
        const isActive = p.key === activeKey;
        return (
          <div
            key={p.key}
            className={"council-dock-item" + (isActive ? " active" : "")}
            onClick={() => onSelect(p.key)}
            title={p.role || p.name}
          >
            <img
              src={`${avatarBasePath}/${p.key}_idle.gif`}
              alt={p.name}
              className="council-dock-avatar"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div
              className="council-dock-avatar-fallback"
              style={{ display: "none" }}
              aria-hidden="true"
            >
              {(p.name || p.key).slice(0, 2).toUpperCase()}
            </div>
            <div className="council-dock-label">{p.name}</div>
          </div>
        );
      })}
    </div>
  );
}
