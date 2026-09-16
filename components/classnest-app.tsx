"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CircleHelp,
  ClipboardCheck,
  GraduationCap,
  Layers3,
  Settings2,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClassnest } from "@/lib/classnest-store";
import {
  DAY,
  dateKey,
  dateText,
  details,
  monday,
  uid,
  wallet,
} from "@/lib/classnest-domain";
import type { Actor, Command, Role } from "@/lib/classnest-domain";
import { Ledger, Modal, SelectField } from "./classnest-shared";
import ClassnestBooking from "./classnest-booking";
import ClassnestManagement from "./classnest-management";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export default function ClassnestApp({ role = "parent" }: { role?: Role }) {
  const { data, error, busy, refresh, dispatch } = useClassnest();
  const [view, setView] = useState("schedule");
  const [familyId, setFamily] = useState("lin");
  const [teacherId, setTeacher] = useState("emma");
  const [owner, setOwner] = useState("");
  const [now, setNow] = useState(0);
  const [help, setHelp] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const locked = useRef(false);
  useEffect(() => {
    let token = "";
    try {
      token = sessionStorage.getItem("classnest-tab") ?? uid();
      sessionStorage.setItem("classnest-tab", token);
    } catch {
      token = uid();
    }
    // Browser-only identity is hydrated after the static server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOwner(token);
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const actor: Actor = { role, familyId, teacherId, session: owner };
  async function run(command: Command, success: string) {
    if (locked.current) return false;
    locked.current = true;
    setActionError("");
    setNotice("");
    try {
      await dispatch(command, actor, uid());
      setNotice(success);
      return true;
    } catch (e) {
      setActionError((e as Error).message);
      return false;
    } finally {
      locked.current = false;
    }
  }
  const tabs =
    role === "parent"
      ? [
          { id: "schedule", name: "探索課程", icon: CalendarDays },
          { id: "bookings", name: "我的預約", icon: BookOpen },
          { id: "ledger", name: "堂數帳本", icon: Wallet },
        ]
      : role === "teacher"
        ? [{ id: "schedule", name: "課表與點名", icon: ClipboardCheck }]
        : [
            { id: "schedule", name: "課程管理", icon: CalendarDays },
            { id: "bookings", name: "預約總覽", icon: BookOpen },
            { id: "ledger", name: "堂數與設定", icon: Settings2 },
          ];
  const balance = data
    ? wallet(data, familyId)
    : { available: 0, frozen: 0, spent: 0 };
  const weekLessons =
    data?.bookings.filter(
      (b) =>
        b.status === "confirmed" &&
        (role === "teacher"
          ? details(data, b.sessionId).teacher.id === teacherId
          : role === "admin" || b.familyId === familyId) &&
        details(data, b.sessionId).session.start >= monday(now) &&
        details(data, b.sessionId).session.start < monday(now) + 7 * DAY,
    ).length ?? 0;
  const changeView = (value: string) => {
    setView(value);
    setNotice("");
  };
  return (
    <main className="cn-app">
      <aside className="cn-sidebar">
        <a className="cn-logo" href={`${base}/classnest/`}>
          <span>
            <Layers3 />
          </span>
          ClassNest<small>課伴</small>
        </a>
        <p className="cn-eyebrow">A LITTLE EVERY DAY</p>
        <nav aria-label="課伴主導覽">
          {tabs.map((t) => (
            <button
              key={t.id}
              disabled={!data || !owner}
              className={view === t.id ? "active" : ""}
              aria-current={view === t.id ? "page" : undefined}
              onClick={() => changeView(t.id)}
            >
              <t.icon size={19} />
              {t.name}
            </button>
          ))}
        </nav>
        <div className="cn-side-note">
          <Sparkles size={25} />
          <h3>
            小小的累積，
            <br />
            大大的成長。
          </h3>
          <p>
            找到合拍的老師，
            <br />
            讓每一次學習都有期待。
          </p>
          <span className="cn-note-orbit" aria-hidden="true">
            ✳
          </span>
        </div>
        <div className="cn-sidebar-bottom">
          <p>留一點時間，給成長。</p>
          <a className="cn-back" href={`${base}/#work`}>
            回到作品集 <ArrowUpRight size={15} />
          </a>
        </div>
      </aside>
      <div className="cn-main">
        <header className="cn-topbar">
          <span className="cn-top-label">
            {role === "parent"
              ? "家長空間"
              : role === "teacher"
                ? "老師空間"
                : "教務管理"}
            <span className="cn-muted">
              {" "}
              / {tabs.find((t) => t.id === view)?.name}
            </span>
          </span>
          <div>
            <span className="cn-demo">
              <span />
              互動展示・本機資料
            </span>
            <button
              className="cn-icon-button"
              aria-label="展示說明"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={19} />
            </button>
            <select
              className="cn-role-select"
              aria-label="切換示範身分"
              disabled={!owner}
              value={role}
              onChange={(e) => {
                window.location.href = `${base}/classnest/${e.target.value === "parent" ? "" : e.target.value + "/"}`;
              }}
            >
              <option value="parent">家長端</option>
              <option value="teacher">老師端</option>
              <option value="admin">管理端</option>
            </select>
          </div>
        </header>
        <div className="cn-body">
          <div className="cn-heading">
            <div>
              <p className="cn-eyebrow">
                {role === "parent"
                  ? "MAKE ROOM FOR GROWTH"
                  : role === "teacher"
                    ? "A GOOD LESSON STARTS WITH YOU"
                    : "A LITTLE CLARITY, EVERY DAY"}
              </p>
              <h1>
                {role === "parent"
                  ? "把學習，排進美好日常"
                  : role === "teacher"
                    ? "每一次陪伴，都有回響"
                    : "讓教學的日常，井然有序"}
                <span>✳</span>
              </h1>
              <p>
                {role === "parent"
                  ? "選一位合拍的老師，為孩子留下一段專注的時光。"
                  : role === "teacher"
                    ? "查看每週安排，記錄孩子的出席與每一堂進步。"
                    : "從老師時段到家庭堂數，照顧每一次預約的細節。"}
              </p>
            </div>
            <span className="cn-pill">
              <GraduationCap size={16} />
              {now
                ? dateText(now, { year: "numeric", month: "long" })
                : "學習計畫"}
            </span>
          </div>
          <div className="cn-identity">
            {data &&
              (role === "teacher" ? (
                <SelectField
                  label="授課老師"
                  value={teacherId}
                  onChange={(e) => setTeacher(e.target.value)}
                >
                  {data.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.english} {t.name}・{t.subject}
                    </option>
                  ))}
                </SelectField>
              ) : (
                <SelectField
                  label="示範家庭"
                  value={familyId}
                  onChange={(e) => {
                    setFamily(e.target.value);
                    setNotice("");
                  }}
                >
                  {data.families.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}・家庭共用堂數
                    </option>
                  ))}
                </SelectField>
              ))}
            <span className="cn-save-status">
              {busy ? "儲存中…" : data ? "● 已存於本機" : "正在準備學習空間…"}
            </span>
          </div>
          <section className="cn-stats" aria-label="堂數摘要">
            <div>
              <span>{role === "teacher" ? "本週安排" : "可用堂數"}</span>
              <strong data-testid="available-credits">
                {role === "teacher" ? weekLessons : balance.available}
                <small>{role === "teacher" ? "筆預約" : "堂"}</small>
              </strong>
              <p>
                {role === "teacher"
                  ? "每一次相遇，都值得用心"
                  : "讓好奇心繼續發芽"}
              </p>
              <Wallet className="cn-stat-icon" size={47} />
            </div>
            <div>
              <span>{role === "teacher" ? "待完成點名" : "已預約凍結"}</span>
              <strong data-testid="frozen-credits">
                {role === "teacher"
                  ? (data?.bookings.filter(
                      (b) =>
                        b.status === "confirmed" &&
                        details(data, b.sessionId).teacher.id === teacherId &&
                        details(data, b.sessionId).session.end <= now,
                    ).length ?? 0)
                  : balance.frozen}
                <small>{role === "teacher" ? "筆" : "堂"}</small>
              </strong>
              <p>完成上課後才正式扣除</p>
              <BookOpen className="cn-stat-icon" size={44} />
            </div>
            <div>
              <span>{role === "teacher" ? "已完成點名" : "已上課扣除"}</span>
              <strong data-testid="spent-credits">
                {role === "teacher"
                  ? (data?.bookings.filter(
                      (b) =>
                        ["attended", "absent"].includes(b.status) &&
                        details(data, b.sessionId).teacher.id === teacherId,
                    ).length ?? 0)
                  : balance.spent}
                <small>{role === "teacher" ? "筆" : "堂"}</small>
              </strong>
              <p>
                {role === "teacher"
                  ? "每一堂學習都有紀錄"
                  : `本週另有 ${weekLessons} 堂學習計畫`}
              </p>
              <Sparkles className="cn-stat-icon" size={44} />
            </div>
          </section>
          <Tabs
            value={view}
            onValueChange={changeView}
            className="cn-mobile-tabs"
          >
            <TabsList aria-label="課伴行動導覽">
              {tabs.map((t) => (
                <TabsTrigger key={t.id} value={t.id} disabled={!data || !owner}>
                  <t.icon size={15} />
                  {t.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {(actionError || error) && (
            <div className="cn-alert" role="alert">
              <span>{actionError || error}</span>
              <button
                onClick={() => {
                  setActionError("");
                  void refresh();
                }}
              >
                重新讀取
              </button>
            </div>
          )}
          {notice && (
            <div className="cn-success" role="status">
              <span>{notice}</span>
              <button aria-label="關閉操作提示" onClick={() => setNotice("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {data && owner && now ? (
            role === "parent" ? (
              view === "ledger" ? (
                <Ledger data={data} familyId={familyId} />
              ) : (
                <ClassnestBooking
                  key={familyId}
                  data={data}
                  actor={actor}
                  now={now}
                  busy={busy}
                  run={run}
                  view={view}
                  onView={changeView}
                />
              )
            ) : (
              <ClassnestManagement
                data={data}
                actor={actor}
                now={now}
                busy={busy}
                run={run}
                view={view}
              />
            )
          ) : (
            <div className="cn-panel cn-loading">
              <Layers3 size={32} />
              <p>正在載入課表與本機資料…</p>
              {role === "admin" && error && (
                <button
                  className="cn-button"
                  onClick={() => {
                    if (window.confirm("重設會清除課伴展示資料。確定重設？"))
                      void run({ type: "reset" }, "展示資料已重設。");
                  }}
                >
                  重設課伴展示
                </button>
              )}
            </div>
          )}
          <footer className="cn-footnote">
            <span>
              CLASSNEST 課伴 · {now ? dateKey(now).slice(0, 4) : "2026"}
            </span>
            <span>虛構資料・僅目前瀏覽器保存・台北時間</span>
            <a href={`${base}/#work`}>Yorke Hsu 作品集 ↗</a>
          </footer>
        </div>
      </div>
      <Modal
        open={help}
        onClose={() => setHelp(false)}
        title="給學習留一個位子"
        description="ClassNest 是可完整操作的課程預訂作品，所有家庭與老師均為虛構示範。"
      >
        <div className="cn-help-copy">
          <p>
            <strong>選課 → 暫留 → 確認 → 上課扣堂</strong>
          </p>
          <p>
            時段保留 10
            分鐘；確認後凍結家庭堂數，課程結束並由老師點名才扣除。開課前至少 24
            小時可以取消或改期。
          </p>
          <p>
            右上角可切換家長、老師及管理員。老師端有一堂待點名課程；管理端可開課、停課、補堂與重設資料。
          </p>
          <p>
            這是本機展示，示範身分並非正式登入。同一瀏覽器分頁會同步；不同裝置不共用資料，沒有真實付款或對外通知。
          </p>
          <div className="cn-help-tech">
            <span>React / TypeScript</span>
            <span>交易與狀態轉換</span>
            <span>IndexedDB / 跨分頁同步</span>
            <span>端到端流程驗證</span>
          </div>
          <small>
            需求參考：TK26082812OCYG11。概念作品，非該案件的已交付客戶專案。
          </small>
        </div>
      </Modal>
    </main>
  );
}
