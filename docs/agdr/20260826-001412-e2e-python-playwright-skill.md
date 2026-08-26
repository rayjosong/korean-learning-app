---
timestamp: 2026-08-26T00:14:12Z
agent: pi-coding-agent
model: glm-5.1
session: 01a039cb-058b-7f27-badb-e0a3b04b4d54
trigger: user-prompt
status: executed
ticket: no-ticket
---

# Throwaway Python/Playwright E2E checks as a project skill

> In the context of verifying UI flows in a real browser without growing permanent test infrastructure, facing a choice between a permanent Playwright suite in the repo and a reusable recipe for throwaway scripts, I decided to add a project skill that standardizes temporary Python + Playwright scripts run via uv to achieve fast, pollution-free browser verification of any flow, accepting that the same harness may be re-assembled per task and that found bugs must still be reproduced in the Node unit suites.

## Context

- A one-off Playwright run of the #11 flow found a real bug unit tests missed (unbound `globalThis.fetch` broke every in-browser AI call), so browser-level verification has proven value.
- The repo's test strategy is Node unit/contract tests (`packages/*/test/*.test.mjs`, `apps/web/**/*.test.tsx`); there is no e2e framework, and V0.1 scope discipline (AGENTS.md) argues against adding one speculatively.
- Multiple agents work this repo on different harnesses (pi, Claude Code, others), so project skills must live in `.agents/skills/`, not a harness-private `.pi/skills/`.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Permanent Playwright suite (`apps/web/e2e`) | Reusable, CI-enforced, fixtures versioned with the app | New framework + CI browser install for V0.1; scripts rot into maintenance; against the "delete after run" diagnostic style that just found a bug |
| Project skill with a template for throwaway scripts | Zero permanent infra; harness-agnostic via `.agents/skills/`; template encodes the hard-won contract (mock provider, ports, selectors, IndexedDB semantics); any agent can run it on any branch | Harness re-assembled per task (mitigated by the template); relies on installed Chrome and `uv`; no CI enforcement |
| Ad-hoc scripts per task, no skill | No files to maintain | Every agent re-learns the mock contract, ports, and selector gotchas; knowledge leaves with the session |

## Decision

Chosen: **project skill with a throwaway-script template**, because browser checks here are episodic diagnostics, not a regression gate — but their setup knowledge (mock AI provider on :9462, dev server on :3100, transcript interception, YouTube blocking, aria-label selectors, reload/persistence semantics) is expensive to rediscover and worth versioning. The skill pins the run recipe to `uv run --python 3.12 --with playwright` so nothing is added to the pnpm workspace, and mandates that any real bug found becomes a permanent Node test, keeping the regression value of a suite without owning one yet.

## Consequences

- `.agents/skills/e2e-python-playwright/` is agent-agnostic (Agent Skills standard) and versioned with the repo.
- Scripts and the `playwright` dependency never touch `package.json` or the lockfile; Chrome via `channel="chrome"`.
- The skill's selector table includes `I know this` / `Undo`, which land with PR #21; merge #21 first or the skill briefly references UI not yet on `main`.
- If browser checks become routine (e.g. CI demand), revisit and graduate to a permanent suite; this record would be superseded then.

## Artifacts

- `.agents/skills/e2e-python-playwright/SKILL.md`
- `.agents/skills/e2e-python-playwright/scripts/template.py`
