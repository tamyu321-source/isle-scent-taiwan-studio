export type ObjectClass = "vehicle" | "pedestrian" | "cyclist";
export type Annotation = {
  id: string;
  category: ObjectClass;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  length: number;
  rotation: number;
  confidence: number;
  reviewed: boolean;
  occluded: boolean;
};
export type TaskStatus = "queued" | "active" | "review" | "done";
export type Task = {
  id: string;
  name: string;
  location: string;
  frames: number;
  status: TaskStatus;
  owner: string;
  priority: string;
};
export type Log = {
  id: string;
  time: string;
  message: string;
  kind: "info" | "success" | "warning";
};
export type ProjectData = {
  version: 1;
  annotations: Record<string, Annotation[]>;
  tasks: Task[];
  logs: Log[];
};
export const CLASSES: Record<
  ObjectClass,
  { label: string; english: string; color: string; dimensions: number[] }
> = {
  vehicle: {
    label: "車輛",
    english: "Vehicle",
    color: "#c8f36a",
    dimensions: [2, 1.7, 4.4],
  },
  pedestrian: {
    label: "行人",
    english: "Pedestrian",
    color: "#ffb77b",
    dimensions: [0.7, 1.8, 0.7],
  },
  cyclist: {
    label: "自行車",
    english: "Cyclist",
    color: "#9f9aff",
    dimensions: [0.8, 1.7, 1.9],
  },
};
export const SCENES = [
  {
    id: "scene-042",
    name: "城市路口",
    english: "Urban intersection",
    location: "TAIPEI · ZHONGSHAN",
    time: "09:41:32",
    seed: 42,
  },
  {
    id: "scene-043",
    name: "林蔭大道",
    english: "Tree-lined avenue",
    location: "TAIPEI · DAAN",
    time: "10:08:16",
    seed: 43,
  },
  {
    id: "scene-044",
    name: "住宅街區",
    english: "Residential street",
    location: "TAINAN · EAST",
    time: "14:22:08",
    seed: 44,
  },
];
export const FRAME_COUNT = 120;
export const STORE_KEY = "vector-perception-v1";
export function initialAnnotations(seed: number): Annotation[] {
  const shift = (seed - 42) * 2;
  return [
    ["vehicle", -3.5, -1 + shift, 0.97],
    ["vehicle", 3.5, -13 + shift, 0.94],
    ["vehicle", -3.5, 12 + shift, 0.91],
    ["vehicle", 3.5, 21 + shift, 0.88],
    ["vehicle", -3.5, -22 + shift, 0.96],
    ["vehicle", 3.5, 5 + shift, 0.93],
    ["pedestrian", 10, 2 + shift, 0.76],
    ["pedestrian", -11, -9 + shift, 0.92],
    ["cyclist", 7, -9 + shift, 0.84],
  ].map(([category, x, z, confidence], i) => {
    const c = category as ObjectClass;
    const [width, height, length] = CLASSES[c].dimensions;
    return {
      id: `${c === "vehicle" ? "VEH" : c === "pedestrian" ? "PED" : "CYC"}-${String(i + 1).padStart(3, "0")}`,
      category: c,
      x: Number(x),
      y: height / 2,
      z: Number(z),
      width,
      height,
      length,
      rotation: Number(x) > 0 ? 180 : 0,
      confidence: Number(confidence),
      reviewed: i < 5,
      occluded: i === 6,
    };
  });
}
export function initialProject(): ProjectData {
  return {
    version: 1,
    annotations: Object.fromEntries(
      SCENES.map((s) => [s.id, initialAnnotations(s.seed)]),
    ),
    tasks: SCENES.map((s, i) => ({
      id: s.id,
      name: s.name,
      location: s.location,
      frames: FRAME_COUNT,
      status: i === 0 ? "active" : i === 1 ? "review" : "queued",
      owner: i === 1 ? "Alex Chen" : "Yorke Hsu",
      priority: i === 0 ? "高" : "一般",
    })),
    logs: [
      {
        id: "init",
        time: "09:41:32",
        message: "已載入 3 組合成場景與 27 個示範標註。",
        kind: "info",
      },
    ],
  };
}
export function positionAt(a: Annotation, frame: number) {
  const speed =
    a.category === "vehicle" ? 0.07 : a.category === "cyclist" ? 0.045 : 0.013;
  const distance = (frame - 42) * speed;
  const heading = (a.rotation * Math.PI) / 180;
  return {
    x: a.x + Math.sin(heading) * distance,
    y: a.y,
    z: a.z + Math.cos(heading) * distance,
  };
}
export function issuesFor(annotations: Annotation[]) {
  return annotations.flatMap((a) => [
    ...(a.confidence < 0.85 && !a.reviewed
      ? [
          {
            id: a.id,
            severity: "warning",
            message: `信心值 ${Math.round(a.confidence * 100)}%，需要人工覆核`,
          },
        ]
      : []),
    ...(a.occluded && !a.reviewed
      ? [
          {
            id: a.id,
            severity: "warning",
            message: "物件有遮擋，請確認邊界框完整性",
          },
        ]
      : []),
    ...(!a.reviewed && a.confidence >= 0.85 && !a.occluded
      ? [{ id: a.id, severity: "info", message: "標註尚未完成覆核" }]
      : []),
  ]);
}
export function parseProject(value: unknown): ProjectData {
  if (!value || typeof value !== "object")
    throw new Error("檔案必須是 VECTOR JSON 專案。");
  const p = value as ProjectData;
  if (
    p.version !== 1 ||
    !p.annotations ||
    !Array.isArray(p.tasks) ||
    !Array.isArray(p.logs)
  )
    throw new Error("專案格式或版本不符。");
  for (const scene of SCENES) {
    const items = p.annotations[scene.id];
    if (!Array.isArray(items) || items.length > 200)
      throw new Error("每個場景需包含 0–200 個標註。");
    const ids = new Set<string>();
    for (const a of items) {
      if (
        !a ||
        typeof a.id !== "string" ||
        !/^[\w-]{1,40}$/.test(a.id) ||
        ids.has(a.id) ||
        !Object.hasOwn(CLASSES, a.category)
      )
        throw new Error("標註 ID 或分類不正確。");
      ids.add(a.id);
      for (const k of [
        "x",
        "y",
        "z",
        "width",
        "height",
        "length",
        "rotation",
        "confidence",
      ] as const) {
        if (
          typeof a[k] !== "number" ||
          !Number.isFinite(a[k]) ||
          Math.abs(a[k]) > 1000
        )
          throw new Error("標註座標必須為有效數值。");
      }
      if (
        [a.width, a.height, a.length].some((v) => v < 0.1 || v > 30) ||
        a.confidence < 0 ||
        a.confidence > 1 ||
        typeof a.reviewed !== "boolean" ||
        typeof a.occluded !== "boolean"
      )
        throw new Error("標註尺寸或屬性不正確。");
    }
  }
  if (
    p.tasks.length !== 3 ||
    SCENES.some((s) => p.tasks.filter((t) => t.id === s.id).length !== 1) ||
    p.tasks.some(
      (t) =>
        !["queued", "active", "review", "done"].includes(t.status) ||
        typeof t.owner !== "string" ||
        t.owner.length > 100,
    )
  )
    throw new Error("任務格式不正確。");
  const clean = initialProject();
  clean.annotations = Object.fromEntries(
    SCENES.map((s) => [
      s.id,
      p.annotations[s.id].map((a) => ({
        id: a.id,
        category: a.category,
        x: a.x,
        y: a.y,
        z: a.z,
        width: a.width,
        height: a.height,
        length: a.length,
        rotation: a.rotation,
        confidence: a.confidence,
        reviewed: a.reviewed,
        occluded: a.occluded,
      })),
    ]),
  );
  clean.tasks = p.tasks.map((t) => ({
    ...clean.tasks.find((x) => x.id === t.id)!,
    status: t.status,
    owner: t.owner,
  }));
  clean.logs = p.logs
    .slice(0, 100)
    .filter(
      (l) =>
        typeof l?.id === "string" &&
        typeof l.time === "string" &&
        typeof l.message === "string" &&
        ["info", "success", "warning"].includes(l.kind),
    )
    .map((l) => ({
      id: l.id.slice(0, 60),
      time: l.time.slice(0, 30),
      message: l.message.slice(0, 300),
      kind: l.kind,
    }));
  return clean;
}
