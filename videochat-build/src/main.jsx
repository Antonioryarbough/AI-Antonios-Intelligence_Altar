const { useMemo, useState, useEffect, useRef } = React;

const personas = window.BABY_RAY_PERSONAS || {};
const avatarBasePath = "./assets/animations";

function getPersona(key) {
  return personas[key] || null;
}

function getInstruction(key) {
  return personas[key]?.systemInstruction || "";
}

function getAllPersonas() {
  return Object.keys(personas).map((key) => ({
    key,
    ...personas[key]
  }));
}

function getAvatarPair(key) {
  return {
    idle: `${avatarBasePath}/${key}_idle.gif`,
    talking: `${avatarBasePath}/${key}_rapping.gif`
  };
}

const DEFAULT_ANIMATION_PROFILE = {
  wordsPerSecond: 2.6,
  minMs: 1400,
  maxMs: 15000,
  leadInMs: 220,
  tailMs: 380
};

const PERSONA_ANIMATION_PROFILES = {
  piscesGhost: { wordsPerSecond: 2.2, minMs: 1800, maxMs: 17000, leadInMs: 280, tailMs: 520 },
  firstLady: { wordsPerSecond: 3.0, minMs: 1300, maxMs: 13000, leadInMs: 180, tailMs: 300 },
  aries: { wordsPerSecond: 3.3, minMs: 1200, maxMs: 12000, leadInMs: 160, tailMs: 220 },
  taurus: { wordsPerSecond: 2.3, minMs: 1700, maxMs: 15500, leadInMs: 260, tailMs: 480 },
  gemini: { wordsPerSecond: 3.5, minMs: 1100, maxMs: 11500, leadInMs: 140, tailMs: 220 },
  cancer: { wordsPerSecond: 2.4, minMs: 1650, maxMs: 15000, leadInMs: 240, tailMs: 460 },
  leo: { wordsPerSecond: 3.1, minMs: 1400, maxMs: 13500, leadInMs: 180, tailMs: 300 },
  virgo: { wordsPerSecond: 2.7, minMs: 1300, maxMs: 13000, leadInMs: 190, tailMs: 320 },
  libra: { wordsPerSecond: 2.8, minMs: 1300, maxMs: 13000, leadInMs: 180, tailMs: 300 },
  scorpio: { wordsPerSecond: 2.5, minMs: 1550, maxMs: 14500, leadInMs: 220, tailMs: 440 },
  sagittarius: { wordsPerSecond: 3.2, minMs: 1200, maxMs: 12500, leadInMs: 160, tailMs: 240 },
  capricorn: { wordsPerSecond: 2.4, minMs: 1600, maxMs: 14500, leadInMs: 230, tailMs: 430 },
  aquarius: { wordsPerSecond: 3.0, minMs: 1200, maxMs: 13000, leadInMs: 170, tailMs: 280 },
  pisces: { wordsPerSecond: 2.3, minMs: 1750, maxMs: 16000, leadInMs: 260, tailMs: 500 }
};

function getAnimationProfile(key) {
  return {
    ...DEFAULT_ANIMATION_PROFILE,
    ...(PERSONA_ANIMATION_PROFILES[key] || {})
  };
}

function calculateTalkDurationMs(text, key) {
  const profile = getAnimationProfile(key);
  const trimmed = (text || "").trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 1;
  const rawMs = wordCount / profile.wordsPerSecond * 1000 + profile.leadInMs + profile.tailMs;
  return {
    profile,
    wordCount,
    durationMs: Math.min(Math.max(rawMs, profile.minMs), profile.maxMs)
  };
}

function LobbyScene() {
  const allPersonas = useMemo(() => getAllPersonas(), []);
  const [activeKey, setActiveKey] = useState(allPersonas[0]?.key || "piscesGhost");
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isTalking, setIsTalking] = useState(false);
  const [animState, setAnimState] = useState("idle");
  const [showAnimDebug, setShowAnimDebug] = useState(false);
  const [animDebug, setAnimDebug] = useState({
    personaKey: null,
    phase: "idle",
    wordCount: 0,
    durationMs: 0,
    wordsPerSecond: 0,
    startedAt: null,
    endsAt: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [councilReactions, setCouncilReactions] = useState([]);
  const [isScoring, setIsScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [status, setStatus] = useState("Local altar online.");
  const roomId = window.BabyRayChatBridge?.getLobbyRoomId?.() || "altar-default";
  const [roomTheme, setRoomTheme] = useState(null);

  useEffect(() => {
    if (window.BabyRayRoomThemes) {
      const theme = window.BabyRayRoomThemes.applyTheme(roomId);
      setRoomTheme(theme);
    }
  }, [roomId]);
  const { messages: sharedMessages, status: chatStatus } = window.BabyRayChat?.useLobbyChat("lobby", true, roomId) || {
    messages: [],
    status: "offline"
  };

  const activePersona = getPersona(activeKey);
  const activeAvatar = getAvatarPair(activeKey);
  const talkTimerRef = useRef(null);

  function clearTalkTimer() {
    if (talkTimerRef.current) {
      window.clearTimeout(talkTimerRef.current);
      talkTimerRef.current = null;
    }
  }

  function enterIdlePhase() {
    clearTalkTimer();
    setIsTalking(false);
    setAnimState("idle");
    setAnimDebug((prev) => ({
      ...prev,
      phase: "idle",
      endsAt: Date.now()
    }));
  }

  function startSpeakingPhase(personaKey, text) {
    const { profile, wordCount, durationMs } = calculateTalkDurationMs(text, personaKey);
    const startedAt = Date.now();
    const endsAt = startedAt + durationMs;

    clearTalkTimer();
    setIsTalking(true);
    setAnimState("speaking");
    setAnimDebug({
      personaKey,
      phase: "speaking",
      wordCount,
      durationMs,
      wordsPerSecond: profile.wordsPerSecond,
      startedAt,
      endsAt
    });

    talkTimerRef.current = window.setTimeout(() => {
      setIsTalking(false);
      setAnimState("cooldown");
      setAnimDebug((prev) => ({
        ...prev,
        phase: "cooldown",
        endsAt: Date.now()
      }));

      talkTimerRef.current = window.setTimeout(() => {
        setIsTalking(false);
        setAnimState("idle");
        setAnimDebug((prev) => ({
          ...prev,
          phase: "idle",
          endsAt: Date.now()
        }));
        talkTimerRef.current = null;
      }, 260);
    }, durationMs);
  }

  useEffect(() => {
    return () => clearTalkTimer();
  }, []);


  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const systemInstruction = getInstruction(activeKey);
    if (!systemInstruction) {
      setResponse("No persona instruction found for this altar voice.");
      return;
    }

    try {
      setIsLoading(true);
      setAnimState("thinking");
      setStatus(`${activePersona?.name || activeKey} is speaking...`);

      const text = await window.BabyRayCallPersonaModel({
        systemInstruction,
        userText: input
      });

      const finalText = text || "No response returned.";
      setResponse(finalText);
      startSpeakingPhase(activeKey, finalText);

      if (window.BabyRayChat?.sendPersonaMessage) {
        await window.BabyRayChat.sendPersonaMessage({
          personaKey: activeKey,
          text: finalText,
          name: activePersona?.name || activeKey,
          roomTargets: { lobby: true, videochat: true, mainStage: false },
          roomId
        });
      }
      setStatus(`${activePersona?.name || activeKey} finished the reading.`);
    } catch (error) {
      console.error(error);
      enterIdlePhase();
      setResponse("Something glitched in the ether. Try again.");
      setStatus("The altar hit interference. Check your API path or key.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRhymeAnalyze() {
    if (!input.trim() || isAnalyzing || isLoading) return;

    // Always Ghost + First Lady, plus 3 random zodiac voices
    const zodiacKeys = allPersonas
      .filter((p) => p.key !== "piscesGhost" && p.key !== "firstLady")
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((p) => p.key);
    const analyzeKeys = ["piscesGhost", "firstLady", ...zodiacKeys];

    setCouncilReactions(analyzeKeys.map((key) => ({
      key,
      name: getPersona(key)?.name || key,
      text: null,
      done: false
    })));
    setIsAnalyzing(true);
    setStatus("Council is reading the bars...");

    const rhymePrompt = `React to these bars from the studio session. Give your honest critique, energy reading, and stamp — raw and in character, keep it under 40 words:\n\n"${input}"`;

    const calls = analyzeKeys.map(async (key) => {
      const systemInstruction = getInstruction(key);
      if (!systemInstruction) return;
      try {
        const text = await window.BabyRayCallPersonaModel({ systemInstruction, userText: rhymePrompt });
        const finalText = text || "No response.";
        setCouncilReactions((prev) =>
          prev.map((r) => (r.key === key ? { ...r, text: finalText, done: true } : r))
        );
        if (window.BabyRayChat?.sendPersonaMessage) {
          await window.BabyRayChat.sendPersonaMessage({
            personaKey: key,
            text: finalText,
            name: getPersona(key)?.name || key,
            roomTargets: { lobby: true, videochat: true, mainStage: false },
            roomId
          });
        }
      } catch {
        setCouncilReactions((prev) =>
          prev.map((r) => (r.key === key ? { ...r, text: "Signal lost.", done: true } : r))
        );
      }
    });

    await Promise.allSettled(calls);
    setIsAnalyzing(false);
    setStatus("The council has spoken.");
  }

  async function handleScore() {
    if (!input.trim() || isScoring || isLoading || isAnalyzing) return;
    if (!window.BabyRayScoreEngine) {
      setStatus("Score engine not loaded.");
      return;
    }

    setIsScoring(true);
    setScoreResult(null);
    setStatus("Ghost and First Lady are deliberating...");

    try {
      const result = await window.BabyRayScoreEngine.scoreTheBars({ bars: input, roomId });
      setScoreResult(result);
      setStatus("Score locked in.");
    } catch (err) {
      console.error(err);
      setStatus("Score session hit interference.");
    } finally {
      setIsScoring(false);
    }
  }

  async function handleSendSharedChat() {
    if (!input.trim()) return;
    if (!window.BabyRayChat?.sendUserMessage) {
      setStatus("Chat bridge offline. Message stayed local.");
      return;
    }

    await window.BabyRayChat.sendUserMessage({
      text: input,
      name: "Lobby User",
      senderType: "user",
      roomTargets: { lobby: true, videochat: true, mainStage: false },
      roomId
    });
    setInput("");
    setStatus("Message mirrored to Videochat Room stream.");
  }

  return (
    <div className="lobby-root">
      <div className="lobby-top lobby-top-stack">
        <div className="lobby-avatar">
          {activePersona ? (
            <img
              src={isTalking ? activeAvatar.talking : activeAvatar.idle}
              alt={activePersona.name}
            />
          ) : (
            <div className="lobby-avatar-placeholder">
              No persona registry loaded. Make sure browser-registry.js is available.
            </div>
          )}
        </div>

        <CouncilDock
          activeKey={activeKey}
          onSelect={(key) => {
            const p = getPersona(key);
            setActiveKey(key);
            setResponse("");
            setStatus(p ? `${p.name} is on deck.` : `${key} is on deck.`);
          }}
        />
      </div>

      <div className="lobby-bottom">
        <div className="lobby-heading">
          <h1>Baby Ray Studio — {roomTheme?.label || "Lobby"}</h1>
          <p>{activePersona ? `${activePersona.name} · ${activePersona.role}` : status}</p>
          <p>Room: {roomId} · Chat: {chatStatus}</p>
        </div>

        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSendSharedChat();
            }
          }}
          placeholder="Drop your bars, ideas, or questions here..."
        />

        <div className="lobby-actions">
          <button
            onClick={handleSendSharedChat}
            disabled={!input.trim()}
          >
            Send To Shared Chat
          </button>
          <button onClick={handleSend} disabled={isLoading || isAnalyzing || !input.trim()}>
            {isLoading ? "Channeling..." : "Ask the Council"}
          </button>
          <button
            className="analyze-btn"
            onClick={handleRhymeAnalyze}
            disabled={isAnalyzing || isLoading || isScoring || !input.trim()}
          >
            {isAnalyzing ? "Analyzing..." : "🎤 Analyze the Bars"}
          </button>
          <button
            className="score-btn"
            onClick={handleScore}
            disabled={isScoring || isLoading || isAnalyzing || !input.trim()}
          >
            {isScoring ? "Scoring..." : "💵 Score These Bars"}
          </button>
          <button
            className="debug-btn"
            onClick={() => setShowAnimDebug((prev) => !prev)}
          >
            {showAnimDebug ? "Hide Anim Debug" : "Show Anim Debug"}
          </button>
          <span className="lobby-status">{status}</span>
        </div>

        {showAnimDebug && (
          <div className="anim-debug-panel">
            <div className="anim-debug-title">Avatar Animation Debug</div>
            <div className="anim-debug-grid">
              <div>State</div><div>{animState}</div>
              <div>Persona</div><div>{animDebug.personaKey || activeKey}</div>
              <div>Words</div><div>{animDebug.wordCount}</div>
              <div>Duration</div><div>{Math.round(animDebug.durationMs)}ms</div>
              <div>Pace</div><div>{animDebug.wordsPerSecond || "-"} w/s</div>
              <div>Started</div><div>{animDebug.startedAt ? new Date(animDebug.startedAt).toLocaleTimeString() : "-"}</div>
              <div>Ends</div><div>{animDebug.endsAt ? new Date(animDebug.endsAt).toLocaleTimeString() : "-"}</div>
            </div>
          </div>
        )}

        <div className="lobby-response">
          <pre>{response || "Responses will appear here after the altar speaks."}</pre>
        </div>

        {scoreResult && (
          <div className="score-panel">
            <div className="score-panel-title">Score Session</div>
            <div className="score-verdict">
              <span className="score-avg">{scoreResult.avgScore} / 10</span>
              <span className="score-payout">{scoreResult.payout} Prop USD</span>
            </div>
            <div className="score-judges">
              {scoreResult.ghostResult && (
                <div className="score-judge-card">
                  <div className="score-judge-name">Pisces Ghost</div>
                  <div className="score-judge-score">{scoreResult.ghostResult.score}/10</div>
                  <div className="score-judge-reason">{scoreResult.ghostResult.reason}</div>
                </div>
              )}
              {scoreResult.ladyResult && (
                <div className="score-judge-card">
                  <div className="score-judge-name">First Lady</div>
                  <div className="score-judge-score">{scoreResult.ladyResult.score}/10</div>
                  <div className="score-judge-reason">{scoreResult.ladyResult.reason}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {councilReactions.length > 0 && (
          <div className="council-reactions">
            <div className="council-reactions-title">Council Reactions</div>
            {councilReactions.map((r) => (
              <div key={r.key} className={"reaction-card" + (r.done ? " done" : " pending")}>
                <div className="reaction-name">{r.name}</div>
                <div className="reaction-text">
                  {r.done ? r.text : "Reading the signal..."}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="lobby-response">
          <pre>
            {sharedMessages.length
              ? sharedMessages.map((m) => `${m.name}: ${m.text}`).join("\n\n")
              : "Shared Lobby/Videochat chat stream is waiting for messages."}
          </pre>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<LobbyScene />);
