// rtcReactBridge.js — React hooks wrapper for the BabyRayRTC WebRTC engine.
//
// Loaded as a plain <script> (NOT type="text/babel") before main.jsx.
// Depends on: window.BabyRayRTC  (src/rtc/peerManager.js)
//             React (UMD global, loaded by lobby.html)
//
// Mirrors the pattern used by browserChatBindings.js — browser-global hooks
// that React components can consume without ES module imports.

(function () {
  var rtc = null;

  /**
   * useWebRTC(roomId, displayName)
   *
   * Subscribes to BabyRayRTC state changes and exposes a React-friendly
   * snapshot + action bound methods.
   *
   * Returns: {
   *   peerId, peerStatus, callStatus, localStream, remoteStream,
   *   hasLocalStream, hasRemoteStream, isCalling, isMuted, isCameraOn,
   *   isDesktopSharing, isAudioMixing, remotePeerId, peers, error,
   *   ready,  // boolean — true when BabyRayRTC is available
   *   startCamera, startCall, hangupCall, startDesktopShare,
   *   stopDesktopShare, toggleMute, shareInvite, retryPeer, init
   * }
   */
  function useWebRTC(roomId, displayName) {
    var hook = React; // UMD global
    var useEffect = hook.useEffect;
    var useMemo = hook.useMemo;
    var useState = hook.useState;

    var [rt, setRt] = useState(function () {
      var initial = {
        peerId: null,
        peerStatus: "disconnected",
        callStatus: "Not connected",
        localStream: null,
        remoteStream: null,
        hasLocalStream: false,
        hasRemoteStream: false,
        isCalling: false,
        isMuted: false,
        isCameraOn: false,
        isDesktopSharing: false,
        isAudioMixing: false,
        remotePeerId: null,
        peers: [],
        error: null
      };
      var rtcRef = window.BabyRayRTC;
      if (rtcRef && rtcRef.state) {
        Object.assign(initial, {
          peerId: rtcRef.state.peerId,
          peerStatus: rtcRef.state.peerStatus,
          callStatus: rtcRef.state.callStatus,
          localStream: rtcRef.state.localStream,
          remoteStream: rtcRef.state.remoteStream,
          hasLocalStream: rtcRef.state.hasLocalStream,
          hasRemoteStream: rtcRef.state.hasRemoteStream,
          isCalling: rtcRef.state.isCalling,
          isMuted: rtcRef.state.isMuted,
          isCameraOn: rtcRef.state.isCameraOn,
          isDesktopSharing: rtcRef.state.isDesktopSharing,
          isAudioMixing: rtcRef.state.isAudioMixing,
          remotePeerId: rtcRef.state.remotePeerId,
          peers: rtcRef.state.peers ? rtcRef.state.peers.slice() : [],
          error: rtcRef.state.error
        });
      }
      return initial;
    });

    useEffect(
      function () {
        var rtcRef = window.BabyRayRTC;
        if (!rtcRef || typeof rtcRef.subscribe !== "function") {
          setRt(function (prev) { return Object.assign({}, prev, { error: "BabyRayRTC not available" }); });
          return undefined;
        }

        // Initialise the engine (idempotent — only creates a Peer if not already open)
        var displayNameVal = displayName || "Lobby Artist";
        rtcRef.init({ roomId: roomId || "altar-default", displayName: displayNameVal });

        var handleState = function (snapshot) {
          setRt({
            peerId: snapshot.peerId,
            peerStatus: snapshot.peerStatus,
            callStatus: snapshot.callStatus,
            localStream: snapshot.localStream,
            remoteStream: snapshot.remoteStream,
            hasLocalStream: snapshot.hasLocalStream,
            hasRemoteStream: snapshot.hasRemoteStream,
            isCalling: snapshot.isCalling,
            isMuted: snapshot.isMuted,
            isCameraOn: snapshot.isCameraOn,
            isDesktopSharing: snapshot.isDesktopSharing,
            isAudioMixing: snapshot.isAudioMixing,
            remotePeerId: snapshot.remotePeerId,
            peers: snapshot.peers || [],
            error: snapshot.error
          });
        };

        var unsubscribe = rtcRef.subscribe(handleState);

        return function cleanup() {
          if (typeof unsubscribe === "function") unsubscribe();
        };
      },
      [roomId, displayName]
    );

    return useMemo(
      function () {
        var rtcRef = window.BabyRayRTC;
        var ready = !!rtcRef;
        return Object.assign({}, rt, { ready: ready }, {
          startCamera: ready ? function () { return rtcRef.startCamera(); } : function () { console.warn("[RTC] not ready"); },
          startCall: ready ? function (pid) { return rtcRef.startCall(pid); } : function () { console.warn("[RTC] not ready"); },
          hangupCall: ready ? function () { return rtcRef.hangupCall(); } : function () { console.warn("[RTC] not ready"); },
          startDesktopShare: ready ? function () { return rtcRef.startDesktopShare(); } : function () { console.warn("[RTC] not ready"); },
          stopDesktopShare: ready ? function () { return rtcRef.stopDesktopShare(); } : function () { console.warn("[RTC] not ready"); },
          toggleMute: ready ? function () { return rtcRef.toggleMute(); } : function () { console.warn("[RTC] not ready"); },
          shareInvite: ready ? function () { return rtcRef.shareInvite(); } : function () { console.warn("[RTC] not ready"); },
          retryPeer: ready ? function () { return rtcRef.retryPeer(); } : function () { console.warn("[RTC] not ready"); },
          init: ready ? function (o) { return rtcRef.init(o); } : function () { console.warn("[RTC] not ready"); },
          refreshPeers: ready ? function () { return rtcRef.refreshPeers(); } : function () { console.warn("[RTC] not ready"); }
        });
      },
      [rt, roomId, displayName]
    );
  }

  window.BabyRayRTCReact = {
    useWebRTC: useWebRTC
  };
})();
