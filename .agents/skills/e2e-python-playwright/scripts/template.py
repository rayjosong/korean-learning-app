#!/usr/bin/env python3
"""Temporary E2E check — copy to repo root as e2e-<feature>.py, adapt FLOW, run:

    uv run --python 3.12 --with playwright python e2e-<feature>.py

DELETE after the run; never commit. Harness: dev server on :3100, mocked
OpenAI-compatible provider on :9462, intercepted /api/transcript, blocked
YouTube embeds, real IndexedDB per browser context. Automatically captures
screenshots to `docs/qa/` at checkpoints and on failures.
"""
import json
import os
import re
import signal
import subprocess
import threading
import time
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from playwright.sync_api import sync_playwright

APP = "http://localhost:3100"
AI_PORT = 9462
AI = f"http://127.0.0.1:{AI_PORT}"
SCREENSHOT_DIR = "docs/qa"

# --- fixtures ---------------------------------------------------------------
SENTENCE_EXPLANATION = {
    "sentence": "뭐 해?",
    "naturalMeaning": "What are you doing?",
    "breakdown": [
        {"text": "뭐", "meaning": "what (contraction of 무엇)", "role": "pronoun"},
        {"text": "해", "meaning": "doing", "role": "verb"},
    ],
    "grammar": [],
    "speechLevel": "해체 (casual/반말)",
}
WORD_EXPLANATION = {
    "word": "뭐",
    "meaning": "what (casual)",
    "dictionaryForm": "무엇",
    "nuance": "Casual spoken register.",
}
TRANSCRIPT = {
    "videoId": "e2eTestVideo",
    "segments": [
        {"id": "seg-1", "text": "뭐 해?", "startTimeMs": 0, "endTimeMs": 2000},
        {"id": "seg-2", "text": "지금 가고 있어요.", "startTimeMs": 2000, "endTimeMs": 4000},
    ],
}

# --- mocked OpenAI-compatible provider --------------------------------------
class FakeAIHandler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("access-control-allow-origin", "*")
        self.send_header("access-control-allow-methods", "POST, OPTIONS")
        self.send_header("access-control-allow-headers", "authorization, content-type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        user_content = body["messages"][-1]["content"] or ""
        is_sentence = user_content.startswith("Explain this Korean sentence")
        explanation = SENTENCE_EXPLANATION if is_sentence else WORD_EXPLANATION
        payload = {"choices": [{"message": {"content": json.dumps(explanation)}}]}
        data = json.dumps(payload).encode()
        self.send_response(200)
        self._cors()
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *args):
        pass


def wait_for_app(timeout_s=60):
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            if urllib.request.urlopen(APP, timeout=2).status == 200:
                return
        except OSError:
            time.sleep(1)
    raise RuntimeError(f"dev server did not start on {APP}")


# --- harness -----------------------------------------------------------------
failures = []


def ok(condition, label):
    print(f"{'PASS' if condition else 'FAIL'}  {label}")
    if not condition:
        failures.append(label)


def main():
    ai_server = ThreadingHTTPServer(("127.0.0.1", AI_PORT), FakeAIHandler)
    threading.Thread(target=ai_server.serve_forever, daemon=True).start()

    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    dev = subprocess.Popen(
        ["pnpm", "--filter", "@korean-learning/web", "dev"],
        env={**os.environ, "PORT": "3100"},
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
    try:
        wait_for_app()

        with sync_playwright() as p:
            browser = p.chromium.launch(channel="chrome")
            context = browser.new_context()
            context.route(
                "**/api/transcript",
                lambda route: route.fulfill(json=TRANSCRIPT),
            )
            context.route(
                re.compile(r"youtube\.com|youtube-nocookie\.com|ytimg\.com"),
                lambda route: route.abort(),
            )

            page = context.new_page()
            page.set_default_timeout(30000)
            page.on("console", lambda msg: msg.type == "error" and print(f"[console] {msg.text}"))
            page.on(
                "requestfailed",
                lambda req: print(f"[requestfailed] {req.method} {req.url}"),
            )
            page.goto(APP)

            def load_video():
                page.fill("#video-url", "https://www.youtube.com/watch?v=e2eTestVideo")
                page.get_by_role("button", name="Load video").click()
                page.get_by_role("list", name="Timestamped transcript").wait_for()

            def fill_ai_settings():
                page.fill("#ai-api-key", "e2e-key")
                page.fill("#ai-model", "e2e-model")
                page.fill("#ai-base-url", f"{AI}/v1")

            def take_screenshot(name):
                path = f"{SCREENSHOT_DIR}/{name}.png"
                page.screenshot(path=path)
                print(f"Screenshot saved: {path}")

            try:
                # ---- FLOW: adapt from here ------------------------------------
                load_video()
                fill_ai_settings()
                take_screenshot("default-loaded")

                # Sentence explanation -> word card.
                page.get_by_role("button", name=re.compile(r"뭐 해\?")).click()
                page.get_by_label("Natural meaning").wait_for()
                take_screenshot("sentence-explained")

                page.get_by_role("button", name="뭐", exact=True).click()
                page.get_by_text("what (casual)").wait_for()
                take_screenshot("word-lookup")

                # Action -> confirmation with Undo.
                page.get_by_role("button", name="I know this").click()
                page.get_by_text("Marked as known").wait_for()
                take_screenshot("marked-known")
                ok(page.get_by_role("button", name="Undo").is_visible(), "confirmation shows Undo")
                ok(page.get_by_role("button", name="I know this").count() == 0, "action replaced by confirmation")

                # Undo restores the action.
                page.get_by_role("button", name="Undo").click()
                page.get_by_role("button", name="I know this").wait_for()
                take_screenshot("undone")
                ok(page.get_by_text("Marked as known").count() == 0, "undo removes saved state")

                # Persist across reload (same context keeps IndexedDB).
                page.get_by_role("button", name="I know this").click()
                page.get_by_text("Marked as known").wait_for()
                page.reload()
                load_video()
                fill_ai_settings()  # form resets on reload
                page.get_by_role("button", name=re.compile(r"뭐 해\?")).click()
                page.get_by_label("Natural meaning").wait_for()
                page.get_by_role("button", name="뭐", exact=True).click()
                page.get_by_text("what (casual)").wait_for()
                take_screenshot("reloaded-persistence")
                ok(
                    page.get_by_text("You already marked this as known.").is_visible(),
                    "known item persists across reload",
                )
                # ---- end FLOW ---------------------------------------------------
            except Exception as e:
                take_screenshot("failure")
                raise e

            browser.close()
    finally:
        os.killpg(os.getpgid(dev.pid), signal.SIGTERM)
        ai_server.shutdown()

    if failures:
        print(f"\n{len(failures)} check(s) failed", flush=True)
        raise SystemExit(1)
    print("\nAll E2E checks passed")


if __name__ == "__main__":
    main()
