import type { Metadata } from "next";
import { AgentRuntimeShowcase } from "@/components/agent-runtime-showcase";
import "./runtime.css";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "AUTHORITY｜可審計的 Agent Runtime",
  description: "以 Python、SQLite 與 FastAPI 建構任務、授權、策略、執行憑證與審計鏈原型。",
};

export default function AgentRuntimePage() {
  return <AgentRuntimeShowcase />;
}
