(function () {
  function useLobbyChat(room, includePersona, roomId) {
    const { useEffect, useMemo, useState } = React;
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

      const activeRoom = room || "lobby";
      const activeRoomId = roomId || bridge.getLobbyRoomId?.() || "altar-default";

      setStatus("live");
      const unsubscribe = bridge.subscribeSharedChat((incoming) => {
        setMessages(incoming);
      }, {
        room: activeRoom,
        includePersona: includePersona !== false,
        roomId: activeRoomId
      });

      return () => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      };
    }, [room, includePersona, roomId]);

    return useMemo(() => ({ messages, status, error }), [messages, status, error]);
  }

  async function sendPersonaMessage(params) {
    const bridge = window.BabyRayChatBridge;
    if (!bridge?.sendPersonaMessage) {
      throw new Error("BabyRayChatBridge is unavailable.");
    }

    const roomId = params?.roomId || bridge.getLobbyRoomId?.() || "altar-default";
    return bridge.sendPersonaMessage({ ...params, roomId });
  }

  async function sendUserMessage(params) {
    const bridge = window.BabyRayChatBridge;
    if (!bridge?.sendSharedChatMessage) {
      throw new Error("BabyRayChatBridge is unavailable.");
    }

    const roomId = params?.roomId || bridge.getLobbyRoomId?.() || "altar-default";
    return bridge.sendSharedChatMessage({ ...params, roomId });
  }

  window.BabyRayChat = {
    useLobbyChat,
    sendPersonaMessage,
    sendUserMessage
  };
})();
