window.BabyRayCallPersonaModel = async function BabyRayCallPersonaModel({ systemInstruction, userText }) {
  const openAIKey = localStorage.getItem("openai_key") || localStorage.getItem("gemini_key") || "";

  if (openAIKey) {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userText }
        ],
        max_output_tokens: 500
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "OpenAI request failed");
    }

    return data.output_text || data.output?.[0]?.content?.[0]?.text || "";
  }

  const res = await fetch("/api/gemini-persona", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction, userText })
  });

  if (!res.ok) {
    throw new Error("No OpenAI key found and Gemini request failed");
  }

  const data = await res.json();
  return data.text || "";
};
