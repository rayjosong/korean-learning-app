# Korean Learning App

Learn Korean through real Korean content. This monorepo contains a Next.js web app and is structured around a desktop-first Watch -> Study -> Review learning loop.

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
