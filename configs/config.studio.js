// Firebase Configuration — studio-2fb13 (BabyRay 4.0 Studio)
var firebaseConfig = {
  apiKey: "AIzaSyB0Y2l5fHvzoUkSJFWrd4ADb-6rRAT47Sw",
  authDomain: "studio-2fb13.firebaseapp.com",
  projectId: "studio-2fb13",
  storageBucket: "studio-2fb13.appspot.com",
  messagingSenderId: "367389228492",
  appId: "1:367389228492:web:bc6f2aa62446f7dd957169",
  measurementId: "G-GQVYKH4J36"
};

var appId = 'ai-enterprise-studio';

var cloudPeerJsConfig = { host: '0.peerjs.com', port: 443, path: '/', secure: true };
var localPeerJsConfig = { host: 'localhost', port: 9000, path: '/myapp', secure: false };
var peerJsConfig = (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1'))
  ? localPeerJsConfig : cloudPeerJsConfig;

var GOODDGIRL_USER_ID = 'gooddgirl-fixed-id';
