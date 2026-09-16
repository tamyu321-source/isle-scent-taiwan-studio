import type { Metadata } from "next";
import ClassnestApp from "@/components/classnest-app";
import "../classnest.css";
export const dynamic = "force-static";
export const metadata: Metadata = { title: "ClassNest 課伴 — 老師課表與點名" };
export default function Page() {
  return <ClassnestApp role="teacher" />;
}
