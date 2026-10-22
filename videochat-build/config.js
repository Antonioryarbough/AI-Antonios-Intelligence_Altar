// Firebase Configuration — raydent-16571 (Lobby)
var firebaseConfig = {
  apiKey: "AIzaSyA9Rl785wVd6NVgdNqU_5lsy36dHYnLMlE",
  authDomain: "raydent-16571.firebaseapp.com",
  projectId: "raydent-16571",
  storageBucket: "raydent-16571.firebasestorage.app",
  messagingSenderId: "904932609815",
  appId: "1:904932609815:web:21147268961e89870a3152",
  measurementId: "G-42YE0D1F68"
};

var appId = 'ai-enterprise-studio';

var cloudPeerJsConfig = { host: '0.peerjs.com', port: 443, path: '/', secure: true };
var localPeerJsConfig = { host: 'localhost', port: 9000, path: '/myapp', secure: false };
var peerJsConfig = (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1'))
  ? localPeerJsConfig : cloudPeerJsConfig;

var GOODDGIRL_USER_ID = 'gooddgirl-fixed-id';
