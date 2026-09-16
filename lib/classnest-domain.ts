// Pure, clock-injected booking rules. These are demo roles, not authentication.
export type Role = "parent" | "teacher" | "admin";
export type Actor = {
  role: Role;
  familyId: string;
  teacherId: string;
  session: string;
};
export type Family = { id: string; name: string };
export type Child = { id: string; familyId: string; name: string; age: number };
export type Teacher = {
  id: string;
  name: string;
  english: string;
  subject: string;
  color: number;
  intro: string;
  specialty: string;
};
export type Course = {
  id: string;
  teacherId: string;
  title: string;
  kind: "individual" | "group";
  duration: number;
  credits: number;
  capacity: number;
};
export type Session = {
  id: string;
  courseId: string;
  start: number;
  end: number;
  capacity: number;
  credits: number;
  cancelled: boolean;
};
export type Hold = {
  id: string;
  sessionId: string;
  childId: string;
  familyId: string;
  owner: string;
  expires: number;
};
export type Booking = {
  id: string;
  sessionId: string;
  childId: string;
  familyId: string;
  credits: number;
  status: "confirmed" | "attended" | "absent" | "cancelled" | "rescheduled";
  created: number;
  note: string;
};
export type LedgerEntry = {
  id: string;
  familyId: string;
  bookingId?: string;
  kind: "grant" | "freeze" | "release" | "settle" | "adjust";
  available: number;
  frozen: number;
  spent: number;
  at: number;
  reason: string;
};
export type NestState = {
  version: 1;
  revision: number;
  families: Family[];
  children: Child[];
  teachers: Teacher[];
  courses: Course[];
  sessions: Session[];
  holds: Hold[];
  bookings: Booking[];
  ledger: LedgerEntry[];
  operations: string[];
};
export const DAY = 86_400_000;
export const HOLD_MS = 600_000;
export const CUTOFF = DAY;
export const kindName = (kind: Course["kind"]) =>
  kind === "individual" ? "一對一" : "小班團體";
export const statusName: Record<Booking["status"], string> = {
  confirmed: "已預約",
  attended: "已出席",
  absent: "缺席",
  cancelled: "已取消",
  rescheduled: "已改期",
};
export const dateKey = (time: number) =>
  new Date(time + 8 * 3600_000).toISOString().slice(0, 10);
export const atTime = (date: string, time = "00:00") =>
  new Date(`${date}T${time}:00+08:00`).getTime();
export const dateText = (
  time: number,
  options: Intl.DateTimeFormatOptions = {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  },
) =>
  new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    ...options,
  }).format(time);
export const timeText = (time: number) =>
  dateText(time, { hour: "2-digit", minute: "2-digit", hour12: false });
export const monday = (now: number) => {
  const day = atTime(dateKey(now));
  const weekday = new Date(day + 8 * 3600_000).getUTCDay();
  return day - ((weekday + 6) % 7) * DAY;
};
export const uid = () => crypto.randomUUID();
function requireRule(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export function details(s: NestState, sessionId: string) {
  const session = s.sessions.find((v) => v.id === sessionId);
  requireRule(session, "這個時段已不存在，請重新整理課表。");
  const course = s.courses.find((v) => v.id === session.courseId)!;
  const teacher = s.teachers.find((v) => v.id === course.teacherId)!;
  return { session, course, teacher };
}
export function wallet(s: NestState, familyId: string) {
  return s.ledger
    .filter((v) => v.familyId === familyId)
    .reduce(
      (a, v) => ({
        available: a.available + v.available,
        frozen: a.frozen + v.frozen,
        spent: a.spent + v.spent,
      }),
      { available: 0, frozen: 0, spent: 0 },
    );
}
export const overlaps = (a: Session, b: Session) =>
  a.start < b.end && b.start < a.end;
export function seats(
  s: NestState,
  id: string,
  now: number,
  ignoreBooking?: string,
) {
  return (
    details(s, id).session.capacity -
    s.bookings.filter(
      (v) =>
        v.sessionId === id &&
        v.status === "confirmed" &&
        v.id !== ignoreBooking,
    ).length -
    s.holds.filter((v) => v.sessionId === id && v.expires > now).length
  );
}
function entry(
  s: NestState,
  familyId: string,
  kind: LedgerEntry["kind"],
  available: number,
  frozen: number,
  spent: number,
  now: number,
  reason: string,
  bookingId?: string,
) {
  s.ledger.push({
    id: uid(),
    familyId,
    kind,
    available,
    frozen,
    spent,
    at: now,
    reason,
    bookingId,
  });
}
export function extendSchedule(s: NestState, now: number) {
  const existing = new Set(s.sessions.map((v) => v.id));
  const firstDay = monday(now);
  for (let d = 0; d < 84; d++) {
    const date = dateKey(firstDay + d * DAY);
    // Each teacher opens one recurring daily class. IDs survive rolling horizons.
    for (let t = 0; t < s.courses.length; t++) {
      const course = s.courses[t];
      const id = `${course.id}-${date}`;
      if (existing.has(id)) continue;
      const start = atTime(
        date,
        ["15:30", "17:00", "15:30", "17:00", "16:00", "18:00"][t],
      );
      s.sessions.push({
        id,
        courseId: course.id,
        start,
        end: start + course.duration * 60_000,
        capacity: course.capacity,
        credits: course.credits,
        cancelled: false,
      });
    }
  }
}
export function seedNest(now: number): NestState {
  const s: NestState = {
    version: 1,
    revision: 0,
    families: [
      { id: "lin", name: "林家" },
      { id: "chen", name: "陳家" },
    ],
    children: [
      { id: "lin-1", familyId: "lin", name: "小禾", age: 9 },
      { id: "lin-2", familyId: "lin", name: "小米", age: 7 },
      { id: "chen-1", familyId: "chen", name: "樂樂", age: 8 },
      { id: "chen-2", familyId: "chen", name: "安安", age: 10 },
    ],
    teachers: [
      {
        id: "emma",
        name: "林以晴",
        english: "Emma",
        subject: "英文",
        color: 0,
        intro:
          "從孩子想分享的日常開始，用繪本、角色扮演與對話，練習把想法說出來。",
        specialty: "繪本閱讀・日常口說",
      },
      {
        id: "oliver",
        name: "周以辰",
        english: "Oliver",
        subject: "英文",
        color: 0,
        intro:
          "讓語言成為一起探索的工具，在小組任務與故事接龍裡，自然建立開口的自信。",
        specialty: "情境對話・合作學習",
      },
      {
        id: "leo",
        name: "陳思齊",
        english: "Leo",
        subject: "數學",
        color: 1,
        intro:
          "用生活問題拆解抽象概念，陪孩子找到自己的解法，也學會說明思考過程。",
        specialty: "數感養成・邏輯推理",
      },
      {
        id: "zoe",
        name: "吳若語",
        english: "Zoe",
        subject: "數學",
        color: 1,
        intro:
          "從桌遊與圖形解謎出發，在同儕討論中練習觀察、提問和不同的解題方法。",
        specialty: "數學桌遊・圖形探索",
      },
      {
        id: "mia",
        name: "許知音",
        english: "Mia",
        subject: "音樂",
        color: 2,
        intro:
          "陪孩子用耳朵發現細節，用旋律表达心情。依學習節奏安排基礎演奏與創作練習。",
        specialty: "鋼琴啟蒙・旋律創作",
      },
      {
        id: "noah",
        name: "楊子樂",
        english: "Noah",
        subject: "音樂",
        color: 2,
        intro:
          "拍手、打擊與合奏都是音樂的起點。透過一起聆聽，學習合作和節奏表達。",
        specialty: "節奏訓練・小組合奏",
      },
    ],
    courses: [],
    sessions: [],
    holds: [],
    bookings: [],
    ledger: [],
    operations: [],
  };
  s.courses = s.teachers.map((t, i) => ({
    id: `course-${i}`,
    teacherId: t.id,
    title: [
      "用英文說世界",
      "故事裡的英文課",
      "數學探險家",
      "邏輯遊戲實驗室",
      "和音樂交朋友",
      "小小節奏合奏團",
    ][i],
    kind: i % 2 ? "group" : "individual",
    duration: i === 4 ? 100 : 50,
    credits: i === 4 ? 2 : 1,
    capacity: i % 2 ? (i === 1 ? 2 : 4) : 1,
  }));
  extendSchedule(s, now);
  entry(s, "lin", "grant", 32, 0, 0, now - DAY * 20, "示範學習方案・32 堂");
  entry(s, "chen", "grant", 24, 0, 0, now - DAY * 20, "示範學習方案・24 堂");
  const past = atTime(dateKey(now - DAY), "15:30");
  let attendanceSession = s.sessions.find(
    (v) => v.courseId === "course-0" && v.start === past,
  );
  if (!attendanceSession) {
    attendanceSession = {
      id: "seed-attendance",
      courseId: "course-0",
      start: past,
      end: past + 50 * 60_000,
      credits: 1,
      capacity: 1,
      cancelled: false,
    };
    s.sessions.push(attendanceSession);
  }
  const b: Booking = {
    id: "seed-booking",
    familyId: "lin",
    childId: "lin-1",
    sessionId: attendanceSession.id,
    credits: 1,
    status: "confirmed",
    created: past - 2 * DAY,
    note: "示範待點名課程",
  };
  s.bookings.push(b);
  entry(
    s,
    b.familyId,
    "freeze",
    -1,
    1,
    0,
    b.created,
    "預約・用英文說世界",
    b.id,
  );
  const future = s.sessions
    .filter((v) => v.start > now + DAY && v.courseId === "course-1")
    .sort((a, b) => a.start - b.start)[0];
  for (const childId of ["chen-1", "chen-2"]) {
    const id = uid();
    s.bookings.push({
      id,
      sessionId: future.id,
      childId,
      familyId: "chen",
      credits: 1,
      status: "confirmed",
      created: now,
      note: "示範額滿團體課",
    });
    entry(s, "chen", "freeze", -1, 1, 0, now, "預約・故事裡的英文課", id);
  }
  const booked = s.sessions.find(
    (v) => v.courseId === "course-4" && v.start > now + DAY,
  )!;
  const bid = uid();
  s.bookings.push({
    id: bid,
    sessionId: booked.id,
    childId: "lin-2",
    familyId: "lin",
    credits: 2,
    status: "confirmed",
    created: now,
    note: "示範學習計畫",
  });
  entry(s, "lin", "freeze", -2, 2, 0, now, "預約・和音樂交朋友", bid);
  return s;
}
function ownedChild(s: NestState, actor: Actor, childId: string) {
  requireRule(
    actor.role === "parent" &&
      s.children.some((v) => v.id === childId && v.familyId === actor.familyId),
    "請選擇目前家庭的孩子。",
  );
}
export function slotIssue(
  s: NestState,
  id: string,
  childId: string,
  now: number,
  ignoreBooking?: string,
) {
  const { session } = details(s, id);
  if (session.cancelled) return "老師已停開此課程";
  if (session.start <= now) return "已超過開課時間";
  if (seats(s, id, now, ignoreBooking) <= 0) return "時段額滿或正在被保留";
  if (
    s.bookings.some(
      (v) =>
        v.childId === childId &&
        v.status === "confirmed" &&
        v.id !== ignoreBooking &&
        overlaps(session, details(s, v.sessionId).session),
    )
  )
    return "孩子已有重疊的預約";
  if (
    s.holds.some(
      (v) =>
        v.childId === childId &&
        v.expires > now &&
        overlaps(session, details(s, v.sessionId).session),
    )
  )
    return "孩子已有重疊的暫留時段";
  return "";
}
export type SeriesItem = { id: string; start: number; issue: string };
export function seriesPreview(
  s: NestState,
  sessionId: string,
  childId: string,
  weeks: number,
  now: number,
): SeriesItem[] {
  requireRule(
    Number.isInteger(weeks) && weeks >= 1 && weeks <= 8,
    "連續週次必須介於 1–8 週。",
  );
  const source = details(s, sessionId).session;
  return Array.from({ length: weeks }, (_, i) => {
    const start = source.start + i * 7 * DAY;
    const match = s.sessions.find(
      (v) => v.courseId === source.courseId && v.start === start,
    );
    return {
      id: match?.id ?? `missing-${start}`,
      start,
      issue: match ? slotIssue(s, match.id, childId, now) : "該週未開放時段",
    };
  });
}
export type Command =
  | { type: "hold"; sessionIds: string[]; childId: string }
  | { type: "release"; holdId: string }
  | { type: "confirm"; holdIds: string[] }
  | { type: "cancel"; bookingId: string }
  | { type: "reschedule"; bookingId: string; sessionId: string }
  | { type: "attendance"; bookingId: string; status: "attended" | "absent" }
  | { type: "adjust"; familyId: string; amount: number; reason: string }
  | { type: "stop"; sessionId: string; reason: string }
  | {
      type: "save-session";
      sessionId?: string;
      courseId: string;
      start: number;
      capacity: number;
      credits: number;
    }
  | { type: "reset" };
function releaseBooking(
  s: NestState,
  b: Booking,
  now: number,
  reason: string,
  status: Booking["status"] = "cancelled",
) {
  b.status = status;
  b.note = reason;
  entry(s, b.familyId, "release", b.credits, -b.credits, 0, now, reason, b.id);
}
function confirmedBooking(s: NestState, id: string) {
  const b = s.bookings.find((v) => v.id === id);
  requireRule(b && b.status === "confirmed", "此預約已處理，請查看最新紀錄。");
  return b;
}
function checkParentChange(
  s: NestState,
  actor: Actor,
  b: Booking,
  now: number,
) {
  ownedChild(s, actor, b.childId);
  requireRule(
    details(s, b.sessionId).session.start - now >= CUTOFF,
    "開課前不足 24 小時，無法自行取消或改期，請聯絡教務。",
  );
}
export function applyCommand(
  input: NestState,
  command: Command,
  actor: Actor,
  operationId: string,
  now: number,
): NestState {
  if (input.operations.includes(operationId)) return input;
  requireRule(operationId && Number.isFinite(now), "操作資料無效。");
  if (command.type === "reset") {
    requireRule(actor.role === "admin", "請由管理員重設展示資料。");
    const reset = seedNest(now);
    reset.revision = input.revision + 1;
    reset.operations.push(operationId);
    return reset;
  }
  const s = structuredClone(input);
  s.holds = s.holds.filter((v) => v.expires > now);
  extendSchedule(s, now);
  if (command.type === "hold") {
    ownedChild(s, actor, command.childId);
    requireRule(
      command.sessionIds.length > 0 &&
        command.sessionIds.length <= 64 &&
        new Set(command.sessionIds).size === command.sessionIds.length,
      "請選擇不重複的時段。",
    );
    for (const id of command.sessionIds) {
      const issue = slotIssue(s, id, command.childId, now);
      requireRule(
        !issue,
        `${dateText(details(s, id).session.start)}：${issue}`,
      );
      s.holds.push({
        id: uid(),
        sessionId: id,
        childId: command.childId,
        familyId: actor.familyId,
        owner: actor.session,
        expires: now + HOLD_MS,
      });
    }
  } else if (command.type === "release") {
    const h = s.holds.find((v) => v.id === command.holdId);
    requireRule(
      !h ||
        (h.owner === actor.session &&
          h.familyId === actor.familyId &&
          actor.role === "parent"),
      "不能移除其他視窗的暫留。",
    );
    s.holds = s.holds.filter((v) => v.id !== command.holdId);
  } else if (command.type === "confirm") {
    requireRule(
      actor.role === "parent" &&
        command.holdIds.length > 0 &&
        new Set(command.holdIds).size === command.holdIds.length,
      "請選擇有效的暫留時段。",
    );
    const selected = command.holdIds.map((id) => {
      const h = s.holds.find((v) => v.id === id);
      requireRule(
        h && h.owner === actor.session && h.familyId === actor.familyId,
        "時段暫留已到期，請重新選課。",
      );
      return h;
    });
    const total = selected.reduce(
      (a, h) => a + details(s, h.sessionId).session.credits,
      0,
    );
    requireRule(
      wallet(s, actor.familyId).available >= total,
      "可用堂數不足，請減少課程或由管理端補堂。",
    );
    s.holds = s.holds.filter((v) => !command.holdIds.includes(v.id));
    for (const h of selected) {
      ownedChild(s, actor, h.childId);
      const issue = slotIssue(s, h.sessionId, h.childId, now);
      requireRule(!issue, issue);
      const { session, course } = details(s, h.sessionId);
      const b: Booking = {
        id: uid(),
        sessionId: session.id,
        childId: h.childId,
        familyId: h.familyId,
        credits: session.credits,
        status: "confirmed",
        created: now,
        note: "",
      };
      s.bookings.push(b);
      entry(
        s,
        b.familyId,
        "freeze",
        -b.credits,
        b.credits,
        0,
        now,
        `預約・${course.title}`,
        b.id,
      );
    }
  } else if (command.type === "cancel") {
    const b = confirmedBooking(s, command.bookingId);
    checkParentChange(s, actor, b, now);
    releaseBooking(s, b, now, "家長於 24 小時前取消");
  } else if (command.type === "reschedule") {
    const b = confirmedBooking(s, command.bookingId);
    checkParentChange(s, actor, b, now);
    requireRule(b.sessionId !== command.sessionId, "請選擇不同的時段。");
    const issue = slotIssue(s, command.sessionId, b.childId, now, b.id);
    requireRule(!issue, issue);
    const { session, course } = details(s, command.sessionId);
    requireRule(
      wallet(s, b.familyId).available + b.credits >= session.credits,
      "改期後的可用堂數不足。",
    );
    releaseBooking(s, b, now, "改期・原課堂數退回", "rescheduled");
    const next: Booking = {
      ...b,
      id: uid(),
      sessionId: session.id,
      credits: session.credits,
      status: "confirmed",
      created: now,
      note: `由 ${b.id.slice(0, 8)} 改期`,
    };
    s.bookings.push(next);
    entry(
      s,
      b.familyId,
      "freeze",
      -next.credits,
      next.credits,
      0,
      now,
      `改期・${course.title}`,
      next.id,
    );
  } else if (command.type === "attendance") {
    const b = s.bookings.find((v) => v.id === command.bookingId);
    requireRule(b, "預約不存在。");
    const { session, teacher, course } = details(s, b.sessionId);
    requireRule(
      actor.role === "admin" ||
        (actor.role === "teacher" && actor.teacherId === teacher.id),
      "只能點名自己的課程。",
    );
    requireRule(session.end <= now, "課程尚未結束，不能提前扣堂。");
    if (b.status === command.status) return input;
    requireRule(b.status === "confirmed", "這堂課已結算，不能重複扣堂。");
    b.status = command.status;
    entry(
      s,
      b.familyId,
      "settle",
      0,
      -b.credits,
      b.credits,
      now,
      `${command.status === "attended" ? "出席" : "缺席"}結算・${course.title}`,
      b.id,
    );
  } else {
    requireRule(actor.role === "admin", "此操作需要管理員示範身分。");
    if (command.type === "adjust") {
      requireRule(
        s.families.some((v) => v.id === command.familyId),
        "請選擇家庭。",
      );
      requireRule(
        Number.isInteger(command.amount) &&
          command.amount !== 0 &&
          Math.abs(command.amount) <= 1000,
        "調整堂數必須為 -1000 至 1000 的非零整數。",
      );
      requireRule(
        command.reason.trim().length >= 2 && command.reason.length <= 200,
        "請填寫 2–200 字的補退堂原因。",
      );
      requireRule(
        wallet(s, command.familyId).available + command.amount >= 0,
        "調整後可用堂數不能小於零。",
      );
      entry(
        s,
        command.familyId,
        "adjust",
        command.amount,
        0,
        0,
        now,
        command.reason.trim(),
      );
    } else if (command.type === "stop") {
      requireRule(command.reason.trim().length >= 2, "請填寫停課原因。");
      const { session } = details(s, command.sessionId);
      requireRule(session.start > now, "已開始的課程不能停開。");
      session.cancelled = true;
      s.bookings
        .filter((v) => v.sessionId === session.id && v.status === "confirmed")
        .forEach((b) =>
          releaseBooking(s, b, now, `老師停課・${command.reason.trim()}`),
        );
      s.holds = s.holds.filter((v) => v.sessionId !== session.id);
    } else if (command.type === "save-session") {
      const course = s.courses.find((v) => v.id === command.courseId);
      requireRule(course, "請選擇課程。");
      const existing = command.sessionId
        ? details(s, command.sessionId).session
        : undefined;
      if (existing) {
        requireRule(
          existing.start > now && !existing.cancelled,
          "只能編輯尚未開始且未停開的時段。",
        );
        requireRule(
          !s.bookings.some((v) => v.sessionId === existing.id) &&
            !s.holds.some((v) => v.sessionId === existing.id),
          "此課已有預約或暫留，不能直接更改時間、容量或堂數。",
        );
      }
      requireRule(
        Number.isFinite(command.start) &&
          command.start > now &&
          command.start < now + DAY * 84,
        "請選擇未來 12 週內的開課時間。",
      );
      requireRule(
        Number.isInteger(command.credits) &&
          command.credits >= 1 &&
          command.credits <= 10,
        "每堂扣除需為 1–10 堂。",
      );
      requireRule(
        Number.isInteger(command.capacity) &&
          command.capacity >= 1 &&
          command.capacity <= 12 &&
          (course.kind !== "individual" || command.capacity === 1),
        "團體容量為 1–12 人，一對一固定 1 人。",
      );
      const next: Session = {
        id: existing?.id ?? uid(),
        courseId: course.id,
        start: command.start,
        end: command.start + course.duration * 60_000,
        capacity: command.capacity,
        credits: command.credits,
        cancelled: false,
      };
      requireRule(
        !s.sessions.some(
          (v) =>
            v.id !== next.id &&
            !v.cancelled &&
            details(s, v.id).teacher.id === course.teacherId &&
            overlaps(v, next),
        ),
        "老師在這個時間已有開課安排。",
      );
      if (existing) Object.assign(existing, next);
      else s.sessions.push(next);
    }
  }
  for (const f of s.families) {
    const balance = wallet(s, f.id);
    requireRule(
      balance.available >= 0 && balance.frozen >= 0 && balance.spent >= 0,
      "堂數帳本檢查失敗，操作已取消。",
    );
    requireRule(
      balance.frozen ===
        s.bookings
          .filter((b) => b.familyId === f.id && b.status === "confirmed")
          .reduce((n, b) => n + b.credits, 0),
      "凍結堂數與預約不符，操作已取消。",
    );
  }
  s.operations.push(operationId);
  s.revision++;
  return s;
}
export function parseNest(value: unknown): NestState {
  requireRule(value && typeof value === "object", "本機資料無法讀取，請重試。");
  const s = value as NestState;
  requireRule(
    s.version === 1 &&
      Number.isInteger(s.revision) &&
      [
        s.families,
        s.children,
        s.teachers,
        s.courses,
        s.sessions,
        s.holds,
        s.bookings,
        s.ledger,
        s.operations,
      ].every(Array.isArray),
    "本機資料版本或內容不相容；既有資料仍保留，請由管理端重設展示。",
  );
  requireRule(
    s.families.length === 2 &&
      s.teachers.length === 6 &&
      s.courses.length === 6 &&
      s.sessions.every(
        (v) =>
          v &&
          typeof v.id === "string" &&
          Number.isFinite(v.start) &&
          Number.isFinite(v.end) &&
          s.courses.some((c) => c.id === v.courseId),
      ) &&
      s.bookings.every(
        (b) =>
          s.sessions.some((v) => v.id === b.sessionId) &&
          s.children.some(
            (c) => c.id === b.childId && c.familyId === b.familyId,
          ),
      ) &&
      s.ledger.every((e) =>
        [e.available, e.frozen, e.spent, e.at].every(Number.isFinite),
      ),
    "本機資料不完整；沒有覆寫或清除資料，請重試或重設展示。",
  );
  return s;
}
export function csvText(rows: (string | number)[][]) {
  return (
    "\ufeff" +
    rows
      .map((row) =>
        row
          .map((value) => {
            let text = String(value);
            if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
            return '"' + text.replaceAll('"', '""') + '"';
          })
          .join(","),
      )
      .join("\r\n")
  );
}
