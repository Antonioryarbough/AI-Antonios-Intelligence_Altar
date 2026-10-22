// VideoCallSection — browser-global React component (no ES imports)
// Loaded via <script type="text/babel"> before main.jsx
// Depends on: window.BabyRayRTCReact (useWebRTC hook), React (UMD global)
// Theme: "Don't get killed… Get skilled" — AI rap assistants as collaborators

function VideoCallSection({ rtc }) {
  const [peerIdToCall, setPeerIdToCall] = React.useState("");

  const handleCallPeer = (peerId) => {
    if (!peerId) return;
    rtc.startCall(peerId);
  };

  const handlePeerCardClick = (peer) => {
    if (rtc.isCalling) {
      if (window.confirm("Switch to calling " + peer.displayName + "?")) {
        rtc.hangupCall();
        setTimeout(() => handleCallPeer(peer.peerId), 300);
      }
    } else {
      handleCallPeer(peer.peerId);
    }
  };

  return (
    <div className="video-call-panel">
      {/* Header with peer ID badge and call status */}
      <div className="video-call-header">
        <h2>📹 Lobby Music Production School</h2>
        <div style={{ textAlign: "right" }}>
          <div className="peer-id-badge">{rtc.peerId || "Connecting…"}</div>
          <div className="call-status">{rtc.callStatus}</div>
        </div>
      </div>

      {/* Video tiles: main remote + local picture-in-picture */}
      <div className="video-tiles">
        <div className="video-main">
          {rtc.hasRemoteStream ? (
            <video
              autoPlay
              playsInline
              srcObject={rtc.remoteStream}
            />
          ) : (
            <div className="video-placeholder">
              {rtc.isCalling
                ? "📞 Calling… waiting for answer"
                : "Enable camera and call a peer to see their video here"}
            </div>
          )}
        </div>
        {rtc.hasLocalStream && (
          <div className="video-pip">
            <video
              autoPlay
              muted
              playsInline
              srcObject={rtc.localStream}
            />
            <div className="pip-label">
              You {rtc.isMuted && "🔇"} {rtc.isDesktopSharing && "🖥️"}
            </div>
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="call-controls">
        <button
          className={"call-btn" + (rtc.isCameraOn ? " active" : "")}
          onClick={() => {
            if (!rtc.isCameraOn) rtc.startCamera();
          }}
          disabled={rtc.isCameraOn || !rtc.ready}
        >
          {rtc.isCameraOn ? "📹 On" : "📹 Enable Camera"}
        </button>

        {!rtc.isCalling ? (
          <button
            className="call-btn"
            onClick={() => {
              const pid = peerIdToCall.trim();
              if (pid) handleCallPeer(pid);
              else alert("Enter a Peer ID first, or click a peer below");
            }}
            disabled={!rtc.isCameraOn || !rtc.peerId || !rtc.ready}
          >
            📞 Call
          </button>
        ) : (
          <button
            className="call-btn danger"
            onClick={() => rtc.hangupCall()}
          >
            ❌ Hang Up
          </button>
        )}

        {rtc.isCameraOn && !rtc.isCalling && (
          <button
            className={"call-btn" + (rtc.isDesktopSharing ? " active" : "")}
            onClick={() => {
              if (rtc.isDesktopSharing) rtc.stopDesktopShare();
              else rtc.startDesktopShare();
            }}
          >
            {rtc.isDesktopSharing ? "🖥️ Stop Share" : "🖥️ Share Screen"}
          </button>
        )}

        {rtc.isCalling && (
          <button
            className="call-btn"
            onClick={() => rtc.toggleMute()}
          >
            {rtc.isMuted ? "🔊 Unmute" : "🔇 Mute"}
          </button>
        )}

        <button
          className="call-btn"
          onClick={() => rtc.shareInvite()}
          disabled={!rtc.peerId}
        >
          📤 Share Invite
        </button>

        {rtc.peerStatus === "error" && (
          <button
            className="call-btn"
            onClick={() => rtc.retryPeer()}
          >
            🔄 Retry PeerJS
          </button>
        )}
      </div>

      {/* Peer ID input for manual calling */}
      {!rtc.isCalling && (
        <div style={{ marginTop: "12px" }}>
          <input
            type="text"
            value={peerIdToCall}
            onChange={(e) => setPeerIdToCall(e.target.value)}
            placeholder="Enter Peer ID to call"
            className="peer-id-input"
          />
        </div>
      )}

      {/* Peer directory — clickable cards for online peers */}
      <div className="peer-directory">
        {rtc.peers && rtc.peers.length > 0 ? (
          rtc.peers.map((p) => (
            <div
              key={p.peerId}
              className="peer-card"
              onClick={() => handlePeerCardClick(p)}
            >
              <div className="peer-dot"></div>
              <div className="peer-name">{p.displayName || "Creator"}</div>
              <div className="peer-id-short">{p.peerId.substring(0, 8)}…</div>
            </div>
          ))
        ) : (
          <div className="peer-empty">
            No other creators are live in this room. Share your Peer ID to invite someone!
          </div>
        )}
      </div>

      {/* Error display */}
      {rtc.error && (
        <div className="rtc-error">
          ⚠️ {rtc.error}
        </div>
      )}
    </div>
  );
}
