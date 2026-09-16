import test from "node:test";
import assert from "node:assert/strict";
import {
  seedNest,
  applyCommand,
  wallet,
  seriesPreview,
  details,
  seats,
  dateKey,
  atTime,
  monday,
  HOLD_MS,
  DAY,
  csvText,
  parseNest,
} from "../lib/classnest-domain.ts";

const NOW = Date.parse("2026-09-14T09:00:00+08:00");
const parent = {
  role: "parent",
  familyId: "lin",
  teacherId: "emma",
  session: "tab-a",
};
const other = { ...parent, familyId: "chen", session: "tab-b" };
const admin = { ...parent, role: "admin" };
const teacher = { ...parent, role: "teacher" };
const act = (s, c, a = parent, now = NOW, id = crypto.randomUUID()) =>
  applyCommand(s, c, a, id, now);
const target = (s, course = "course-0", offset = 3) =>
  s.sessions.find(
    (v) =>
      v.courseId === course && dateKey(v.start) === dateKey(NOW + offset * DAY),
  );
function reserve(s, ids, child = "lin-1", actor = parent, now = NOW) {
  const held = act(
    s,
    { type: "hold", sessionIds: ids, childId: child },
    actor,
    now,
  );
  const holdIds = held.holds
    .filter((h) => h.owner === actor.session)
    .map((h) => h.id);
  return act(held, { type: "confirm", holdIds }, actor, now);
}
test("seed balances reconcile with confirmed reservations and use Taipei dates", () => {
  const s = seedNest(NOW);
  assert.deepEqual(wallet(s, "lin"), { available: 29, frozen: 3, spent: 0 });
  assert.deepEqual(wallet(s, "chen"), { available: 22, frozen: 2, spent: 0 });
  assert.equal(monday(NOW), atTime("2026-09-14"));
  assert.equal(dateKey(Date.parse("2026-09-13T17:00:00Z")), "2026-09-14");
  assert.equal(parseNest(JSON.parse(JSON.stringify(s))).version, 1);
  assert.throws(() => parseNest({ version: 1 }));
});
test("individual hold excludes another family without charging credits", () => {
  let s = seedNest(NOW);
  const id = target(s).id;
  s = act(s, { type: "hold", sessionIds: [id], childId: "lin-1" });
  assert.equal(seats(s, id, NOW), 0);
  assert.equal(wallet(s, "lin").available, 29);
  assert.throws(
    () => act(s, { type: "hold", sessionIds: [id], childId: "chen-1" }, other),
    /額滿/,
  );
  assert.throws(
    () => act(s, { type: "release", holdId: s.holds[0].id }, other),
    /其他/,
  );
});
test("group capacity counts each child, confirmed bookings and live holds", () => {
  let s = seedNest(NOW);
  const id = target(s, "course-1").id;
  s = reserve(s, [id]);
  s = act(s, { type: "hold", sessionIds: [id], childId: "chen-1" }, other);
  assert.equal(seats(s, id, NOW), 0);
  assert.throws(
    () => act(s, { type: "hold", sessionIds: [id], childId: "chen-2" }, other),
    /額滿/,
  );
});
test("child collisions across different teachers reject entire hold batch", () => {
  const s = seedNest(NOW);
  const before = structuredClone(s);
  const a = target(s).id,
    b = target(s, "course-2").id;
  assert.throws(
    () => act(s, { type: "hold", sessionIds: [a, b], childId: "lin-1" }),
    /重疊/,
  );
  assert.deepEqual(s, before);
});
test("batch confirmation freezes once, never creates duplicate bookings", () => {
  let s = seedNest(NOW);
  s = act(s, {
    type: "hold",
    sessionIds: [target(s).id, target(s, "course-0", 4).id],
    childId: "lin-1",
  });
  const command = { type: "confirm", holdIds: s.holds.map((h) => h.id) };
  const id = crypto.randomUUID();
  s = act(s, command, parent, NOW, id);
  assert.equal(wallet(s, "lin").available, 27);
  assert.equal(wallet(s, "lin").frozen, 5);
  const repeat = act(s, command, parent, NOW, id);
  assert.deepEqual(repeat, s);
  assert.throws(() => act(s, command), /到期/);
});
test("insufficient credits cause no partial confirmation and retain holds", () => {
  let s = seedNest(NOW);
  s = act(
    s,
    { type: "adjust", familyId: "lin", amount: -28, reason: "測試剩餘" },
    admin,
  );
  s = act(s, {
    type: "hold",
    sessionIds: [target(s).id, target(s, "course-4", 4).id],
    childId: "lin-1",
  });
  const before = structuredClone(s);
  assert.throws(
    () => act(s, { type: "confirm", holdIds: s.holds.map((h) => h.id) }),
    /不足/,
  );
  assert.deepEqual(s, before);
});
test("expired holds do not confirm and another tab can claim freed capacity", () => {
  let s = seedNest(NOW);
  const id = target(s).id;
  s = act(s, { type: "hold", sessionIds: [id], childId: "lin-1" });
  assert.throws(
    () =>
      act(
        s,
        { type: "confirm", holdIds: s.holds.map((h) => h.id) },
        parent,
        NOW + HOLD_MS,
      ),
    /到期/,
  );
  assert.equal(seats(s, id, NOW + HOLD_MS), 1);
  s = act(
    s,
    { type: "hold", sessionIds: [id], childId: "chen-1" },
    other,
    NOW + HOLD_MS,
  );
  assert.equal(s.holds[0].familyId, "chen");
});
test("recurring preview exposes conflicts; removing them enables a whole batch", () => {
  let s = seedNest(NOW);
  const first = target(s);
  const preview = seriesPreview(s, first.id, "lin-1", 4, NOW);
  assert.equal(preview.length, 4);
  assert.equal(preview[1].start - preview[0].start, 7 * DAY);
  s = reserve(s, [preview[1].id], "chen-1", other);
  const updated = seriesPreview(s, first.id, "lin-1", 4, NOW);
  assert.match(updated[1].issue, /額滿/);
  assert.throws(
    () =>
      act(s, {
        type: "hold",
        sessionIds: updated.map((v) => v.id),
        childId: "lin-1",
      }),
    /額滿/,
  );
  s = act(s, {
    type: "hold",
    sessionIds: updated.filter((v) => !v.issue).map((v) => v.id),
    childId: "lin-1",
  });
  assert.equal(s.holds.length, 3);
  assert.throws(() => seriesPreview(s, first.id, "lin-1", 9, NOW), /1–8/);
});
test("24-hour cancellation boundary is inclusive and refund happens once", () => {
  let s = seedNest(NOW);
  const slot = target(s);
  s = reserve(s, [slot.id]);
  const b = s.bookings.find((v) => v.sessionId === slot.id);
  assert.throws(
    () =>
      act(s, { type: "cancel", bookingId: b.id }, parent, slot.start - DAY + 1),
    /24/,
  );
  s = act(s, { type: "cancel", bookingId: b.id }, parent, slot.start - DAY);
  assert.equal(wallet(s, "lin").available, 29);
  assert.throws(() => act(s, { type: "cancel", bookingId: b.id }), /已處理/);
});
test("rescheduling rolls back failed change and atomically reprices successful change", () => {
  let s = seedNest(NOW);
  const old = target(s),
    full = target(s, "course-0", 4);
  s = reserve(s, [old.id]);
  s = reserve(s, [full.id], "chen-1", other);
  const b = s.bookings.find((v) => v.sessionId === old.id);
  const before = structuredClone(s);
  assert.throws(
    () => act(s, { type: "reschedule", bookingId: b.id, sessionId: full.id }),
    /額滿/,
  );
  assert.deepEqual(s, before);
  s = act(s, {
    type: "reschedule",
    bookingId: b.id,
    sessionId: target(s, "course-4", 5).id,
  });
  assert.equal(s.bookings.find((v) => v.id === b.id).status, "rescheduled");
  assert.equal(wallet(s, "lin").available, 27);
  assert.equal(wallet(s, "lin").frozen, 5);
});
test("attendance authorizes the teacher, waits until end, settles exactly once", () => {
  let s = seedNest(NOW);
  const slot = target(s);
  s = reserve(s, [slot.id]);
  const b = s.bookings.find((v) => v.sessionId === slot.id);
  assert.throws(
    () =>
      act(
        s,
        { type: "attendance", bookingId: b.id, status: "attended" },
        teacher,
      ),
    /尚未結束/,
  );
  assert.throws(
    () =>
      act(
        s,
        { type: "attendance", bookingId: b.id, status: "attended" },
        { ...teacher, teacherId: "mia" },
        slot.end,
      ),
    /自己/,
  );
  s = act(
    s,
    { type: "attendance", bookingId: b.id, status: "attended" },
    teacher,
    slot.end,
  );
  assert.equal(wallet(s, "lin").spent, 1);
  assert.equal(wallet(s, "lin").frozen, 3);
  assert.deepEqual(
    act(
      s,
      { type: "attendance", bookingId: b.id, status: "attended" },
      teacher,
      slot.end,
    ),
    s,
  );
  assert.throws(
    () =>
      act(
        s,
        { type: "attendance", bookingId: b.id, status: "absent" },
        teacher,
        slot.end,
      ),
    /不能重複/,
  );
});
test("absence settles credits and administrator adjustment requires a reason", () => {
  let s = seedNest(NOW);
  s = act(
    s,
    { type: "attendance", bookingId: "seed-booking", status: "absent" },
    teacher,
  );
  assert.equal(wallet(s, "lin").spent, 1);
  assert.throws(
    () =>
      act(s, { type: "adjust", familyId: "lin", amount: 4, reason: "" }, admin),
    /原因/,
  );
  assert.throws(
    () =>
      act(
        s,
        { type: "adjust", familyId: "lin", amount: -99, reason: "誤發收回" },
        admin,
      ),
    /小於零/,
  );
  s = act(
    s,
    { type: "adjust", familyId: "lin", amount: 4, reason: "補發四堂" },
    admin,
  );
  assert.equal(wallet(s, "lin").available, 33);
  assert.equal(s.ledger.at(-1).reason, "補發四堂");
});
test("teacher cancellation releases each family's frozen credits and all holds", () => {
  let s = seedNest(NOW);
  const id = target(s, "course-3").id;
  s = reserve(s, [id]);
  s = reserve(s, [id], "chen-1", other);
  s = act(s, { type: "hold", sessionIds: [id], childId: "lin-2" });
  s = act(s, { type: "stop", sessionId: id, reason: "老師請假" }, admin);
  assert.equal(wallet(s, "lin").available, 29);
  assert.equal(wallet(s, "chen").available, 22);
  assert.equal(s.holds.length, 0);
  assert.equal(details(s, id).session.cancelled, true);
});
test("admin cannot alter reserved sessions or create overlapping teacher classes", () => {
  let s = seedNest(NOW);
  const slot = target(s);
  s = reserve(s, [slot.id]);
  const command = {
    type: "save-session",
    courseId: slot.courseId,
    start: slot.start,
    capacity: 1,
    credits: 1,
  };
  assert.throws(
    () => act(s, { ...command, sessionId: slot.id }, admin),
    /已有預約/,
  );
  assert.throws(() => act(s, command, admin), /已有開課/);
  s = act(s, { ...command, start: slot.start - 3 * 3600_000 }, admin);
  assert.ok(s.sessions.some((v) => v.start === slot.start - 3 * 3600_000));
  assert.throws(
    () =>
      act(
        s,
        { ...command, start: slot.start - 6 * 3600_000, capacity: 2 },
        admin,
      ),
    /固定 1/,
  );
});
test("another family cannot book or cancel a child's class, and CSV escapes formulas", () => {
  const s = seedNest(NOW);
  assert.throws(
    () =>
      act(s, { type: "hold", sessionIds: [target(s).id], childId: "chen-1" }),
    /家庭/,
  );
  assert.throws(
    () => act(s, { type: "cancel", bookingId: "seed-booking" }, other),
    /家庭/,
  );
  assert.match(csvText([["=SUM(1,2)", 'a"b', "中文"]]), /^\ufeff"'=SUM/);
  assert.match(csvText([['a"b']]), /a""b/);
  assert.equal(csvText([[-2, 3, 0]]), '\ufeff"-2","3","0"');
  assert.equal(csvText([["-SUM(A1:A2)"]]), '\ufeff"\'-SUM(A1:A2)"');
});
test("rolling schedule adds future weeks and keeps previous bookings and stopped sessions", () => {
  let s = seedNest(NOW);
  const slot = target(s);
  s = act(s, { type: "stop", sessionId: slot.id, reason: "測試停開" }, admin);
  const count = s.sessions.length;
  const ids = s.bookings.map((v) => v.id);
  s = act(
    s,
    { type: "adjust", familyId: "lin", amount: 1, reason: "新週補堂" },
    admin,
    NOW + 20 * DAY,
  );
  assert.ok(s.sessions.length > count);
  assert.deepEqual(
    s.bookings.map((v) => v.id),
    ids,
  );
  assert.equal(details(s, slot.id).session.cancelled, true);
});
