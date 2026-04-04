// Simple CommonJS PeerJS server.
// Start: node server.js
// Then change peerJsConfig in public/config.js to:
//   const peerJsConfig = { host: 'localhost', port: 9000, path: '/myapp', secure: false };
// To allow remote access: run behind an HTTPS reverse proxy and use the proxy host/port.

const { PeerServer } = require('peer');

const PORT = process.env.PORT || 9000;
const PATH = process.env.PEER_PATH || '/myapp';

const peerServer = PeerServer({
  port: PORT,
  path: PATH,
  allow_discovery: true,
});

peerServer.on('connection', client => {
  console.log(`[peer] connected: ${client.getId()}`);
});

peerServer.on('disconnect', client => {
  console.log(`[peer] disconnected: ${client.getId()}`);
});

console.log(`PeerJS server running on port ${PORT} path ${PATH}`);