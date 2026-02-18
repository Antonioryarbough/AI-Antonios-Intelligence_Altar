#!/usr/bin/env python3
"""Simple Python dev server that injects Firebase globals into index.html

Usage:
  python3 dev-server.py --appId=raydent-16571 --port=8000

It will read `.firebase_config.json` in the repo root or the `FIREBASE_CONFIG` env var.
"""
import http.server
import socketserver
import argparse
import os
import json
from urllib.parse import unquote

ROOT = os.getcwd()

class InjectHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = unquote(self.path.split('?',1)[0])
        if path == '/' or path == '/index.html':
            self.serve_index_injected()
        else:
            return super().do_GET()

    def serve_index_injected(self):
        index_path = os.path.join(ROOT, 'index.html')
        if not os.path.exists(index_path):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'index.html not found')
            return
        with open(index_path, 'r', encoding='utf-8') as f:
            html = f.read()
        # Build injection script from server attributes set at startup
        cfg = self.server.firebase_config
        app_id = self.server.app_id
        token = None
        inject = f"\n<script>window.__firebase_config = {json.dumps(cfg)}; window.__app_id = {json.dumps(app_id)}; window.__initial_auth_token = null;</script>\n"
        if '</head>' in html:
            html = html.replace('</head>', inject + '</head>')
        else:
            html = inject + html
        encoded = html.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


def load_firebase_config(app_id):
    # Try env var
    cfg = None
    env = os.environ.get('FIREBASE_CONFIG')
    if env:
        try:
            cfg = json.loads(env)
        except Exception:
            pass
    # Try local file
    if cfg is None:
        cfg_path = os.path.join(ROOT, '.firebase_config.json')
        if os.path.exists(cfg_path):
            try:
                with open(cfg_path, 'r', encoding='utf-8') as f:
                    cfg = json.load(f)
            except Exception:
                cfg = None
    # Fallback minimal
    if cfg is None:
        cfg = {"projectId": app_id}
    return cfg


def run(port, app_id):
    firebase_config = load_firebase_config(app_id)
    Handler = InjectHandler
    with socketserver.TCPServer(("", port), Handler) as httpd:
        httpd.firebase_config = firebase_config
        httpd.app_id = app_id
        print(f"Dev server running at http://localhost:{port}  (appId={app_id})")
        print('Serving files from', ROOT)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nStopping server')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--appId', type=str, default='raydent-16571')
    args = parser.parse_args()
    run(args.port, args.appId)
