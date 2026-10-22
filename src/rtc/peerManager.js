// peerManager.js — Consolidated WebRTC/PeerJS engine for the Baby Ray Studio lobby.
//
// Consolidates ALL video calling features from the three studio repos:
//   • Mainstage (public/index.html) — PeerJS init w/ timeout+reconnect, getUserMedia,
//     incoming/outgoing calls, hangup, share-invite, Firestore directory presence
//   • Studio (Studio/public/index.html) — Audio mixing (Web Audio API), desktop sharing
//     (getDisplayMedia + stream composition), track replacement, adaptive video profiles
//
// Browser-global: window.BabyRayRTC
// Depends on: window.Peer (loaded via <script src="…peerjs.min.js"> in lobby.html)
//             window.firebase  (initialised by src/chat/lobbyChatBridge.js)
//
// State is pushed to subscribers via an onStateChanged callback so React
// (main.jsx via rtcReactBridge.js) can re-render declaratively.

(function () {
  "use strict";

  // ── PeerJS configuration (mirrors configs/config.*.js pattern) ────────────
  var cloudPeerJsConfig = { host: "0.peerjs.com", port: 443, path: "/", secure: true };
  var localPeerJsConfig = { host: "localhost", port: 9000, path: "/myapp", secure: false };

  function resolvePeerJsConfig() {
    if (typeof location !== "undefined" &&
        (location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      return localPeerJsConfig;
    }
    return cloudPeerJsConfig;
  }

  // ── Firestore presence path helpers ────────────────────────────────────────
  // Lobby reuses the studio-2fb13 Firebase project (same as lobbyChatBridge.js)
  var DEFAULT_APP_ID = "studio-2fb13";

  function directoryDocRef(db, appId, uid) {
    return db.collection("artifacts")
             .doc(appId)
             .collection("public")
             .doc("data")
             .collection("directory")
             .doc(uid);
  }

  function directoryQuery(db, appId) {
    return db.collection("artifacts")
             .doc(appId)
             .collection("public")
             .doc("data")
             .collection("directory")
             .where("online", "==", true);
  }

  // ── Internal mutable state ─────────────────────────────────────────────────
  var cfg = {
    roomId: "altar-default",
    userId: null,
    displayName: "Lobby Artist",
    appId: DEFAULT_APP_ID
  };

  var state = {
    peerId: null,
    peerStatus: "disconnected",          // 'connecting' | 'connected' | 'disconnected' | 'error'
    callStatus: "Not connected",
    localStream: null,                    // MediaStream (or null)
    remoteStream: null,                   // MediaStream (or null)
    hasLocalStream: false,
    hasRemoteStream: false,
    isCalling: false,
    isMuted: false,
    isCameraOn: false,
    isDesktopSharing: false,
    isAudioMixing: false,
    remotePeerId: null,                   // peer we're currently talking to
    peers: [],                            // [{ peerId, userId, displayName, imageUrl, roomId, lastSeen }]
    error: null,
    config: { roomId: "altar-default", userId: null, displayName: "Lobby Artist", appId: DEFAULT_APP_ID }
  };

  // ── Private runtime fields ─────────────────────────────────────────────────
  var peer = null;                  // PeerJS instance
  var currentCall = null;           // active PeerJS Call object
  var localStream = null;           // raw or mixed media stream
  var cameraStream = null;          // original camera/microphone stream (before mixing/desktop)
  var desktopStream = null;         // desktop sharing stream
  var outgoingAudioTrack = null;    // audio track from localStream (for desktop composition)
  var audioCtx = null;              // Web Audio context (for audio mixing)
  var audioMixDestination = null;   // MediaStreamDestination for mixing
  var micSourceNode = null;         // MediaStreamSource for mic
  var gainNode = null;              // GainControlNode for mic
  var heartbeatTimer = null;        // keepalive
  var connectTimeout = null;        // 15 s PeerJS connection timeout
  var directoryUnsub = null;        // Firestore onSnapshot teardown

  var subscribers = new Set();

  // ── State broadcasting ─────────────────────────────────────────────────────
  function emitState() {
    // Build a shallow-clone snapshot so React sees a new reference each time.
    var snapshot = {
      peerId: state.peerId,
      peerStatus: state.peerStatus,
      callStatus: state.callStatus,
      localStream: state.localStream,
      remoteStream: state.remoteStream,
      hasLocalStream: state.hasLocalStream,
      hasRemoteStream: state.hasRemoteStream,
      isCalling: state.isCalling,
      isMuted: state.isMuted,
      isCameraOn: state.isCameraOn,
      isDesktopSharing: state.isDesktopSharing,
      isAudioMixing: state.isAudioMixing,
      remotePeerId: state.remotePeerId,
      peers: state.peers.slice(),
      error: state.error,
      config: { ...state.config }
    };
    subscribers.forEach(function (cb) {
      try { cb(snapshot); } catch (e) { console.warn("[RTC] subscriber threw", e); }
    });
  }

  function updateState(partial) {
    Object.keys(partial).forEach(function (key) {
      state[key] = partial[key];
    });
    emitState();
  }

  // ── Firebase helpers ───────────────────────────────────────────────────────
  function getFirebase() {
    if (!window.firebase || !window.firebase.apps || !window.firebase.apps.length) {
      return null;
    }
    try {
      return {
        db: window.firebase.firestore(),
        auth: window.firebase.auth()
      };
    } catch (e) {
      console.warn("[RTC] Firebase access failed:", e);
      return null;
    }
  }

  /**
   * Resolve the current Firebase UID, ensuring anonymous sign-in if needed.
   * Returns a Promise<string|null>.
   */
  function resolveUserId() {
    var fb = getFirebase();
    if (!fb) return Promise.resolve(null);

    var currentUser = fb.auth.currentUser;
    if (currentUser && currentUser.uid) {
      return Promise.resolve(currentUser.uid);
    }

    return fb.auth.signInAnonymously()
      .then(function () { return fb.auth.currentUser ? fb.auth.currentUser.uid : null; })
      .catch(function () { return null; });
  }

  /**
   * Publish / update this peer's public presence (peerId, online status, roomId).
   */
  function updatePublicPresence(presenceData) {
    var fb = getFirebase();
    if (!fb || !cfg.userId) return Promise.resolve();

    var ref = directoryDocRef(fb.db, cfg.appId, cfg.userId);
    var payload = {
      peerId: state.peerId || null,
      online: true,
      roomId: cfg.roomId,
      displayName: cfg.displayName,
      lastSeen: window.firebase.firestore.FieldValue.serverTimestamp()
    };
    Object.assign(payload, presenceData);
    return ref.set(payload, { merge: true });
  }

  /**
   * Subscribe to the directory of online peers in the same room.
   * Updates state.peers in real-time.
   */
  function subscribeDirectory() {
    var fb = getFirebase();
    if (!fb) {
      updateState({ peers: [] });
      return;
    }

    var q = directoryQuery(fb.db, cfg.appId);
    directoryUnsub = q.onSnapshot(function (snapshot) {
      var list = [];
      snapshot.forEach(function (doc) {
        var d = doc.data();
        // Only show peers in the same room (and exclude self)
        if (d.roomId === cfg.roomId && d.peerId && d.userId !== cfg.userId) {
          list.push({
            peerId: d.peerId,
            userId: d.userId,
            displayName: d.displayName || "Anonymous",
            imageUrl: d.imageUrl || null,
            roomId: d.roomId,
            lastSeen: d.lastSeen || null
          });
        }
      });
      updateState({ peers: list });
    });
  }

  /**
   * Set this user offline in the directory.
   */
  function goOfflinePresence() {
    var fb = getFirebase();
    if (!fb || !cfg.userId) return;

    var ref = directoryDocRef(fb.db, cfg.appId, cfg.userId);
    ref.set({ online: false, lastSeen: window.firebase.firestore.FieldValue.serverTimestamp() }, { merge: true })
      .catch(function (e) { console.warn("[RTC] presence-offline write failed:", e); });
  }

  // ── Adaptive video profile (from Studio) ───────────────────────────────────
  /**
   * Return video constraints that adapt to page visibility, network type,
   * and call state. Reduces CPU/bandwidth on mobile, slow networks, or
   * when the tab is hidden.
   */
  function getAdaptiveVideoProfile() {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var effectiveType = conn ? conn.effectiveType : (typeof conn !== "undefined" && conn ? conn.effectiveType : "");
    var saveData = Boolean(conn && conn.saveData);
    var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");

    var width = 1280;
    var height = 720;
    var fps = 24;
    var maxBitrate = 900000;

    if (isMobile || effectiveType === "3g" || effectiveType === "2g") {
      width = 854;
      height = 480;
      fps = 20;
      maxBitrate = 550000;
    }

    if (saveData || effectiveType === "2g") {
      width = 640;
      height = 360;
      fps = 15;
      maxBitrate = 300000;
    }

    // If tab is hidden, drop to minimum to save battery
    var isVisible = (typeof document !== "undefined") ? !document.hidden : true;
    if (!isVisible) {
      width = 320;
      height = 240;
      fps = 10;
      maxBitrate = 150000;
    }

    return { width: width, height: height, fps: fps, maxBitrate: maxBitrate, isMobile: isMobile, effectiveType: effectiveType, saveData: saveData };
  }

  // ── Audio mixing (from Studio) ─────────────────────────────────────────────
  /**
   * Route the raw microphone stream through a Web Audio API graph so that
   * gain / effects can be applied or multiple sources mixed in the future.
   * Falls back to the raw stream if Audio API is unavailable.
   */
  async function setupAudioMixer(rawStream) {
    if (!rawStream) return rawStream;

    // Already initialised — reuse
    if (audioCtx && audioMixDestination) {
      try {
        var source = audioCtx.createMediaStreamSource(rawStream);
        source.connect(audioMixDestination);
        return audioMixDestination.stream;
      } catch (e) {
        console.warn("[RTC] audio mixer reuse failed, returning raw:", e.message);
        return rawStream;
      }
    }

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioMixDestination = audioCtx.createMediaStreamDestination();
      micSourceNode = audioCtx.createMediaStreamSource(rawStream);
      gainNode = audioCtx.createGain();
      gainNode.gain.value = 1.0;
      micSourceNode.connect(gainNode).connect(audioMixDestination);
      return audioMixDestination.stream;
    } catch (e) {
      console.warn("[RTC] audio mixer unavailable, returning raw stream:", e.message);
      audioCtx = null;
      audioMixDestination = null;
      micSourceNode = null;
      gainNode = null;
      return rawStream;
    }
  }

  // ── Camera / microphone ────────────────────────────────────────────────────
  /**
   * Request camera + microphone access and set the local preview stream.
   * Applies adaptive video profile and optional audio mixing.
   */
  async function startCamera() {
    if (state.isCameraOn) {
      return true; // already started
    }

    var profile = getAdaptiveVideoProfile();
    var constraints = {
      video: {
        facingMode: "user",
        width: { ideal: profile.width, max: profile.width },
        height: { ideal: profile.height, max: profile.height },
        frameRate: { ideal: profile.fps, max: profile.fps },
        aspectRatio: { ideal: 16 / 9 }
      },
      audio: true
    };

    try {
      localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Hint for motion-quality video
      var rawVideoTrack = localStream.getVideoTracks()[0];
      if (rawVideoTrack && "contentHint" in rawVideoTrack) {
        rawVideoTrack.contentHint = "motion";
      }

      cameraStream = localStream;

      // Extract outgoing audio track for desktop-share composition
      outgoingAudioTrack = localStream.getAudioTracks()[0] || null;

      var mixed = await setupAudioMixer(localStream);
      if (mixed !== localStream) {
        localStream = mixed;
        state.isAudioMixing = true;
      }

      // Hot-swap tracks if a call is already in progress
      if (currentCall) {
        var vt = localStream.getVideoTracks()[0];
        var at = localStream.getAudioTracks()[0];
        if (vt) await replaceOutgoingVideoTrack(vt);
        if (at) await replaceOutgoingAudioTrack(at);
      }

      state.localStream = localStream;
      state.hasLocalStream = true;
      state.isCameraOn = true;
      state.isMuted = false;
      state.isDesktopSharing = false;
      state.callStatus = "✅ Camera and Mic Ready";
      state.error = null;

      emitState();
      return true;
    } catch (err) {
      console.error("[RTC] getUserMedia failed:", err);
      state.callStatus = "❌ Camera/Mic not enabled";
      state.error = formatMediaError(err);
      state.isCameraOn = false;
      emitState();
      return false;
    }
  }

  /**
   * Stop all local media tracks.
   */
  function stopCamera() {
    if (localStream) {
      localStream.getTracks().forEach(function (t) {
        try { t.stop(); } catch (e) {}
      });
    }
    if (desktopStream) {
      desktopStream.getTracks().forEach(function (t) {
        try { t.stop(); } catch (e) {}
      });
    }
    localStream = null;
    cameraStream = null;
    desktopStream = null;
    outgoingAudioTrack = null;
    state.localStream = null;
    state.hasLocalStream = false;
    state.isCameraOn = false;
    state.isMuted = false;
    state.isDesktopSharing = false;
    state.isAudioMixing = false;
    state.callStatus = "Camera off";
    emitState();
  }

  // ── Error formatting (from mainstage) ──────────────────────────────────────
  /**
   * Turn a getUserMedia error into a human-readable message with fix steps.
   */
  function formatMediaError(err) {
    if (err.name === "NotAllowedError" || err.name === "PermissionDenied") {
      return "Camera/Mic access was blocked.\n\n" +
             "Fix:\n1. Click the camera icon in your browser's address bar\n" +
             "2. Allow camera and microphone\n3. Refresh the page";
    }
    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      return "No camera or microphone found.\n\n" +
             "Check: 1. Camera is connected 2. Not used by another app";
    }
    if (err.name === "NotReadableError" || err.name === "TrackStartError") {
      return "Camera or microphone is already in use by another app.\n\n" +
             "Close other apps that might use your camera/microphone.";
    }
    return "Unable to access camera/microphone.\n\n" + (err.message || err.name || "Unknown error");
  }

  // ── Desktop sharing (from Studio) ──────────────────────────────────────────
  /**
   * Share your screen / a window as your outgoing video, keeping your
   * microphone audio in the stream.
   */
  async function startDesktopShare() {
    if (state.isDesktopSharing) return true;
    if (!state.hasLocalStream) {
      var ok = await startCamera();
      if (!ok) return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      state.error = "Desktop sharing is not supported by this browser.";
      emitState();
      return false;
    }

    try {
      desktopStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "motion" },
        audio: { echoCancellation: true }
      });

      var screenTrack = desktopStream.getVideoTracks()[0];

      // Compose: screen video + our outgoing audio
      var composed = new MediaStream([screenTrack]);
      if (outgoingAudioTrack) composed.addTrack(outgoingAudioTrack);

      // Preserve the original camera stream so we can restore it later
      if (!cameraStream) cameraStream = localStream;

      localStream = composed;
      state.localStream = composed;
      state.isDesktopSharing = true;
      state.callStatus = "🖥️ Sharing desktop";

      // Replace the outgoing video track on the active call so peers see the screen
      if (currentCall) {
        await replaceOutgoingVideoTrack(screenTrack);
      }

      // Auto-stop when the user stops sharing from the browser UI
      screenTrack.onended = function () {
        stopDesktopShare();
      };

      emitState();
      return true;
    } catch (err) {
      console.error("[RTC] getDisplayMedia failed:", err);
      state.error = "Desktop sharing was cancelled or failed. " + (err.message || "");
      state.isDesktopSharing = false;
      emitState();
      return false;
    }
  }

  /**
   * Stop desktop sharing and restore the camera stream.
   */
  async function stopDesktopShare() {
    if (!state.isDesktopSharing) return;

    if (desktopStream) {
      desktopStream.getTracks().forEach(function (t) {
        try { t.stop(); } catch (e) {}
      });
      desktopStream = null;
    }

    var restored = cameraStream || localStream;
    if (restored) {
      localStream = restored;
      state.localStream = restored;

      // Extract audio track for future compositions
      outgoingAudioTrack = restored.getAudioTracks()[0] || null;

      // Restore outgoing video track on the active call
      if (currentCall) {
        var videoTrack = restored.getVideoTracks()[0];
        if (videoTrack) {
          await replaceOutgoingVideoTrack(videoTrack);
        }
      }
    }

    state.isDesktopSharing = false;
    state.callStatus = state.isCalling ? "📞 In call" : "✅ Camera and Mic Ready";
    emitState();
  }

  // ── Outgoing track replacement (from Studio) ───────────────────────────────
  /**
   * Replace the video track of the current PeerJS call by sending the
   * new track to the remote peer over the existing WebRTC sender.
   */
  async function replaceOutgoingVideoTrack(newTrack) {
    if (!currentCall || !currentCall.peerConnection || !newTrack) return;

    try {
      var pc = currentCall.peerConnection;
      var senders = pc.getSenders ? pc.getSenders() : [];
      var videoSender = null;
      for (var i = 0; i < senders.length; i++) {
        if (senders[i].track && senders[i].track.kind === "video") {
          videoSender = senders[i];
          break;
        }
      }

      if (videoSender && videoSender.replaceTrack) {
        await videoSender.replaceTrack(newTrack);
      }
    } catch (e) {
      console.warn("[RTC] replaceOutgoingVideoTrack error:", e.message);
    }
  }

  /**
   * Replace the audio track of the current PeerJS call.
   */
  async function replaceOutgoingAudioTrack(newTrack) {
    if (!currentCall || !currentCall.peerConnection || !newTrack) return;

    try {
      var pc = currentCall.peerConnection;
      var senders = pc.getSenders ? pc.getSenders() : [];
      var audioSender = null;
      for (var i = 0; i < senders.length; i++) {
        if (senders[i].track && senders[i].track.kind === "audio") {
          audioSender = senders[i];
          break;
        }
      }

      if (audioSender && audioSender.replaceTrack) {
        await audioSender.replaceTrack(newTrack).catch(function (e) {
          console.warn("[RTC] Audio track replace failed:", e.message);
        });
      }
    } catch (e) {
      console.warn("[RTC] replaceOutgoingAudioTrack error:", e.message);
    }
  }

  // ── Microphone mute / unmute ───────────────────────────────────────────────
  /**
   * Toggle the local microphone on/off by enabling/disabling audio tracks.
   */
  function toggleMute() {
    if (!localStream) return false;

    state.isMuted = !state.isMuted;
    var audioTracks = localStream.getAudioTracks();
    audioTracks.forEach(function (track) {
      track.enabled = !state.isMuted;
    });

    state.callStatus = state.isMuted ? "🔇 Microphone muted" : "✅ Microphone on";
    emitState();
    return state.isMuted;
  }

  // ── Incoming call handling ─────────────────────────────────────────────────
  /**
   * Wire up event listeners for an incoming or outgoing PeerJS call.
   */
  function handleCallEvents(call) {
    currentCall = call;
    state.isCalling = true;
    state.hasRemoteStream = false;
    state.remoteStream = null;
    emitState();

    call.on("stream", function (remoteStream) {
      console.log("[RTC] 🎥 Remote stream received");
      state.remoteStream = remoteStream;
      state.hasRemoteStream = true;
      state.callStatus = "📞 Connected to peer";
      emitState();

      tuneOutgoingVideoSender(call).catch(function (err) {
        console.warn("[RTC] Video tune skipped:", err);
      });
    });

    call.on("error", function (err) {
      console.error("[RTC] Call error:", err);
      state.error = "Call error: " + (err.message || err.type || "unknown");
      emitState();
    });

    call.on("close", function () {
      console.log("[RTC] Call closed by remote peer");
      hangupCall();
    });

    return call;
  }

  // ── PeerJS connection lifecycle (from mainstage + Studio) ──────────────────
  /**
   * Initialise the PeerJS connection and Firestore presence.
   * Call once on app start (after DOM + Firebase are ready).
   *
   * opts: { roomId?, userId?, displayName?, appId? }
   */
  function init(opts) {
    opts = opts || {};
    cfg.roomId = opts.roomId || cfg.roomId;
    cfg.displayName = opts.displayName || cfg.displayName;
    cfg.appId = opts.appId || cfg.appId;

    state.config = {
      roomId: cfg.roomId,
      userId: cfg.userId,
      displayName: cfg.displayName,
      appId: cfg.appId
    };

    // If PeerJS library is missing, surface an error.
    if (!window.Peer) {
      state.peerStatus = "error";
      state.callStatus = "PeerJS library not loaded";
      state.error = "PeerJS library not loaded. Ensure <script src='…peerjs.min.js'> is present.";
      emitState();
      return;
    }

    // Resolve Firebase UID before connecting (for presence + directory).
    resolveUserId().then(function (uid) {
      cfg.userId = uid || cfg.userId;
      state.config.userId = cfg.userId;

      state.peerStatus = "connecting";
      state.callStatus = "Connecting to PeerJS…";
      emitState();

      // Subscribe to the directory of online peers in this room.
      subscribeDirectory();

      try {
        peer = new Peer(resolvePeerJsConfig());

        connectTimeout = setTimeout(function () {
          if (!peer.id || peer.id === "disconnected" || peer.id === null) {
            console.error("[RTC] PeerJS connection timeout after 15s");
            state.peerStatus = "error";
            state.peerId = "Server unreachable";
            state.callStatus = "PeerJS server not responding. Try refreshing.";
            state.error =
              "PeerJS server is not responding.\n\n" +
              "This is a known issue with the free 0.peerjs.com service.\n\n" +
              "Try refreshing the page, or contact support if the issue persists.";
            emitState();
          }
        }, 15000);

        peer.on("open", function (id) {
          clearTimeout(connectTimeout);
          console.log("[RTC] ✅ PeerJS connected! My ID:", id);
          peer.id = id;
          state.peerId = id;
          state.peerStatus = "connected";
          state.callStatus = "✅ Ready to call!";
          state.error = null;
          emitState();

          // Publish presence to Firestore directory.
          updatePublicPresence({ online: true });
          startHeartbeat();
        });

        peer.on("disconnected", function () {
          console.warn("[RTC] PeerJS disconnected");
          state.peerStatus = "disconnected";
          state.callStatus = "⏳ Reconnecting…";
          state.peerId = "Reconnecting…";
          emitState();
          goOfflinePresence();

          try { peer.reconnect(); } catch (e) { /* ignore */ }
        });

        peer.on("call", function (call) {
          console.log("[RTC] Incoming call from:", call.peer);
          if (localStream) {
            call.answer(localStream);
          } else {
            call.answer();
          }
          state.remotePeerId = call.peer;
          handleCallEvents(call);
        });

        peer.on("error", function (err) {
          clearTimeout(connectTimeout);
          console.error("[RTC] PeerJS error:", err.type, err);
          state.peerStatus = "error";
          state.peerId = "Error: " + (err.type || "unknown");
          state.error = formatPeerJSError(err);
          emitState();
        });

        peer.on("close", function () {
          console.log("[RTC] PeerJS connection closed");
          if (currentCall) hangupCall();
          state.peerStatus = "disconnected";
          state.callStatus = "Connection closed. Click Retry to reconnect.";
          goOfflinePresence();
          emitState();
        });

      } catch (err) {
        console.error("[RTC] Failed to initialise PeerJS:", err);
        state.peerStatus = "error";
        state.peerId = "Init failed";
        state.callStatus = "Failed to initialise connection";
        state.error = "Failed to initialise PeerJS:\n\n" + err.message;
        emitState();
      }
    })
      .catch(function (err) {
        console.error("[RTC] Firebase auth / UID resolution failed:", err);
        state.peerStatus = "error";
        state.callStatus = "Firebase auth unavailable — PeerJS will still work for calls";
        state.error = "Firebase auth unavailable (offline mode).";
        emitState();
      });
  }

  // ── Outgoing call ──────────────────────────────────────────────────────────
  /**
   * Initiate an outgoing call to a remote PeerJS ID.
   */
  async function startCall(remotePeerId) {
    if (!remotePeerId || !remotePeerId.trim()) {
      state.error = "Please enter or select a Peer ID to call.";
      emitState();
      return false;
    }
    remotePeerId = remotePeerId.trim();

    if (!localStream) {
      var ok = await startCamera();
      if (!ok) return false;
    }

    if (!peer || !peer.id) {
      state.error = "Peer connection not ready. Try clicking Retry.";
      emitState();
      return false;
    }

    state.callStatus = "📞 Calling…";
    state.isCalling = true;
    state.remotePeerId = remotePeerId;
    state.hasRemoteStream = false;
    state.remoteStream = null;
    emitState();

    try {
      var call = peer.call(remotePeerId, {
        stream: localStream,
        serialization: "json"
      });

      handleCallEvents(call);
      return true;
    } catch (err) {
      console.error("[RTC] startCall failed:", err);
      state.error = "Failed to start call: " + err.message;
      state.callStatus = "❌ Call failed";
      state.isCalling = false;
      emitState();
      return false;
    }
  }

  // ── Hang up ─────────────────────────────────────────────────────────────────
  /**
   * End the current call and stop sharing (if applicable).
   */
  async function hangupCall() {
    if (currentCall) {
      try { currentCall.close(); } catch (e) { /* already closed */ }
      currentCall = null;
    }

    // Stop desktop share if active
    if (state.isDesktopSharing) {
      await stopDesktopShare();
    }

    state.isCalling = false;
    state.remotePeerId = null;
    state.remoteStream = null;
    state.hasRemoteStream = false;
    state.callStatus = state.isCameraOn ? "✅ Camera and Mic Ready" : "Ready";
    emitState();
  }

  // ── Adaptive video tuning (from Studio) ────────────────────────────────────
  /**
   * Apply adaptive sender constraints to an active call's video sender.
   * Reduces resolution / bitrate based on network conditions and device type.
   */
  async function tuneOutgoingVideoSender(call) {
    if (!call || !call.peerConnection || !call.peerConnection.getSenders) return;

    var profile = getAdaptiveVideoProfile();
    var senders = call.peerConnection.getSenders();
    var videoSender = null;
    for (var i = 0; i < senders.length; i++) {
      if (senders[i].track && senders[i].track.kind === "video") {
        videoSender = senders[i];
        break;
      }
    }

    if (!videoSender || !videoSender.getParameters || !videoSender.setParameters) return;

    try {
      var params = videoSender.getParameters() || {};
      if (!Array.isArray(params.encodings) || !params.encodings.length) {
        params.encodings = [{}];
      }

      params.encodings[0].maxBitrate = profile.maxBitrate;
      params.encodings[0].maxFramerate = profile.fps;
      if (profile.isMobile || profile.saveData) {
        params.encodings[0].scaleResolutionDownBy = 1.5;
      }

      if ("degradationPreference" in params) {
        params.degradationPreference = "maintain-framerate";
      }

      videoSender.setParameters(params).catch(function (e) {
        console.warn("[RTC] setParameters failed:", e.message);
      });
    } catch (e) {
      console.warn("[RTC] tuneOutgoingVideoSender skip:", e.message);
    }

    // Also tune on visibility change
    function onVisibilityChange() {
      tuneOutgoingVideoSender(call).catch(function () {});
    }
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.addEventListener("visibilitychange", onVisibilityChange);
    }
  }

  // ── Heartbeat ──────────────────────────────────────────────────────────────
  /** Keep the user's presence online every 60 s. */
  function startHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(function () {
      if (state.peerId && state.peerId !== "Reconnecting…" && state.peerStatus === "connected") {
        updatePublicPresence({ online: true });
      }
    }, 60000);
  }

  // ── Share invite (from mainstage) ──────────────────────────────────────────
  /**
   * Copy a shareable invite message (URL + Peer ID) to the clipboard
   * or trigger the native share sheet.
   */
  async function shareInvite() {
    var url = window.location.href;
    var pid = state.peerId || "not-connected";
    var message =
      "Join my AI Enterprise Studio — Lobby Music Production School!\n\n" +
      "App URL: " + url + "\n" +
      "My Peer ID: " + pid + "\n\n" +
      "Copy my Peer ID and paste it below to video call with me!";

    if (navigator.share) {
      try {
        await navigator.share({ title: "Baby Ray Studio — Lobby", text: message });
        state.callStatus = "✅ Invite shared!";
        emitState();
      } catch (err) {
        if (err.name !== "AbortError") {
          await navigator.clipboard.writeText(message);
          state.callStatus = "📋 Invite copied to clipboard!";
          emitState();
        }
      }
    } else {
      await navigator.clipboard.writeText(message);
      state.callStatus = "📋 Invite copied to clipboard!";
      emitState();
    }
  }

  // ── Retry PeerJS ───────────────────────────────────────────────────────────
  /**
   * Close and re-create the PeerJS connection (manual retry button handler).
   */
  function retryPeer() {
    state.peerStatus = "connecting";
    state.callStatus = "Reconnecting…";
    state.peerId = "Connecting…";
    state.error = null;
    emitState();

    if (peer) {
      try { peer.destroy(); } catch (e) { /* ignore */ }
      peer = null;
    }
    if (currentCall) {
      try { currentCall.close(); } catch (e) { /* ignore */ }
      currentCall = null;
    }
    if (connectTimeout) clearTimeout(connectTimeout);

    setTimeout(function () {
      init({
        roomId: cfg.roomId,
        userId: cfg.userId,
        displayName: cfg.displayName,
        appId: cfg.appId
      });
    }, 500);
  }

  // ── Error formatting for PeerJS ────────────────────────────────────────────
  function formatPeerJSError(err) {
    if (err.type === "network" || err.type === "network-error") {
      return "Network error: Unable to reach PeerJS server.\n\nCheck your internet connection and try refreshing.";
    }
    if (err.type === "server-unavailable") {
      return "PeerJS server is currently unavailable.\n\nTry refreshing the page in a few minutes.";
    }
    if (err.type === "disconnected") {
      return "Connection closed unexpectedly. Use the Retry button.";
    }
    return "PeerJS error: " + (err.type || "unknown") + "\n\nTry refreshing the page.";
  }

  // ── Teardown ───────────────────────────────────────────────────────────────
  function destroy() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (connectTimeout) {
      clearTimeout(connectTimeout);
      connectTimeout = null;
    }
    if (directoryUnsub) {
      directoryUnsub();
      directoryUnsub = null;
    }
    hangupCall();
    stopCamera();
    goOfflinePresence();

    if (peer) {
      try { peer.destroy(); } catch (e) { /* ignore */ }
      peer = null;
    }
    if (audioCtx) {
      try { audioCtx.close(); } catch (e) { /* ignore */ }
      audioCtx = null;
      audioMixDestination = null;
      micSourceNode = null;
      gainNode = null;
    }

    state.peerId = null;
    state.peerStatus = "disconnected";
    state.callStatus = "Destroyed";
    state.localStream = null;
    state.remoteStream = null;
    state.hasLocalStream = false;
    state.hasRemoteStream = false;
    state.isCalling = false;
    state.isMuted = false;
    state.isCameraOn = false;
    state.isDesktopSharing = false;
    state.isAudioMixing = false;
    state.remotePeerId = null;
    state.peers = [];
    state.error = null;
    emitState();
    subscribers.clear();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  window.BabyRayRTC = {
    // State snapshot
    state: state,
    config: cfg,

    // Lifecycle
    init: init,
    retryPeer: retryPeer,
    destroy: destroy,

    // Media
    startCamera: startCamera,
    stopCamera: stopCamera,
    startDesktopShare: startDesktopShare,
    stopDesktopShare: stopDesktopShare,
    toggleMute: toggleMute,

    // Calls
    startCall: startCall,
    hangupCall: hangupCall,

    // Utilities
    shareInvite: shareInvite,
    refreshPeers: subscribeDirectory,
    getPeerId: function () { return state.peerId; },
    getState: function () {
      return {
        peerId: state.peerId,
        peerStatus: state.peerStatus,
        callStatus: state.callStatus,
        hasLocalStream: state.hasLocalStream,
        hasRemoteStream: state.hasRemoteStream,
        isCalling: state.isCalling,
        isMuted: state.isMuted,
        isCameraOn: state.isCameraOn,
        isDesktopSharing: state.isDesktopSharing,
        isAudioMixing: state.isAudioMixing,
        remotePeerId: state.remotePeerId,
        peers: state.peers.slice(),
        error: state.error,
        config: { ...state.config }
      };
    },
    isLocalPeerId: function (id) { return id === state.peerId; },

    // Subscription (React integration)
    subscribe: function (cb) {
      subscribers.add(cb);
      // Emit immediately so the subscriber gets the current state.
      try {
        cb({
          peerId: state.peerId,
          peerStatus: state.peerStatus,
          callStatus: state.callStatus,
          localStream: state.localStream,
          remoteStream: state.remoteStream,
          hasLocalStream: state.hasLocalStream,
          hasRemoteStream: state.hasRemoteStream,
          isCalling: state.isCalling,
          isMuted: state.isMuted,
          isCameraOn: state.isCameraOn,
          isDesktopSharing: state.isDesktopSharing,
          isAudioMixing: state.isAudioMixing,
          remotePeerId: state.remotePeerId,
          peers: state.peers.slice(),
          error: state.error,
          config: { ...state.config }
        });
      } catch (e) { /* ignore */ }
      return function () { subscribers.delete(cb); };
    },
    unsubscribe: function (cb) {
      subscribers.delete(cb);
    }
  };

  // Expose internal helpers for debugging
  window.BabyRayRTCDebug = {
    getPeer: function () { return peer; },
    getCall: function () { return currentCall; },
    getLocalStream: function () { return localStream; },
    getCameraStream: function () { return cameraStream; },
    getAudioContext: function () { return audioCtx; },
    getAdaptiveProfile: getAdaptiveVideoProfile
  };

  console.log("[RTC] peerManager.js loaded — window.BabyRayRTC ready");
})();