#!/usr/bin/env python3
"""
Lightweight static-file server for the KMRL React frontend.
Serves ~/public on port 3000 with SPA fallback (all routes → index.html).
API calls are proxied to the backend on port 8300.
"""

import http.server
import os
import socketserver
import urllib.request
import urllib.error

PORT = 3000
PUBLIC_DIR = os.path.expanduser("~/public")

# API prefixes that should be proxied to the backend
API_PREFIXES = (
    "/health", "/webhook/", "/auth/", "/ingest/", "/features/",
    "/schedule/", "/liveops/", "/api/",
)

BACKEND = "http://127.0.0.1:8300"


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    """Serve static files with SPA fallback and API proxy."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    # ---------- API proxy ----------
    def _is_api(self):
        return any(self.path.startswith(p) for p in API_PREFIXES)

    def _proxy(self, method="GET", body=None):
        url = BACKEND + self.path
        headers = {k: v for k, v in self.headers.items()
                   if k.lower() not in ("host",)}
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
                self.send_response(resp.status)
                for k, v in resp.getheaders():
                    if k.lower() not in ("transfer-encoding", "connection"):
                        self.send_header(k, v)
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            for k, v in e.headers.items():
                if k.lower() not in ("transfer-encoding", "connection"):
                    self.send_header(k, v)
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_error(502, f"Backend unavailable: {e}")

    # ---------- HTTP verbs ----------
    def do_GET(self):
        if self._is_api():
            return self._proxy("GET")
        # Try to serve the file; if it doesn't exist, fall back to index.html (SPA)
        path = self.translate_path(self.path)
        if os.path.isfile(path):
            return super().do_GET()
        # SPA fallback
        self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else None
        return self._proxy("POST", body)

    def do_PUT(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else None
        return self._proxy("PUT", body)

    def do_DELETE(self):
        return self._proxy("DELETE")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        self.end_headers()

    # Suppress noisy per-request logs
    def log_message(self, format, *args):
        pass


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def main():
    print(f"Frontend server starting on http://0.0.0.0:{PORT}")
    print(f"Serving files from {PUBLIC_DIR}")
    print(f"API proxy → {BACKEND}")
    with ReusableTCPServer(("0.0.0.0", PORT), SPAHandler) as httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    main()
