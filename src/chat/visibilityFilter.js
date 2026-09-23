export function buildRoomTargets({ lobby = true, videochat = true, mainStage = false } = {}) {
  return { lobby, videochat, mainStage };
}

export function canViewMessage(message, room = "lobby") {
  if (!message) return false;

  const roomTargets = message.roomTargets || {};
  if (roomTargets[room] === false) return false;

  if (room === "mainStage" && roomTargets.mainStage !== true) {
    return false;
  }

  return true;
}

export function normalizeRoomScopedMessages(messages = [], room = "lobby") {
  return messages.filter((message) => canViewMessage(message, room));
}
