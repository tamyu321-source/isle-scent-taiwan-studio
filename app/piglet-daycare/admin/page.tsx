import type { Metadata } from "next";
import { PigletAdmin } from "@/components/piglet-admin";

export const metadata: Metadata = {
  title: "豬仔仔幼兒園管理後台",
  description: "豬仔仔幼兒園預約、客戶、費用、相簿、價格與留言管理。",
};
export const dynamic = "force-static";

export default function PigletAdminPage() {
  return <PigletAdmin />;
}
