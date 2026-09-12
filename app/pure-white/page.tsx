import type { Metadata } from "next";
import { PureWhiteSite } from "@/components/pure-white-site";

export const dynamic = "force-static";
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const metadata: Metadata = {
  title: "PURE WHITE｜純粹，自有厚度。",
  description: "PURE WHITE 手作希臘優格，以鮮乳、乳酸菌與手作的耐心，讓純粹成為日常。探索品牌理念、慢工製法與優格的日常提案。",
  icons: { icon: `${base}/pure-white-mark.svg` },
};
export default function Page() { return <PureWhiteSite />; }
