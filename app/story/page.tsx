import type { Metadata } from "next";
import { StoryPage } from "@/components/brand-pages";

export const metadata: Metadata = { title: "品牌故事" };
export const dynamic = "force-static";

export default StoryPage;
