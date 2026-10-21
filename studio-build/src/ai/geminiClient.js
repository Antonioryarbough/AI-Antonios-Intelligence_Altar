export async function callPersonaModel({ systemInstruction, userText }) {
  const res = await fetch("/api/gemini-persona", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction, userText })
  });

  if (!res.ok) {
    throw new Error("Gemini request failed");
  }

  const data = await res.json();
  return data.text || "";
}
