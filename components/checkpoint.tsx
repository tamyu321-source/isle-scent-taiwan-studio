"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  Copy,
  FileJson2,
  Focus,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  checkpointActionsUrl,
  checkpointArtifact,
  checkpointStatuses,
  checkpointTime,
  isCheckpointReport,
  type CheckpointReport,
  type CheckpointStatus,
} from "@/lib/checkpoint";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const reportRoot = `${base}/data/checkpoint/latest`;
const repository =
  "https://github.com/tamyu321-source/isle-scent-taiwan-studio";
const commands = `py -3.11 -m venv .venv
.\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt
.\\.venv\\Scripts\\python.exe -m playwright install chromium
.\\.venv\\Scripts\\python.exe checkpoint.py --suite portfolio`;

function Status({ value }: { value: CheckpointStatus }) {
  return (
    <span className={`cp-status cp-status-${value}`}>
      <span aria-hidden="true">
        {value === "passed"
          ? "✓"
          : value === "failed"
            ? "×"
            : value === "blocked"
              ? "!"
              : "–"}
      </span>
      {checkpointStatuses[value]}
    </span>
  );
}

function EvidenceImage({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="cp-image-missing" role="status">
      截圖載入失敗。下方仍保留這一步的文字紀錄。
    </div>
  ) : (
    <img
      src={src}
      alt={`${title}的實際瀏覽器截圖`}
      onError={() => setFailed(true)}
    />
  );
}

export function Checkpoint() {
  const [report, setReport] = useState<CheckpointReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewport, setViewport] = useState("desktop");
  const [status, setStatus] = useState("all");
  const [caseId, setCaseId] = useState("");
  const [stepId, setStepId] = useState("");
  const [notice, setNotice] = useState("");
  const request = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const deadline = window.setTimeout(() => controller.abort(), 15000);
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${reportRoot}/report.json`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error(
          response.status === 404
            ? "這個版本還沒有已發佈的巡檢報告。"
            : `報告讀取失敗（HTTP ${response.status}）。`,
        );
      const text = await response.text();
      if (text.length > 5_000_000) throw new Error("報告超過可讀取的大小。");
      const value: unknown = JSON.parse(text);
      if (!isCheckpointReport(value))
        throw new Error("報告格式不完整，無法顯示結果。");
      setReport(value);
    } catch (cause) {
      if (request.current !== controller) return;
      setError(
        controller.signal.aborted
          ? "讀取超過 15 秒，請稍後重新載入。"
          : cause instanceof TypeError
            ? "目前無法連線讀取報告，請稍後重新載入。"
            : cause instanceof SyntaxError
              ? "報告內容無法解析。"
              : cause instanceof Error
                ? cause.message
                : "目前無法讀取報告。",
      );
    } finally {
      clearTimeout(deadline);
      if (request.current === controller) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    return () => request.current?.abort();
  }, [reload]);
  const cases = useMemo(
    () =>
      (report?.cases ?? []).filter(
        (item) =>
          item.viewport === viewport &&
          (status === "all" || item.status === status),
      ),
    [report, viewport, status],
  );
  const active = cases.find((item) => item.id === caseId) ?? cases[0];
  const step =
    active?.steps.find((item) => item.id === stepId) ?? active?.steps[0];
  const screenshot = checkpointArtifact(step?.screenshot, reportRoot);
  const actionsUrl = checkpointActionsUrl(report?.actionsUrl);
  const trace = checkpointArtifact(active?.trace, reportRoot);
  const passed =
    report?.cases.filter((item) => item.status === "passed").length ?? 0;
  const totalSteps =
    report?.cases.reduce(
      (sum, item) =>
        sum + item.steps.filter((step) => step.status !== "skipped").length,
      0,
    ) ?? 0;
  const duration =
    report?.cases.reduce((sum, item) => sum + item.durationMs, 0) ?? 0;
  const liveSelection = useRef({ report, active, step });
  liveSelection.current = { report, active, step };

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "read_checkpoint_result",
            title: "讀取目前巡檢紀錄",
            description:
              "讀取畫面選取的案例與步驟，不執行測試、不改變網站或下載檔案。",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute(input) {
              if (
                !input ||
                typeof input !== "object" ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error("此工具不接受額外參數");
              const current = liveSelection.current;
              if (!current.report) throw new Error("報告尚未載入");
              return {
                runId: current.report.runId,
                finishedAt: current.report.finishedAt,
                environment: current.report.environment,
                revision: current.report.revision,
                case: current.active ?? null,
                step: current.step ?? null,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => undefined);
    } catch {
      /* Optional in browsers without the proposed page-tool API. */
    }
    return () => lifecycle.abort();
  }, []);

  return (
    <main className="cp-page">
      <a className="cp-skip" href="#checkpoint-results">
        跳至巡檢結果
      </a>
      <header className="cp-header">
        <a href={`${base}/checkpoint/`} className="cp-brand">
          <span className="cp-brand-icon">
            <Focus size={21} />
          </span>
          CHECKPOINT<span className="cp-brand-label">BROWSER INSPECTION</span>
        </a>
        <a className="cp-back" href={`${base}/#project-08`}>
          <ArrowLeft size={15} />
          作品集
        </a>
      </header>
      <div className="cp-shell">
        <section className="cp-intro" aria-labelledby="cp-title">
          <div>
            <p className="cp-eyebrow">RUNS / EVIDENCE / RESULTS</p>
            <h1 id="cp-title">
              瀏覽器巡檢台<span>_</span>
            </h1>
            <p>操作留下紀錄。結果有跡可循。</p>
          </div>
          <div className="cp-run-actions">
            <a
              href={`${base}/downloads/checkpoint-python.zip`}
              className="cp-button cp-button-dark"
            >
              <ArrowDownToLine size={17} />
              下載巡檢工具
            </a>
            <button
              className="cp-button"
              onClick={() => void reload()}
              disabled={loading}
            >
              <RefreshCw size={16} />
              {loading ? "讀取報告" : "重載報告"}
            </button>
          </div>
        </section>
        <section className="cp-run-summary" aria-label="最近一次巡檢">
          <div className="cp-score">
            <span>案例通過</span>
            <strong>
              {report ? passed : "—"}
              <small>/ {report?.cases.length ?? "—"}</small>
            </strong>
            {report && <Status value={report.status} />}
          </div>
          <div>
            <span>已執行步驟</span>
            <strong>
              {report ? totalSteps : "—"}
              <small>步</small>
            </strong>
            <p>獨立瀏覽器實際操作</p>
          </div>
          <div>
            <span>執行時間</span>
            <strong>
              {report ? (duration / 1000).toFixed(1) : "—"}
              <small>秒</small>
            </strong>
            <p>包含兩種畫面尺寸</p>
          </div>
          <div className="cp-run-stamp">
            <span>最近執行 · 臺灣時間</span>
            <strong>
              {report
                ? checkpointTime(report.finishedAt)
                : loading
                  ? "讀取中"
                  : "尚無報告"}
            </strong>
            <p>
              {report?.environment === "build-preview"
                ? "本次建置產物"
                : report
                  ? "本機執行紀錄"
                  : "等待真實報告"}
              {report?.revision && <code>{report.revision.slice(0, 7)}</code>}
            </p>
          </div>
        </section>
        <div className="cp-context">
          <ShieldCheck size={17} />
          <p>
            {report?.complete === false
              ? "這份紀錄未完整執行，不能用於通過發佈門檻。"
              : "這裡顯示已完成的執行紀錄，不是即時控制台。發佈巡檢未通過時，網站保留上一版。"}
          </p>
          {actionsUrl && (
            <a href={actionsUrl} target="_blank" rel="noreferrer">
              查看 Actions
              <ArrowUpRight size={14} />
            </a>
          )}
        </div>
        {error && (
          <div className="cp-error" role="alert">
            {error}
            {report && " 以下保留先前讀取的報告。"}
            <button onClick={() => void reload()} disabled={loading}>
              重新載入
            </button>
          </div>
        )}
        <section
          id="checkpoint-results"
          className="cp-results"
          aria-label="巡檢結果"
          aria-busy={loading}
        >
          <Tabs
            value={viewport}
            onValueChange={(value) => {
              setViewport(value);
              setCaseId(
                active
                  ? active.id.replace(/-(desktop|mobile)$/, `-${value}`)
                  : "",
              );
              setStepId("");
            }}
          >
            <div className="cp-results-toolbar">
              <h2>
                執行紀錄<span>{report?.runId ?? "尚未取得"}</span>
              </h2>
              <TabsList className="cp-viewports" aria-label="測試畫面尺寸">
                <TabsTrigger value="desktop">
                  <Monitor size={16} />
                  桌面<span>1440</span>
                </TabsTrigger>
                <TabsTrigger value="mobile">
                  <Smartphone size={16} />
                  手機<span>390</span>
                </TabsTrigger>
              </TabsList>
            </div>
            {["desktop", "mobile"].map((view) => (
              <TabsContent value={view} key={view}>
                <div className="cp-workspace">
                  <aside className="cp-cases" aria-label="巡檢案例">
                    <div className="cp-cases-heading">
                      <span>TEST CASES</span>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger
                          aria-label="案例狀態"
                          className="cp-select"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部狀態</SelectItem>
                          {Object.entries(checkpointStatuses).map(
                            ([value, label]) => (
                              <SelectItem value={value} key={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="cp-case-list">
                      {cases.map((item, index) => (
                        <button
                          className="cp-case"
                          key={item.id}
                          onClick={() => {
                            setCaseId(item.id);
                            setStepId("");
                          }}
                          aria-pressed={active?.id === item.id}
                        >
                          <span className="cp-case-number">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span>
                            <strong>{item.title}</strong>
                            <small>
                              {item.steps.length} 個步驟 ·{" "}
                              {(item.durationMs / 1000).toFixed(1)} 秒
                            </small>
                            <Status value={item.status} />
                          </span>
                          <ChevronRight size={16} />
                        </button>
                      ))}
                    </div>
                    {!cases.length && (
                      <p className="cp-case-empty">
                        {loading
                          ? "正在讀取案例…"
                          : report
                            ? "沒有符合這個條件的案例。"
                            : "尚無可檢視的報告。"}
                      </p>
                    )}
                    <div className="cp-case-note">
                      <span>HOW IT RAN</span>
                      <p>開啟頁面 → 操作控制項 → 核對結果 → 保存截圖</p>
                      <a href="#checkpoint-tool">
                        在自己的電腦重跑
                        <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </aside>
                  <div className="cp-inspection">
                    {active ? (
                      <>
                        <div className="cp-case-title">
                          <div>
                            <p>
                              {active.viewport === "desktop"
                                ? "DESKTOP"
                                : "MOBILE"}{" "}
                              / {active.dimensions.width} ×{" "}
                              {active.dimensions.height}
                            </p>
                            <h3>{active.title}</h3>
                          </div>
                          <Status value={active.status} />
                        </div>
                        <div className="cp-evidence-layout">
                          <nav className="cp-steps" aria-label="核對步驟">
                            {active.steps.map((item, index) => (
                              <button
                                className="cp-step"
                                key={item.id}
                                aria-current={
                                  step?.id === item.id ? "step" : undefined
                                }
                                onClick={() => setStepId(item.id)}
                              >
                                <span
                                  className={`cp-step-marker cp-step-${item.status}`}
                                >
                                  {item.status === "passed" ? (
                                    <Check size={13} />
                                  ) : (
                                    String(index + 1).padStart(2, "0")
                                  )}
                                </span>
                                <span>
                                  <strong>{item.title}</strong>
                                  <small>
                                    {checkpointStatuses[item.status]} ·{" "}
                                    {(item.durationMs / 1000).toFixed(1)}s
                                  </small>
                                </span>
                              </button>
                            ))}
                          </nav>
                          <div className="cp-evidence" aria-live="polite">
                            <div className="cp-evidence-top">
                              <span>
                                <Focus size={14} />
                                ACTUAL CAPTURE
                              </span>
                              <span>{step?.id ?? "尚無步驟"}</span>
                            </div>
                            <div
                              className={`cp-capture ${active.viewport === "mobile" ? "cp-capture-mobile" : ""}`}
                            >
                              {screenshot && step ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button
                                      className="cp-enlarge"
                                      aria-label="放大實際截圖"
                                    >
                                      <EvidenceImage
                                        key={screenshot}
                                        src={screenshot}
                                        title={step.title}
                                      />
                                      <span>
                                        <Focus size={14} />
                                        放大截圖
                                      </span>
                                    </button>
                                  </DialogTrigger>
                                  <DialogContent
                                    className="cp-image-dialog"
                                    showCloseButton={false}
                                  >
                                    <DialogTitle>{step.title}</DialogTitle>
                                    <DialogDescription>
                                      實際執行截圖 · {active.dimensions.width} ×{" "}
                                      {active.dimensions.height}
                                    </DialogDescription>
                                    <DialogClose
                                      className="cp-image-close"
                                      aria-label="關閉截圖"
                                    >
                                      <X size={22} />
                                    </DialogClose>
                                    <EvidenceImage
                                      key={`large-${screenshot}`}
                                      src={screenshot}
                                      title={step.title}
                                    />
                                  </DialogContent>
                                </Dialog>
                              ) : (
                                <div className="cp-image-missing">
                                  <Focus size={32} />
                                  <p>
                                    {step?.status === "skipped"
                                      ? "這一步沒有執行，因此沒有截圖。"
                                      : "這一步尚未取得截圖。"}
                                  </p>
                                </div>
                              )}
                            </div>
                            {step && (
                              <div className="cp-assertion">
                                <h4>{step.title}</h4>
                                <dl>
                                  <div>
                                    <dt>預期結果</dt>
                                    <dd>{step.expected}</dd>
                                  </div>
                                  <div>
                                    <dt>實際結果</dt>
                                    <dd>{step.actual}</dd>
                                  </div>
                                </dl>
                                {step.evidenceError && (
                                  <p className="cp-evidence-error">
                                    截圖紀錄：{step.evidenceError}
                                  </p>
                                )}
                                <div className="cp-assertion-footer">
                                  <Status value={step.status} />
                                  <span>
                                    <Clock3 size={14} />
                                    {(step.durationMs / 1000).toFixed(1)} 秒
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="cp-case-footer">
                          <span>
                            {active.browserVersion ?? "瀏覽器版本未取得"}
                          </span>
                          {trace && (
                            <a href={trace} download>
                              下載失敗追蹤檔
                              <ArrowDownToLine size={14} />
                            </a>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="cp-inspection-empty">
                        <Focus size={36} />
                        <h3>
                          {loading
                            ? "正在讀取執行紀錄"
                            : report
                              ? "此條件沒有案例"
                              : "尚未取得巡檢紀錄"}
                        </h3>
                        <p>
                          {report
                            ? "可以切換畫面尺寸或狀態，查看其他案例。"
                            : "報告由真實瀏覽器執行產生；沒有資料時不顯示示範結果。"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </section>
        <section
          className="cp-tool"
          id="checkpoint-tool"
          aria-labelledby="cp-tool-title"
        >
          <div>
            <p className="cp-eyebrow">RUN IT YOURSELF</p>
            <h2 id="cp-tool-title">
              讓瀏覽器，
              <br />
              自己走一遍。
            </h2>
            <p>
              下載、解壓縮，在工具資料夾開啟 PowerShell。工具會啟動自己的
              Chromium，操作過程看得見。
            </p>
            <div className="cp-tool-links">
              <a
                href={`${base}/downloads/checkpoint-python.zip`}
                className="cp-button cp-button-orange"
              >
                <ArrowDownToLine size={16} />
                Python 工具
              </a>
              <a
                href={`${repository}/tree/main/tools/checkpoint`}
                target="_blank"
                rel="noreferrer"
              >
                查看原始碼
                <ArrowUpRight size={15} />
              </a>
            </div>
          </div>
          <div className="cp-terminal">
            <div>
              <span>
                <Code2 size={16} />
                WINDOWS / PYTHON 3.11+
              </span>
              <button
                aria-label="複製安裝與執行指令"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(commands);
                    setNotice("已複製安裝與執行指令。");
                  } catch {
                    setNotice("無法自動複製，請手動選取下方指令。");
                  }
                }}
              >
                <Copy size={15} />
                複製
              </button>
            </div>
            <pre>
              <code>{commands}</code>
            </pre>
            <p>巡檢自己的公開網站，將最後一行改為：</p>
            <pre>
              <code>
                .\.venv\Scripts\python.exe checkpoint.py --url
                https://example.com
              </code>
            </pre>
            <p>
              自訂網址只做基本巡檢，不點擊、登入或提交表單。首次安裝需要下載
              Chromium。
            </p>
          </div>
        </section>
        <p className="cp-notice" role="status">
          {notice}
        </p>
        <footer className="cp-footer">
          <p>只測試有權操作的網站。報告與截圖保存在本機，不自動上傳。</p>
          <div>
            {report && (
              <>
                <a href={`${reportRoot}/report.json`} download>
                  <FileJson2 size={15} />
                  JSON 報告
                </a>
                <a
                  href={`${reportRoot}/report.html`}
                  target="_blank"
                  rel="noreferrer"
                >
                  完整報告
                  <ArrowUpRight size={14} />
                </a>
              </>
            )}
            <span>CHECKPOINT / {report?.toolVersion ?? "1.0.0"}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
