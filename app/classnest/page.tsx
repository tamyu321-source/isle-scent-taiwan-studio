import type { Metadata } from "next";
import ClassnestApp from "@/components/classnest-app";
import "./classnest.css";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "ClassNest 課伴 — 把學習，排進美好日常",
  description:
    "多老師選課、一對一與團體班、連續週次預約和堂數帳本。家長、老師與管理端的完整互動展示。",
};
export default function Page() {
  return <ClassnestApp role="parent" />;
}
