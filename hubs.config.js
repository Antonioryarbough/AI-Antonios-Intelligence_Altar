// hubs.config.js — Central Studio Directory (single source of truth)
// ====================================================================
// One manifest for the AI Antonios Intelligence hub and its sibling studios.
// Each studio is a self-contained app with a unique URL + PeerJS room. The hub
// (mainstage front page) discovers/links the others from this manifest.
//
// IMPORTANT (load-time): mainstage-build/ only ships the files produced by
// `npm run build:mainstage` (index.html, styles.css, config.js). So this file is
// NOT auto-copied unless the `babyray-classic` build profile gets an `extra`
// entry. It therefore lives as the canonical, machine-readable registry only —
// the front-page launcher (#ai-hubs-launcher) currently hard-codes the same
// URLs. Keep them in sync, or add `"hubs.config.js:hubs.config.js"` to the
// build profile's `extra` + drop `<script src="hubs.config.js">` in the head.
//
// PeerJS: all four Firebase apps share `appId: 'ai-enterprise-studio'`, so they
// share the same PeerJS room namespace by design — that is what lets a studio
// "discover and call" another studio. See STUDIO_DIRECTORY.md.

window.HUBS = Object.freeze([
  {
    id: 'mainstage',
    name: 'AI Antonios Intelligence (Front Page / Music Video Maker)',
    url: 'https://ai-antonios-intelligence.vercel.app', // original homepage
    platform: 'vercel',
    firebaseProject: 'studio-9757662699-74931',
    source: 'public/index.html',
    build: 'npm run build:mainstage',
    deploy: 'npx vercel --prod',
    peerRoom: 'ai-enterprise-studio',
    status: 'live-on-vercel'
  },
  {
    id: 'studio',
    name: 'BabyRay 4.0 Studio (Camera / Scene tabs)',
    url: 'https://studio-2fb13.web.app',
    platform: 'firebase-hosting',
    alias: 'studio',            // .firebaserc: studio -> studio-2fb13
    firebaseProject: 'studio-2fb13',
    source: 'Studio/public/index.html (root index.html)',
    build: 'npm run build:studio',
    deploy: 'npm run deploy:studio',
    peerRoom: 'ai-enterprise-studio',
    status: 'live'
  },
  {
    id: 'community',
    name: 'Community (raydent-16571)',
    url: 'https://raydent-16571.web.app',
    platform: 'firebase-hosting',
    alias: 'default',           // .firebaserc default -> raydent-16571
    firebaseProject: 'raydent-16571',
    source: 'Studio/public/index.html (root firebase.json)',
    build: 'firebase deploy --only hosting --config firebase.json',
    deploy: 'firebase deploy --only hosting --config firebase.json',
    peerRoom: 'ai-enterprise-studio',
    status: 'live'
  },
  {
    id: 'lobby',
    name: 'Video Chat / Lobby',
    url: 'https://lobby-raydent.web.app',   // distinct named site — see firebase.lobby.json
    platform: 'firebase-hosting',
    alias: 'lobby',             // .firebaserc: lobby -> raydent-16571
    site: 'lobby-raydent',      // NOTE: create this named site ONCE first (see STUDIO_DIRECTORY.md)
    firebaseProject: 'raydent-16571',
    source: 'lobby.html + src/ (videochat-build)',
    build: 'npm run build:videochat',
    deploy: 'npm run deploy:lobby',
    peerRoom: 'ai-enterprise-studio',
    status: 'live'
  },
  {
    id: 'frontpage',
    name: 'babyray-front (Firebase alias — ORPHANED, do not use)',
    url: null,                  // .firebaserc frontpage -> babyray-front ; no firebase config exists
    platform: 'firebase-hosting',
    alias: 'frontpage',
    firebaseProject: 'babyray-front',
    source: 'n/a',
    build: null,
    deploy: null,
    peerRoom: null,
    status: 'orphaned-unused'
  }
]);

// Convenience accessor (optional future use)
window.hubUrl = function hubUrl(id) {
  return (window.HUBS || []).find(function (h) { return h.id === id; })?.url;
};
