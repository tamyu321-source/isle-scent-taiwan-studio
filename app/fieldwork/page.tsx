import type { Metadata } from "next";
import { Fieldwork } from "@/components/fieldwork";
import "../fieldwork.css";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "FIELDWORK｜商家資料工作台",
  description:
    "查詢臺南與桃園的公開店家資料，核對來源、篩選並匯出 CSV 或 JSON。附可執行的 Python 蒐集工具。",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/fieldwork-mark.svg`,
  },
};

export default function Page() {
  return <Fieldwork />;
}
