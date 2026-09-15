"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Annotation,
  initialProject,
  issuesFor,
  ObjectClass,
  CLASSES,
  parseProject,
  ProjectData,
  STORE_KEY,
  TaskStatus,
} from "@/lib/vector-model";

export function useVectorProject() {
  const [project, setProject] = useState(initialProject);
  const reference = useRef(project);
  const history = useRef<ProjectData[]>([]);
  const [historySize, setHistorySize] = useState(0);
  const [ready, setReady] = useState(false);
  const [persist, setPersist] = useState(true);
  const [saveStatus, setSaveStatus] = useState("載入中");
  const [role, setRole] = useState<"annotator" | "reviewer" | "viewer">(
    "reviewer",
  );
  const lastEdit = useRef({ key: "", time: 0 });
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      // Hydrate device-local storage after mount to preserve server/client initial markup.
      if (raw) {
        const next = parseProject(JSON.parse(raw));
        reference.current = next;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProject(next);
      }
    } catch {
      setPersist(false);
      setSaveStatus("保存不可用");
      toast.warning("無法讀取本機資料。請先匯出備份；本次修改仍可操作與下載。");
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || !persist) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(project));
        setSaveStatus("已存於本機");
      } catch {
        setSaveStatus("保存失敗");
        toast.error("瀏覽器保存失敗，請使用 JSON 匯出保留修改。");
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [project, ready, persist]);
  useEffect(() => {
    if (!ready || !persist) return;
    const flush = () => {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(reference.current)); }
      catch { /* The visible save status and JSON export remain the fallback. */ }
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [ready, persist]);
  const commit = useCallback(
    (next: ProjectData, message: string, group = "") => {
      if (role === "viewer") {
        toast.info("目前為檢視者模式，請切換為標註員或覆核員。");
        return;
      }
      const now = Date.now();
      const grouped =
        group &&
        lastEdit.current.key === group &&
        now - lastEdit.current.time < 600;
      if (!grouped) {
        history.current = [
          ...history.current.slice(-29),
          structuredClone(reference.current),
        ];
        setHistorySize(history.current.length);
      }
      lastEdit.current = { key: group, time: now };
      const log = {
        id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
        time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        message,
        kind: "success" as const,
      };
      const result = {
        ...next,
        logs: [log, ...next.logs.slice(grouped ? 1 : 0)].slice(0, 100),
      };
      reference.current = result;
      setProject(result);
      if (persist) setSaveStatus("儲存中");
    },
    [role, persist],
  );
  const update = (scene: string, id: string, patch: Partial<Annotation>) => {
    if ("reviewed" in patch && role !== "reviewer") {
      toast.info("完成覆核需要切換至覆核員模式。");
      return;
    }
    const p = reference.current;
    const a = p.annotations[scene].find((a) => a.id === id);
    if (!a) return;
    const normalized = { ...patch };
    for (const k of [
      "x",
      "y",
      "z",
      "width",
      "height",
      "length",
      "rotation",
    ] as const) {
      if (
        k in normalized &&
        (typeof normalized[k] !== "number" || !Number.isFinite(normalized[k]))
      )
        return;
    }
    if (
      ["width", "height", "length"].some(
        (k) =>
          k in normalized &&
          (Number(normalized[k as keyof Annotation]) < 0.1 ||
            Number(normalized[k as keyof Annotation]) > 30),
      )
    )
      return;
    if (
      ["x", "y", "z"].some(
        (k) =>
          k in normalized &&
          Math.abs(Number(normalized[k as keyof Annotation])) > 1000,
      )
    )
      return;
    const editedGeometry = Object.keys(patch).some(
      (k) => !["reviewed"].includes(k),
    );
    const updated = {
      ...a,
      ...normalized,
      ...(editedGeometry ? { reviewed: false } : {}),
    };
    const tasks = editedGeometry || patch.reviewed === false
      ? p.tasks.map((t) =>
          t.id === scene && t.status === "done"
            ? { ...t, status: "active" as const }
            : t,
        )
      : p.tasks;
    commit(
      {
        ...p,
        tasks,
        annotations: {
          ...p.annotations,
          [scene]: p.annotations[scene].map((v) => (v.id === id ? updated : v)),
        },
      },
      `${scene.toUpperCase()} · 更新 ${id} ${"reviewed" in patch ? (patch.reviewed ? "覆核完成" : "設為待覆核") : "標註屬性"}`,
      `${scene}-${id}-${Object.keys(patch).join("-")}`,
    );
  };
  const review = (scene: string, ids: string[]) => {
    if (role !== "reviewer") {
      toast.info("請切換至覆核員模式。");
      return;
    }
    if (!ids.length) {
      toast.info("請先選取物件。");
      return;
    }
    const p = reference.current;
    commit(
      {
        ...p,
        annotations: {
          ...p.annotations,
          [scene]: p.annotations[scene].map((a) =>
            ids.includes(a.id) ? { ...a, reviewed: true } : a,
          ),
        },
      },
      `${scene.toUpperCase()} · 批次覆核 ${ids.length} 個物件`,
    );
    toast.success(`已完成 ${ids.length} 個物件的覆核`);
  };
  const add = (scene: string, category: ObjectClass) => {
    const p = reference.current;
    if (role === "viewer") {
      toast.info("檢視者無法新增標註。");
      return null;
    }
    if (p.annotations[scene].length >= 200) {
      toast.error("此示範每個場景最多 200 個物件。");
      return null;
    }
    const [width, height, length] = CLASSES[category].dimensions;
    const id = `${category === "vehicle" ? "VEH" : category === "pedestrian" ? "PED" : "CYC"}-${String(Math.max(0, ...p.annotations[scene].map((a) => Number(a.id.split("-").at(-1)) || 0)) + 1).padStart(3, "0")}`;
    const a: Annotation = {
      id,
      category,
      x: 0,
      y: height / 2,
      z: 0,
      width,
      height,
      length,
      rotation: 0,
      confidence: 1,
      occluded: false,
      reviewed: false,
    };
    commit(
      {
        ...p,
        annotations: {
          ...p.annotations,
          [scene]: [...p.annotations[scene], a],
        },
        tasks: p.tasks.map((t) =>
          t.id === scene && t.status === "done"
            ? { ...t, status: "active" }
            : t,
        ),
      },
      `${scene.toUpperCase()} · 新增 ${id} 人工標註`,
    );
    toast.success(`已新增 ${id}，可拖曳或編輯位置`);
    return id;
  };
  const remove = (scene: string, ids: string[]) => {
    if (role === "viewer" || !ids.length) return;
    const p = reference.current;
    commit(
      {
        ...p,
        annotations: {
          ...p.annotations,
          [scene]: p.annotations[scene].filter((a) => !ids.includes(a.id)),
        },
      },
      `${scene.toUpperCase()} · 移除 ${ids.length} 個標註（可復原）`,
    );
    toast.success(`已移除 ${ids.length} 個標註，可按復原恢復`);
  };
  const undo = () => {
    if (role === "viewer") return;
    const previous = history.current.pop();
    if (!previous) return;
    reference.current = previous;
    setProject(previous);
    setHistorySize(history.current.length);
    lastEdit.current.key = "";
    toast.success("已復原上一步");
  };
  const taskStatus = (id: string, status: TaskStatus) => {
    const p = reference.current;
    if (
      status === "done" &&
      (role !== "reviewer" || issuesFor(p.annotations[id]).length)
    ) {
      toast.warning("請由覆核員完成全部物件覆核，再將任務設為完成。");
      return;
    }
    commit(
      { ...p, tasks: p.tasks.map((t) => (t.id === id ? { ...t, status } : t)) },
      `${id.toUpperCase()} · 任務狀態變更為 ${status}`,
    );
  };
  const reorder = (from: string, to: string) => {
    if (from === to) return;
    const p = reference.current;
    const tasks = [...p.tasks];
    const a = tasks.findIndex((t) => t.id === from);
    const b = tasks.findIndex((t) => t.id === to);
    if (a < 0 || b < 0) return;
    tasks.splice(b, 0, tasks.splice(a, 1)[0]);
    commit({ ...p, tasks }, "已調整任務執行順序");
  };
  return {
    project,
    role,
    setRole,
    update,
    review,
    add,
    remove,
    undo,
    historySize,
    saveStatus,
    taskStatus,
    reorder,
    importProject: (value: unknown) => {
      const p = parseProject(value);
      commit(p, "已匯入 JSON 專案（可復原）");
    },
    ready,
  };
}
