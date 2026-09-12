import type { Metadata } from "next";
import { Checkpoint } from "@/components/checkpoint";
import "../checkpoint.css";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "CHECKPOINT｜瀏覽器巡檢台",
  description:
    "檢視真實瀏覽器操作、功能核對與截圖證據。下載 Python 巡檢工具，在自己的電腦重新執行。",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/checkpoint-mark.svg`,
  },
};

export default function Page() {
  return <Checkpoint />;
}
