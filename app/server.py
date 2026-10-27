"""Minimal HTTP server: static UI, /health and POST /api/plan (standard library)."""
from __future__ import annotations

import json
import logging
import os
from functools import cache
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from .api import MAX_BODY_BYTES, RateLimiter, handle_plan

STATIC_DIR = Path(__file__).resolve().parent.parent / 'static'

MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=utf-8',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
}


def _build_static_map(root: Path) -> dict[str, tuple[str, str]]:
    """Safe explicit mapping of allowed files in static/ directory.
    Keys are strictly matched request paths, completely preventing directory traversal.
    """
    mapping: dict[str, tuple[str, str]] = {
        '/': ('index.html', 'text/html; charset=utf-8'),
        '/index.html': ('index.html', 'text/html; charset=utf-8'),
    }
    if not root.is_dir():
        return mapping
    for p in root.rglob('*'):
        if p.is_file():
            ext = p.suffix.lower()
            if ext in MIME_TYPES:
                rel = p.relative_to(root).as_posix()
                mapping[f'/{rel}'] = (rel, MIME_TYPES[ext])
    return mapping


# Explicit allow-list populated at startup: no user-controlled file paths.
STATIC_FILES = _build_static_map(STATIC_DIR)
SECURITY_HEADERS = {
    'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
}


@cache
def _read_static(name: str) -> bytes:
    return (STATIC_DIR / name).read_bytes()


class Handler(BaseHTTPRequestHandler):
    """HTTP request handler serving static files and API endpoints."""
    server_version = 'FestivAI'
    sys_version = ''
    limiter = RateLimiter()

    def _send(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        for name, value in SECURITY_HEADERS.items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, status: int, data: dict) -> None:
        self._send(status, json.dumps(data, default=str).encode('utf-8'), 'application/json')

    def do_GET(self) -> None:
        """Handle GET requests for static assets and health checks."""
        path = self.path.split('?', 1)[0]
        if path == '/health':
            return self._send_json(200, {'status': 'ok'})
        entry = STATIC_FILES.get(path)
        if entry is None:
            return self._send_json(404, {'detail': 'Not found'})
        self._send(200, _read_static(entry[0]), entry[1])

    def do_POST(self) -> None:
        """Handle POST requests for plan generation."""
        if self.path.split('?', 1)[0] != '/api/plan':
            return self._send_json(404, {'detail': 'Not found'})
        try:
            length = max(int(self.headers.get('Content-Length', '0')), 0)
        except ValueError:
            return self._send_json(400, {'detail': 'Invalid Content-Length.'})
        raw = self.rfile.read(min(length, MAX_BODY_BYTES + 1))
        status, body = handle_plan(
            raw, self.headers.get('Content-Type', ''), self.client_address[0], self.limiter
        )
        self._send_json(status, body)

    def log_message(self, fmt: str, *args) -> None:  # route access logs through logging
        """Log HTTP request details through the application logger."""
        logging.getLogger('festivai.access').info('%s - %s', self.address_string(), fmt % args)


def _load_env() -> None:
    env_file = Path(__file__).resolve().parent.parent / '.env'
    if not env_file.is_file():
        return
    try:
        for line in env_file.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            k, v = k.strip(), v.strip().strip('\'"')
            if k and k not in os.environ:
                os.environ[k] = v
    except (OSError, UnicodeDecodeError):
        pass


def make_server(host: str = '127.0.0.1', port: int = 8000) -> ThreadingHTTPServer:
    """Create a server whose handler has its own fresh rate limiter."""
    handler = type('BoundHandler', (Handler,), {'limiter': RateLimiter()})
    return ThreadingHTTPServer((host, port), handler)


def main() -> None:
    """Start the HTTP server on configured host and port."""
    _load_env()
    logging.basicConfig(level=logging.INFO)
    host = os.getenv('HOST', '127.0.0.1')
    port = int(os.getenv('PORT', '8000'))
    server = make_server(host, port)
    print(f'FestivAI running at http://{host}:{port}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
