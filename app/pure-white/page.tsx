import type { Metadata } from "next";
import { PureWhiteSite } from "@/components/pure-white-site";

export const dynamic = "force-static";
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const metadata: Metadata = {
  title: "PURE WHITE｜原味，值得細細品嚐。",
  description:
    "探索 PURE WHITE 原味希臘優格的細緻質地、慢工製法、150g 與 450g 規格，以及從早餐到餐桌的日常搭配。",
  icons: { icon: `${base}/pure-white-mark.svg` },
};
export default function Page() {
  return <PureWhiteSite />;
}
