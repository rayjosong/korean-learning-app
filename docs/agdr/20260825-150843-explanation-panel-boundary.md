---
timestamp: 2026-08-25T15:08:43Z
agent: pi-coding-agent
model: glm-5.1
session: 01a0396c-bb86-7e07-80b8-c18cb2c13b2c
trigger: user-prompt
status: executed
ticket: "8"
---

# Explanation panel integration boundary

In the context of backlog #8 (explanation panel wired from transcript clicks), facing `ARCHITECTURE.md`'s rule that UI components must not call model-provider SDKs directly, I decided to keep provider construction in `apps/web/lib/ai.ts` behind the `LanguageModel` interface, with a presentational `ExplanationPanel` driven by a `useSentenceExplanation` hook, to achieve a UI → use case → domain interface → adapter flow, accepting that the provider runs fully client-side (BYO key, local-first, no server proxy).

## Context

- Backlog #7 shipped `OpenAICompatibleLanguageModel` behind the `LanguageModel` interface; nothing in the web app consumed it yet.
- The product is local-first with BYO keys; there is no server runtime beyond static Next.js output.
- The repo tests packages with `node:test` and renders UI only through `next build`.

## Options

| Option | Pros | Cons |
|--------|------|------|
| A. Component imports the provider class directly | Fewest files | Violates the architecture rule ("provider code must not leak into UI"); hard to swap providers in tests |
| B. Next.js route handler proxies model calls | Key never touches client; central place for logging | Adds a server runtime; BYO-key/local-first product goal makes it unnecessary plumbing; couples cache/persistence to the server |
| C. Client hook depends on `LanguageModel`; a thin `lib/ai.ts` factory constructs the provider | Matches the prescribed layering; panel stays presentational and testable; BYO key stays in memory | Provider code ships to the browser bundle (acceptable: the key is the user's own and must reach the provider anyway) |

## Decision

Option C. `StudySession` (client) owns AI settings and selection state, `useSentenceExplanation` handles loading/error/superseded-request state, `ExplanationPanel` renders states, and `lib/ai.ts` is the only place the provider class is named. Panel states are verified by real `react-dom/server` render tests (via the already-installed `tsx` loader, which also required marking `apps/web` as `"type": "module"`).

One-line consequence: `packages/ai/src/index.ts` now re-exports with a `.ts` specifier because Turbopack does not rewrite `.js` → `.ts` specifiers in workspace package sources; Node and `tsc` accept both.
