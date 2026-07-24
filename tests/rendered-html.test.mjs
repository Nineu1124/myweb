import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the finished archive experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>MONUMENTS OF ECHOES \/ 回响纪念碑<\/title>/i,
  );
  assert.match(html, /MONUMENTS OF ECHOES/);
  assert.match(html, /回响纪念碑/);
  assert.match(html, /开始档案恢复/);
  assert.match(html, /档案索引/);
  assert.match(html, /这份记录仍在继续/);
  assert.doesNotMatch(html, /codex-preview/);
  assert.doesNotMatch(html, /Your site is taking shape/);
  assert.doesNotMatch(html, /react-loading-skeleton/);
});

test("renders public archive categories, spatial sensing, and the sealed trace", async () => {
  const response = await render();
  const html = await response.text();

  for (const label of [
    "通讯中继站",
    "迁徙思想",
    "人类记忆库",
    "遗物锻造场",
    "身份恢复",
  ]) {
    assert.match(html, new RegExp(label));
  }

  assert.match(html, /W \/ MEM-03/);
  assert.match(html, /THO-02 · UNSTABLE \/ E/);
  assert.match(html, /SCROLL \/ MAINLINE/);
  assert.match(html, /POINTER FIELD ACTIVE/);
  assert.match(html, /中央遗迹键盘导航/);
  assert.doesNotMatch(html, /direction-node/);
  assert.match(html, /神谕罗盘/);
  assert.match(html, /EMOTIONAL ARCHIVE \/ SEALED/);
  assert.doesNotMatch(html, /封存庭园/);
  assert.match(html, /SOURCE SIGNAL/);
  assert.match(html, /ACTIVE/);
});
