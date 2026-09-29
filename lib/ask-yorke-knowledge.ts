export const askYorkeProjects = [
  { id: "authority", title: "AUTHORITY", href: "/agent-runtime/", facts: "Python、FastAPI、SQLite 的單機 Agent Runtime 原型；展示任務狀態、授權、雙人覆核、一次性憑證與審計鏈。使用合成資料，沒有正式身分驗證或真實付款。" },
  { id: "classnest", title: "ClassNest 課伴", href: "/classnest/", facts: "多老師課程預約、名額暫留、連續週次、家庭共用堂數帳本，以及家長、老師、教務三種示範介面。資料保存在訪客瀏覽器。" },
  { id: "vector", title: "VECTOR", href: "/vector/", facts: "React、TypeScript、Three.js 的合成點雲與 3D 邊界框標註工作台，包含任務排序、品質覆核與資料匯出；未連接真實駕駛資料。" },
  { id: "isle", title: "Isle / Scent", href: "/isle-scent/", facts: "香氛品牌概念網站，以 Canvas 動態敘事、產品展示與響應式介面呈現台灣島嶼意象。" },
  { id: "pure-white", title: "PURE WHITE", href: "/pure-white/", facts: "希臘優格品牌概念網站，有捲動分鏡、規格選擇、食譜與產品內容；沒有實際訂購。" },
  { id: "piglet", title: "豬仔仔幼兒園", href: "/piglet-daycare/", facts: "寵物寄宿示範系統，包含預約、客戶、費用、相簿與管理台；資料在瀏覽器內。" },
  { id: "order", title: "Order Flow", href: "/order-hub/", facts: "示範從專屬下單連結串到訂單、採購、到貨、庫存與出貨的流程；資料在瀏覽器內。" },
  { id: "mori", title: "MORI 留白陶作", href: "/mori-studio/", facts: "陶作品牌與體驗預約示範，包含會員空間、器物選購、模擬結帳、名額與庫存。" },
  { id: "shareflow", title: "ShareFlow", href: "/shareflow/", facts: "廣告收入與合作夥伴分潤示範，包含資料同步、比例調整、結算狀態與權限介面；未連接真實廣告帳戶。" },
  { id: "fieldwork", title: "FIELDWORK", href: "/fieldwork/", facts: "Python 蒐集公開商家資料，保留來源與擷取狀態，供查詢及 CSV、JSON 匯出；不保證店家營業狀態。" },
  { id: "checkpoint", title: "CHECKPOINT", href: "/checkpoint/", facts: "Python 與 Playwright 的瀏覽器巡檢工具，操作網站並產生截圖、下載與發佈檢查報告；瀏覽器工具在本機或 CI 執行。" },
] as const;

export type AskYorkeProjectId = (typeof askYorkeProjects)[number]["id"];
