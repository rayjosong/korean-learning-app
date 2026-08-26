## Summary

<!-- Briefly describe what changed and why. -->

## Backlog item

- Backlog item: #<!-- id -->
- Acceptance criteria mapping:
  - <!-- criterion -> implementation / test -->

## Verification

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`

Results:

<!-- Paste the result of each command. If omitted, explain why. -->

## QA screenshots

<!-- For user-visible changes, add screenshots under qa/screenshots/<backlog-id>/ and link each one below. Describe the flow or state shown. -->

- [ ] Screenshots added and linked below.
- [ ] Not applicable — explain why:

<!--
- [Review state](../blob/<branch>/qa/screenshots/<backlog-id>/review-state.png): what this demonstrates
-->

## Risks and compatibility

- Migrations:
- User-visible behavior:
- Compatibility risks:

## Remaining work

<!-- State "None" when complete, or list concrete follow-up work. -->

## Agent completion report

```text
Backlog item
#<id> <title>

Status
complete | partial | blocked

Backlog changes
- [ ] -> [x] <only when fully verified>

Verification
- tests: pass/fail/not run
- typecheck: pass/fail/not run
- lint: pass/fail/not run
- build: pass/fail/not run

Files changed
- ...

Remaining
- ...

Recommended next item
#<id> <title>
```

## Checklist

- [ ] I read `AGENTS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, and `docs/BACKLOG.md`.
- [ ] This PR changes only the assigned backlog item and necessary supporting files.
- [ ] I did not mark the backlog item complete unless every acceptance criterion was verified.
- [ ] I did not commit secrets or API keys.
- [ ] I will not merge my own PR unless explicitly asked.
