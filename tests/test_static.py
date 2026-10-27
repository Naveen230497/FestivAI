"""Security, Static Asset, and CSP Compliance Test Suite."""
from __future__ import annotations

import re
import unittest

from app.server import STATIC_DIR, STATIC_FILES
from tests.helpers import EphemeralServerTestCase


class StaticSecurityTests(EphemeralServerTestCase):
    """Security and asset integrity tests for static UI files."""

    def request(self, path: str) -> tuple[int, dict, bytes]:
        """Perform a GET request to the test server."""
        import urllib.request
        req = urllib.request.Request(self.base + path)
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.status, dict(resp.headers), resp.read()
        except urllib.error.HTTPError as err:
            return err.code, dict(err.headers), err.read()

    def test_html_contains_no_inline_scripts_or_styles(self) -> None:
        """Verify that HTML templates contain no inline scripts or style tags."""
        html_path = STATIC_DIR / 'index.html'
        content = html_path.read_text(encoding='utf-8')

        # Assert no <style> blocks
        self.assertIsNone(
            re.search(r'<style\b', content, re.IGNORECASE),
            'Found forbidden <style> block in HTML',
        )

        # Assert no style="" inline attributes
        self.assertIsNone(
            re.search(r'\bstyle\s*=', content, re.IGNORECASE),
            'Found forbidden style="" attribute in HTML',
        )

        # Assert no inline event handlers (e.g. onclick=)
        self.assertIsNone(
            re.search(r'\bon[a-z]+\s*=', content, re.IGNORECASE),
            'Found forbidden inline handler in HTML',
        )

        # Assert all <script> tags have src attribute (no inline JS)
        scripts = re.findall(r'<script\b([^>]*)>', content, re.IGNORECASE)
        for attr in scripts:
            self.assertIn('src=', attr, f'Inline <script> without src detected: <script {attr}>')

    def test_no_js_file_uses_innerhtml_or_eval(self) -> None:
        """Verify that JavaScript files avoid unsafe DOM manipulation APIs."""
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

    def test_all_referenced_assets_in_index_html_return_200(self) -> None:
        """Verify that all linked assets in index.html resolve successfully."""
        content = (STATIC_DIR / 'index.html').read_text(encoding='utf-8')

        # Extract linked stylesheets and scripts
        css_pattern = r'<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']([^"\']+)["\']'
        css_links = re.findall(css_pattern, content)
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

    def test_path_traversal_attempts_are_blocked(self) -> None:
        """Verify that directory traversal attempts are rejected."""
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

    def test_static_allowlist_covers_all_static_files(self) -> None:
        """Verify that every static file is registered in the static allowlist."""
        for route, (_filename, content_type) in STATIC_FILES.items():
            with self.subTest(route=route):
                status, headers, body = self.request(route)
                self.assertEqual(status, 200, f'Route {route} returned {status}')
                self.assertEqual(headers.get('Content-Type'), content_type)
                self.assertGreater(len(body), 0)


if __name__ == '__main__':
    unittest.main()
