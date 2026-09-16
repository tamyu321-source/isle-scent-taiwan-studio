# PURE WHITE — 品牌影像與互動設計

PURE WHITE 採白色、鈷藍與食材特寫建立視覺識別。影像用於品牌概念與食用情境展示；包裝、字標及產品資訊不代表真實業者或上市商品。

## 影像配置

| 區塊 | 檔案 | 視覺重點 |
| --- | --- | --- |
| 首頁主視覺 | `public/images/pure-white-hero.webp` | 鈷藍桌面、白瓷碗與濃稠優格，直式構圖搭配左側標題 |
| 手作製程 | `public/images/pure-white-craft.webp` | 濾布、不鏽鋼容器與手部細節，呈現質地與製程主題 |
| 日常搭配 | `public/images/pure-white-ritual.webp` | 白色桌面、藍色織物與早餐擺盤，橫向構圖保留留白 |
| 個人杯 | `public/images/pure-white-cup.webp` | 150g 白色杯身與鈷藍杯蓋；1254 × 1254 |
| 分享罐 | `public/images/pure-white-jar.webp` | 450g 加高罐身，與個人杯共用字標與配色；1254 × 1254 |
| 質地特寫 | `public/images/pure-white-spoon.webp` | 鈷藍背景、不鏽鋼湯匙與優格紋理；1536 × 1024 |

影像以 WebP 提供，首頁情境圖使用品質 86，產品特寫使用品質 88。版面以適量 CSS 遮罩銜接影像背景，規格文字與按鈕由 HTML 呈現。作品集縮圖取自實際 `/pure-white/` 頁面。

## 產品識別

包裝使用兩行 PURE／WHITE 字標、GREEK YOGURT 品名及容量標示。個人杯與分享罐以輪廓和高度區分，保持相同的白色紙質外觀與鈷藍蓋面。產品資訊集中在 `components/pure-white-content.ts`，供首頁及詳情頁共用。

## 互動與響應式

- 規格切換同步更新圖片、文字與詳情入口。
- `/pure-white/original/` 接受 `?size=cup` 與 `?size=jar`；頁內切換更新網址，重新整理後保留選擇。
- 食用搭配、FAQ 及行動選單支援滑鼠、觸控與鍵盤；選擇行動選單項目後關閉選單。
- 捲動分鏡隨閱讀方向更新。減少動態模式、短視窗及互動尚未初始化時，三段內容以正常文件順序呈現。
- 圖片、標題及操作區在不同寬度下保持完整，詳細檢查見 [驗收紀錄](pure-white-acceptance.md)。

食譜圖片的構圖與份量說明見 [食譜內容與影像規格](pure-white-recipes.md)。
