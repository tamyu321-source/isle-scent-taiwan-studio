export const checkpointStatuses = {
  passed: "通過",
  failed: "失敗",
  blocked: "受阻",
  skipped: "未執行",
} as const;

export type CheckpointStatus = keyof typeof checkpointStatuses;
export type CheckpointStep = {
  id: string;
  title: string;
  expected: string;
  actual: string;
  status: CheckpointStatus;
  durationMs: number;
  screenshot?: string;
  evidenceError?: string;
};
export type CheckpointCase = {
  id: string;
  title: string;
  viewport: "desktop" | "mobile";
  dimensions: { width: number; height: number };
  status: CheckpointStatus;
  durationMs: number;
  browserVersion?: string;
  trace?: string;
  steps: CheckpointStep[];
};
export type CheckpointReport = {
  schemaVersion: 1;
  runId: string;
  toolVersion: string;
  startedAt: string;
  finishedAt: string | null;
  complete: boolean;
  status: CheckpointStatus;
  environment: string;
  target: string;
  revision: string;
  actionsUrl?: string;
  cases: CheckpointCase[];
};

export function isCheckpointReport(value: unknown): value is CheckpointReport {
  if (!value || typeof value !== "object") return false;
  const report = value as CheckpointReport;
  const text = (value: unknown) => typeof value === "string";
  const status = (value: unknown) =>
    typeof value === "string" && Object.hasOwn(checkpointStatuses, value);
  const duration = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0;
  return (
    report.schemaVersion === 1 &&
    text(report.runId) &&
    text(report.toolVersion) &&
    text(report.startedAt) &&
    Number.isFinite(Date.parse(report.startedAt)) &&
    (report.finishedAt === null ||
      (text(report.finishedAt) &&
        Number.isFinite(Date.parse(report.finishedAt)))) &&
    typeof report.complete === "boolean" &&
    status(report.status) &&
    [report.environment, report.target, report.revision].every(text) &&
    Array.isArray(report.cases) &&
    report.cases.length <= 100 &&
    report.cases.every(
      (item) =>
        item &&
        text(item.id) &&
        text(item.title) &&
        ["desktop", "mobile"].includes(item.viewport) &&
        status(item.status) &&
        duration(item.durationMs) &&
        item.dimensions &&
        duration(item.dimensions.width) &&
        duration(item.dimensions.height) &&
        Array.isArray(item.steps) &&
        item.steps.length <= 100 &&
        item.steps.every(
          (step) =>
            step &&
            [step.id, step.title, step.expected, step.actual].every(text) &&
            status(step.status) &&
            duration(step.durationMs) &&
            (step.screenshot === undefined || text(step.screenshot)),
        ),
    )
  );
}

export function checkpointArtifact(path: string | undefined, root: string) {
  if (
    typeof path !== "string" ||
    !path ||
    !/^[a-zA-Z0-9_./-]+$/.test(path) ||
    path.split("/").some((part) => !part || part === "." || part === "..")
  )
    return undefined;
  return `${root}/${path}`;
}

export function checkpointActionsUrl(url: string | undefined) {
  return url &&
    /^https:\/\/github\.com\/tamyu321-source\/isle-scent-taiwan-studio\/actions\/runs\/\d+$/.test(
      url,
    )
    ? url
    : undefined;
}

export function checkpointTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("zh-TW", {
        timeZone: "Asia/Taipei",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(value))
    : "尚未完成";
}
