# Local PeerJS Server

You can run a self-hosted PeerJS signaling server locally for lower latency and fewer disconnects vs the public cloud host.

## Start Server (Development)

```powershell
npm run peer:server
```

This starts the server at: `http://localhost:9000/myapp`

## How the Client Chooses Config
`public/config.js` now auto-selects:
- Local config when `location.hostname` is `localhost` or `127.0.0.1`
- Cloud config (0.peerjs.com) for any other host (deployed site)

No manual change needed for typical workflows. Just open the app at `http://localhost:PORT` (Firebase local serve or other) *after* starting the peer server.

## For Remote Self-Hosting
If you deploy the peer server yourself behind HTTPS:
1. Put it behind a reverse proxy (Nginx/Caddy) with TLS.
2. Set environment variables when starting:
   - `PORT` (e.g. 443 behind proxy)
   - `PEER_PATH` (your chosen path; keep `/myapp` or change)
3. Edit `cloudPeerJsConfig` in `public/config.js` to point to your host.

## Troubleshooting
| Symptom | Action |
|---------|--------|
| Client shows `PeerJS disconnected; attempting reconnect` repeatedly | Ensure server is running; check firewall or port conflict |
| Cannot connect, browser console shows `ERR_CONNECTION_REFUSED` | Start server (`npm run peer:server`); verify port 9000 is free |
| Works locally but not via LAN IP | Add exception to local firewall or bind reverse proxy |
| Need verbose logs | Temporarily add `debug: 2` inside the chosen config object in `config.js` |

## Why Self-Host?
- Reduces reliance on public shared signaling infrastructure
- More stable during peak times
- Ability to log connections for analytics/security

Server code: `peer-server/server.js` (uses the `peer` package).
