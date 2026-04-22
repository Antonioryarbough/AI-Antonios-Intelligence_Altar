// Firebase Configuration — studio-2fb13 (BabyRay 4.0 Studio)
const firebaseConfig = {
  apiKey: "AIzaSyB0Y2l5fHvzoUkSJFWrd4ADb-6rRAT47Sw",
  authDomain: "studio-2fb13.firebaseapp.com",
  projectId: "studio-2fb13",
  storageBucket: "studio-2fb13.appspot.com",
  messagingSenderId: "367389228492",
  appId: "1:367389228492:web:bc6f2aa62446f7dd957169",
  measurementId: "G-GQVYKH4J36"
};

const appId = 'ai-enterprise-studio';

const cloudPeerJsConfig = { host: '0.peerjs.com', port: 443, path: '/', secure: true };
const localPeerJsConfig = { host: 'localhost', port: 9000, path: '/myapp', secure: false };
const peerJsConfig = (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1'))
  ? localPeerJsConfig : cloudPeerJsConfig;

const GOODDGIRL_USER_ID = 'gooddgirl-fixed-id';
