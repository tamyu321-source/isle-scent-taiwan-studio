import type { Metadata } from "next";
import { SystemCase } from "@/components/system-case";

export const metadata: Metadata = { title: "Tax Flow｜Yorke Hsu", description: "瀏覽器申報流程自動化案例。" };
export const dynamic = "force-static";

export default function TaxFlowPage() {
  return <SystemCase data={{ index: "06", title: "TAX FLOW", eyebrow: "BROWSER WORKFLOW AUTOMATION", statement: "在多分頁與低規格環境裡，讓自動化可靠地把工作交回給人。", intro: "正式申報不是單一按鈕，而是一段跨越登入、分頁、表單與人工確認的生命週期。設計重點是保存正確頁面狀態，並且在必須由人決定的地方確實停下。", accent: "#8aa8ff", roles: ["RPA", "BROWSER LIFECYCLE", "SAFE HANDOFF", "LOW-SPEC SUPPORT"], stages: [{ label: "PREPARE", title: "建立可控的瀏覽器上下文", body: "處理頁面建立、切換與關閉順序，避免操作落到已失效或錯誤的分頁。" }, { label: "VERIFY", title: "用狀態而不是假設判斷", body: "記錄分頁數量、來源是否關閉與流程觸發方式，保留可以重現的證據。" }, { label: "HAND OFF", title: "預填後交還人工確認", body: "自動化只把資料準備到位，不跨越需要使用者正式提交的界線。" }], outcomes: ["低規格 Windows 環境仍可完成必要流程", "多分頁切換具備明確生命週期記錄", "人工提交界線在錯誤復原後依然有效"] }} />;
}
