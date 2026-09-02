# Korean Learning App

Learn Korean through real Korean content. This monorepo contains a Next.js web app built around a desktop-first Watch -> Study -> Review learning loop.

## Product direction

The app is designed to feel like a Korean media environment where a learner can watch authentic content, inspect only what they do not understand, learn meaningful phrases, and review them in original context.

Authoritative project documents:

- [`AGENTS.md`](AGENTS.md) — operating rules for coding agents;
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product vision, scope, and canonical UX behavior;
- [`DESIGN.md`](DESIGN.md) — visual language, interaction rules, and desktop ASCII reference layouts;
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — technical boundaries and implementation structure;
- [`docs/BACKLOG.md`](docs/BACKLOG.md) — implementation order, acceptance criteria, and completion state.

Agents should read these in the order specified by `AGENTS.md` before implementing changes.

## Requirements

- Node.js 22+
- pnpm 11+

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## AI provider setup

The app uses a BYO-key OpenAI-compatible provider. Enter the provider model and API
key in the AI provider settings; saved settings stay in the current browser and are
restored on later visits. The key is not included in exports or explanation records.
Browser persistence is local convenience, not a secure secret vault. Remove the key
from shared or untrusted devices.

Claude Code and Codex CLI providers are detected from the environment of the Next.js server, never from the browser user's machine. Install and authenticate each CLI for the OS user running the app. Service managers and containers often have a different `PATH`; use `CLAUDE_CLI_PATH` or `CODEX_CLI_PATH` when required. `CLAUDE_CLI_HOME` may point at the account home used only for Claude authentication.

Codex uses an application-owned `CODEX_CLI_HOME`. Create that directory with permissions restricted to the application user, set `CODEX_CLI_HOME` in the server environment, then run `CODEX_HOME=<that directory> codex login` as that user. Do not copy a personal general `CODEX_HOME` into the service. Docker deployments must install the CLIs and provide their authentication state inside the container.

CLI execution is application-level isolation, not an OS sandbox. Detection reports installation/version availability only and does not prove authentication. Antigravity can be detected but is intentionally unavailable for runtime explanations.

## Verification commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Layout

```text
apps/web       Next.js web application
packages/*     domain, learning, adapter, and storage packages
docs/          product, architecture, and implementation plan
DESIGN.md      canonical visual + UX design system
AGENTS.md      coding-agent operating rules
```
