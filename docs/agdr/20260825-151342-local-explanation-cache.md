---
timestamp: 2026-08-25T15:13:42Z
agent: pi-coding-agent
model: glm-5.1
session: 01a0396c-bb86-7e07-80b8-c18cb2c13b2c
trigger: user-prompt
status: executed
ticket: "9"
---

# Local explanation cache: Dexie behind a storage package

In the context of backlog #9 (cache sentence explanations locally), facing `ARCHITECTURE.md`'s call for IndexedDB/Dexie persistence behind replaceable adapters and UI that must not write arbitrary persistence logic, I decided to add a `@korean-learning/storage` package owning the Dexie schema, records, and cache-key builder, consumed through a `withExplanationCache` wrapper around `LanguageModel` in the web app, to achieve cache transparency for the explanation hook and a prompt-version-scoped key (`${promptVersion}:${sentence}`), accepting that switching models under the same prompt version keeps serving cached explanations (metadata records which model produced them).

## Context

- #8 landed the explanation panel whose hook talks to a `LanguageModel`; caching must not touch UI components.
- `ARCHITECTURE.md` prescribes Dexie for explanations and provider/model/prompt-version metadata on cached explanations; API keys must never be exported or logged.
- Packages here are source-exported TS run by Node type-stripping (`node --test`) and Turbopack, with no bundler in the packages themselves.

## Options

| Option | Pros | Cons |
|--------|------|------|
| A. `localStorage` in the web app | Zero dependencies, trivial | String-size limits, no indexed queries, persistence logic leaks into UI, off the ARCHITECTURE.md path |
| B. Dexie wired directly in `apps/web/lib` | One package fewer | UI app owns persistence schema; later learner-state tables (#10–#13) would also land in the app, eroding the adapter boundary |
| C. `packages/storage` owning Dexie + records + key builder; web glue wraps `LanguageModel` | Matches prescribed layout; key builder and clear are unit-testable without a browser; future tables (learning items, reviews) have a home | One more workspace package to configure now |

## Decision

Option C. `explanationCacheKey(promptVersion, sentence)` is the single key builder; `SENTENCE_EXPLANATION_PROMPT_VERSION` lives beside the prompt in `@korean-learning/ai` so prompt edits force a bump. `withExplanationCache` checks the store before calling the provider and writes metadata-bearing records after — never credentials (asserted by tests). Tests run against real Dexie on `fake-indexeddb` (dev-only): reopen-preserves, repeat-call-avoided, clear-falls-back-to-model, and no-key-in-record.
