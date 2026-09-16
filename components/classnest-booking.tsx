"use client";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Repeat2,
  Search,
  Users,
  X,
} from "lucide-react";
import {
  DAY,
  CUTOFF,
  dateKey,
  dateText,
  details,
  kindName,
  monday,
  seats,
  seriesPreview,
  slotIssue,
  statusName,
  timeText,
  wallet,
} from "@/lib/classnest-domain";
import type { Booking, Session, Teacher } from "@/lib/classnest-domain";
import {
  ConfirmModal,
  ExportButton,
  Modal,
  SelectField,
  exportBookings,
} from "./classnest-shared";
import type { NestUI } from "./classnest-shared";

export default function ClassnestBooking({
  data,
  actor,
  now,
  busy,
  run,
  view,
  onView,
}: NestUI & { view: string; onView: (view: string) => void }) {
  const [childId, setChild] = useState(
    data.children.find((c) => c.familyId === actor.familyId)!.id,
  );
  const [subject, setSubject] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [kind, setKind] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [dayIndex, setDayIndex] = useState(
    Math.floor((now - monday(now)) / DAY),
  );
  const [profile, setProfile] = useState<Teacher | null>(null);
  const [series, setSeries] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [modalError, setModalError] = useState("");
  const [cancel, setCancel] = useState<Booking | null>(null);
  const [reschedule, setReschedule] = useState<Booking | null>(null);
  const [newSession, setNewSession] = useState("");
  const [bookFilter, setBookFilter] = useState("upcoming");
  const [search, setSearch] = useState("");
  const week = monday(now) + weekOffset * 7 * DAY;
  const days = Array.from({ length: 7 }, (_, i) => week + i * DAY);
  const holds = data.holds.filter(
    (h) =>
      h.owner === actor.session &&
      h.familyId === actor.familyId &&
      h.expires > now,
  );
  const holdCost = holds.reduce(
    (n, h) => n + details(data, h.sessionId).session.credits,
    0,
  );
  const balance = wallet(data, actor.familyId);
  const visibleSessions = data.sessions
    .filter(
      (s) =>
        s.start >= week &&
        s.start < week + 7 * DAY &&
        !s.cancelled &&
        s.start > now,
    )
    .filter((s) => {
      const d = details(data, s.id);
      return (
        (!subject || d.teacher.subject === subject) &&
        (!teacherFilter || d.teacher.id === teacherFilter) &&
        (!kind || d.course.kind === kind)
      );
    })
    .sort((a, b) => a.start - b.start);
  const preview = series
    ? seriesPreview(data, series, childId, weeks, now)
    : [];
  const included = preview.filter((s) => !excluded.includes(s.id));
  const pendingBookings = data.bookings
    .filter((b) => b.familyId === actor.familyId)
    .filter(
      (b) =>
        bookFilter === "all" ||
        (bookFilter === "upcoming"
          ? b.status === "confirmed"
          : b.status !== "confirmed"),
    )
    .filter((b) => {
      const d = details(data, b.sessionId);
      return `${d.course.title}${d.teacher.name}${data.children.find((c) => c.id === b.childId)?.name}${b.id}`.includes(
        search.trim(),
      );
    })
    .sort(
      (a, b) =>
        details(data, a.sessionId).session.start -
        details(data, b.sessionId).session.start,
    );
  const changeWeek = (offset: number) => {
    setWeekOffset(offset);
    setDayIndex(offset === 0 ? Math.floor((now - monday(now)) / DAY) : 0);
  };
  function courseCard(s: Session) {
    const { course, teacher } = details(data, s.id);
    const mine = holds.find(
      (h) => h.sessionId === s.id && h.childId === childId,
    );
    const issue = slotIssue(data, s.id, childId, now);
    const remaining = seats(data, s.id, now);
    return (
      <article
        key={s.id}
        className={`cn-course tone-${teacher.color}${mine ? " is-held" : ""}`}
        data-session-id={s.id}
      >
        <div className="cn-course-label">
          <span className="cn-course-kind">{kindName(course.kind)}</span>
          <span className="cn-credit-tag">{s.credits} 堂</span>
        </div>
        <p className="cn-course-time">
          <Clock3 size={12} />
          {timeText(s.start)}–{timeText(s.end)}
        </p>
        <h3>{course.title}</h3>
        <button
          className="cn-course-teacher"
          onClick={() => setProfile(teacher)}
          aria-label={`認識 ${teacher.english} ${teacher.name}`}
        >
          {teacher.english} {teacher.name} ↗
        </button>
        <div className="cn-course-bottom">
          <span>
            <Users size={12} />
            {mine
              ? "已為你保留"
              : remaining > 0
                ? `剩 ${remaining}/${s.capacity} 位`
                : "已額滿"}
          </span>
          <button
            disabled={busy || (!mine && Boolean(issue))}
            title={mine ? "移除暫留" : issue || "保留 10 分鐘"}
            aria-label={`${mine ? "移除" : "保留"} ${course.title} ${dateKey(s.start)} ${timeText(s.start)}`}
            onClick={() =>
              void run(
                mine
                  ? { type: "release", holdId: mine.id }
                  : { type: "hold", sessionIds: [s.id], childId },
                mine ? "已釋放暫留時段。" : "時段已保留 10 分鐘，尚未扣堂。",
              )
            }
          >
            {mine ? <Check size={15} /> : <Plus size={15} />}
          </button>
        </div>
        {issue && !mine && remaining > 0 && (
          <small className="cn-conflict">課表衝突</small>
        )}
        <button
          className="cn-repeat"
          disabled={busy}
          onClick={() => {
            setSeries(s.id);
            setWeeks(4);
            setExcluded([]);
            setModalError("");
          }}
        >
          <Repeat2 size={11} />
          連續週次
        </button>
      </article>
    );
  }
  return (
    <>
      {view === "schedule" ? (
        <>
          <div className="cn-workspace">
            <section className="cn-panel cn-calendar-panel">
              <div className="cn-section-title">
                <div>
                  <p className="cn-eyebrow">YOUR WEEK, YOUR PACE</p>
                  <h2>探索本週課程</h2>
                </div>
                <div className="cn-week-nav">
                  <button
                    aria-label="上一週"
                    disabled={weekOffset <= 0}
                    onClick={() => changeWeek(weekOffset - 1)}
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <span>
                    {dateText(week, { month: "2-digit", day: "2-digit" })} —{" "}
                    {dateText(week + 6 * DAY, {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </span>
                  <button
                    aria-label="下一週"
                    disabled={weekOffset >= 11}
                    onClick={() => changeWeek(weekOffset + 1)}
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
              <div className="cn-booking-filters">
                <SelectField
                  label="為誰預約"
                  value={childId}
                  onChange={(e) => setChild(e.target.value)}
                >
                  {data.children
                    .filter((c) => c.familyId === actor.familyId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}・{c.age} 歲
                      </option>
                    ))}
                </SelectField>
                <SelectField
                  label="老師"
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                >
                  <option value="">所有老師</option>
                  {data.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.english} {t.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="課程型態"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                >
                  <option value="">全部型態</option>
                  <option value="individual">一對一</option>
                  <option value="group">小班團體</option>
                </SelectField>
              </div>
              <div className="cn-filter-line">
                <div className="cn-filters" aria-label="科目篩選">
                  {["", "英文", "數學", "音樂"].map((v) => (
                    <button
                      key={v}
                      aria-pressed={subject === v}
                      className={subject === v ? "active" : ""}
                      onClick={() => setSubject(v)}
                    >
                      {v || "全部課程"}
                    </button>
                  ))}
                </div>
                <span>{visibleSessions.length} 個時段</span>
              </div>
              <div className="cn-day-picker" aria-label="日期篩選">
                {days.map((d, i) => (
                  <button
                    key={d}
                    className={dayIndex === i ? "active" : ""}
                    aria-pressed={dayIndex === i}
                    onClick={() => setDayIndex(i)}
                  >
                    <span>{dateText(d, { weekday: "short" })}</span>
                    <strong>{Number(dateKey(d).slice(8))}</strong>
                    {dateKey(d) === dateKey(now) && <small>今天</small>}
                  </button>
                ))}
              </div>
              <div className="cn-calendar-scroll">
                <div className="cn-week-grid">
                  {days.map((day, i) => (
                    <div
                      key={day}
                      className={`cn-day-column${dayIndex === i ? " selected-day" : ""}`}
                    >
                      <div
                        className={`cn-day-heading${dateKey(day) === dateKey(now) ? " is-today" : ""}`}
                      >
                        <span>{dateText(day, { weekday: "short" })}</span>
                        <strong>{Number(dateKey(day).slice(8))}</strong>
                      </div>
                      {visibleSessions
                        .filter((s) => dateKey(s.start) === dateKey(day))
                        .map(courseCard)}
                      {!visibleSessions.some(
                        (s) => dateKey(s.start) === dateKey(day),
                      ) && (
                        <p className="cn-day-empty">
                          {day < now - DAY ? "已結束" : "沒有符合的課程"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="cn-calendar-legend">
                <span>
                  <i />
                  英文
                </span>
                <span>
                  <i />
                  數學
                </span>
                <span>
                  <i />
                  音樂
                </span>
                <small>台北時間 · 名額含暫留</small>
              </div>
            </section>
            <aside className="cn-basket" id="classnest-basket">
              <span className="cn-eyebrow">A PLAN TO LOOK FORWARD TO</span>
              <div className="cn-basket-heading">
                <h2>你的預約清單</h2>
                <span>{holds.length}</span>
              </div>
              {!holds.length ? (
                <div className="cn-empty">
                  <CalendarDays size={37} />
                  <h3>為好奇心留個位子</h3>
                  <p>
                    點選課程的 ＋，
                    <br />
                    一次安排多位老師與時段。
                  </p>
                </div>
              ) : (
                <div className="cn-holds">
                  {holds.map((h) => {
                    const d = details(data, h.sessionId);
                    const seconds = Math.max(
                      0,
                      Math.min(600, Math.ceil((h.expires - now) / 1000)),
                    );
                    return (
                      <div
                        className={`cn-hold tone-${d.teacher.color}`}
                        key={h.id}
                      >
                        <div>
                          <span>
                            {
                              data.children.find((c) => c.id === h.childId)
                                ?.name
                            }{" "}
                            · {d.teacher.subject}
                          </span>
                          <button
                            aria-label={`移除清單 ${d.course.title} ${dateKey(d.session.start)}`}
                            disabled={busy}
                            onClick={() =>
                              void run(
                                { type: "release", holdId: h.id },
                                "已釋放暫留時段。",
                              )
                            }
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <h3>{d.course.title}</h3>
                        <p>
                          {dateText(d.session.start)}{" "}
                          {timeText(d.session.start)}
                        </p>
                        <div>
                          <span>
                            {d.teacher.english} · {d.session.credits} 堂
                          </span>
                          <strong>
                            <Clock3 size={11} />
                            {Math.floor(seconds / 60)}:
                            {String(seconds % 60).padStart(2, "0")}
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {holds.length > 0 && (
                <>
                  <div className="cn-basket-total">
                    <span>本次凍結</span>
                    <strong>
                      {holdCost}
                      <small> 堂</small>
                    </strong>
                  </div>
                  <div className="cn-basket-remaining">
                    <span>預約後可用</span>
                    <strong>{balance.available - holdCost} 堂</strong>
                  </div>
                  {holdCost > balance.available && (
                    <p className="cn-inline-error">
                      可用堂數不足，請移除部分課程。
                    </p>
                  )}
                  <button
                    className="cn-primary cn-confirm-booking"
                    disabled={busy || holdCost > balance.available}
                    onClick={() =>
                      void run(
                        { type: "confirm", holdIds: holds.map((h) => h.id) },
                        `已確認 ${holds.length} 堂課，凍結 ${holdCost} 堂；上課後才扣除。`,
                      )
                    }
                  >
                    確認預約 <ArrowRight size={16} />
                  </button>
                </>
              )}
              <div className="cn-rule">
                <Clock3 size={16} />
                <p>
                  時段暫留 10 分鐘
                  <br />
                  <span>確認預約才會凍結堂數</span>
                </p>
              </div>
              <p className="cn-basket-policy">
                開課前至少 24 小時可取消或改期。
                <br />
                團體課為每位孩子各保留一個名額。
              </p>
              <button
                className="cn-text-button"
                onClick={() => onView("bookings")}
              >
                查看我的預約 <ArrowRight size={13} />
              </button>
            </aside>
          </div>
          <section className="cn-teacher-section">
            <div className="cn-section-title">
              <div>
                <p className="cn-eyebrow">PEOPLE WHO MAKE A DIFFERENCE</p>
                <h2>陪伴好奇心的老師</h2>
              </div>
              <span className="cn-muted">6 位老師 · 3 種探索</span>
            </div>
            <div className="cn-teacher-grid">
              {data.teachers.map((t) => (
                <button
                  key={t.id}
                  className={`cn-teacher-card tone-${t.color}`}
                  onClick={() => setProfile(t)}
                >
                  <span className="cn-avatar">
                    {t.english.slice(0, 1)}
                    <i />
                  </span>
                  <div>
                    <h3>
                      {t.english} <small>{t.name}</small>
                    </h3>
                    <p>{t.specialty}</p>
                    <span>
                      {t.subject} <ArrowRight size={12} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
          {holds.length > 0 && (
            <div className="cn-mobile-basket">
              <div>
                <strong>{holds.length} 堂課</strong>
                <span>需凍結 {holdCost} 堂</span>
              </div>
              <a href="#classnest-basket">
                查看預約清單 <ArrowRight size={15} />
              </a>
            </div>
          )}
        </>
      ) : (
        <section className="cn-panel">
          <div className="cn-section-title">
            <div>
              <p className="cn-eyebrow">YOUR LEARNING JOURNEY</p>
              <h2>我的預約</h2>
            </div>
            <ExportButton
              onClick={() => exportBookings(data, actor.familyId)}
            />
          </div>
          <div className="cn-list-filters">
            <div className="cn-filters">
              {[
                ["upcoming", "已預約"],
                ["history", "歷史紀錄"],
                ["all", "全部"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={bookFilter === id ? "active" : ""}
                  aria-pressed={bookFilter === id}
                  onClick={() => setBookFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="cn-search">
              <Search size={16} />
              <input
                aria-label="搜尋預約"
                placeholder="課程、老師或孩子"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          <div className="cn-booking-list">
            {pendingBookings.map((b) => {
              const d = details(data, b.sessionId);
              const canChange =
                b.status === "confirmed" && d.session.start - now >= CUTOFF;
              return (
                <article
                  className="cn-booking-row"
                  key={b.id}
                  data-booking-id={b.id}
                >
                  <div className={`cn-date-tile tone-${d.teacher.color}`}>
                    <small>
                      {dateText(d.session.start, { month: "short" })}
                    </small>
                    <strong>
                      {dateText(d.session.start, { day: "numeric" })}
                    </strong>
                    <span>
                      {dateText(d.session.start, { weekday: "short" })}
                    </span>
                  </div>
                  <div className="cn-booking-copy">
                    <span className="cn-row-eyebrow">
                      {data.children.find((c) => c.id === b.childId)?.name} ·{" "}
                      {kindName(d.course.kind)} · {b.credits} 堂
                    </span>
                    <h3>{d.course.title}</h3>
                    <p>
                      {timeText(d.session.start)}–{timeText(d.session.end)}　
                      {d.teacher.english} {d.teacher.name}
                    </p>
                    <small>
                      #{b.id.slice(0, 8)} {b.note && `· ${b.note}`}
                    </small>
                  </div>
                  <div className="cn-booking-actions">
                    <span className={`cn-status ${b.status}`}>
                      {statusName[b.status]}
                    </span>
                    {canChange ? (
                      <div>
                        <button
                          className="cn-button"
                          disabled={busy}
                          onClick={() => {
                            setReschedule(b);
                            setNewSession("");
                            setModalError("");
                          }}
                        >
                          改期
                        </button>
                        <button
                          className="cn-text-button"
                          disabled={busy}
                          onClick={() => setCancel(b)}
                        >
                          取消預約
                        </button>
                      </div>
                    ) : (
                      b.status === "confirmed" && (
                        <small>
                          {d.session.end <= now
                            ? "待老師點名"
                            : "24 小時內請聯絡教務"}
                        </small>
                      )
                    )}
                  </div>
                </article>
              );
            })}
            {!pendingBookings.length && (
              <div className="cn-empty">
                <BookEmpty />
                <h3>這裡還沒有符合的預約</h3>
                <p>換個搜尋條件，或到課表挑選喜歡的課程。</p>
                <button
                  className="cn-button"
                  onClick={() => onView("schedule")}
                >
                  去探索課程
                </button>
              </div>
            )}
          </div>
        </section>
      )}
      <Modal
        open={Boolean(profile)}
        onClose={() => setProfile(null)}
        title={profile ? `${profile.english} ${profile.name}` : "認識老師"}
        description={
          profile ? `${profile.subject}老師 · ${profile.specialty}` : "老師介紹"
        }
      >
        {profile && (
          <div className="cn-profile">
            <div
              className={`cn-profile-art tone-${profile.color}`}
              aria-hidden="true"
            >
              <span>{profile.english[0]}</span>
              <i>✳</i>
            </div>
            <h3>從喜歡的事開始，把學習變成日常。</h3>
            <p>{profile.intro}</p>
            <p className="cn-description">
              {data.courses
                .filter((c) => c.teacherId === profile.id)
                .map(
                  (c) =>
                    `${kindName(c.kind)} · ${c.duration} 分鐘 · 每次 ${c.credits} 堂`,
                )
                .join(" / ")}
            </p>
            <button
              className="cn-primary"
              onClick={() => {
                setTeacherFilter(profile.id);
                setSubject("");
                setKind("");
                onView("schedule");
                setProfile(null);
              }}
            >
              查看老師時段 <ArrowRight size={16} />
            </button>
            <small>老師姓名與介紹為虛構示範。</small>
          </div>
        )}
      </Modal>
      <Modal
        open={Boolean(series)}
        onClose={() => setSeries("")}
        title="把喜歡的課，排成每週日常"
        description="逐堂核對後再保留。若有衝突，請取消勾選該堂；系統不會自動跳過。"
      >
        <SelectField
          label="連續週次"
          value={String(weeks)}
          onChange={(e) => {
            setWeeks(Number(e.target.value));
            setExcluded([]);
          }}
        >
          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>
              連續 {n} 週
            </option>
          ))}
        </SelectField>
        <div className="cn-series-list">
          {preview.map((p) => (
            <label key={p.id} className={p.issue ? "has-conflict" : ""}>
              <input
                type="checkbox"
                checked={!excluded.includes(p.id)}
                onChange={(e) =>
                  setExcluded(
                    e.target.checked
                      ? excluded.filter((id) => id !== p.id)
                      : [...excluded, p.id],
                  )
                }
              />
              <div>
                <strong>
                  {dateText(p.start)} {timeText(p.start)}
                </strong>
                <small>
                  {p.issue ||
                    `${details(data, p.id).course.title} · ${details(data, p.id).session.credits} 堂`}
                </small>
              </div>
              <span>{p.issue ? "需處理" : "可預約"}</span>
            </label>
          ))}
        </div>
        <p className="cn-description">
          已選 {included.length} 堂課 · 共需{" "}
          {included
            .filter((p) => !p.id.startsWith("missing-"))
            .reduce((n, p) => n + details(data, p.id).session.credits, 0)}{" "}
          堂。暫留階段不扣堂數。
        </p>
        {modalError && (
          <p className="cn-inline-error" role="alert">
            {modalError}
          </p>
        )}
        <button
          className="cn-primary"
          disabled={
            busy || !included.length || included.some((p) => Boolean(p.issue))
          }
          onClick={async () => {
            if (
              await run(
                {
                  type: "hold",
                  sessionIds: included.map((p) => p.id),
                  childId,
                },
                `已保留 ${included.length} 個時段，請在 10 分鐘內確認。`,
              )
            )
              setSeries("");
            else
              setModalError("時段狀態已變動，請重新核對清單；本批次沒有成立。");
          }}
        >
          保留所選 {included.length} 個時段 <ArrowRight size={16} />
        </button>
      </Modal>
      <ConfirmModal
        open={Boolean(cancel)}
        onClose={() => setCancel(null)}
        title="取消這堂課？"
        description={
          cancel
            ? `取消後退回 ${cancel.credits} 堂凍結堂數，名額將重新開放。`
            : ""
        }
        busy={busy}
        onConfirm={async () => {
          if (
            cancel &&
            (await run(
              { type: "cancel", bookingId: cancel.id },
              "預約已取消，凍結堂數已退回。",
            ))
          )
            setCancel(null);
        }}
      />
      <Modal
        open={Boolean(reschedule)}
        onClose={() => setReschedule(null)}
        title="找一個更合適的時間"
        description="新時段確認成功才釋放原預約；若名額或堂數不足，原課程保持不變。"
      >
        {reschedule && (
          <>
            <p className="cn-description">
              原課：{details(data, reschedule.sessionId).course.title} ·{" "}
              {dateText(details(data, reschedule.sessionId).session.start)}{" "}
              {timeText(details(data, reschedule.sessionId).session.start)}
            </p>
            <SelectField
              label="改期至"
              value={newSession}
              onChange={(e) => setNewSession(e.target.value)}
            >
              <option value="">請選擇新時段</option>
              {data.sessions
                .filter(
                  (s) =>
                    s.courseId ===
                      details(data, reschedule.sessionId).course.id &&
                    s.id !== reschedule.sessionId &&
                    s.start > now &&
                    !s.cancelled,
                )
                .sort((a, b) => a.start - b.start)
                .map((s) => {
                  const issue = slotIssue(
                    data,
                    s.id,
                    reschedule.childId,
                    now,
                    reschedule.id,
                  );
                  return (
                    <option key={s.id} value={s.id} disabled={Boolean(issue)}>
                      {dateText(s.start)} {timeText(s.start)} · {s.credits} 堂
                      {issue ? `（${issue}）` : ""}
                    </option>
                  );
                })}
            </SelectField>
            {modalError && (
              <p className="cn-inline-error" role="alert">
                {modalError}
              </p>
            )}
            <button
              className="cn-primary"
              disabled={busy || !newSession}
              onClick={async () => {
                if (
                  await run(
                    {
                      type: "reschedule",
                      bookingId: reschedule.id,
                      sessionId: newSession,
                    },
                    "改期成功，原課程已釋放，新時段已確認。",
                  )
                )
                  setReschedule(null);
                else
                  setModalError(
                    "改期未成立，原預約仍然保留。請重新選擇可用時段。",
                  );
              }}
            >
              確認改期 <ArrowRight size={16} />
            </button>
          </>
        )}
      </Modal>
    </>
  );
}
function BookEmpty() {
  return <CalendarDays size={35} />;
}
