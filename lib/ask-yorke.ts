import { askYorkeProjects, type AskYorkeProjectId } from "./ask-yorke-knowledge.ts";

export type AskYorkeMode = "works" | "brief";
export type AskYorkeBrief = {
  goal: string;
  audience: string;
  flows: string[];
  priorities: string[];
  questions: string[];
};
export type AskYorkeMessage = {
  role: "user" | "assistant";
  content: string;
  projectIds?: AskYorkeProjectId[];
  brief?: AskYorkeBrief;
};
export type AskYorkeReply = {
  answer: string;
  projects: { id: AskYorkeProjectId; title: string; href: string }[];
  brief?: AskYorkeBrief;
  remaining: number;
};

const projectById = new Map<string, (typeof askYorkeProjects)[number]>(
  askYorkeProjects.map((project) => [project.id, project]),
);

export function validMessages(value: unknown): value is AskYorkeMessage[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 9 && value.every(
    (item) => item && typeof item === "object" &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" && item.content.length > 0 && item.content.length <= 1500,
  ) && value[value.length - 1].role === "user";
}

export function normalizeReply(value: unknown, remaining: number): AskYorkeReply | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (typeof data.answer !== "string" || !data.answer.trim() || data.answer.length > 4000) return null;
  const ids = Array.isArray(data.projectIds) ? data.projectIds : [];
  const projects = ids.slice(0, 3).flatMap((id) => {
    const project = typeof id === "string" ? projectById.get(id) : undefined;
    return project ? [{ id: project.id, title: project.title, href: project.href }] : [];
  });
  let brief: AskYorkeBrief | undefined;
  if (data.brief && typeof data.brief === "object") {
    const candidate = data.brief as Record<string, unknown>;
    const list = (key: string) => Array.isArray(candidate[key])
      ? (candidate[key] as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 5).map((x) => x.slice(0, 200))
      : [];
    brief = {
      goal: typeof candidate.goal === "string" ? candidate.goal.slice(0, 300) : "",
      audience: typeof candidate.audience === "string" ? candidate.audience.slice(0, 300) : "",
      flows: list("flows"), priorities: list("priorities"), questions: list("questions"),
    };
  }
  return { answer: data.answer.trim(), projects, brief, remaining };
}

export function taipeiKeys(now: Date) {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return { day: date, month: date.slice(0, 7) };
}
