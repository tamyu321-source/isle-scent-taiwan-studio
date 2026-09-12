import type { Metadata } from "next";
import { ShareFlowApp } from "@/components/shareflow-app";

export const metadata: Metadata = { title: "ShareFlow 管理員後台", description: "廣告營收來源、分潤規則與合作夥伴權限管理展示。" };
export const dynamic = "force-static";

export default function ShareFlowAdminPage() { return <ShareFlowApp portal="admin" />; }
