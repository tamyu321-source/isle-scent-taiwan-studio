"use client";
import { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";
import {
  DAY,
  dateKey,
  dateText,
  details,
  kindName,
  monday,
  seats,
  statusName,
  timeText,
} from "@/lib/classnest-domain";
import type { Booking, Session } from "@/lib/classnest-domain";
import {
  ConfirmModal,
  ExportButton,
  Ledger,
  Modal,
  SelectField,
  exportBookings,
} from "./classnest-shared";
import type { NestUI } from "./classnest-shared";

export default function ClassnestManagement({
  data,
  actor,
  now,
  busy,
  run,
  view,
}: NestUI & { view: string }) {
  const [filter, setFilter] = useState(
    actor.role === "teacher" ? "pending" : "confirmed",
  );
  const [search, setSearch] = useState("");
  const [teacher, setTeacher] = useState("");
  const [offset, setOffset] = useState(0);
  const [editor, setEditor] = useState<Session | "new" | null>(null);
  const [courseId, setCourse] = useState("course-0");
  const [start, setStart] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [credits, setCredits] = useState("1");
  const [stop, setStop] = useState<Session | null>(null);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("4");
  const [adjustReason, setAdjustReason] = useState("");
  const [reset, setReset] = useState(false);
  const [modalError, setModalError] = useState("");
  const week = monday(now) + offset * 7 * DAY;
  const edit = (session: Session | "new") => {
    setEditor(session);
    setModalError("");
    if (session === "new") {
      setCourse("course-0");
      setStart(`${dateKey(now + DAY)}T10:00`);
      setCapacity("1");
      setCredits("1");
    } else {
      setCourse(session.courseId);
      setStart(`${dateKey(session.start)}T${timeText(session.start)}`);
      setCapacity(String(session.capacity));
      setCredits(String(session.credits));
    }
  };
  const classSessions = data.sessions
    .filter((s) => s.start >= week && s.start < week + 7 * DAY)
    .filter((s) => !teacher || details(data, s.id).teacher.id === teacher)
    .sort((a, b) => a.start - b.start);
  const bookings = data.bookings
    .filter(
      (b) =>
        actor.role !== "teacher" ||
        details(data, b.sessionId).teacher.id === actor.teacherId,
    )
    .filter(
      (b) =>
        filter === "all" ||
        (filter === "pending"
          ? b.status === "confirmed" &&
            details(data, b.sessionId).session.end <= now
          : filter === "history"
            ? ["attended", "absent", "cancelled", "rescheduled"].includes(
                b.status,
              )
            : b.status === "confirmed"),
    )
    .filter((b) =>
      `${details(data, b.sessionId).course.title}${details(data, b.sessionId).teacher.name}${data.children.find((c) => c.id === b.childId)?.name}${data.families.find((f) => f.id === b.familyId)?.name}${b.id}`.includes(
        search,
      ),
    )
    .sort(
      (a, b) =>
        details(data, a.sessionId).session.start -
        details(data, b.sessionId).session.start,
    );
  function bookingRow(b: Booking) {
    const { session, course, teacher: t } = details(data, b.sessionId);
    return (
      <article className="cn-booking-row" key={b.id} data-booking-id={b.id}>
        <div className={`cn-date-tile tone-${t.color}`}>
          <small>{dateText(session.start, { month: "short" })}</small>
          <strong>{dateText(session.start, { day: "numeric" })}</strong>
          <span>{timeText(session.start)}</span>
        </div>
        <div className="cn-booking-copy">
          <span className="cn-row-eyebrow">
            {data.families.find((f) => f.id === b.familyId)?.name} /{" "}
            {data.children.find((c) => c.id === b.childId)?.name} ·{" "}
            {kindName(course.kind)} · {b.credits} 堂
          </span>
          <h3>{course.title}</h3>
          <p>
            {t.english} {t.name} · {timeText(session.start)}–
            {timeText(session.end)}
          </p>
          <small>
            #{b.id.slice(0, 8)} · {b.note || "確認後凍結堂數，點名後正式結算"}
          </small>
        </div>
        <div className="cn-booking-actions">
          <span className={`cn-status ${b.status}`}>
            {statusName[b.status]}
          </span>
          {b.status === "confirmed" && session.end <= now ? (
            <div>
              <button
                className="cn-primary"
                disabled={busy}
                onClick={() =>
                  void run(
                    { type: "attendance", bookingId: b.id, status: "attended" },
                    `已記錄出席，正式扣除 ${b.credits} 堂。`,
                  )
                }
              >
                <Check size={14} />
                出席扣堂
              </button>
              <button
                className="cn-button"
                disabled={busy}
                onClick={() =>
                  void run(
                    { type: "attendance", bookingId: b.id, status: "absent" },
                    `已記錄缺席，依預約規則扣除 ${b.credits} 堂。`,
                  )
                }
              >
                缺席扣堂
              </button>
            </div>
          ) : (
            b.status === "confirmed" && <small>課程結束後開放點名</small>
          )}
        </div>
      </article>
    );
  }
  return (
    <>
      {actor.role === "teacher" || view === "bookings" ? (
        <section className="cn-panel">
          <div className="cn-section-title">
            <div>
              <p className="cn-eyebrow">BE PRESENT, MAKE A DIFFERENCE</p>
              <h2>
                {actor.role === "teacher" ? "課表與出席紀錄" : "所有家庭預約"}
              </h2>
            </div>
            <ExportButton
              onClick={() =>
                exportBookings(
                  data,
                  undefined,
                  actor.role === "teacher" ? actor.teacherId : undefined,
                )
              }
            />
          </div>
          <div className="cn-list-filters">
            <div className="cn-filters">
              {[
                ["pending", "待點名"],
                ["confirmed", "已預約"],
                ["history", "已處理"],
                ["all", "全部"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={filter === id ? "active" : ""}
                  aria-pressed={filter === id}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="cn-search">
              <Search size={15} />
              <input
                aria-label="搜尋管理預約"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="孩子、家庭或課程"
              />
            </label>
          </div>
          <p className="cn-description">
            {actor.role === "teacher"
              ? "只顯示目前老師的預約。團體課按孩子逐一點名；課程未結束時不會提前扣堂。"
              : "各家庭獨立記帳；請依實際出席情況結算，每筆預約只會扣堂一次。"}
          </p>
          {bookings.map(bookingRow)}
          {!bookings.length && (
            <div className="cn-empty">
              <CalendarDays size={34} />
              <h3>目前沒有符合的紀錄</h3>
              <p>可切換已預約、已處理或其他老師查看。</p>
            </div>
          )}
        </section>
      ) : view === "ledger" ? (
        <div className="cn-admin-ledger">
          <div>
            <Ledger data={data} familyId={actor.familyId} />
          </div>
          <aside className="cn-panel">
            <p className="cn-eyebrow">A LITTLE EXTRA SUPPORT</p>
            <h2>調整家庭堂數</h2>
            <p className="cn-description">
              目前家庭：
              {data.families.find((f) => f.id === actor.familyId)?.name}
              。補堂填正數，扣回誤發堂數填負數；每筆必須記錄原因。
            </p>
            <form
              className="cn-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  await run(
                    {
                      type: "adjust",
                      familyId: actor.familyId,
                      amount: Number(amount),
                      reason: adjustReason,
                    },
                    "家庭堂數已調整，異動原因已記入帳本。",
                  )
                )
                  setAdjustReason("");
              }}
            >
              <label className="cn-field">
                <span>調整堂數</span>
                <input
                  type="number"
                  min="-1000"
                  max="1000"
                  step="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <label className="cn-field">
                <span>補退堂原因</span>
                <textarea
                  required
                  minLength={2}
                  maxLength={200}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="例如：補發活動贈課 4 堂"
                />
              </label>
              <button
                className="cn-primary"
                disabled={
                  busy || !Number(amount) || adjustReason.trim().length < 2
                }
              >
                儲存堂數調整
              </button>
            </form>
            <div className="cn-reset-panel">
              <h3>重新體驗</h3>
              <p>
                只重設課伴的虛構資料，其他作品不受影響。課伴目前的預約與帳本將被清除。
              </p>
              <button className="cn-button" onClick={() => setReset(true)}>
                <RotateCcw size={14} />
                重設示範資料
              </button>
            </div>
          </aside>
        </div>
      ) : (
        <section className="cn-panel">
          <div className="cn-section-title">
            <div>
              <p className="cn-eyebrow">THE SPACE BEHIND EVERY LESSON</p>
              <h2>老師開課管理</h2>
            </div>
            <button className="cn-primary" onClick={() => edit("new")}>
              <Plus size={16} />
              新增時段
            </button>
          </div>
          <div className="cn-admin-toolbar">
            <SelectField
              label="篩選老師"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
            >
              <option value="">所有老師</option>
              {data.teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.english} {t.name}
                </option>
              ))}
            </SelectField>
            <div className="cn-week-nav">
              <button
                aria-label="上一週"
                disabled={offset <= 0}
                onClick={() => setOffset(offset - 1)}
              >
                <ChevronLeft size={17} />
              </button>
              <span>
                {dateText(week, { month: "2-digit", day: "2-digit" })} —{" "}
                {dateText(week + 6 * DAY, { month: "2-digit", day: "2-digit" })}
              </span>
              <button
                aria-label="下一週"
                disabled={offset >= 11}
                onClick={() => setOffset(offset + 1)}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
          <p className="cn-description">
            已有預約或暫留的課程會鎖定編輯。老師停課會取消全部預約、釋放名額，並退回各家庭凍結堂數。
          </p>
          <div className="cn-admin-session-list">
            {classSessions.map((s) => {
              const { course, teacher: t } = details(data, s.id);
              const roster = data.bookings.filter(
                (b) => b.sessionId === s.id && b.status === "confirmed",
              );
              const locked =
                data.bookings.some((b) => b.sessionId === s.id) ||
                data.holds.some((h) => h.sessionId === s.id && h.expires > now);
              return (
                <article className="cn-admin-session" key={s.id}>
                  <div className={`cn-mini-avatar tone-${t.color}`}>
                    {t.english[0]}
                  </div>
                  <div className="cn-booking-copy">
                    <span className="cn-row-eyebrow">
                      {dateText(s.start)} {timeText(s.start)}–{timeText(s.end)}
                    </span>
                    <h3>
                      {course.title} <span>{kindName(course.kind)}</span>
                    </h3>
                    <p>
                      {t.english} {t.name} · 每人 {s.credits} 堂 · 容量{" "}
                      {s.capacity} 人
                    </p>
                    {roster.length > 0 && (
                      <small className="cn-roster">
                        <Users size={12} />
                        {roster
                          .map(
                            (b) =>
                              `${data.families.find((f) => f.id === b.familyId)?.name}・${data.children.find((c) => c.id === b.childId)?.name}`,
                          )
                          .join("、")}
                      </small>
                    )}
                  </div>
                  <div className="cn-admin-session-actions">
                    <span
                      className={`cn-status ${s.cancelled ? "cancelled" : "confirmed"}`}
                    >
                      {s.cancelled
                        ? "已停課"
                        : s.start <= now
                          ? "已開始"
                          : `剩 ${seats(data, s.id, now)} 位`}
                    </span>
                    <div>
                      <button
                        className="cn-button"
                        disabled={
                          busy || locked || s.start <= now || s.cancelled
                        }
                        title={
                          locked
                            ? "已有預約或暫留，不能直接編輯"
                            : "編輯時間、堂數與容量"
                        }
                        onClick={() => edit(s)}
                      >
                        編輯
                      </button>
                      <button
                        className="cn-text-button"
                        disabled={busy || s.start <= now || s.cancelled}
                        onClick={() => {
                          setStop(s);
                          setReason("");
                          setModalError("");
                        }}
                      >
                        停課
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={editor === "new" ? "為老師新增開課時段" : "編輯開課時段"}
        description="老師不能在重疊時間開兩堂課；一對一固定一人，團體課最多 12 人。"
      >
        <form
          className="cn-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const command = {
              type: "save-session" as const,
              sessionId: editor && editor !== "new" ? editor.id : undefined,
              courseId,
              start: new Date(`${start}:00+08:00`).getTime(),
              capacity: Number(capacity),
              credits: Number(credits),
            };
            if (await run(command, "開課時段已儲存。")) setEditor(null);
            else
              setModalError(
                "無法儲存，請確認老師時間是否重疊、課程是否已有預約，以及輸入值範圍。",
              );
          }}
        >
          <SelectField
            label="授課課程"
            disabled={editor !== "new"}
            value={courseId}
            onChange={(e) => {
              setCourse(e.target.value);
              const c = data.courses.find((v) => v.id === e.target.value)!;
              setCapacity(String(c.capacity));
              setCredits(String(c.credits));
            }}
          >
            {data.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {data.teachers.find((t) => t.id === c.teacherId)?.english} ·{" "}
                {c.title}
              </option>
            ))}
          </SelectField>
          <label className="cn-field">
            <span>開課時間（台北）</span>
            <input
              type="datetime-local"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <div className="cn-form-row">
            <label className="cn-field">
              <span>容量（人）</span>
              <input
                type="number"
                required
                min="1"
                max={
                  data.courses.find((c) => c.id === courseId)?.kind ===
                  "individual"
                    ? 1
                    : 12
                }
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </label>
            <label className="cn-field">
              <span>每人扣除堂數</span>
              <input
                type="number"
                required
                min="1"
                max="10"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
              />
            </label>
          </div>
          {modalError && (
            <p className="cn-inline-error" role="alert">
              {modalError}
            </p>
          )}
          <button className="cn-primary" disabled={busy}>
            儲存開課時段
          </button>
        </form>
      </Modal>
      <Modal
        open={Boolean(stop)}
        onClose={() => setStop(null)}
        title="停開這個時段"
        description={
          stop
            ? `${details(data, stop.id).course.title}・${dateText(stop.start)} ${timeText(stop.start)}。所有預約會取消，凍結堂數全數退回。`
            : "請記錄停課原因。"
        }
      >
        <form
          className="cn-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              stop &&
              (await run(
                { type: "stop", sessionId: stop.id, reason },
                "課程已停開，所有家庭的凍結堂數已退回。",
              ))
            )
              setStop(null);
            else
              setModalError("停課未成立，請重新核對時段。所有既有預約仍保留。");
          }}
        >
          <label className="cn-field">
            <span>停課原因</span>
            <textarea
              required
              minLength={2}
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例如：老師請假，安排補課"
            />
          </label>
          {modalError && (
            <p className="cn-inline-error" role="alert">
              {modalError}
            </p>
          )}
          <button
            className="cn-primary"
            disabled={busy || reason.trim().length < 2}
          >
            確認停課並退堂
          </button>
        </form>
      </Modal>
      <ConfirmModal
        open={reset}
        onClose={() => setReset(false)}
        title="重設課伴示範資料？"
        description="將刪除課伴目前的預約、暫留與堂數帳本，重新建立兩個家庭和老師課表。其他作品的資料不受影響。"
        busy={busy}
        onConfirm={async () => {
          if (await run({ type: "reset" }, "課伴示範資料已重設。"))
            setReset(false);
        }}
      />
    </>
  );
}
