---
name: e2e-python-playwright
description: Write throwaway Python + Playwright scripts that verify this app's UI flows in a real browser (dev server + mocked AI provider + real IndexedDB). Use when asked to E2E test, browser test, or verify a UI feature end-to-end without adding permanent test infrastructure.
---

# Temporary Python + Playwright E2E checks

One-off scripts that drive the real app in headless Chrome. They catch what unit tests cannot (e.g. an unbound `globalThis.fetch` made every real in-browser AI call fail while injected-fetch tests passed). The script is a diagnostic tool: run it, fix what it finds, then delete it.

## Rules

1. **Temporary.** Write to the repo root as `e2e-<feature>.py`, delete after the run. Never commit it.
2. **No repo pollution.** Do not add Python deps to `package.json` or the lockfile. `uv` provides Playwright ephemerally (setup below).
3. **Real bugs found become permanent regression tests** in the existing Node test suites (`packages/*/test/*.test.mjs`, `apps/web/**/*.test.tsx`) — not Python.
4. Check in after each step; report findings with PASS/FAIL lines and exit code.

## Setup (no installs beyond uv)

`uv` is at `~/.local/bin/uv`. Run scripts with:

```bash
uv run --python 3.12 --with playwright python e2e-<feature>.py
```

- `--python 3.12`: system Python (3.14) may lack Playwright wheels; uv fetches its own.
- Launch with `channel="chrome"` to use installed Google Chrome — no `playwright install` browser download.
- Port for the mock AI provider: `9462`; dev server: `3100`.

## Project contract for the script

The app under test is `apps/web` (Next.js, client-heavy). What a script must set up:

| Concern | How |
|---|---|
| Dev server | `subprocess.Popen(["pnpm", "--filter", "@korean-learning/web", "dev"], env={**os.environ, "PORT": "3100"}, start_new_session=True)`, poll `http://localhost:3100` until ready, `os.killpg` in `finally` |
| AI provider mock | Local `ThreadingHTTPServer` on `127.0.0.1:9462` answering `/v1/chat/completions` with CORS headers (`OPTIONS` → 204). Discriminate sentence vs word requests by the last message content (`"Explain this Korean sentence"` prefix = sentence). Return `{choices:[{message:{content: JSON.stringify(explanation)}}]}` |
| Point app at mock | Fill `#ai-api-key`, `#ai-model`, `#ai-base-url` (=`http://127.0.0.1:9462/v1`) after the session loads. **No AI call or cache read happens until key + model are set** |
| Transcript | `context.route("**/api/transcript", ...)` → fulfill with `{videoId, segments:[{id,text,startTimeMs,endTimeMs}]}`. No real YouTube needed |
| YouTube embed | `context.route(re.compile(r"youtube\.com|youtube-nocookie\.com|ytimg\.com"), abort)` — the transcript viewer works without the player |
| Persistence | Dexie/IndexedDB is real per browser context. Test reload persistence with `page.reload()` in the same context |

Stable selectors the app already exposes (aria labels / roles): `list "Timestamped transcript"`, section `Sentence explanation`, `Natural meaning`, aside `Word explanation`, buttons `Load video`, `I know this`, `Undo`, transcript segment buttons by sentence text, breakdown words by exact text.

### Gotchas learned the hard way

- `get_by_label("Word explanation")` matches the loading aside too — wait for ready-state content (e.g. the meaning text) instead.
- After `page.reload()` the AI settings form resets — re-fill before any cached flow.
- Selectors with Korean text + `?` need regex escaping (`re.compile(r"뭐 해\?")`).

## Template

Copy `scripts/template.py` from this skill's directory to the repo root, adapt the flow section, run. It already implements the full harness (dev server, mock provider with sentence/word fixtures, transcript interception, YouTube blocking, PASS/FAIL accounting, cleanup, and **automatic checkpoint screenshot saving to `docs/qa/` (plus automatic `failure.png` capture on test exceptions)**).

## Cleanup after the run

```bash
rm e2e-<feature>.py
git checkout -- apps/web/next-env.d.ts        # dev server rewrites it
```

- `apps/web/AGENTS.md` and `apps/web/CLAUDE.md` are Next.js 16 dev-server artifacts, not yours — leave them untracked, never commit.
- Ensure the dev server process group is dead (`os.killpg` in the script's `finally` handles this; verify no stray `next-server` on :3100).
