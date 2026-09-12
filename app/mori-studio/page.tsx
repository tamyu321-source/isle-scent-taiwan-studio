import type { Metadata } from "next";
import { MoriStudio } from "@/components/mori-studio";

export const dynamic = "force-static";
export const metadata: Metadata = { title: "MORI 留白陶作｜把時間，揉進日常", description: "手作陶藝體驗與日常器物。選一堂課，為生活留一點白。" };
export default function MoriPage() { return <MoriStudio />; }
