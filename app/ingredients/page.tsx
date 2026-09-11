import type { Metadata } from "next";
import { IngredientsPage } from "@/components/brand-pages";

export const metadata: Metadata = { title: "島嶼原料" };
export const dynamic = "force-static";

export default IngredientsPage;
