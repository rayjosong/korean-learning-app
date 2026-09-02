# Local CLI AI providers

- The browser calls Next.js explanation routes with a qualified `provider:model` reference. It does not execute or choose CLI binaries.
- Server binary paths come from server `PATH` or operator-controlled provider-specific environment overrides.
- Claude uses a direct CLI process with tools, user MCP configuration, settings sources, session persistence, and interactive permissions disabled. Prompts use stdin and JSON events are validated.
- Codex uses direct `codex exec`, read-only sandbox, approval `never`, disabled web search/project instructions/history, an application-owned `CODEX_HOME`, stdin, and JSONL events.
- Each request uses a fresh temporary directory, filtered environment, bounded concurrency/output/retries/timeout, process termination, and cleanup. This is application-level isolation, not an OS sandbox.
- Antigravity has detection/version probing only. Runtime stays disabled until its non-interactive invocation, tool/MCP/web/permissions/environment/stdin/JSON/authentication contract is verified. Production must not use `--dangerously-skip-permissions`.
