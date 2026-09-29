import assert from "node:assert/strict";
import test from "node:test";
import { askYorkeProjects } from "../lib/ask-yorke-knowledge.ts";
import { normalizeReply, taipeiKeys, validMessages } from "../lib/ask-yorke.ts";

test("the public project catalogue only points to local work routes", () => {
  assert.equal(askYorkeProjects.length, 11);
  assert.equal(new Set(askYorkeProjects.map((item) => item.id)).size, 11);
  for (const project of askYorkeProjects) {
    assert.match(project.href, /^\/[a-z0-9-/]+\/$/);
    assert.ok(project.facts.length > 25);
  }
});

test("requests require a bounded conversation ending with the visitor", () => {
  assert.equal(validMessages([{ role: "user", content: "我想做預約系統" }]), true);
  assert.equal(validMessages([{ role: "assistant", content: "你好" }]), false);
  assert.equal(validMessages([{ role: "user", content: "x".repeat(1501) }]), false);
  assert.equal(validMessages([]), false);
  assert.equal(validMessages(Array.from({ length: 10 }, () => ({ role: "user", content: "a" }))), false);
});

test("model output only exposes known project links and bounded brief fields", () => {
  const answer = normalizeReply({
    answer: "可以參考課程預約案例。",
    projectIds: ["classnest", "unknown", "authority"],
    brief: { goal: "預約", audience: "家長", flows: ["選課"], priorities: ["名額"], questions: ["是否需要收款？"] },
  }, 3);
  assert.deepEqual(answer?.projects.map((item) => item.href), ["/classnest/", "/agent-runtime/"]);
  assert.equal(answer?.brief?.questions[0], "是否需要收款？");
  assert.equal(normalizeReply({ answer: "" }, 5), null);
});

test("daily and monthly quota keys roll over in Taipei time", () => {
  assert.deepEqual(taipeiKeys(new Date("2026-09-30T15:59:59Z")), { day: "2026-09-30", month: "2026-09" });
  assert.deepEqual(taipeiKeys(new Date("2026-09-30T16:00:00Z")), { day: "2026-10-01", month: "2026-10" });
});
