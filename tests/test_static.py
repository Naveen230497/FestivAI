"""Security, Static Asset, and CSP Compliance Test Suite."""
import os
import re
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from unittest import mock

from app.server import STATIC_DIR, STATIC_FILES, make_server


class StaticSecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.env = mock.patch.dict(os.environ, {}, clear=True)
        cls.env.start()
        cls.server = make_server('127.0.0.1', 0)
        cls.base = f'http://127.0.0.1:{cls.server.server_address[1]}'
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.env.stop()

    def request(self, path):
        req = urllib.request.Request(self.base + path)
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.status, dict(resp.headers), resp.read()
        except urllib.error.HTTPError as err:
            return err.code, dict(err.headers), err.read()

    def test_html_contains_no_inline_scripts_or_styles(self):
        html_path = STATIC_DIR / 'index.html'
        content = html_path.read_text(encoding='utf-8')

        # Assert no <style> blocks
        self.assertIsNone(re.search(r'<style\b', content, re.IGNORECASE), 'Found forbidden <style> block in HTML')

        # Assert no style="" inline attributes
        self.assertIsNone(re.search(r'\bstyle\s*=', content, re.IGNORECASE), 'Found forbidden style="" attribute in HTML')

        # Assert no inline event handlers (e.g. onclick=)
        self.assertIsNone(re.search(r'\bon[a-z]+\s*=', content, re.IGNORECASE), 'Found forbidden inline handler in HTML')

        # Assert all <script> tags have src attribute (no inline JS)
        scripts = re.findall(r'<script\b([^>]*)>', content, re.IGNORECASE)
        for attr in scripts:
            self.assertIn('src=', attr, f'Inline <script> without src detected: <script {attr}>')

    def test_no_js_file_uses_innerhtml_or_eval(self):
        js_files = list(STATIC_DIR.rglob('*.js'))
        self.assertGreater(len(js_files), 5, 'Expected multiple modular JS files')

        for js_file in js_files:
            rel = js_file.relative_to(STATIC_DIR)
            code = js_file.read_text(encoding='utf-8')

            self.assertIsNone(
                re.search(r'\binnerHTML\b', code),
                f'Forbidden innerHTML found in {rel}',
            )
            self.assertIsNone(
                re.search(r'\beval\s*\(', code),
                f'Forbidden eval() found in {rel}',
            )

    def test_all_referenced_assets_in_index_html_return_200(self):
        content = (STATIC_DIR / 'index.html').read_text(encoding='utf-8')

        # Extract linked stylesheets and scripts
        css_links = re.findall(r'<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']([^"\']+)["\']', content)
        js_scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', content)

        referenced_urls = set(css_links + js_scripts)
        self.assertIn('/css/tokens.css', referenced_urls)
        self.assertIn('/js/main.js', referenced_urls)

        for url in referenced_urls:
            with self.subTest(url=url):
                status, headers, body = self.request(url)
                self.assertEqual(status, 200, f'Asset {url} returned status {status}')
                self.assertGreater(len(body), 0, f'Asset {url} returned empty body')
                
                if url.endswith('.css'):
                    self.assertIn('text/css', headers.get('Content-Type', ''))
                elif url.endswith('.js'):
                    self.assertIn('text/javascript', headers.get('Content-Type', ''))

    def test_path_traversal_attempts_are_blocked(self):
        traversals = (
            '/../app/server.py',
            '/%2e%2e/app/server.py',
            '/css/../../app/server.py',
            '/js/../README.md',
            '/non_existent_file.png',
        )
        for path in traversals:
            with self.subTest(path=path):
                status, _, _ = self.request(path)
                self.assertEqual(status, 404, f'Traversal attempt {path} must return 404')

    def test_static_allowlist_covers_all_static_files(self):
        for route, (filename, content_type) in STATIC_FILES.items():
            with self.subTest(route=route):
                status, headers, body = self.request(route)
                self.assertEqual(status, 200, f'Route {route} returned {status}')
                self.assertEqual(headers.get('Content-Type'), content_type)
                self.assertGreater(len(body), 0)


if __name__ == '__main__':
    unittest.main()
