import type { Metadata } from "next";
import { ShareFlowApp } from "@/components/shareflow-app";

export const metadata: Metadata = {
  title: "ShareFlow 分潤台",
  description: "廣告營收與合作夥伴分潤管理系統概念展示。",
};

export const dynamic = "force-static";

export default function ShareFlowPage() {
  return <ShareFlowApp />;
}
