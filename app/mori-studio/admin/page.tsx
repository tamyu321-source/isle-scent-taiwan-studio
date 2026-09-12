import type { Metadata } from "next";
import { MoriAdmin } from "@/components/mori-account";
export const dynamic = "force-static";
export const metadata: Metadata = { title: "展示管理台｜MORI 留白陶作", robots: { index: false, follow: false } };
export default function Page() { return <MoriAdmin />; }
