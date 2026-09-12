"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Database,
  FileJson2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Terminal,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  emptyFilters,
  fieldLabels,
  filterMerchants,
  formatTime,
  isSnapshot,
  merchantCsv,
  safeSourceUrl,
  statusLabels,
  timestamp,
  type Filters,
  type Merchant,
  type Snapshot,
} from "@/lib/fieldwork";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const PAGE_SIZE = 15;
const command =
  "py -3.11 -X utf8 fieldwork.py --output-dir output --max-pages 100";
const runLabels = {
  ok: "完成",
  partial: "部分完成",
  failed: "失敗",
  skipped: "未執行",
  stale: "使用上次資料",
};

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="fw-filter">
      <span>{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="fw-select" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="fw-select-menu" position="popper">
          {options.map(([key, text]) => (
            <SelectItem value={key} key={key}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Status({ row }: { row: Merchant }) {
  return (
    <span className={`fw-status fw-status-${row.verification.status}`}>
      {statusLabels[row.verification.status]}
    </span>
  );
}

export function Fieldwork() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Merchant | null>(null);
  const [notice, setNotice] = useState("");
  const [exportScope, setExportScope] = useState("filtered");
  const request = useRef<AbortController | null>(null);
  const detailTrigger = useRef<HTMLButtonElement | null>(null);

  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    const timeout = window.setTimeout(() => {
      controller.abort();
      if (request.current === controller) {
        setLoading(false);
        setError("讀取快照逾時，請稍後重試；已顯示的資料仍可使用。");
      }
    }, 15000);
    try {
      const response = await fetch(`${base}/data/fieldwork/merchants.json`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: unknown = await response.json();
      if (!isSnapshot(data)) throw new Error("資料格式不完整");
      if (controller.signal.aborted) return;
      setSnapshot(data);
      setSelected(new Set());
      setPage(1);
      setDetail(null);
      setNotice("已載入發佈資料；這個按鈕不會啟動爬蟲。");
    } catch (reason) {
      if (!controller.signal.aborted)
        setError(
          `無法載入最新快照。${reason instanceof Error ? reason.message : "請稍後重試"}；已顯示的資料仍可使用。`,
        );
    } finally {
      window.clearTimeout(timeout);
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => request.current?.abort();
  }, [refresh]);

  const records = snapshot?.merchants ?? [];
  const filtered = useMemo(
    () => filterMerchants(snapshot?.merchants ?? [], filters),
    [snapshot, filters],
  );
  const currentResults = useRef({ snapshot, filters, filtered });
  useEffect(() => {
    currentResults.current = { snapshot, filters, filtered };
  }, [snapshot, filters, filtered]);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "read_fieldwork_results",
            title: "讀取目前店家篩選結果",
            description:
              "讀取畫面上目前篩選條件與最多 30 筆店家資料，不啟動爬蟲、不變更篩選或下載檔案。",
            inputSchema: {
              type: "object",
              properties: {
                limit: { type: "integer", minimum: 1, maximum: 30 },
              },
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute(input) {
              if (!input || typeof input !== "object" || Array.isArray(input))
                throw new Error("需要物件參數");
              const args = input as Record<string, unknown>;
              const limit = args.limit ?? 15;
              if (
                Object.keys(args).some((key) => key !== "limit") ||
                typeof limit !== "number" ||
                !Number.isInteger(limit) ||
                limit < 1 ||
                limit > 30
              )
                throw new Error("limit 必須為 1–30 的整數");
              const current = currentResults.current;
              if (!current.snapshot) throw new Error("資料尚未載入");
              return {
                generatedAt: current.snapshot.generatedAt,
                filters: current.filters,
                total: current.filtered.length,
                merchants: current.filtered.slice(0, limit),
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => undefined);
    } catch {
      // The visible workspace remains usable in browsers without this optional API.
    }
    return () => lifecycle.abort();
  }, []);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const districts = [
    ...new Set(
      records
        .filter((row) => filters.city === "all" || row.city === filters.city)
        .map((row) => row.district)
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, "zh-Hant"));
  const selectedRecords = records.filter((row) => selected.has(row.id));
  const exportRecords = exportScope === "selected" ? selectedRecords : filtered;
  const checkedCount = records.filter(
    (row) => row.verification.checkedAt,
  ).length;
  const oldSnapshot = snapshot
    ? Date.now() - timestamp(snapshot.generatedAt) > 48 * 60 * 60 * 1000
    : false;
  const wholePageSelected =
    visible.length > 0 && visible.every((row) => selected.has(row.id));
  const partialPageSelected = visible.some((row) => selected.has(row.id));

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "city" ? { district: "all" } : {}),
    }));
    setPage(1);
  };
  const toggleRow = (id: string, checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  const togglePage = () =>
    setSelected((current) => {
      const next = new Set(current);
      visible.forEach((row) => {
        if (wholePageSelected) next.delete(row.id);
        else next.add(row.id);
      });
      return next;
    });
  const download = (format: "csv" | "json") => {
    if (!snapshot || !exportRecords.length) return;
    const content =
      format === "csv"
        ? merchantCsv(exportRecords)
        : JSON.stringify(
            {
              ...snapshot,
              merchants: exportRecords,
              export: {
                exportedAt: new Date().toISOString(),
                scope: exportScope,
                filters,
                count: exportRecords.length,
              },
            },
            null,
            2,
          );
    const url = URL.createObjectURL(
      new Blob([content], {
        type:
          format === "csv"
            ? "text/csv;charset=utf-8"
            : "application/json;charset=utf-8",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fieldwork-${exportScope}-${exportRecords.length}.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`已匯出 ${exportRecords.length} 筆 ${format.toUpperCase()}。`);
  };

  return (
    <main className="fw-root" id="fieldwork-top">
      <a className="fw-skip" href="#merchant-results">
        跳至店家資料
      </a>
      <header className="fw-header">
        <a className="fw-brand" href={`${base}/fieldwork/`}>
          <span className="fw-brand-mark">F</span>FIELDWORK
          <span className="fw-version">/ 01</span>
        </a>
        <span className="fw-header-label">PUBLIC DATA WORKSPACE</span>
        <a className="fw-back" href={`${base}/#project-07`}>
          <ArrowLeft size={16} />
          作品集
        </a>
      </header>

      <div className="fw-workspace">
        <aside className="fw-sidebar" aria-label="資料來源與工具">
          <div className="fw-sidebar-top">
            <span className="fw-section-code">01 / DIRECTORY</span>
            <h1>
              商家資料
              <br />
              工作台<span>_</span>
            </h1>
            <p>
              臺南 × 桃園
              <br />
              餐飲・伴手禮
            </p>
          </div>
          <a className="fw-nav-active" href="#merchant-results">
            <Database size={17} />
            店家資料<span>{records.length || "—"}</span>
          </a>
          <a className="fw-nav-link" href="#fieldwork-tool">
            <Code2 size={17} />
            Python 工具
          </a>
          <div className="fw-source-panel">
            <h2>來源連線紀錄</h2>
            {snapshot?.run.sources.map((source) => (
              <div className="fw-source" key={source.id}>
                <div>
                  <span>{source.label}</span>
                  <span data-status={source.status}>
                    {runLabels[source.status]}
                  </span>
                </div>
                <p>
                  最近成功
                  <br />
                  <time>{formatTime(source.lastSuccessAt)}</time>
                </p>
                {source.processed !== undefined && (
                  <p>
                    本次 {source.processed} 筆
                    {source.failed ? ` / 失敗 ${source.failed} 筆` : ""}
                  </p>
                )}
                {source.error && (
                  <p className="fw-source-error">{source.error}</p>
                )}
                {source.note && (
                  <details>
                    <summary>來源備註</summary>
                    <p>{source.note}</p>
                  </details>
                )}
              </div>
            ))}
            {!snapshot && <p>讀取發佈快照後顯示。</p>}
          </div>
          <div className="fw-sidebar-foot">
            <span>DATA, WITH A SOURCE.</span>
            <p>
              公開來源的記載
              <br />
              不是營業狀態保證。
            </p>
          </div>
        </aside>

        <div className="fw-main">
          <div className="fw-page-heading">
            <div>
              <p className="fw-section-code">TAIWAN / BUSINESS INTELLIGENCE</p>
              <h2>
                找到資料。<span>留下依據。</span>
              </h2>
              <p>搜尋、核對來源，匯出你需要的名單。</p>
            </div>
            <button
              className="fw-button fw-refresh"
              onClick={() => void refresh()}
              disabled={loading}
            >
              <RefreshCw size={16} />
              {loading ? "讀取中" : "重載發佈資料"}
            </button>
          </div>
          <div className="fw-stats">
            <div>
              <span>收錄店家 / RECORDS</span>
              <strong>
                {snapshot ? records.length.toLocaleString() : "—"}
                <small>筆</small>
              </strong>
            </div>
            <div>
              <span>涵蓋城市 / CITIES</span>
              <strong>
                {snapshot ? new Set(records.map((row) => row.city)).size : "—"}
                <small>座</small>
              </strong>
            </div>
            <div>
              <span>曾核對網頁 / CHECKED</span>
              <strong>
                {snapshot ? checkedCount : "—"}
                <small>筆</small>
              </strong>
            </div>
            <div className="fw-publish-stat">
              <span>快照產生 / SNAPSHOT</span>
              <strong>
                {snapshot ? formatTime(snapshot.generatedAt) : "讀取中"}
              </strong>
              <small>
                {snapshot ? runLabels[snapshot.run.status] : "等待資料"} ·
                臺灣時間
              </small>
            </div>
          </div>
          {(error || oldSnapshot || snapshot?.run.status === "stale") && (
            <div className="fw-warning" role="alert">
              {error ||
                (oldSnapshot
                  ? "快照已超過 48 小時未更新，請留意排程狀態與來源時間。"
                  : "本次官方來源讀取失敗，以下保留上次有效資料。")}
            </div>
          )}

          <section
            className="fw-results"
            id="merchant-results"
            aria-labelledby="fw-results-title"
            aria-busy={loading}
          >
            <div className="fw-section-heading">
              <h2 id="fw-results-title">
                <SlidersHorizontal size={18} />
                店家資料
              </h2>
              <span>{filtered.length.toLocaleString()} RESULTS</span>
            </div>
            <div className="fw-filters">
              <label className="fw-search">
                <span>搜尋店家</span>
                <div>
                  <Search size={18} />
                  <input
                    value={filters.keyword}
                    onChange={(event) =>
                      updateFilter("keyword", event.target.value)
                    }
                    placeholder="名稱、地址或電話"
                  />
                </div>
              </label>
              <FilterSelect
                label="城市"
                value={filters.city}
                onChange={(value) => updateFilter("city", value)}
                options={[
                  ["all", "全部城市"],
                  ["臺南市", "臺南市"],
                  ["桃園市", "桃園市"],
                ]}
              />
              <FilterSelect
                label="行政區"
                value={filters.district}
                onChange={(value) => updateFilter("district", value)}
                options={[
                  ["all", "全部行政區"],
                  ...districts.map((district): [string, string] => [
                    district,
                    district,
                  ]),
                ]}
              />
              <FilterSelect
                label="核對狀態"
                value={filters.status}
                onChange={(value) => updateFilter("status", value)}
                options={[["all", "全部狀態"], ...Object.entries(statusLabels)]}
              />
            </div>
            <div className="fw-table-toolbar">
              <div>
                <span>
                  已選 <b>{selected.size}</b> 筆
                </span>
                {selected.size > 0 && (
                  <button onClick={() => setSelected(new Set())}>
                    清除選取
                  </button>
                )}
                <button
                  onClick={() => {
                    setFilters(emptyFilters);
                    setPage(1);
                  }}
                >
                  重設篩選
                </button>
              </div>
              <FilterSelect
                label="排序"
                value={filters.sort}
                onChange={(value) => updateFilter("sort", value)}
                options={[
                  ["name", "店家名稱"],
                  ["district", "城市／行政區"],
                  ["updated", "來源更新：新到舊"],
                ]}
              />
            </div>
            <Table className="fw-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="fw-check-cell">
                    <Checkbox
                      aria-label="選取本頁全部店家"
                      checked={
                        wholePageSelected
                          ? true
                          : partialPageSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={togglePage}
                      disabled={!visible.length}
                    />
                  </TableHead>
                  <TableHead>店家名稱 / NAME</TableHead>
                  <TableHead className="fw-location-cell">區域</TableHead>
                  <TableHead className="fw-phone-cell">電話</TableHead>
                  <TableHead className="fw-status-cell">來源核對</TableHead>
                  <TableHead className="fw-action-cell">
                    <span className="sr-only">明細</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={selected.has(row.id) ? "selected" : undefined}
                  >
                    <TableCell className="fw-check-cell">
                      <Checkbox
                        aria-label={`選取 ${row.name}`}
                        checked={selected.has(row.id)}
                        onCheckedChange={(value) =>
                          toggleRow(row.id, value === true)
                        }
                      />
                    </TableCell>
                    <TableCell className="fw-name-cell">
                      <button
                        onClick={(event) => {
                          detailTrigger.current = event.currentTarget;
                          setDetail(row);
                        }}
                      >
                        {row.name}
                      </button>
                      <p>{row.address || "地址未提供"}</p>
                      <div className="fw-mobile-meta">
                        {row.phone || "電話未提供"}
                        <Status row={row} />
                      </div>
                    </TableCell>
                    <TableCell className="fw-location-cell">
                      {row.city}
                      <span>{row.district}</span>
                    </TableCell>
                    <TableCell className="fw-phone-cell">
                      {row.phone || "未提供"}
                    </TableCell>
                    <TableCell className="fw-status-cell">
                      <Status row={row} />
                      <span className="fw-source-count">
                        {row.sources.length} 個來源
                      </span>
                    </TableCell>
                    <TableCell className="fw-action-cell">
                      <button
                        aria-label={`查看 ${row.name} 明細`}
                        onClick={(event) => {
                          detailTrigger.current = event.currentTarget;
                          setDetail(row);
                        }}
                      >
                        <ArrowUpRight size={19} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {!visible.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="fw-empty">
                      <Search size={25} />
                      <h3>
                        {loading
                          ? "正在讀取店家資料"
                          : snapshot
                            ? "沒有符合條件的店家"
                            : "目前無法取得資料"}
                      </h3>
                      <p>
                        {loading
                          ? "資料來自已發佈的公開來源快照。"
                          : snapshot
                            ? "試試其他關鍵字，或重設篩選。"
                            : "請重新載入；不會以示範資料取代真實資料。"}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="fw-pagination">
              <span>
                {filtered.length
                  ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)}`
                  : "0"}{" "}
                / {filtered.length} 筆
              </span>
              <Pagination aria-label="店家清單分頁">
                <PaginationContent>
                  <PaginationItem>
                    <button
                      aria-label="上一頁"
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      <ChevronLeft size={18} />
                    </button>
                  </PaginationItem>
                  <PaginationItem>
                    <span aria-live="polite">
                      {currentPage} / {pages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <button
                      aria-label="下一頁"
                      disabled={currentPage === pages}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </section>

          <section className="fw-export" aria-label="匯出店家資料">
            <div>
              <ArrowDownToLine size={23} />
              <div>
                <h2>帶走這份名單</h2>
                <p>CSV 可用 Excel 開啟；JSON 保留各來源原始欄位。</p>
              </div>
            </div>
            <div className="fw-export-actions">
              <FilterSelect
                label="匯出範圍"
                value={exportScope}
                onChange={setExportScope}
                options={[
                  ["filtered", `篩選結果（${filtered.length}）`],
                  ["selected", `勾選資料（${selected.size}）`],
                ]}
              />
              <button
                className="fw-button fw-button-primary"
                onClick={() => download("csv")}
                disabled={!exportRecords.length}
              >
                <ArrowDownToLine size={16} />
                CSV
              </button>
              <button
                className="fw-button"
                onClick={() => download("json")}
                disabled={!exportRecords.length}
              >
                <FileJson2 size={16} />
                JSON
              </button>
            </div>
          </section>
          <p className="fw-notice" role="status">
            {notice}
          </p>

          <section
            className="fw-tool"
            id="fieldwork-tool"
            aria-labelledby="fw-tool-title"
          >
            <div>
              <p className="fw-section-code">02 / RUN IT YOURSELF</p>
              <h2 id="fw-tool-title">
                <Terminal size={24} />讓 Python 做蒐集。
              </h2>
              <p>
                在自己的電腦更新資料，輸出可直接交付的名單。工具包含 HTML
                爬取、欄位核對與 CSV／JSON 匯出，無須 API 金鑰。
              </p>
              <a
                className="fw-button"
                href={`${base}/downloads/fieldwork-python.zip`}
                download
              >
                <ArrowDownToLine size={17} />
                下載 Python 工具
              </a>
              <a
                className="fw-code-link"
                href="https://github.com/tamyu321-source/isle-scent-taiwan-studio/tree/main/tools/fieldwork"
                target="_blank"
                rel="noreferrer"
              >
                查看原始碼 <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="fw-terminal">
              <div>
                <span>POWERSHELL / PYTHON 3.11+</span>
                <button
                  aria-label="複製執行指令"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(command);
                      setNotice("執行指令已複製。");
                    } catch {
                      setNotice("無法自動複製，請選取下方指令。 ");
                    }
                  }}
                >
                  <Check size={15} />
                  複製
                </button>
              </div>
              <p>解壓縮後，在工具資料夾開啟 PowerShell：</p>
              <code>{command}</code>
              <ul>
                <li>
                  <span>01</span>讀取官方資料，整合營業時間
                </li>
                <li>
                  <span>02</span>低頻核對臺南店家 HTML，每次最多 100 頁
                </li>
                <li>
                  <span>03</span>輸出 merchants.csv、merchants.json 與執行摘要
                </li>
              </ul>
              <p>
                網站使用排程發佈的快照，訪客不會啟動遠端爬蟲。排程預計每日 08:17
                執行，可能延遲。
              </p>
            </div>
          </section>
          <footer className="fw-footer">
            <p>
              來源收錄範圍不等於全市店家總數。電話、地址與營業時間請向店家再次確認。
            </p>
            <div>
              <a
                href="https://data.gov.tw/dataset/7779"
                target="_blank"
                rel="noreferrer"
              >
                觀光署開放資料 ↗
              </a>
              <a
                href="https://data.gov.tw/license"
                target="_blank"
                rel="noreferrer"
              >
                政府資料開放授權條款第 1 版 ↗
              </a>
              <a
                href="https://www.twtainan.net/zh-tw/gwoia/"
                target="_blank"
                rel="noreferrer"
              >
                臺南旅遊網使用須知 ↗
              </a>
            </div>
            <span>FIELDWORK / A YORKE HSU PROJECT</span>
          </footer>
        </div>
      </div>

      <Sheet
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <SheetContent
          className="fw-detail"
          showCloseButton={false}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            detailTrigger.current?.focus();
          }}
        >
          <SheetClose className="fw-detail-close" aria-label="關閉店家明細">
            <X size={23} />
          </SheetClose>
          <p className="fw-section-code">RECORD / SOURCE INSPECTION</p>
          <SheetTitle>{detail?.name ?? "店家明細"}</SheetTitle>
          <SheetDescription>
            原始欄位依來源並列；成功讀取頁面不代表已確認仍在營業。
          </SheetDescription>
          {detail && (
            <>
              <div className="fw-detail-summary">
                <Status row={detail} />
                <span>
                  {detail.city} / {detail.district}
                </span>
              </div>
              <dl className="fw-detail-times">
                <div>
                  <dt>最近網頁核對成功</dt>
                  <dd>{formatTime(detail.verification.checkedAt)}</dd>
                </div>
                <div>
                  <dt>最近網頁核對嘗試</dt>
                  <dd>{formatTime(detail.verification.lastAttemptAt)}</dd>
                </div>
              </dl>
              {detail.verification.error && (
                <p className="fw-warning">
                  {detail.verification.error}。先前成功取得的資料仍保留。
                </p>
              )}
              {detail.differences.length > 0 && (
                <p className="fw-warning">
                  以下欄位有差異：
                  {detail.differences
                    .map((field) => fieldLabels[field])
                    .join("、")}
                  。可能是格式或更新時間不同，請向店家確認。
                </p>
              )}
              {detail.sources.map((source) => (
                <article className="fw-observation" key={source.id}>
                  <h3>
                    {source.label}
                    <a
                      href={safeSourceUrl(source.url)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`開啟${source.label}來源`}
                    >
                      <ArrowUpRight size={18} />
                    </a>
                  </h3>
                  <dl>
                    {Object.entries(fieldLabels).map(([field, label]) => (
                      <div
                        key={field}
                        data-difference={detail.differences.includes(
                          field as keyof typeof fieldLabels,
                        )}
                      >
                        <dt>{label}</dt>
                        <dd>
                          {source.values[field as keyof typeof fieldLabels] ||
                            "來源未提供"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="fw-observation-time">
                    來源更新：{formatTime(source.updatedAt)}
                    <br />
                    實際擷取：{formatTime(source.fetchedAt)}
                    {source.hoursUpdatedAt && (
                      <>
                        <br />
                        營業時間資料更新：{formatTime(source.hoursUpdatedAt)}
                      </>
                    )}
                  </div>
                </article>
              ))}
              <p className="fw-record-id">{detail.id}</p>
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}
