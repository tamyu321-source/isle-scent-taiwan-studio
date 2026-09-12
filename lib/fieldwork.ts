export type VerificationStatus =
  "unverified" | "matched" | "conflict" | "failed";
export type SourceValues = Record<
  "name" | "address" | "phone" | "hours",
  string
>;
export type Observation = {
  id: string;
  label: string;
  url: string;
  fetchedAt: string;
  updatedAt: string | null;
  hoursUpdatedAt?: string | null;
  values: SourceValues;
};
export type Merchant = SourceValues & {
  id: string;
  city: string;
  district: string;
  differences: (keyof SourceValues)[];
  sources: Observation[];
  verification: {
    status: VerificationStatus;
    checkedAt: string | null;
    lastAttemptAt: string | null;
    error: string | null;
  };
};
export type SourceRun = {
  id: string;
  label: string;
  attemptedAt: string;
  lastSuccessAt: string | null;
  status: "ok" | "partial" | "failed" | "skipped";
  processed?: number;
  failed?: number;
  note?: string;
  error: string | null;
};
export type Snapshot = {
  schemaVersion: 1;
  generatedAt: string;
  run: {
    startedAt: string;
    status: "ok" | "partial" | "stale";
    sources: SourceRun[];
    total: number;
    duplicatesRemoved: number;
  };
  merchants: Merchant[];
};
export type Filters = {
  keyword: string;
  city: string;
  district: string;
  status: string;
  sort: string;
};

export const statusLabels: Record<VerificationStatus, string> = {
  unverified: "官方資料",
  matched: "已核對欄位",
  conflict: "來源有差異",
  failed: "核對失敗",
};
export const fieldLabels: Record<keyof SourceValues, string> = {
  name: "店家名稱",
  address: "地址",
  phone: "電話",
  hours: "營業時間",
};
export const emptyFilters: Filters = {
  keyword: "",
  city: "all",
  district: "all",
  status: "all",
  sort: "name",
};
const collator = new Intl.Collator("zh-Hant-TW");

export function normalizeSearch(value: string) {
  return value
    .normalize("NFKC")
    .replaceAll("台", "臺")
    .replace(/[\s,，。｜|·]+/g, "")
    .toLowerCase();
}

export function timestamp(value: string | null | undefined) {
  if (!value) return 0;
  const zoned =
    /T/.test(value) && !/(Z|[+-]\d\d:\d\d)$/.test(value)
      ? `${value}+08:00`
      : value;
  return Date.parse(zoned) || 0;
}

export function formatTime(value: string | null | undefined) {
  const time = timestamp(value);
  return time
    ? new Intl.DateTimeFormat("zh-TW", {
        timeZone: "Asia/Taipei",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(time)
    : "未提供";
}

export function filterMerchants(records: Merchant[], filters: Filters) {
  const keyword = normalizeSearch(filters.keyword);
  return records
    .filter(
      (row) =>
        (filters.city === "all" || row.city === filters.city) &&
        (filters.district === "all" || row.district === filters.district) &&
        (filters.status === "all" ||
          row.verification.status === filters.status) &&
        (!keyword ||
          normalizeSearch(
            [row.name, row.city, row.district, row.address, row.phone].join(
              " ",
            ),
          ).includes(keyword)),
    )
    .sort((a, b) => {
      const byName =
        collator.compare(a.name, b.name) || a.id.localeCompare(b.id);
      if (filters.sort === "updated")
        return (
          timestamp(b.sources[0]?.updatedAt) -
            timestamp(a.sources[0]?.updatedAt) || byName
        );
      if (filters.sort === "district")
        return (
          collator.compare(a.city + a.district, b.city + b.district) || byName
        );
      return byName;
    });
}

export function isSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== "object") return false;
  const data = value as Snapshot;
  return (
    data.schemaVersion === 1 &&
    timestamp(data.generatedAt) > 0 &&
    ["ok", "partial", "stale"].includes(data.run?.status) &&
    Array.isArray(data.run?.sources) &&
    Array.isArray(data.merchants) &&
    data.merchants.length > 0 &&
    new Set(data.merchants.map((row) => row?.id)).size ===
      data.merchants.length &&
    data.merchants.every(
      (row) =>
        row &&
        typeof row.id === "string" &&
        typeof row.name === "string" &&
        typeof row.city === "string" &&
        typeof row.district === "string" &&
        [row.address, row.phone, row.hours].every(
          (field) => typeof field === "string",
        ) &&
        Array.isArray(row.differences) &&
        Object.hasOwn(statusLabels, row.verification?.status ?? "") &&
        Array.isArray(row.sources) &&
        row.sources.length > 0 &&
        row.sources.every(
          (source) =>
            source &&
            typeof source.url === "string" &&
            typeof source.label === "string" &&
            timestamp(source.fetchedAt) > 0 &&
            source.values &&
            Object.keys(fieldLabels).every(
              (key) =>
                typeof source.values[key as keyof SourceValues] === "string",
            ),
        ),
    )
  );
}

export function safeSourceUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" &&
      ["data.gov.tw", "www.twtainan.net"].includes(parsed.hostname)
      ? parsed.href
      : undefined;
  } catch {
    return undefined;
  }
}

export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text.trimStart()) || /^[\t\r\n]/.test(text))
    text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function merchantCsv(records: Merchant[]) {
  const header = [
    "識別碼",
    "店家名稱",
    "城市",
    "行政區",
    "地址",
    "電話",
    "營業時間",
    "核對狀態",
    "來源網址",
    "來源更新時間",
    "擷取時間",
    "網頁核對時間",
  ];
  const rows = records.map((row) => [
    row.id,
    row.name,
    row.city,
    row.district,
    row.address,
    row.phone,
    row.hours,
    statusLabels[row.verification.status],
    row.sources.map((source) => source.url).join(" | "),
    row.sources
      .map((source) => `${source.label}: ${source.updatedAt || "未提供"}`)
      .join(" | "),
    row.sources
      .map((source) => `${source.label}: ${source.fetchedAt}`)
      .join(" | "),
    row.verification.checkedAt || "",
  ]);
  return (
    "\ufeff" +
    [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") +
    "\r\n"
  );
}
