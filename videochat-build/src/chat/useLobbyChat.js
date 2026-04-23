import { useEffect, useMemo, useState } from "react";
import { canViewMessage } from "./visibilityFilter";

export function useLobbyChat(room = "lobby", includePersona = true, roomId = "altar-default") {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");

  useEffect(() => {
    const bridge = window.BabyRayChatBridge;
    if (!bridge?.subscribeSharedChat) {
      setStatus("offline");
      setError("BabyRayChatBridge is unavailable.");
      return undefined;
    }

    setStatus("live");
    const unsubscribe = bridge.subscribeSharedChat((incoming) => {
      setMessages(incoming.filter((message) => canViewMessage(message, room)));
    }, { room, includePersona, roomId });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [room, includePersona, roomId]);

  return useMemo(() => ({
    messages,
    status,
    error
  }), [messages, status, error]);
}
