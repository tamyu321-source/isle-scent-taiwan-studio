import contextlib
import io
import json
import tempfile
import threading
import time
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

import checkpoint
from browser_checks import (
    BlockedError,
    generic_steps,
    inspect_images,
    navigate,
    page_health,
    validate_url,
)
from reporting import (
    artifact_path,
    case_status,
    create_run,
    finish_report,
    read_json,
    render_html,
    save_report,
)


class FixtureHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        if self.path.startswith("/slow"):
            time.sleep(2)
        status = 404 if self.path.startswith("/missing") else 403 if self.path == "/denied" else 200
        content = "<!doctype html><html><head><title>CHECKPOINT fixture</title></head><body><h1>測試頁面</h1>"
        if self.path == "/image":
            content += '<img src="/missing.png" alt="broken">'
        if self.path == "/overflow":
            content += '<div style="width:3000px">wide</div>'
        if self.path == "/script":
            content += '<script>throw new Error("fixture error")</script>'
        if self.path == "/challenge":
            content = "<title>Verify you are human</title><body>challenge"
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        try:
            self.wfile.write((content + "</body></html>").encode("utf-8"))
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass


class BrowserFailureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), FixtureHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        self.context = self.browser.new_context(viewport={"width": 390, "height": 844})
        self.page = self.context.new_page()
        self.page.set_default_timeout(500)
        self.page.set_default_navigation_timeout(500)
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))

    def tearDown(self):
        self.context.close()

    def test_clean_page_and_zero_images_pass(self):
        for _, _, action in generic_steps(self.page, self.base + "/ok", self.errors):
            self.assertTrue(action())

    def test_broken_image_is_failure(self):
        navigate(self.page, self.base + "/image")
        with self.assertRaisesRegex(AssertionError, "圖片未載入"):
            inspect_images(self.page)

    def test_javascript_error_is_failure(self):
        navigate(self.page, self.base + "/script")
        with self.assertRaisesRegex(AssertionError, "fixture error"):
            page_health(self.page, self.errors)

    def test_horizontal_overflow_is_failure(self):
        navigate(self.page, self.base + "/overflow")
        with self.assertRaisesRegex(AssertionError, "水平溢出"):
            page_health(self.page, self.errors)

    def test_http_error_is_failure(self):
        with self.assertRaisesRegex(AssertionError, "404"):
            navigate(self.page, self.base + "/missing")

    def test_denied_and_challenge_are_blocked(self):
        for route in ("/denied", "/challenge"):
            with self.assertRaises(BlockedError):
                navigate(self.page, self.base + route)

    def test_navigation_timeout_is_not_success(self):
        with self.assertRaises(PlaywrightTimeout):
            navigate(self.page, self.base + "/slow")

    def test_case_deadline_preserves_report(self):
        with tempfile.TemporaryDirectory() as directory:
            args = checkpoint.parser().parse_args(
                [
                    "--base-url",
                    self.base + "/slow/",
                    "--headless",
                    "--viewport",
                    "desktop",
                    "--output",
                    directory,
                ]
            )
            with patch.object(checkpoint, "CASE_LIMIT", 1), contextlib.redirect_stdout(
                io.StringIO()
            ):
                code = checkpoint.run(args)
            self.assertEqual(code, 1)
            report = read_json(next(Path(directory).glob("*/report.json")))
            self.assertEqual(len(report["cases"]), 3)
            self.assertTrue(all(case["status"] == "blocked" for case in report["cases"]))


class ReportingTests(unittest.TestCase):
    def test_urls_reject_credentials_and_private_targets(self):
        for url in (
            "file:///a",
            "javascript:alert(1)",
            "https://user:password@example.com",
            "http://127.0.0.1",
            "http://192.168.1.1",
            "http://localhost",
            "http://printer.local",
        ):
            with self.assertRaises(ValueError):
                validate_url(url)
        self.assertEqual(validate_url("https://example.com/a"), "https://example.com/a")
        self.assertEqual(
            validate_url("http://127.0.0.1:3000/", allow_local=True), "http://127.0.0.1:3000/"
        )

    def test_report_paths_cannot_escape(self):
        for value in (
            "../a.png",
            "/a.png",
            "https://example.com/a",
            "a\\b",
            "a/../b",
            "a.png?x",
            "",
        ):
            self.assertIsNone(artifact_path(value))
        self.assertEqual(
            artifact_path("portfolio-desktop/step-01.png"), "portfolio-desktop/step-01.png"
        )

    def test_separate_runs_never_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            first, report = create_run(directory, suite="custom", target="https://example.com")
            second, _ = create_run(directory, suite="custom", target="https://example.com")
            self.assertNotEqual(first, second)
            save_report(first, report)
            self.assertTrue((first / "report.html").exists())
            self.assertFalse(read_json(first / "report.json")["complete"])

    def test_unsafe_html_is_escaped(self):
        with tempfile.TemporaryDirectory() as directory:
            _, report = create_run(directory, suite="custom", target='<script>alert("x")</script>')
            report["cases"] = [
                {
                    "title": "<img onerror=alert(1)>",
                    "viewport": "desktop",
                    "status": "failed",
                    "steps": [
                        {
                            "title": "<script>bad</script>",
                            "expected": "safe",
                            "actual": "<iframe src=x>",
                            "status": "failed",
                            "screenshot": "javascript:alert(1)",
                        }
                    ],
                }
            ]
            markup = render_html(report)
            self.assertNotIn("<script>", markup)
            self.assertNotIn("<iframe", markup)
            self.assertNotIn("javascript:", markup)
            self.assertIn("&lt;iframe", markup)

    def test_skipped_and_blocked_never_pass(self):
        self.assertEqual(case_status([]), "skipped")
        self.assertEqual(case_status([{"status": "passed"}, {"status": "skipped"}]), "skipped")
        self.assertEqual(case_status([{"status": "blocked"}]), "blocked")

    def test_interruption_keeps_previous_steps(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "case.json"
            original = {
                "steps": [
                    {
                        "id": "1",
                        "status": "passed",
                        "actual": "完成",
                        "screenshot": "case/step-01.png",
                    },
                    {"id": "2", "status": "skipped", "actual": "等待"},
                ],
                "durationMs": 25,
            }
            path.write_text(json.dumps(original), encoding="utf-8")
            result = checkpoint.interrupted_case(path, {}, "使用者中斷")
            self.assertEqual(result["steps"][0], original["steps"][0])
            self.assertEqual(result["steps"][1]["status"], "blocked")


if __name__ == "__main__":
    unittest.main()
