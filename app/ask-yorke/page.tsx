import type { Metadata } from "next";
import { AskYorkePageContent } from "@/components/ask-yorke";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "ASK YORKE｜作品導覽與需求整理",
  description: "使用 Qwen 的常駐 AI 工具，根據 Yorke Hsu 的公開作品推薦案例並整理專案需求。",
};

export default function AskYorkePage() { return <AskYorkePageContent />; }
