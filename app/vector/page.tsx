import type { Metadata } from "next";
import VectorWorkspace from "@/components/vector-workspace";
import "./vector.css";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "VECTOR — 3D 感知標註工作台",
  description:
    "React、TypeScript 與 Three.js 實作的 3D 點雲標註、資料生產與品質檢查作品。",
};
export default function VectorPage() {
  return <VectorWorkspace />;
}
