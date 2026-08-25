---
timestamp: 2026-08-25T14:36:33Z
agent: pi-coding-agent
model: GPT-5
trigger: user-prompt
status: executed
ticket: no-ticket
pr: 15
---

# OpenAI-compatible AI adapter

> In the context of adding the first replaceable AI provider for the Korean learning loop, facing a choice between a provider SDK and a transport-level integration, I decided to use native `fetch` behind a new `packages/ai` adapter to achieve OpenAI-compatible requests without coupling the UI or domain to one vendor, accepting responsibility for the small request and response-validation layer.

## Context

- Issue #6 requires a `LanguageModel` boundary, BYO API keys, custom base URLs, controlled invalid-output errors, and no secret logging.
- The architecture requires provider-specific code to remain behind interfaces and the repository currently has no AI SDK dependency.
- Issue #7 will build the richer structured sentence-explanation behavior on top of this boundary.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Native `fetch` in `packages/ai` | No new dependency; works with OpenAI-compatible services; keeps transport details out of the UI | Requires maintaining a small request and response-validation layer |
| Official OpenAI SDK | Mature OpenAI request types and helpers | Adds a vendor SDK dependency and makes custom-compatible endpoints less direct |
| Provider-specific SDK abstraction | Could expose provider-specific features | Adds multiple dependencies and broadens the boundary before a second provider is needed |

## Decision

Chosen: **Native `fetch` in `packages/ai`**, because the required API surface is a single chat-completions request and native platform support meets it without adding a dependency or leaking provider code into the web app.

## Consequences

- OpenAI-compatible providers can be selected with an API key, model, and optional base URL.
- The adapter owns transport failures and validates model output before returning domain types.
- Provider-specific features outside the compatible chat-completions surface will require a deliberate extension or a later adapter decision.

## Artifacts

- [GitHub issue #6](https://github.com/rayjosong/korean-learning-app/issues/6)
