import type { Metadata } from "next";
import { PureWhiteProduct } from "@/components/pure-white-product";

export const dynamic = "force-static";
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "原味希臘優格｜PURE WHITE",
  description:
    "細看 PURE WHITE 原味希臘優格的濃厚質地，探索 150g 日常杯、450g 分享罐，以及配方、風味與日常搭配。",
  icons: { icon: `${base}/pure-white-mark.svg` },
};

export default function Page() {
  return <PureWhiteProduct />;
}
