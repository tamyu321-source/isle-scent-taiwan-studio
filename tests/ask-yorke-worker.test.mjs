import assert from "node:assert/strict";
import test from "node:test";
import worker from "../workers/ask-yorke/index.ts";

const origin = "https://tamyu321-source.github.io";
const visitorId = "924559d5-f08e-40bd-aa15-bbd32fd907a1";

function fakeDb() {
  const counts = new Map();
  return {
    counts,
    prepare(sql) {
      return { bind(...params) {
        return {
          async run() {
            if (!sql.startsWith("INSERT")) return { meta: { changes: 0 } };
            const [scope, key, limit] = params;
            const mapKey = `${scope}:${key}`;
            const count = counts.get(mapKey) ?? 0;
            if (count >= limit) return { meta: { changes: 0 } };
            counts.set(mapKey, count + 1);
            return { meta: { changes: 1 } };
          },
          async first() { return { count: counts.get(`${params[0]}:${params[1]}`) ?? 0 }; },
        };
      } };
    },
  };
}

function request(overrides = {}, ip = "203.0.113.1") {
  return new Request("https://yorke-ask.example/v1/ask", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json", "CF-Connecting-IP": ip },
    body: JSON.stringify({ mode: "works", visitorId, turnstileToken: "test-token", messages: [{ role: "user", content: "想做預約系統" }], ...overrides }),
  });
}

test("Worker accepts verified questions, validates project links and enforces the daily quota", async () => {
  const db = fakeDb();
  const env = {
    DB: db, DASHSCOPE_API_KEY: "server-only-test-key", TURNSTILE_SECRET: "test-secret",
    USAGE_SALT: "test-salt", SITE_ORIGIN: origin,
    QWEN_API_HOST: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  };
  const previous = globalThis.fetch;
  let modelCalls = 0;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("siteverify")) return Response.json({ success: true, action: "ask_yorke", hostname: "tamyu321-source.github.io" });
    assert.equal(options.headers.Authorization, "Bearer server-only-test-key");
    const body = JSON.parse(options.body);
    assert.equal(body.model, "qwen3.8-flash");
    assert.equal(body.enable_thinking, false);
    modelCalls++;
    return Response.json({ choices: [{ message: { content: JSON.stringify({ answer: "Isle / Scent 有預約庫存管理", projectIds: ["classnest", "isle", "made-up"] }) } }] });
  };
  try {
    for (let index = 0; index < 5; index++) {
      const response = await worker.fetch(request(), env);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.deepEqual(body.projects.map((item) => item.id), ["classnest"]);
      assert.match(body.answer, /ClassNest.*多老師課程預約/);
      assert.doesNotMatch(body.answer, /Isle \/ Scent|預約庫存管理/);
      assert.equal(body.remaining, 4 - index);
      assert.equal(JSON.stringify(body).includes("server-only-test-key"), false);
    }
    const exceeded = await worker.fetch(request(), env);
    assert.equal(exceeded.status, 429);
    assert.equal((await exceeded.json()).error, "daily_limit");
    assert.equal(modelCalls, 5);
  } finally { globalThis.fetch = previous; }
});

test("Worker stops the whole site's monthly Qwen calls at 500", async () => {
  const env = {
    DB: fakeDb(), DASHSCOPE_API_KEY: "server-only-test-key", TURNSTILE_SECRET: "test-secret",
    USAGE_SALT: "test-salt", SITE_ORIGIN: origin,
    QWEN_API_HOST: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  };
  const previous = globalThis.fetch;
  let modelCalls = 0;
  globalThis.fetch = async (url) => {
    if (String(url).includes("siteverify")) return Response.json({ success: true, action: "ask_yorke", hostname: "tamyu321-source.github.io" });
    modelCalls++;
    return Response.json({ choices: [{ message: { content: JSON.stringify({ answer: "已找到作品", projectIds: ["classnest"] }) } }] });
  };
  try {
    for (let index = 0; index < 500; index++) {
      const id = `924559d5-f08e-40bd-aa15-${index.toString(16).padStart(12, "0")}`;
      const ip = `198.51.100.${Math.floor(index / 20) + 1}`;
      assert.equal((await worker.fetch(request({ visitorId: id }, ip), env)).status, 200);
    }
    const blocked = await worker.fetch(request({ visitorId: "924559d5-f08e-40bd-aa15-ffffffffffff" }, "198.51.100.26"), env);
    assert.equal(blocked.status, 429);
    assert.equal((await blocked.json()).error, "monthly_limit");
    assert.equal(modelCalls, 500);
  } finally { globalThis.fetch = previous; }
});

test("Worker rejects wrong origins, malformed requests and missing secrets", async () => {
  const env = { DB: fakeDb(), DASHSCOPE_API_KEY: "key", TURNSTILE_SECRET: "secret", USAGE_SALT: "salt", SITE_ORIGIN: origin, QWEN_API_HOST: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions" };
  const foreign = new Request("https://yorke-ask.example/v1/ask", { method: "POST", headers: { Origin: "https://unrelated.example" } });
  assert.equal((await worker.fetch(foreign, env)).status, 403);
  assert.equal((await worker.fetch(request({ messages: [] }), env)).status, 400);
  assert.equal((await worker.fetch(request(), { ...env, DASHSCOPE_API_KEY: "" })).status, 503);
});
