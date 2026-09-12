import type { Metadata } from "next";
import { SystemCase } from "@/components/system-case";

export const metadata: Metadata = { title: "Ledger Flow｜Yorke Hsu", description: "桌面財務系統介面與工作流程案例。" };
export const dynamic = "force-static";

export default function LedgerFlowPage() {
  return <SystemCase data={{ index: "04", title: "LEDGER FLOW", eyebrow: "DESKTOP FINANCE SYSTEM", statement: "讓多張表、多個帳套與列印流程，維持同一套清楚語言。", intro: "既有桌面財務產品功能完整，卻因頁籤層級、表格高度、主題樣式與列印路徑而累積操作負擔。這次工作在不改變會計邏輯的前提下，重新梳理每個高頻節點。", accent: "#d8ff3f", roles: ["PRODUCT UI", "ELECTRON", "DESIGN SYSTEM", "LEGACY COMPATIBILITY"], stages: [{ label: "CONTEXT", title: "辨認真實操作層級", body: "先區分帳套、外層頁籤與內層表單，避免只看路由就修改錯誤畫面。" }, { label: "INTERFACE", title: "把捲動留在資料區", body: "重建高度與 flex 鏈，讓大型表格在內部捲動，頁面框架保持穩定。" }, { label: "OUTPUT", title: "保留原生列印路徑", body: "延續桌面端列印與 PDF 預覽流程，避免破壞既有憑證與申報習慣。" }], outcomes: ["多主題下維持一致的欄位層級與可讀性", "表格高度與捲動範圍回到使用者預期", "在舊版 Electron 環境中保留核心列印能力"] }} />;
}
