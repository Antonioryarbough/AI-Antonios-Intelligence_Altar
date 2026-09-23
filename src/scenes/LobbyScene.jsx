import React, { useState } from "react";
import { getAllPersonas, getInstruction } from "../personas";
import { avatarMap } from "../personas/avatars";
import { callPersonaModel } from "../ai/geminiClient";

export default function LobbyScene() {
  const personas = getAllPersonas();
  const [activeKey, setActiveKey] = useState("piscesGhost");
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isTalking, setIsTalking] = useState(false);
  const activeAvatar = avatarMap[activeKey];

  async function handleSend() {
    if (!input.trim()) return;

    const systemInstruction = getInstruction(activeKey);

    try {
      setIsTalking(true);
      const text = await callPersonaModel({
        systemInstruction,
        userText: input
      });
      setResponse(text);
    } catch (error) {
      console.error(error);
      setResponse("Something glitched in the ether. Try again.");
    } finally {
      setTimeout(() => setIsTalking(false), 4000);
    }
  }

  return (
    <div className="lobby-root">
      <div className="lobby-top">
        <div className="lobby-avatar">
          {activeAvatar && (
            <img
              src={isTalking ? activeAvatar.talking : activeAvatar.idle}
              alt={activeKey}
            />
          )}
        </div>

        <div className="lobby-persona-picker">
          {personas.map((persona) => (
            <button
              key={persona.key}
              className={
                persona.key === activeKey ? "persona-btn active" : "persona-btn"
              }
              onClick={() => {
                setActiveKey(persona.key);
                setResponse("");
              }}
            >
              {persona.name}
            </button>
          ))}
        </div>
      </div>

      <div className="lobby-bottom">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Drop your bars, ideas, or questions here..."
        />

        <button onClick={handleSend}>Ask the Council</button>

        <div className="lobby-response">
          {response && <pre>{response}</pre>}
        </div>
      </div>
    </div>
  );
}
