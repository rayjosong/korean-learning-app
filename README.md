# Korean Learning App

An open-source, local-first Korean learning app built around real Korean content.

The first goal is simple:

> Paste a Korean YouTube video, understand its transcript in context, and turn difficult language into personalized learning.

## Project docs

- [`docs/PRODUCT.md`](docs/PRODUCT.md) — what we are building and why.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the system should be structured.
- [`docs/BACKLOG.md`](docs/BACKLOG.md) — implementation order and verified completion state.
- [`AGENTS.md`](AGENTS.md) — mandatory workflow for coding agents, including multi-agent coordination.

## First vertical slice

```text
Paste YouTube URL
-> Korean transcript
-> synced viewer
-> click sentence
-> contextual AI explanation
-> local cache
```

## Development

This repository is intentionally designed for multi-agent development.

Every coding agent must read `AGENTS.md` before modifying the repository.
