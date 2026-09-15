"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVectorProject } from "@/hooks/use-vector-project";
import { VectorPanels, SECTION_LABELS, type Section } from "./vector-panels";
import {
  ArrowUpRight,
  Box,
  Boxes,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Download,
  Focus,
  Grid2X2,
  Grip,
  Layers,
  ListChecks,
  Move,
  MousePointer2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ScanLine,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  SquareDashedMousePointer,
  Terminal,
  Undo2,
  Waypoints,
  Trash2,
  Upload,
  FileJson,
  FileSpreadsheet,
  FileText,
  LockKeyhole,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Annotation,
  CLASSES,
  SCENES,
  type ObjectClass,
} from "@/lib/vector-model";
import VectorViewport, { ViewportProps } from "./vector-viewport";

export default function VectorWorkspace() {
  const store = useVectorProject();
  const { project } = store;
  const [section, setSection] = useState<Section>("workspace");
  const [dialog, setDialog] = useState<"export" | "help" | "add" | null>(null);
  const [newClass, setNewClass] = useState<ObjectClass>("vehicle");
  const [playing, setPlaying] = useState(false);
  const [reportDate, setReportDate] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [sceneId, setSceneId] = useState("scene-042");
  const scene = SCENES.find((s) => s.id === sceneId)!;
  const annotations = project.annotations[sceneId];
  const [selected, setSelected] = useState(["VEH-001"]);
  const [frame, setFrame] = useState(42);
  const [tool, setTool] = useState<ViewportProps["tool"]>("select");
  const [view, setView] = useState<ViewportProps["view"]>("perspective");
  const [layers, setLayers] = useState({
    points: true,
    boxes: true,
    mesh: true,
    tracks: true,
    grid: true,
  });
  const [pointSize, setPointSize] = useState(1.5);
  const [resetKey, setResetKey] = useState(0);
  const [stats, setStats] = useState({ points: 0, fps: 0 });
  const [query, setQuery] = useState("");
  const a = annotations.find((a) => selected.includes(a.id));
  const update = (id: string, patch: Partial<Annotation>) =>
    store.update(sceneId, id, patch);
  const canEdit = store.role !== "viewer";
  const openScene = (id: string, objectId?: string) => {
    setSceneId(id);
    setSelected(objectId ? [objectId] : ["VEH-001"]);
    setFrame(42);
    setPlaying(false);
    setSection("workspace");
  };
  const removeSelected = () => {
    store.remove(sceneId, selected);
    if (canEdit) setSelected([]);
  };
  useEffect(() => {
    if (!playing || section !== "workspace") return;
    const timer = setInterval(() => setFrame((f) => (f + 1) % 120), 100);
    return () => clearInterval(timer);
  }, [playing, section]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(tag) || dialog)
        return;
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setDialog("help");
      }
      if (section !== "workspace") return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((v) => !v);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setPlaying(false);
        setFrame((v) => Math.min(119, v + 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPlaying(false);
        setFrame((v) => Math.max(0, v - 1));
      }
      if (e.key.toLowerCase() === "v") setTool("select");
      if (e.key.toLowerCase() === "g" && canEdit) {
        setTool("move");
        setPlaying(false);
      }
      if (e.key.toLowerCase() === "b") setTool("box");
      if (e.key.toLowerCase() === "f") setResetKey((v) => v + 1);
      if (e.key.toLowerCase() === "n" && canEdit) setDialog("add");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        store.undo();
      }
      if (e.key === "Escape") setSelected([]);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [section, dialog, canEdit, store]);
  const download = (type: "json" | "csv") => {
    const body =
      type === "json"
        ? JSON.stringify(project, null, 2)
        : "\ufeff" +
          [
            "scene_id,track_id,class,x,y,z,width,height,length,rotation,confidence,reviewed,occluded",
            ...SCENES.flatMap((s) =>
              project.annotations[s.id].map((a) =>
                [
                  s.id,
                  a.id,
                  a.category,
                  a.x,
                  a.y,
                  a.z,
                  a.width,
                  a.height,
                  a.length,
                  a.rotation,
                  a.confidence,
                  a.reviewed,
                  a.occluded,
                ].join(","),
              ),
            ),
          ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([body], {
        type: type === "json" ? "application/json" : "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "vector-project." + type;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(type.toUpperCase() + " 檔案已產生");
    setDialog(null);
  };
  return (
    <main className="vx-app">
      <Toaster
        theme="dark"
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#202a31",
            color: "#dfe9e3",
            border: "1px solid #495543",
            fontSize: "12px",
          },
        }}
      />
      <header className="vx-header">
        <a
          className="vx-brand"
          href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`}
          aria-label="返回作品集"
        >
          <span className="vx-brand-mark">
            <Waypoints size={21} />
          </span>
          VECTOR<span className="vx-brand-slash">/</span>
          <span className="vx-brand-sub">PERCEPTION STUDIO</span>
        </a>
        <span className="vx-demo">
          <i />
          互動作品 · 合成資料
        </span>
        <div className="vx-header-right">
          <label className="vx-role">
            <LockKeyhole size={12} />
            <select
              aria-label="示範角色"
              value={store.role}
              onChange={(e) => {
                store.setRole(e.target.value as typeof store.role);
                setTool("select");
              }}
            >
              <option value="reviewer">覆核員</option>
              <option value="annotator">標註員</option>
              <option value="viewer">檢視者</option>
            </select>
          </label>
          <button
            className="vx-icon"
            title="操作說明"
            aria-label="操作說明"
            onClick={() => setDialog("help")}
          >
            <CircleHelp size={17} />
          </button>
          <span className="vx-avatar">YH</span>
        </div>
      </header>
      <div className="vx-shell">
        <aside className="vx-rail">
          <div>
            <button
              className={`vx-rail-item ${section === "workspace" ? "active" : ""}`}
              title="標註工作台"
              aria-label="標註工作台"
              onClick={() => setSection("workspace")}
            >
              <ScanLine />
              <span>標註</span>
            </button>
            <button
              className={`vx-rail-item ${section === "tasks" ? "active" : ""}`}
              title="任務管理"
              aria-label="任務管理"
              onClick={() => {
                setSection("tasks");
                setPlaying(false);
              }}
            >
              <ListChecks />
              <span>任務</span>
            </button>
            <button
              className={`vx-rail-item ${section === "analytics" ? "active" : ""}`}
              title="生產分析"
              aria-label="生產分析"
              onClick={() => {
                setSection("analytics");
                setPlaying(false);
              }}
            >
              <Grid2X2 />
              <span>分析</span>
            </button>
            <button
              className={`vx-rail-item ${section === "quality" ? "active" : ""}`}
              title="品質檢查"
              aria-label="品質檢查"
              onClick={() => {
                setSection("quality");
                setPlaying(false);
              }}
            >
              <ShieldCheck />
              <span>質檢</span>
            </button>
            <button
              className={`vx-rail-item ${section === "logs" ? "active" : ""}`}
              title="操作日誌"
              aria-label="操作日誌"
              onClick={() => {
                setSection("logs");
                setPlaying(false);
              }}
            >
              <Terminal />
              <span>日誌</span>
            </button>
          </div>
          <a
            href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/#work`}
            className="vx-rail-item"
            title="返回作品集"
          >
            <ArrowUpRight />
            <span>作品集</span>
          </a>
        </aside>
        <div className="vx-main">
          <div className="vx-titlebar">
            <div>
              <div className="vx-breadcrumb">
                感知資料集 <ChevronRight size={12} /> Taiwan urban · v1.0
              </div>
              <h1>
                {SECTION_LABELS[section][0]}{" "}
                <span>{SECTION_LABELS[section][1]}</span>
              </h1>
            </div>
            <div className="vx-title-actions">
              <span className="vx-save" role="status">
                <Check size={13} />
                {store.saveStatus}
              </span>
              <button className="vx-btn" onClick={() => setDialog("export")}>
                <Download size={14} />
                匯出標註
              </button>
              <button
                className="vx-btn vx-primary"
                disabled={
                  section !== "workspace" ||
                  !selected.length ||
                  store.role !== "reviewer"
                }
                onClick={() => store.review(sceneId, selected)}
              >
                <Check size={14} />
                完成覆核
              </button>
            </div>
          </div>
          {section === "workspace" ? (
            <div className="vx-workarea">
              <aside className="vx-left">
                <div className="vx-panel-heading">
                  場景序列<span>03</span>
                </div>
                <div className="vx-scene-list">
                  {SCENES.map((s, i) => (
                    <button
                      key={s.id}
                      className={`vx-scene ${sceneId === s.id ? "active" : ""}`}
                      onClick={() => openScene(s.id)}
                    >
                      <span className={`vx-scene-thumbnail scene-${i}`}>
                        <Waypoints size={26} />
                      </span>
                      <span>
                        <b>{s.name}</b>
                        <small>{s.id.toUpperCase()}</small>
                      </span>
                      <span className="vx-scene-dot" />
                    </button>
                  ))}
                </div>
                <div className="vx-panel-heading">
                  物件清單
                  <span>
                    {annotations.length.toString().padStart(2, "0")}
                    <button
                      className="vx-icon"
                      disabled={!canEdit}
                      aria-label="新增標註"
                      title="新增標註 · N"
                      onClick={() => setDialog("add")}
                    >
                      <Plus size={14} />
                    </button>
                  </span>
                </div>
                <label className="vx-search">
                  <Search size={13} />
                  <input
                    aria-label="搜尋物件"
                    placeholder="搜尋 ID 或分類…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <kbd>/</kbd>
                </label>
                <div className="vx-object-list">
                  {annotations
                    .filter((a) =>
                      `${a.id}${CLASSES[a.category].label}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    )
                    .map((a) => (
                      <button
                        key={a.id}
                        onClick={(e) =>
                          setSelected(
                            e.shiftKey
                              ? selected.includes(a.id)
                                ? selected.filter((id) => id !== a.id)
                                : [...selected, a.id]
                              : [a.id],
                          )
                        }
                        className={`vx-object ${selected.includes(a.id) ? "active" : ""}`}
                      >
                        <Box
                          size={14}
                          style={{ color: CLASSES[a.category].color }}
                        />
                        <span>
                          <b>{a.id}</b>
                          <small>{CLASSES[a.category].english}</small>
                        </span>
                        <span className="vx-confidence">
                          {Math.round(a.confidence * 100)}%
                        </span>
                        {a.reviewed ? (
                          <Check size={12} />
                        ) : (
                          <span className="vx-pending-dot" />
                        )}
                      </button>
                    ))}
                  {!annotations.some((a) =>
                    (a.id + CLASSES[a.category].label)
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  ) && <div className="vx-no-objects">沒有符合的物件</div>}
                </div>
                <div className="vx-left-bottom">
                  <div>
                    <span>場景覆核進度</span>
                    <b>
                      {annotations.filter((a) => a.reviewed).length} /{" "}
                      {annotations.length}
                    </b>
                  </div>
                  <div className="vx-progress">
                    <i
                      style={{
                        width: `${annotations.length ? (annotations.filter((a) => a.reviewed).length / annotations.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <small>
                    <span className="vx-live-dot" />
                    所有變更保留在此瀏覽器
                  </small>
                </div>
              </aside>
              <section className="vx-stage">
                <div className="vx-stage-toolbar">
                  <div className="vx-tool-group">
                    {(
                      [
                        {
                          id: "select",
                          icon: MousePointer2,
                          label: "選取物件",
                        },
                        { id: "move", icon: Move, label: "拖曳移動" },
                        {
                          id: "box",
                          icon: SquareDashedMousePointer,
                          label: "框選物件",
                        },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        className={`vx-icon ${tool === t.id ? "active" : ""}`}
                        disabled={t.id === "move" && !canEdit}
                        onClick={() => {
                          setTool(t.id);
                          setPlaying(false);
                        }}
                        title={t.label}
                        aria-label={t.label}
                      >
                        <t.icon size={17} />
                      </button>
                    ))}
                    <span className="vx-separator" />
                    <button
                      className="vx-icon"
                      title="重設視角"
                      aria-label="重設視角"
                      onClick={() => setResetKey((v) => v + 1)}
                    >
                      <Focus size={17} />
                    </button>
                    <button
                      className="vx-icon"
                      aria-label="復原"
                      title="復原 · Ctrl+Z"
                      disabled={!store.historySize || !canEdit}
                      onClick={store.undo}
                    >
                      <Undo2 size={16} />
                    </button>
                    <button
                      className="vx-icon"
                      aria-label="新增標註"
                      title="新增標註 · N"
                      disabled={!canEdit}
                      onClick={() => setDialog("add")}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="vx-views">
                    {(
                      [
                        { id: "perspective", label: "透視" },
                        { id: "top", label: "俯視" },
                        { id: "front", label: "前視" },
                      ] as const
                    ).map((v) => (
                      <button
                        className={view === v.id ? "active" : ""}
                        key={v.id}
                        onClick={() => setView(v.id)}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                  <span className="vx-renderer">
                    <i />
                    WebGL
                  </span>
                </div>
                <div className="vx-viewport">
                  {selected.length > 1 && (
                    <div className="vx-selection-bar">
                      <span>{selected.length} 個已選取</span>
                      <button
                        disabled={store.role !== "reviewer"}
                        onClick={() => store.review(sceneId, selected)}
                      >
                        批次覆核
                      </button>
                      <button disabled={!canEdit} onClick={removeSelected}>
                        刪除
                      </button>
                      <button onClick={() => setSelected([])}>取消</button>
                    </div>
                  )}
                  <VectorViewport
                    key={sceneId}
                    annotations={annotations}
                    selected={selected}
                    frame={frame}
                    seed={scene.seed}
                    tool={tool}
                    view={view}
                    layers={layers}
                    pointSize={pointSize}
                    resetKey={resetKey}
                    onSelect={setSelected}
                    onMove={(id, x, z) => update(id, { x, z })}
                    onStats={(points, fps) => setStats({ points, fps })}
                  />
                  <div className="vx-scene-overlay">
                    <p>
                      <span className="vx-live-dot" /> LIDAR ·{" "}
                      {scene.id.toUpperCase()}
                    </p>
                    <h2>{scene.english}</h2>
                    <small>
                      {scene.location} <span> / </span> {scene.time}
                    </small>
                  </div>
                  <div className="vx-cloud-legend">
                    {Object.entries(CLASSES).map(([key, c]) => (
                      <span key={key}>
                        <i style={{ background: c.color }} />
                        {c.english}
                      </span>
                    ))}
                  </div>
                  <div className="vx-axis">
                    <span>Y</span>
                    <b>↑</b>
                    <span>Z ⤢</span>
                    <span>X →</span>
                  </div>
                  <div className="vx-viewport-footer">
                    <span>
                      {tool === "move"
                        ? "拖曳物件移動 · 支援地面 X / Z 軸"
                        : tool === "box"
                          ? "在場景中拖出矩形，批次選取物件"
                          : "拖曳旋轉 · 滾輪縮放 · Shift 多選"}
                    </span>
                    <span>
                      {(stats.points / 1000).toFixed(1)}K points <i />{" "}
                      {stats.fps} FPS
                    </span>
                  </div>
                </div>
                <div className="vx-timeline">
                  <div className="vx-timeline-head">
                    <div>
                      <button
                        className="vx-icon"
                        aria-label="上一影格"
                        onClick={() => {
                          setPlaying(false);
                          setFrame((f) => Math.max(0, f - 1));
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        className="vx-play"
                        aria-label={playing ? "暫停" : "播放"}
                        onClick={() => {
                          setTool("select");
                          setPlaying((v) => !v);
                        }}
                      >
                        {playing ? (
                          <Pause size={13} fill="currentColor" />
                        ) : (
                          <Play size={13} fill="currentColor" />
                        )}
                      </button>
                      <button
                        className="vx-icon"
                        aria-label="下一影格"
                        onClick={() => {
                          setPlaying(false);
                          setFrame((f) => Math.min(119, f + 1));
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                      <span className="vx-frame">
                        <b>{String(frame).padStart(3, "0")}</b> / 119
                      </span>
                    </div>
                    <span>
                      10 Hz <span className="vx-separator" /> 12.0 s
                    </span>
                  </div>
                  <div className="vx-timeline-track">
                    <div className="vx-ruler">
                      {["000", "020", "040", "060", "080", "100", "119"].map(
                        (v) => (
                          <span key={v}>{v}</span>
                        ),
                      )}
                    </div>
                    <div className="vx-track-bars">
                      {Array.from({ length: 60 }, (_, i) => (
                        <i
                          key={i}
                          className={i * 2 <= frame ? "done" : ""}
                          style={{ height: `${14 + Math.sin(i * 1.7) * 4}px` }}
                        />
                      ))}
                    </div>
                    <input
                      aria-label="影格時間軸"
                      type="range"
                      min="0"
                      max="119"
                      value={frame}
                      onChange={(e) => {
                        setPlaying(false);
                        setFrame(Number(e.target.value));
                      }}
                    />
                    <div
                      className="vx-playhead"
                      style={{ left: `${(frame / 119) * 100}%` }}
                    >
                      <b>{String(frame).padStart(3, "0")}</b>
                    </div>
                  </div>
                  <div className="vx-timeline-note">
                    <span>
                      <i />
                      物件軌跡 · 合成動態序列
                    </span>
                    <span>
                      FRAME {String(frame).padStart(3, "0")}{" "}
                      <span>⏱ {(frame / 10).toFixed(1)} s</span>
                    </span>
                  </div>
                </div>
              </section>
              <aside className="vx-inspector">
                <div className="vx-panel-heading">
                  <span>
                    <SlidersHorizontal size={14} />
                    物件屬性
                  </span>
                  <button
                    className="vx-icon"
                    aria-label="刪除選取標註"
                    title="刪除選取標註（可復原）"
                    disabled={!canEdit || !selected.length}
                    onClick={removeSelected}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {a ? (
                  <>
                    <div className="vx-selected-title">
                      <span
                        className="vx-cube-icon"
                        style={{ color: CLASSES[a.category].color }}
                      >
                        <Box size={23} />
                      </span>
                      <div>
                        <h2>{a.id}</h2>
                        <small>TRACK ID · {a.id.slice(-3)}</small>
                      </div>
                      <span
                        className="vx-class-dot"
                        style={{ background: CLASSES[a.category].color }}
                      />
                    </div>
                    <div className="vx-inspector-section vx-object-meta">
                      <label className="vx-field-label">物件分類</label>
                      <select
                        disabled={!canEdit}
                        aria-label="物件分類"
                        value={a.category}
                        onChange={(e) =>
                          update(a.id, {
                            category: e.target.value as Annotation["category"],
                          })
                        }
                      >
                        {Object.entries(CLASSES).map(([key, c]) => (
                          <option key={key} value={key}>
                            {c.label} · {c.english}
                          </option>
                        ))}
                      </select>
                      <div className="vx-confidence-row">
                        <span>
                          模型信心值 <small>示範</small>
                        </span>
                        <b style={{ color: CLASSES[a.category].color }}>
                          {(a.confidence * 100).toFixed(0)}
                          <small>%</small>
                        </b>
                      </div>
                      <div className="vx-progress">
                        <i
                          style={{
                            width: `${a.confidence * 100}%`,
                            background: CLASSES[a.category].color,
                          }}
                        />
                      </div>
                    </div>
                    <div className="vx-inspector-section vx-object-geometry">
                      <h3>
                        3D 邊界框<span>公尺 / 度</span>
                      </h3>
                      <label className="vx-field-label">位置 · Position</label>
                      <div className="vx-number-grid">
                        {(["x", "y", "z"] as const).map((key) => (
                          <label key={key}>
                            <span>{key.toUpperCase()}</span>
                            <input
                              disabled={!canEdit}
                              type="number"
                              min="-1000"
                              max="1000"
                              step=".1"
                              aria-label={`位置 ${key.toUpperCase()}`}
                              value={a[key]}
                              onChange={(e) =>
                                update(a.id, { [key]: Number(e.target.value) })
                              }
                            />
                          </label>
                        ))}
                      </div>
                      <label className="vx-field-label">
                        尺寸 · Dimensions
                      </label>
                      <div className="vx-number-grid">
                        {(["width", "height", "length"] as const).map(
                          (key, i) => (
                            <label key={key}>
                              <span>{["W", "H", "L"][i]}</span>
                              <input
                                disabled={!canEdit}
                                type="number"
                                min=".1"
                                max="30"
                                step=".1"
                                aria-label={`尺寸 ${key}`}
                                value={a[key]}
                                onChange={(e) =>
                                  update(a.id, {
                                    [key]: Math.max(
                                      0.1,
                                      Number(e.target.value),
                                    ),
                                  })
                                }
                              />
                            </label>
                          ),
                        )}
                      </div>
                      <label className="vx-field-label">方向 · Rotation</label>
                      <div className="vx-rotation">
                        <RotateCcw size={14} />
                        <input
                          disabled={!canEdit}
                          type="range"
                          aria-label="旋轉角度"
                          min="0"
                          max="360"
                          value={a.rotation}
                          onChange={(e) =>
                            update(a.id, { rotation: Number(e.target.value) })
                          }
                        />
                        <span>{a.rotation}°</span>
                      </div>
                    </div>
                    <div className="vx-inspector-section vx-object-state">
                      <h3>標註狀態</h3>
                      <label className="vx-switch-row">
                        已完成覆核
                        <Switch
                          aria-label="已完成覆核"
                          disabled={store.role !== "reviewer"}
                          checked={a.reviewed}
                          onCheckedChange={(value) =>
                            update(a.id, { reviewed: value })
                          }
                        />
                      </label>
                      <label className="vx-switch-row">
                        物件有遮擋
                        <Switch
                          aria-label="物件有遮擋"
                          disabled={!canEdit}
                          checked={a.occluded}
                          onCheckedChange={(value) =>
                            update(a.id, { occluded: value })
                          }
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="vx-empty">
                    <MousePointer2 size={24} />
                    <p>
                      選取場景中的物件
                      <br />
                      即可編輯標註屬性
                    </p>
                  </div>
                )}
                <div className="vx-inspector-section vx-layers">
                  <h3>
                    <Layers size={14} />
                    場景圖層
                  </h3>
                  {(
                    [
                      { id: "points", label: "點雲", icon: Grip },
                      { id: "boxes", label: "3D 邊界框", icon: Box },
                      { id: "mesh", label: "Mesh 網格", icon: Boxes },
                      { id: "tracks", label: "移動軌跡", icon: Waypoints },
                      { id: "grid", label: "地面網格", icon: Grid2X2 },
                    ] as const
                  ).map((l) => (
                    <label className="vx-switch-row" key={l.id}>
                      <span>
                        <l.icon size={13} />
                        {l.label}
                      </span>
                      <Switch
                        aria-label={l.label}
                        checked={layers[l.id]}
                        onCheckedChange={(v) =>
                          setLayers((s) => ({ ...s, [l.id]: v }))
                        }
                      />
                    </label>
                  ))}
                  <label className="vx-point-size">
                    <span>點大小</span>
                    <input
                      type="range"
                      min=".5"
                      max="3"
                      step=".1"
                      aria-label="點大小"
                      value={pointSize}
                      onChange={(e) => setPointSize(Number(e.target.value))}
                    />
                    <small>{pointSize.toFixed(1)}</small>
                  </label>
                </div>
              </aside>
            </div>
          ) : (
            <VectorPanels
              section={section}
              project={project}
              role={store.role}
              onOpen={openScene}
              onStatus={store.taskStatus}
              onReorder={store.reorder}
              onReview={store.review}
            />
          )}
          <footer className="vx-statusbar">
            <span>
              <span className="vx-live-dot" />
              {annotations.length} 個標註物件<span className="vx-muted">·</span>
              {selected.length} 個已選取
            </span>
            <span>
              合成場景 · 無真實道路資料 <span className="vx-muted">|</span>{" "}
              VECTOR v1.0
            </span>
          </footer>
        </div>
      </div>
      <button className="vx-mobile-help" onClick={() => setDialog("help")}>
        <CircleHelp size={14} />
        操作說明
      </button>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        aria-label="匯入 JSON 專案"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            if (file.size > 2_000_000) throw new Error("檔案不可超過 2 MB。");
            store.importProject(JSON.parse(await file.text()));
            setSelected([]);
            toast.success("專案已匯入，可按復原恢復原資料");
            setDialog(null);
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "無法讀取 JSON 專案。",
            );
          }
          e.target.value = "";
        }}
      />
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent className="vx-dialog">
          <DialogHeader>
            <span className="vx-eyebrow">VECTOR / PERCEPTION STUDIO</span>
            <DialogTitle>
              {dialog === "export"
                ? "帶走你的標註成果"
                : dialog === "add"
                  ? "新增 3D 標註"
                  : "從第一個物件開始"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "export"
                ? "匯出包含全部 3 個場景。JSON 可重新匯入，保留任務與操作紀錄。"
                : dialog === "add"
                  ? "標註會建立在場景中心。拖曳物件或使用右側屬性調整位置。"
                  : "選取、調整、覆核，再匯出。所有操作都可以在這個工作台完成。"}
            </DialogDescription>
          </DialogHeader>
          {dialog === "export" ? (
            <div className="vx-export-options">
              <button onClick={() => download("json")}>
                <FileJson />
                <span>
                  <b>完整專案 JSON</b>
                  <small>所有標註、任務狀態與操作日誌</small>
                </span>
                <Download size={16} />
              </button>
              <button onClick={() => download("csv")}>
                <FileSpreadsheet />
                <span>
                  <b>標註資料 CSV</b>
                  <small>座標、尺寸、分類與覆核狀態</small>
                </span>
                <Download size={16} />
              </button>
              <button
                onClick={() => {
                  setReportDate(new Date().toLocaleString("zh-TW"));
                  setDialog(null);
                  setTimeout(() => window.print(), 150);
                }}
              >
                <FileText />
                <span>
                  <b>覆核報告 PDF</b>
                  <small>開啟列印視窗，選擇「另存為 PDF」</small>
                </span>
                <ArrowUpRight size={16} />
              </button>
              <button
                disabled={!canEdit}
                onClick={() => fileInput.current?.click()}
              >
                <Upload />
                <span>
                  <b>匯入 VECTOR JSON</b>
                  <small>僅在此裝置讀取 · 最多 2 MB · 可復原</small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          ) : dialog === "add" ? (
            <div className="vx-add-form">
              <label>
                物件分類
                <select
                  aria-label="新增物件分類"
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value as ObjectClass)}
                >
                  {Object.entries(CLASSES).map(([key, c]) => (
                    <option key={key} value={key}>
                      {c.label} · {c.english}
                    </option>
                  ))}
                </select>
              </label>
              <p>新增的是整段序列的 Track 標註；位置以第 042 影格為基準。</p>
              <button
                className="vx-btn vx-primary"
                onClick={() => {
                  const id = store.add(sceneId, newClass);
                  if (id) {
                    setSelected([id]);
                    setFrame(42);
                    setPlaying(false);
                    setTool("move");
                    setDialog(null);
                  }
                }}
              >
                <Plus size={16} />
                建立標註
              </button>
            </div>
          ) : (
            <div className="vx-help-content">
              <ol>
                <li>
                  <b>選取物件</b>
                  <span>
                    點擊點雲中的邊界框或左側清單；Shift
                    可多選，框選工具可批次選取。
                  </span>
                </li>
                <li>
                  <b>調整標註</b>
                  <span>
                    按 G 拖曳地面位置，或編輯座標、尺寸與方向。修改作用於整條
                    Track。
                  </span>
                </li>
                <li>
                  <b>檢查與交付</b>
                  <span>
                    在質檢頁定位待覆核物件，確認後將任務設為完成，再匯出成果。
                  </span>
                </li>
              </ol>
              <div className="vx-shortcuts">
                {[
                  ["V", "選取"],
                  ["G", "移動"],
                  ["B", "框選"],
                  ["F", "重設視角"],
                  ["N", "新增"],
                  ["Space", "播放 / 暫停"],
                  ["← →", "切換影格"],
                  ["Ctrl Z", "復原"],
                ].map(([k, v]) => (
                  <span key={k}>
                    <kbd>{k}</kbd>
                    {v}
                  </span>
                ))}
              </div>
              <div className="vx-honest-note">
                <b>關於這個作品</b>
                <p>
                  以 React、TypeScript 與 Three.js
                  製作。點雲、軌跡、信心值均為合成示範，未連接自駕模型或真實車輛。角色切換展示前端操作限制，不代表伺服器驗證；資料只存在目前瀏覽器。
                </p>
                <a
                  href="https://github.com/tamyu321-source/isle-scent-taiwan-studio/blob/main/docs/vector-perception.md"
                  target="_blank"
                  rel="noreferrer"
                >
                  查看原始碼與技術說明 <ArrowUpRight size={13} />
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <section className="vx-print-report">
        <h1>VECTOR · 3D 標註覆核報告</h1>
        <p>合成資料示範 / 產生時間：{reportDate}</p>
        <p>
          Track 座標基準為影格 042；每段序列 120
          影格。此報告不代表真實道路模型的辨識能力。
        </p>
        {SCENES.map((s) => (
          <article key={s.id}>
            <h2>
              {s.name} / {s.id}
            </h2>
            <p>
              已覆核{" "}
              {project.annotations[s.id].filter((a) => a.reviewed).length} /{" "}
              {project.annotations[s.id].length}
            </p>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>分類</th>
                  <th>位置 XYZ (m)</th>
                  <th>尺寸 WHL (m)</th>
                  <th>角度</th>
                  <th>信心值</th>
                  <th>覆核</th>
                </tr>
              </thead>
              <tbody>
                {project.annotations[s.id].map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{CLASSES[a.category].label}</td>
                    <td>
                      {a.x}, {a.y}, {a.z}
                    </td>
                    <td>
                      {a.width}, {a.height}, {a.length}
                    </td>
                    <td>{a.rotation}°</td>
                    <td>{Math.round(a.confidence * 100)}%</td>
                    <td>{a.reviewed ? "完成" : "待覆核"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ))}
      </section>
    </main>
  );
}
