"use client";
import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Box,
  Check,
  CheckCheck,
  CircleAlert,
  GripVertical,
  Search,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CLASSES,
  issuesFor,
  ProjectData,
  SCENES,
  TaskStatus,
} from "@/lib/vector-model";

export type Section = "workspace" | "tasks" | "analytics" | "quality" | "logs";
export const SECTION_LABELS = {
  workspace: ["3D 標註工作台", "Annotation workspace"],
  tasks: ["資料生產任務", "Production queue"],
  analytics: ["生產分析", "Dataset overview"],
  quality: ["品質檢查", "Quality assurance"],
  logs: ["操作日誌", "Activity log"],
};
const STATUS_LABELS: Record<TaskStatus, string> = {
  queued: "待處理",
  active: "標註中",
  review: "待覆核",
  done: "已完成",
};
type Props = {
  section: Section;
  project: ProjectData;
  role: string;
  onOpen: (scene: string, id?: string) => void;
  onStatus: (id: string, status: TaskStatus) => void;
  onReorder: (from: string, to: string) => void;
  onReview: (scene: string, ids: string[]) => void;
};

export function VectorPanels({
  section,
  project,
  role,
  onOpen,
  onStatus,
  onReorder,
  onReview,
}: Props) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dragId, setDragId] = useState("");
  const all = Object.values(project.annotations).flat();
  const reviewed = all.filter((a) => a.reviewed).length;
  const issues = SCENES.flatMap((s) =>
    issuesFor(project.annotations[s.id]).map((i) => ({ ...i, scene: s })),
  );
  const ratio = all.length ? Math.round((reviewed / all.length) * 100) : 0;
  const metrics = (
    <div className="vx-metrics">
      <article>
        <span>
          <Box size={14} />
          標註物件
        </span>
        <strong>
          {all.length}
          <small>個</small>
        </strong>
        <p>3 組合成城市場景</p>
      </article>
      <article>
        <span>
          <CheckCheck size={14} />
          已完成覆核
        </span>
        <strong>
          {reviewed}
          <small>/ {all.length}</small>
        </strong>
        <p>
          <i className="vx-live-dot" />
          已由人工確認的物件
        </p>
      </article>
      <article>
        <span>
          <ShieldCheck size={14} />
          覆核完成率
        </span>
        <strong>
          {ratio}
          <small>%</small>
        </strong>
        <p>依目前標註即時計算</p>
      </article>
      <article>
        <span>
          <CircleAlert size={14} />
          待處理項目
        </span>
        <strong>
          {issues.length}
          <small>項</small>
        </strong>
        <p>低信心值、遮擋或未覆核</p>
      </article>
    </div>
  );
  if (section === "tasks")
    return (
      <section className="vx-data-page">
        <div className="vx-page-intro">
          <div>
            <span className="vx-eyebrow">DATA OPERATIONS</span>
            <h2>讓每一段場景，走到完成。</h2>
            <p>安排優先順序，追蹤從標註到覆核的進度。</p>
          </div>
          <span className="vx-page-count">
            03<span>SCENES</span>
          </span>
        </div>
        {metrics}
        <div className="vx-data-card">
          <div className="vx-card-title">
            <h3>
              任務佇列 <span>3</span>
            </h3>
            <div className="vx-filter-group">
              {["all", "active", "review", "done"].map((v) => (
                <button
                  key={v}
                  className={filter === v ? "active" : ""}
                  onClick={() => setFilter(v)}
                >
                  {v === "all" ? "全部" : STATUS_LABELS[v as TaskStatus]}
                </button>
              ))}
            </div>
          </div>
          <Table className="vx-table">
            <TableHeader>
              <TableRow>
                <TableHead>順序</TableHead>
                <TableHead>場景 / 任務</TableHead>
                <TableHead>負責人</TableHead>
                <TableHead>覆核進度</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.tasks
                .filter((t) => filter === "all" || t.status === filter)
                .map((t) => {
                  const index = project.tasks.findIndex((v) => v.id === t.id);
                  const a = project.annotations[t.id];
                  const n = a.filter((v) => v.reviewed).length;
                  return (
                    <TableRow
                      key={t.id}
                      draggable={role !== "viewer"}
                      onDragStart={(e) => {
                        setDragId(t.id);
                        e.dataTransfer.setData("text/plain", t.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        onReorder(dragId, t.id);
                        setDragId("");
                      }}
                    >
                      <TableCell>
                        <div className="vx-order-cell">
                          <GripVertical size={15} />
                          <b>{String(index + 1).padStart(2, "0")}</b>
                          <div>
                            <button
                              aria-label={`上移 ${t.id}`}
                              disabled={index === 0 || role === "viewer"}
                              onClick={() =>
                                onReorder(t.id, project.tasks[index - 1].id)
                              }
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              aria-label={`下移 ${t.id}`}
                              disabled={
                                index === project.tasks.length - 1 ||
                                role === "viewer"
                              }
                              onClick={() =>
                                onReorder(t.id, project.tasks[index + 1].id)
                              }
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <b>{t.name}</b>
                        <small>
                          {t.id.toUpperCase()} · {t.frames} FRAMES
                        </small>
                      </TableCell>
                      <TableCell>
                        <span className="vx-person">
                          <i>
                            {t.owner
                              .split(" ")
                              .map((s) => s[0])
                              .join("")}
                          </i>
                          {t.owner}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span>
                          {n} / {a.length} 個物件
                        </span>
                        <div className="vx-progress">
                          <i
                            style={{
                              width: `${a.length ? (n / a.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <select
                          aria-label={`${t.id} 任務狀態`}
                          disabled={role === "viewer"}
                          className={`vx-status-select ${t.status}`}
                          value={t.status}
                          onChange={(e) =>
                            onStatus(t.id, e.target.value as TaskStatus)
                          }
                        >
                          {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <button
                          className="vx-text-btn"
                          onClick={() => onOpen(t.id)}
                        >
                          開啟標註
                          <ArrowUpRight size={14} />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          {!project.tasks.some(
            (t) => filter === "all" || t.status === filter,
          ) && <div className="vx-empty">目前沒有此狀態的任務</div>}
          <div className="vx-card-foot">
            <GripVertical size={12} />
            拖曳資料列可安排順序，也可使用上下移動按鈕。
            <span>所有任務為本機示範資料</span>
          </div>
        </div>
      </section>
    );
  if (section === "analytics")
    return (
      <section className="vx-data-page">
        <div className="vx-page-intro">
          <div>
            <span className="vx-eyebrow">PRODUCTION INTELLIGENCE</span>
            <h2>看見資料，與資料之間的進度。</h2>
            <p>依目前專案狀態產生統計，修改標註後即時更新。</p>
          </div>
          <BarChart3 size={41} strokeWidth={1} />
        </div>
        {metrics}
        <div className="vx-analytics-grid">
          <article className="vx-data-card">
            <div className="vx-card-title">
              <h3>物件類別分布</h3>
              <span>CLASS DISTRIBUTION</span>
            </div>
            <div className="vx-distribution">
              <div
                className="vx-donut"
                style={{
                  background: `conic-gradient(${Object.entries(CLASSES)
                    .map(([key, c], i, arr) => {
                      const before = arr
                        .slice(0, i)
                        .reduce(
                          (n, [k]) =>
                            n + all.filter((a) => a.category === k).length,
                          0,
                        );
                      const count = all.filter(
                        (a) => a.category === key,
                      ).length;
                      return `${c.color} ${all.length ? (before / all.length) * 100 : 0}% ${all.length ? ((before + count) / all.length) * 100 : 0}%`;
                    })
                    .join(",")})`,
                }}
              >
                <div>
                  <strong>{all.length}</strong>
                  <span>OBJECTS</span>
                </div>
              </div>
              <div className="vx-distribution-legend">
                {Object.entries(CLASSES).map(([key, c]) => (
                  <div key={key}>
                    <i style={{ background: c.color }} />
                    <span>
                      {c.label}
                      <small>{c.english}</small>
                    </span>
                    <b>{all.filter((a) => a.category === key).length}</b>
                  </div>
                ))}
              </div>
            </div>
          </article>
          <article className="vx-data-card">
            <div className="vx-card-title">
              <h3>各場景覆核進度</h3>
              <span>REVIEW COVERAGE</span>
            </div>
            <div className="vx-bar-chart">
              {SCENES.map((s) => {
                const a = project.annotations[s.id],
                  n = a.filter((x) => x.reviewed).length;
                return (
                  <div key={s.id}>
                    <div>
                      <span>{s.name}</span>
                      <b>{a.length ? Math.round((n / a.length) * 100) : 0}%</b>
                    </div>
                    <div className="vx-chart-track">
                      <i
                        style={{
                          width: `${a.length ? (n / a.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <small>
                      {n} / {a.length} 個物件已完成覆核
                    </small>
                  </div>
                );
              })}
            </div>
          </article>
          <article className="vx-data-card">
            <div className="vx-card-title">
              <h3>信心值區間</h3>
              <span>SYNTHETIC SCORES</span>
            </div>
            <div className="vx-histogram">
              {[
                [0, 0.7],
                [0.7, 0.8],
                [0.8, 0.9],
                [0.9, 1.01],
              ].map(([from, to]) => {
                const count = all.filter(
                  (a) => a.confidence >= from && a.confidence < to,
                ).length;
                return (
                  <div key={from}>
                    <b>{count}</b>
                    <i
                      style={{
                        height: `${Math.max(4, (count / Math.max(1, all.length)) * 120)}px`,
                      }}
                    />
                    <span>
                      {from === 0
                        ? "<70%"
                        : from === 0.9
                          ? "≥90%"
                          : `${from * 100}–${to * 100}%`}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="vx-chart-caption">
              信心值為示範輸入，非真實模型推論結果。
            </p>
          </article>
          <article className="vx-data-card">
            <div className="vx-card-title">
              <h3>資料集摘要</h3>
              <span>DATASET SPEC</span>
            </div>
            <dl className="vx-dataset-spec">
              <div>
                <dt>資料來源</dt>
                <dd>程式生成的合成城市場景</dd>
              </div>
              <div>
                <dt>時間序列</dt>
                <dd>3 × 120 frames / 10 Hz</dd>
              </div>
              <div>
                <dt>標註方式</dt>
                <dd>Track 級 3D Cuboid</dd>
              </div>
              <div>
                <dt>儲存範圍</dt>
                <dd>目前瀏覽器 · localStorage</dd>
              </div>
              <div>
                <dt>資料交換</dt>
                <dd>JSON 專案 / CSV 標註</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>
    );
  if (section === "quality")
    return (
      <section className="vx-data-page">
        <div className="vx-page-intro">
          <div>
            <span className="vx-eyebrow">QUALITY ASSURANCE</span>
            <h2>把不確定，留給仔細的確認。</h2>
            <p>信心值低於 85%、遮擋或未覆核的物件會出現在這裡。</p>
          </div>
          <ShieldCheck size={41} strokeWidth={1} />
        </div>
        {metrics}
        <div className="vx-data-card">
          <div className="vx-card-title">
            <h3>
              待覆核物件 <span>{issues.length}</span>
            </h3>
            <span>即時規則檢查</span>
          </div>
          {issues.length ? (
            <div className="vx-quality-list">
              {issues.map((item, i) => (
                <div
                  className="vx-quality-row"
                  key={`${item.scene.id}-${item.id}-${i}`}
                >
                  <span className={`vx-issue-icon ${item.severity}`}>
                    <CircleAlert size={17} />
                  </span>
                  <div>
                    <h4>
                      {item.id}
                      <span>{item.scene.name}</span>
                    </h4>
                    <p>{item.message}</p>
                  </div>
                  <button
                    className="vx-btn"
                    onClick={() => onOpen(item.scene.id, item.id)}
                  >
                    定位物件
                    <ArrowRight size={13} />
                  </button>
                  <button
                    className="vx-btn vx-primary"
                    disabled={role !== "reviewer"}
                    onClick={() => onReview(item.scene.id, [item.id])}
                  >
                    <Check size={13} />
                    確認
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="vx-quality-clear">
              <ShieldCheck size={44} />
              <h3>全部物件已完成覆核</h3>
              <p>目前沒有待處理項目。可將任務設為完成，或匯出專案。</p>
            </div>
          )}
        </div>
        <p className="vx-page-note">
          確認表示你已檢視此物件。調整位置、尺寸或類別後，系統會重新標為待覆核。
        </p>
      </section>
    );
  return (
    <section className="vx-data-page">
      <div className="vx-page-intro">
        <div>
          <span className="vx-eyebrow">ACTIVITY STREAM</span>
          <h2>每一次修改，都有跡可循。</h2>
          <p>記錄本機專案最近 100 筆操作，匯出 JSON 時一併保留。</p>
        </div>
        <Terminal size={41} strokeWidth={1} />
      </div>
      <div className="vx-data-card">
        <div className="vx-card-title">
          <h3>
            操作紀錄 <span>{project.logs.length}</span>
          </h3>
          <label className="vx-search">
            <Search size={14} />
            <input
              aria-label="搜尋日誌"
              placeholder="搜尋操作內容…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="vx-log-list">
          {project.logs
            .filter((l) =>
              l.message.toLowerCase().includes(search.toLowerCase()),
            )
            .map((l) => (
              <div className="vx-log" key={l.id}>
                <time>{l.time}</time>
                <i className={l.kind} />
                <span>{l.message}</span>
                <small>LOCAL</small>
              </div>
            ))}
          {!project.logs.some((l) =>
            l.message.toLowerCase().includes(search.toLowerCase()),
          ) && <div className="vx-empty">沒有符合的操作紀錄</div>}
        </div>
      </div>
    </section>
  );
}
