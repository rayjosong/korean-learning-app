import assert from "node:assert/strict";
import test from "node:test";
import { renderToString } from "react-dom/server";

import { HomeSurface } from "./home-surface.tsx";

test("Home always keeps the new-content entry point available", () => {
  const html = renderToString(
    <HomeSurface
      videoUrl=""
      onVideoUrlChange={() => {}}
      onSubmit={() => {}}
      onOpenContent={() => {}}
      isLoading={false}
      ready={false}
    />
  ).replaceAll("<!-- -->", "");

  assert.match(html, /안녕하세요\./);
  assert.match(html, /Start something new/);
  assert.match(html, /Korean YouTube URL/);
  assert.match(html, /Load video/);
});
