import assert from "node:assert/strict";
import test from "node:test";

import { buildProviderStatus } from "./route.ts";

test("provider status reports safe current probes without secrets", async () => {
  const status = await buildProviderStatus(async (key) => key === "antigravity_cli"
    ? { status: "runtime_disabled", path: "/srv/bin/agy", version: "1", models: [] }
    : { status: "not_installed", models: [] });
  assert.equal(status.detected_clis.antigravity_cli, true);
  assert.equal(status.detected_cli_paths.antigravity_cli, "/srv/bin/agy");
  assert.equal(status.probes.antigravity_cli.status, "runtime_disabled");
  assert.equal(JSON.stringify(status).includes("API_KEY"), false);
});
