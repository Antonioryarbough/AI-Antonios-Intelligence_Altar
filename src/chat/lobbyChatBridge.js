(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyB0Y2l5fHvzoUkSJFWrd4ADb-6rRAT47Sw",
    authDomain: "studio-2fb13.firebaseapp.com",
    projectId: "studio-2fb13",
    storageBucket: "studio-2fb13.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
  };

  const appId = "studio-2fb13";
  const messagePath = ["artifacts", appId, "public", "data", "messages"];
  const queryParams = new URLSearchParams(window.location.search || "");
  const DEFAULT_ROOM_ID = queryParams.get("roomId") || localStorage.getItem("lobby_room_id") || "altar-default";

  let initialized = false;
  let authReadyPromise = null;
  let db = null;
  let auth = null;

  function getCollectionRef() {
    let ref = db.collection(messagePath[0]);
    for (let i = 1; i < messagePath.length; i += 1) {
      ref = i % 2 === 1 ? ref.doc(messagePath[i]) : ref.collection(messagePath[i]);
    }
    return ref;
  }

  function initFirebase() {
    if (initialized) return;

    if (!window.firebase || !window.firebase.initializeApp) {
      throw new Error("Firebase SDK not loaded in lobby.html");
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    db = firebase.firestore();
    auth = firebase.auth();

    authReadyPromise = auth
      .signInAnonymously()
      .then(() => true)
      .catch(() => true);

    initialized = true;
  }

  function normalizeMessage(docOrData) {
    const data = docOrData.data ? docOrData.data() : docOrData;
    const timestamp = data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : null;

    return {
      id: docOrData.id || data.id || `${Date.now()}-${Math.random()}`,
      text: data.text || "",
      name: data.name || "Anon",
      senderType: data.senderType || "user",
      roomId: data.roomId || DEFAULT_ROOM_ID,
      roomTargets: data.roomTargets || { lobby: true, videochat: true, mainStage: false },
      createdAt: timestamp,
      raw: data
    };
  }

  function shouldMirrorMessageToRoom(message, room) {
    if (!message) return false;

    const roomTargets = message.roomTargets || {};
    if (roomTargets[room] === false) return false;

    if (room === "mainStage" && roomTargets.mainStage !== true) {
      return false;
    }

    return true;
  }

  async function sendSharedChatMessage({ text, name, senderType, roomTargets, personaKey, roomId }) {
    initFirebase();
    await authReadyPromise;

    const trimmed = (text || "").trim();
    if (!trimmed) return;

    const payload = {
      text: trimmed,
      name: name || "Lobby",
      senderType: senderType || "user",
      personaKey: personaKey || null,
      roomId: roomId || DEFAULT_ROOM_ID,
      roomTargets: roomTargets || { lobby: true, videochat: true, mainStage: false },
      sourceRoom: "lobby",
      userId: auth.currentUser?.uid || null,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    await getCollectionRef().add(payload);
  }

  async function sendPersonaMessage({ personaKey, text, name, roomTargets, visibleTo, roomId }) {
    await sendSharedChatMessage({
      text,
      name: name || personaKey || "Council",
      senderType: "persona",
      personaKey,
      roomTargets: roomTargets || { lobby: true, videochat: true, mainStage: false },
      roomId: roomId || DEFAULT_ROOM_ID
    });

    // visibleTo is included to keep schema forward-compatible for room-level filtering.
    return { ok: true, visibleTo: visibleTo || ["performer", "student"] };
  }

  function subscribeSharedChat(onMessages, options) {
    initFirebase();

    const opts = options || {};
    const includePersona = opts.includePersona !== false;
    const room = opts.room || "lobby";
    const roomId = opts.roomId || DEFAULT_ROOM_ID;

    const unsubscribe = getCollectionRef()
      .where("roomId", "==", roomId)
      .orderBy("timestamp", "desc")
      .limit(40)
      .onSnapshot((snapshot) => {
        const messages = snapshot.docs
          .map(normalizeMessage)
          .filter((message) => {
            if (!includePersona && message.senderType === "persona") return false;
            return shouldMirrorMessageToRoom(message, room);
          })
          .reverse();

        onMessages(messages);
      });

    return unsubscribe;
  }

  function setLobbyRoomId(roomId) {
    if (!roomId) return;
    localStorage.setItem("lobby_room_id", roomId);
  }

  function getLobbyRoomId() {
    return localStorage.getItem("lobby_room_id") || DEFAULT_ROOM_ID;
  }

  window.BabyRayChatBridge = {
    sendSharedChatMessage,
    sendPersonaMessage,
    shouldMirrorMessageToRoom,
    subscribeSharedChat,
    setLobbyRoomId,
    getLobbyRoomId
  };
})();
