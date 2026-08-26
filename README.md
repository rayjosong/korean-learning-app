# Korean Learning App

Learn Korean through real Korean content. This monorepo starts with a Next.js web app and is structured for the V0.1 learning loop described in [`docs/PRODUCT.md`](docs/PRODUCT.md).

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
packages/*     future domain and adapter packages
docs/          product, architecture, and implementation plan
```
