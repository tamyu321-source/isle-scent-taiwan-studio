import type { Metadata } from "next";
import { PigletPublicSite } from "@/components/piglet-public-site";

export const metadata: Metadata = {
  title: "豬仔仔幼兒園｜狗狗貓貓安心寄宿",
  description: "狗狗貓貓的安心寄宿、日托與日常照片回報。爸媽放心出遊，孩子開心放電。",
};
export const dynamic = "force-static";

export default function PigletDaycarePage() {
  return <PigletPublicSite />;
}
