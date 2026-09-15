import test from "node:test";
import assert from "node:assert/strict";
import {
  initialProject,
  parseProject,
  positionAt,
  issuesFor,
  SCENES,
} from "../lib/vector-model.ts";

test("exported projects round-trip without losing annotations or task states", () => {
  const project = initialProject();
  project.annotations["scene-042"][0].x = 8.73;
  project.annotations["scene-042"][0].rotation = 72;
  project.tasks.reverse();
  project.tasks[0].status = "review";
  const result = parseProject(JSON.parse(JSON.stringify(project)));
  assert.deepEqual(result.annotations, project.annotations);
  assert.deepEqual(result.tasks, project.tasks);
  for (const task of project.tasks)
    assert.equal(
      result.tasks.find((t) => t.id === task.id).status,
      task.status,
    );
});
test("import rejects duplicate IDs, invalid classes, missing scenes, invalid dimensions and non-finite positions", () => {
  for (const mutate of [
    (p) => p.annotations["scene-042"].push(p.annotations["scene-042"][0]),
    (p) => {
      p.annotations["scene-042"][0].category = "__proto__";
    },
    (p) => {
      delete p.annotations["scene-043"];
    },
    (p) => {
      p.annotations["scene-042"][0].width = -1;
    },
    (p) => {
      p.annotations["scene-042"][0].x = NaN;
    },
    (p) => {
      p.annotations["scene-042"][0].confidence = 2;
    },
    (p) => {
      p.tasks[0].status = "invalid";
    },
  ]) {
    const p = initialProject();
    mutate(p);
    assert.throws(() => parseProject(p));
  }
});
test("track anchor stays fixed at frame 42 and rotated trajectories move along heading", () => {
  const a = initialProject().annotations["scene-042"][0];
  assert.deepEqual(positionAt(a, 42), { x: a.x, y: a.y, z: a.z });
  const end = positionAt({ ...a, rotation: 90 }, 52);
  assert.ok(Math.abs(end.x - (a.x + 0.7)) < 1e-9);
  assert.ok(Math.abs(end.z - a.z) < 1e-9);
  assert.equal(end.y, a.y);
});
test("quality warnings require review and are cleared by human confirmation", () => {
  const annotations = initialProject().annotations["scene-042"];
  const issues = issuesFor(annotations);
  assert.equal(issues.length, 5);
  assert.equal(issues.filter((i) => i.id === "PED-007").length, 2);
  assert.deepEqual(
    issuesFor(annotations.map((a) => ({ ...a, reviewed: true }))),
    [],
  );
});
test("empty scenes are valid and deterministic demo data does not share object references", () => {
  const a = initialProject(),
    b = initialProject();
  assert.deepEqual(a, b);
  a.annotations[SCENES[0].id][0].x = 900;
  assert.notEqual(
    a.annotations[SCENES[0].id][0].x,
    b.annotations[SCENES[0].id][0].x,
  );
  a.annotations["scene-042"] = [];
  assert.deepEqual(parseProject(a).annotations["scene-042"], []);
});
