# GLM GitHub Issue Worker

This repository can delegate a GitHub issue to a GLM model through OpenCode running in GitHub Actions.

## One-time setup

1. Subscribe to a Z.AI GLM Coding Plan or otherwise obtain a Coding Plan API key.
2. In GitHub, open **Settings → Secrets and variables → Actions**.
3. Create a repository secret named `ZHIPU_API_KEY` containing the Z.AI Coding Plan API key.

The workflow uses Z.AI's Coding Plan provider through OpenCode. Never commit the API key to the repository.

## Assign an issue to GLM

Add a comment to the GitHub issue. The first line is the command.

Use the default model, GLM-5.3:

```text
/glm
```

Choose a model explicitly:

```text
/glm glm-5.3
/glm glm-5.2
/glm glm-5-turbo
/glm glm-4.7
/glm glm-4.5-air
```

Anything after the first line can be used as extra context for the run, but the issue body and acceptance criteria remain the assigned task.

Only repository owners, members, and collaborators can trigger the workflow. Comments on pull requests do not trigger this issue worker.

## Recommended routing

- `glm-4.5-air`: cheap first attempt for narrow, mechanical, low-risk work.
- `glm-4.7`: routine implementation work where cost matters more than maximum capability.
- `glm-5.2` or `glm-5-turbo`: stronger alternatives when available in the Coding Plan.
- `glm-5.3`: default for harder or longer-horizon issue implementation.

Model availability is ultimately controlled by the Z.AI Coding Plan. If Z.AI removes a model, the workflow will fail until the allow-list is updated.

## What the worker must do

The workflow explicitly tells OpenCode to:

1. Read `AGENTS.md`.
2. Read `docs/PRODUCT.md`.
3. Read `docs/ARCHITECTURE.md`.
4. Read `docs/BACKLOG.md`.
5. Implement only the assigned issue.
6. Follow the repository's branch and verification rules.
7. Update backlog completion only after every acceptance criterion is verified.
8. Open a pull request rather than merge directly.

Normal repository CI remains the final verification gate.

## Examples

Cheap workhorse attempt:

```text
/glm glm-4.5-air
```

Default flagship attempt:

```text
/glm
```

Explicit flagship attempt with extra context:

```text
/glm glm-5.3
Focus on the root cause rather than working around a failing test.
```

## Failure handling

If the workflow fails before OpenCode starts, check the Actions log first. Common causes are:

- missing or invalid `ZHIPU_API_KEY`;
- a model that is no longer included in the Coding Plan;
- provider or OpenCode integration changes.

If the worker produces a PR but CI fails, keep the backlog item incomplete until the latest PR commit passes the required checks, as specified by `AGENTS.md`.
