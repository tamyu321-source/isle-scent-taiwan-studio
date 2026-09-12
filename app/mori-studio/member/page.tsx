import type { Metadata } from "next";
import { MoriMember } from "@/components/mori-account";
export const dynamic = "force-static";
export const metadata: Metadata = { title: "會員空間｜MORI 留白陶作" };
export default function Page() { return <MoriMember />; }
