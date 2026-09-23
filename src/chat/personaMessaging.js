import personas from "../personas/personas.json";
import { buildRoomTargets } from "./visibilityFilter";

export function resolvePersona(personaKey) {
  return personas[personaKey] || null;
}

export async function sendPersonaMessage({
  personaKey,
  text,
  roomTargets = buildRoomTargets(),
  visibleTo = ["performer", "student"],
  roomId = "altar-default"
}) {
  const bridge = window.BabyRayChatBridge;
  if (!bridge?.sendPersonaMessage) {
    throw new Error("BabyRayChatBridge is not available in this environment.");
  }

  const persona = resolvePersona(personaKey);
  return bridge.sendPersonaMessage({
    personaKey,
    text,
    name: persona?.name || personaKey,
    roomTargets,
    visibleTo,
    roomId
  });
}
