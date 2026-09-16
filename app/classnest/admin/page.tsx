import type { Metadata } from "next";
import ClassnestApp from "@/components/classnest-app";
import "../classnest.css";
export const dynamic = "force-static";
export const metadata: Metadata = { title: "ClassNest 課伴 — 教務管理" };
export default function Page() {
  return <ClassnestApp role="admin" />;
}
