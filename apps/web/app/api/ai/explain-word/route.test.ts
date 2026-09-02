import assert from "node:assert/strict";
import test from "node:test";

import { handleWordExplanationRequest } from "@/lib/server-ai-routes";

test("word route rejects oversize bodies before provider creation", async () => {
  let invoked = false;
  const response = await handleWordExplanationRequest(new Request("http://test", { method: "POST", headers: { "content-length": "40000" }, body: "{}" }), () => {
    invoked = true;
    throw new Error("not reached");
  });
  assert.equal(response.status, 413);
  assert.equal(invoked, false);
});
