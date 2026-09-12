import assert from "node:assert/strict";
import test from "node:test";
import {
  checkpointActionsUrl,
  checkpointArtifact,
  checkpointTime,
  isCheckpointReport,
} from "../lib/checkpoint.ts";

const report = {
  schemaVersion: 1,
  runId: "test-run",
  toolVersion: "1.0.0",
  startedAt: "2026-09-13T01:00:00Z",
  finishedAt: "2026-09-13T01:01:00Z",
  complete: true,
  status: "passed",
  environment: "build-preview",
  target: "http://127.0.0.1:4000/project/",
  revision: "abc1234",
  cases: [
    {
      id: "portfolio-desktop",
      title: "作品集",
      viewport: "desktop",
      dimensions: { width: 1440, height: 900 },
      status: "passed",
      durationMs: 1200,
      steps: [
        {
          id: "step-01",
          title: "導覽",
          expected: "成功載入",
          actual: "HTTP 200",
          status: "passed",
          durationMs: 1000,
          screenshot: "portfolio-desktop/step-01.png",
        },
      ],
    },
  ],
};

test("accepts the shared report and honest empty runs", () => {
  assert.ok(isCheckpointReport(report));
  assert.ok(
    isCheckpointReport({
      ...report,
      complete: false,
      finishedAt: null,
      status: "skipped",
      cases: [],
    }),
  );
});

test("rejects broken schemas, statuses, dates and evidence types", () => {
  for (const value of [
    null,
    {},
    { ...report, schemaVersion: 2 },
    { ...report, startedAt: "bad" },
    { ...report, status: "success" },
    { ...report, cases: [null] },
  ])
    assert.equal(isCheckpointReport(value), false);
  const invalid = structuredClone(report);
  invalid.cases[0].steps[0].screenshot = 3;
  assert.equal(isCheckpointReport(invalid), false);
});

test("evidence remains within the versioned report directory", () => {
  assert.equal(
    checkpointArtifact("portfolio-desktop/step-01.png", "/repo/data/latest"),
    "/repo/data/latest/portfolio-desktop/step-01.png",
  );
  for (const value of [
    undefined,
    {},
    "/x.png",
    "../x.png",
    "a/../x.png",
    "https://evil.test/a",
    "a%2fb.png",
    "a.png?x",
    "a\\b.png",
    "//evil.test",
  ])
    assert.equal(checkpointArtifact(value, "/repo/data/latest"), undefined);
});

test("Actions links are limited to this repository", () => {
  const url =
    "https://github.com/tamyu321-source/isle-scent-taiwan-studio/actions/runs/123";
  assert.equal(checkpointActionsUrl(url), url);
  for (const value of [
    "javascript:alert(1)",
    "https://evil.test",
    `${url}?extra=1`,
    "https://github.com/other/repo/actions/runs/123",
  ])
    assert.equal(checkpointActionsUrl(value), undefined);
});

test("timestamps are presented in Taiwan time without inventing completion", () => {
  assert.equal(checkpointTime(null), "尚未完成");
  assert.match(checkpointTime("2026-09-13T01:00:00Z"), /09:00/);
});
