// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0Y2l5fHvzoUkSJFWrd4ADb-6rRAT47Sw",
  authDomain: "studio-2fb13.firebaseapp.com",
  projectId: "studio-2fb13",
  storageBucket: "studio-2fb13.appspot.com",
  messagingSenderId: "367389228492",
  appId: "1:367389228492:web:bc6f2aa62446f7dd957169",
  measurementId: "G-GQVYKH4J36"
};

// App Configuration
const appId = 'ai-enterprise-studio';

// PeerJS Configuration
const defaultIceServers = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302'
    ]
  },
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp'
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

// Cloud (default) + optional local self-host for development/reduced latency.
const cloudPeerJsConfig = {
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true,
  config: { iceServers: defaultIceServers }
};

// Local development server (run: `npm run peer:server`) lives at http://localhost:9000/myapp
const localPeerJsConfig = {
  host: 'localhost',
  port: 9000,
  path: '/myapp',
  secure: false,
  config: { iceServers: defaultIceServers }
};

// Auto-pick local when running from localhost, otherwise use cloud.
// Optional URL override allows quick testing with custom signaling hosts:
// ?peerHost=example.com&peerPort=443&peerPath=/myapp&peerSecure=true
const peerJsConfig = (() => {
  const hasLocation = typeof location !== 'undefined';
  const isLocalHost = hasLocation && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  const base = isLocalHost ? localPeerJsConfig : cloudPeerJsConfig;

  if (!hasLocation) return base;

  const params = new URLSearchParams(location.search);
  const peerHost = params.get('peerHost');
  if (!peerHost) return base;

  const peerPort = Number(params.get('peerPort'));
  const peerPath = params.get('peerPath');
  const peerSecure = params.get('peerSecure');

  return {
    ...base,
    host: peerHost,
    port: Number.isFinite(peerPort) && peerPort > 0 ? peerPort : base.port,
    path: peerPath || base.path,
    secure: peerSecure === null ? base.secure : peerSecure === 'true'
  };
})();

// GoodDGirl User ID (can be customized)
const GOODDGIRL_USER_ID = 'gooddgirl-fixed-id';

// Optional global export for standalone pages that share the same backend config.
if (typeof window !== 'undefined') {
  window.STUDIO_CONFIG = {
    firebaseConfig,
    appId,
    defaultIceServers,
    cloudPeerJsConfig,
    localPeerJsConfig,
    peerJsConfig,
    GOODDGIRL_USER_ID
  };
}
