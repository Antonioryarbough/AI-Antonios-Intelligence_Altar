// Firebase Configuration — studio-9757662699-74931 (Main Stage)
const firebaseConfig = {
  apiKey: "AIzaSyBDJ4ygYAzmZLyP4o13uUhPBF3xk9Xk2Y0",
  authDomain: "studio-9757662699-74931.firebaseapp.com",
  projectId: "studio-9757662699-74931",
  storageBucket: "studio-9757662699-74931.firebasestorage.app",
  messagingSenderId: "508114864761",
  appId: "1:508114864761:web:048454479ce47e139de2a8",
  measurementId: "G-33WVFTCKG8"
};

const appId = 'ai-enterprise-studio';

const cloudPeerJsConfig = { host: '0.peerjs.com', port: 443, path: '/', secure: true };
const localPeerJsConfig = { host: 'localhost', port: 9000, path: '/myapp', secure: false };
const peerJsConfig = (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1'))
  ? localPeerJsConfig : cloudPeerJsConfig;

const GOODDGIRL_USER_ID = 'gooddgirl-fixed-id';
