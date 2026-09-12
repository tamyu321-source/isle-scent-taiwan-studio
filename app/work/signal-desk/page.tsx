import type { Metadata } from "next";
import { SystemCase } from "@/components/system-case";

export const metadata: Metadata = { title: "Signal Desk｜Yorke Hsu", description: "風險優先的交易自動化工作台案例。" };
export const dynamic = "force-static";

export default function SignalDeskPage() {
  return <SystemCase data={{ index: "05", title: "SIGNAL DESK", eyebrow: "RISK-FIRST TRADING AUTOMATION", statement: "自動化不只要能送出，也要清楚知道什麼時候不能送出。", intro: "交易流程把行情、帳戶、資產辨識與委託串在一起，任何一個狀態不明都不該被當成成功。介面與紀錄因此以風險判斷為核心，而不是只顯示最終結果。", accent: "#ff6a4b", roles: ["AUTOMATION", "RISK GUARD", "OBSERVABILITY", "OPERATOR UX"], stages: [{ label: "CHECK", title: "先確認客戶端在線", body: "登入或重啟前先取得可證明的狀態，不用猜測覆蓋正在運作的連線。" }, { label: "DECIDE", title: "把限制寫進流程", body: "時間、資產、報價與額度逐項驗證，不符合條件時明確取消而非勉強執行。" }, { label: "TRACE", title: "讓每一階段可追溯", body: "區分排隊、送出、撮合與失敗，紀錄精簡但保留判讀所需的關鍵值。" }], outcomes: ["不確定的線上狀態會安全取消操作", "人工指令與自動流程具有清楚優先序", "日誌可直接區分等待、送出與真正成交"] }} />;
}
