// scoreEngine.js — browser global window.BabyRayScoreEngine
// Asks Pisces Ghost + First Lady to each score bars 1-10,
// averages them, converts to a Prop USD payout, saves to Firestore.
// Depends on: window.BabyRayCallPersonaModel, window.BABY_RAY_PERSONAS,
//             firebase (compat SDK already loaded by lobby.html)

(function () {
  const SCORE_PROMPT = (bars) =>
    `You are a judge in a rap battle scoring session.\n` +
    `Score these bars on a scale of 1 to 10. Consider: flow, wordplay, originality, energy.\n` +
    `Reply with ONLY a JSON object like: {"score": 8, "reason": "one sentence why"}\n` +
    `No extra text. Bars:\n\n"${bars}"`;

  // Prop USD payout table (score → dollars, bragging rights only)
  const PAYOUT_TABLE = {
    1:  "$0.10",
    2:  "$0.25",
    3:  "$0.50",
    4:  "$1.00",
    5:  "$2.50",
    6:  "$5.00",
    7:  "$10.00",
    8:  "$25.00",
    9:  "$50.00",
    10: "$100.00"
  };

  function parseScorerResponse(text) {
    try {
      // Extract JSON object even if model adds a tiny comment
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return null;
      const parsed = JSON.parse(match[0]);
      const score = Math.min(10, Math.max(1, Math.round(Number(parsed.score))));
      return { score, reason: (parsed.reason || "").trim() };
    } catch {
      return null;
    }
  }

  function getPropPayout(avgScore) {
    const rounded = Math.min(10, Math.max(1, Math.round(avgScore)));
    return PAYOUT_TABLE[rounded] || "$0.00";
  }

  async function saveScoreToFirestore({ bars, roomId, ghostResult, ladyResult, avgScore, payout }) {
    if (!window.firebase || !firebase.apps.length) return;

    try {
      const db = firebase.firestore();
      await db
        .collection("artifacts")
        .doc("studio-2fb13")
        .collection("public")
        .doc("data")
        .collection("scores")
        .add({
          bars: bars.slice(0, 500), // cap stored text
          roomId: roomId || "altar-default",
          ghostScore: ghostResult?.score ?? null,
          ghostReason: ghostResult?.reason ?? null,
          ladyScore: ladyResult?.score ?? null,
          ladyReason: ladyResult?.reason ?? null,
          avgScore,
          payout,
          scoredAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (err) {
      console.warn("[scoreEngine] Firestore write failed:", err.message);
    }
  }

  /**
   * Score bars with Ghost + First Lady in parallel.
   * Returns { ghostResult, ladyResult, avgScore, payout }
   */
  async function scoreTheBars({ bars, roomId }) {
    const personas = window.BABY_RAY_PERSONAS || {};
    const ghostInstruction = personas.piscesGhost?.systemInstruction || "";
    const ladyInstruction = personas.firstLady?.systemInstruction || "";
    const prompt = SCORE_PROMPT(bars);

    const [ghostRaw, ladyRaw] = await Promise.allSettled([
      window.BabyRayCallPersonaModel
        ? window.BabyRayCallPersonaModel({ systemInstruction: ghostInstruction, userText: prompt })
        : Promise.resolve(null),
      window.BabyRayCallPersonaModel
        ? window.BabyRayCallPersonaModel({ systemInstruction: ladyInstruction, userText: prompt })
        : Promise.resolve(null)
    ]);

    const ghostResult = ghostRaw.status === "fulfilled"
      ? parseScorerResponse(ghostRaw.value || "")
      : null;
    const ladyResult = ladyRaw.status === "fulfilled"
      ? parseScorerResponse(ladyRaw.value || "")
      : null;

    const scores = [ghostResult?.score, ladyResult?.score].filter(Number.isFinite);
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const payout = getPropPayout(avgScore);

    await saveScoreToFirestore({ bars, roomId, ghostResult, ladyResult, avgScore, payout });

    return { ghostResult, ladyResult, avgScore: Math.round(avgScore * 10) / 10, payout };
  }

  window.BabyRayScoreEngine = { scoreTheBars, getPropPayout };
})();
