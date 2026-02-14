/* Simple dev server that injects Firebase globals into index.html

Usage:
  # create .firebase_config.json with a valid Firebase web config OR set FIREBASE_CONFIG env var
  node dev-server.js --appId=raydent-16571 --port=8000

The server will inject a script tag setting window.__firebase_config and window.__app_id before serving index.html.
*/

const http = require('http');
const fs = require('fs');
const path = require('path');

const argv = require('minimist')(process.argv.slice(2));
const port = argv.port || process.env.PORT || 8000;
const root = process.cwd();
const appId = argv.appId || process.env.APP_ID || 'raydent-16571';

let firebaseConfig = null;
// Try env var first
if (process.env.FIREBASE_CONFIG) {
  try { firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG); } catch (e) { console.error('Invalid FIREBASE_CONFIG JSON'); }
}
// Then try file .firebase_config.json
if (!firebaseConfig) {
  const cfgPath = path.join(root, '.firebase_config.json');
  if (fs.existsSync(cfgPath)) {
    try { firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch (e) { console.error('Invalid .firebase_config.json'); }
  }
}
// Fallback minimal config with projectId (not functional for auth without real keys)
if (!firebaseConfig) {
  firebaseConfig = { projectId: appId };
}

function injectAndServeIndex(res) {
  const indexPath = path.join(root, 'index.html');
  if (!fs.existsSync(indexPath)) { res.writeHead(404); res.end('index.html not found'); return; }
  let html = fs.readFileSync(indexPath, 'utf8');
  const inject = `\n<script>window.__firebase_config = ${JSON.stringify(firebaseConfig)}; window.__app_id = ${JSON.stringify(appId)}; window.__initial_auth_token = null;</script>\n`;
  // Insert before </head> if present, otherwise prepend
  if (html.indexOf('</head>') !== -1) {
    html = html.replace('</head>', inject + '</head>');
  } else {
    html = inject + html;
  }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
}

function serveFile(req, res) {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const safePath = path.normalize(urlPath).replace(/^\/+/, '');
  let filePath = path.join(root, safePath);
  if (urlPath === '/' || urlPath === '/index.html') return injectAndServeIndex(res);
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) { return injectAndServeIndex(res); }
  const stream = fs.createReadStream(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg'
  };
  res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
  stream.pipe(res);
}

const server = http.createServer((req, res) => {
  try { serveFile(req, res); } catch (e) { console.error(e); res.writeHead(500); res.end('Server error'); }
});

server.listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}  (appId=${appId})`);
  console.log('To use a real Firebase config, create .firebase_config.json or set FIREBASE_CONFIG env var.');
});
