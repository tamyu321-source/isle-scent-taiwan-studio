# Yorke Hsu — Portfolio

個人作品集網站，聚焦互動前端、產品系統與流程自動化。原本的「嶼氣 ISLE / SCENT」品牌網站已整理為首件完整案例，並保留可操作的線上體驗。

## 作品內容

- 作品集首頁：個人定位、精選作品、能力與聯絡入口
- `/work/isle-scent`：嶼氣品牌網站案例說明
- `/work/ledger-flow`：桌面財務系統案例說明
- `/work/signal-desk`：交易自動化工作台案例說明
- `/work/tax-flow`：瀏覽器流程自動化案例說明
- `/collections/o-01`：O-01 電影式互動產品 Demo
- `/piglet-daycare`：豬仔仔幼兒園狗狗貓貓寄宿網站
- `/piglet-daycare/admin`：可操作的預約與營運管理後台
- `/order-hub`：由後台建立的專屬客戶下單頁
- `/order-hub/admin`：訂單連結、訂貨、庫存與出貨管理中台
- 三項匿名化實務案例：桌面財務系統、交易自動化與瀏覽器流程自動化
- 原創品牌概念、視覺方向與繁體中文內容
- 11 個完整頁面，而非單頁展示稿
- 首頁與產品頁使用 Canvas Sprite Sequence，進入視窗後自動播放 16 格影格融合與多鏡位推拉動畫
- 支援滑鼠、觸控、手機版選單與 `prefers-reduced-motion`
- 圖片採用專案專屬生成素材，包含海岸主視覺、瓶身微距與島嶼原料，皆提供 WebP 輕量版本
- 語意化結構、動態頁面標題、客製 favicon 與 404 頁面

## 頁面

1. `/` 個人作品集首頁
2. `/work/isle-scent` 嶼氣專案案例
3. `/collections` 香氣系列
4. `/collections/o-01` 單品頁
5. `/story` 品牌故事
6. `/craft` 製作工藝
7. `/ingredients` 島嶼原料
8. `/spaces` 空間香氛
9. `/journal` 誌記列表
10. `/journal/field-note-07` 誌記文章
11. `/stockists` 體驗據點
12. `/contact` 聯絡合作
13. `/piglet-daycare` 豬仔仔幼兒園公開前台
14. `/piglet-daycare/admin` 豬仔仔幼兒園管理後台

## 技術

Vinext / React 19 / TypeScript / Tailwind CSS 4 / Canvas 2D / requestAnimationFrame / Next Image

逐幀效果由 `IntersectionObserver` 在舞台進入視窗後觸發，再以 `requestAnimationFrame` 播放約 10 秒電影式時間軸；海岸、瓶身微距、16 角度產品旋轉與收束主視覺以四個鏡位自動交接，並同步鏡頭推拉、對焦、環境光與文字敘事。離開視窗時暫停並在返回後續播，畫面也提供暫停與重播控制並尊重 `prefers-reduced-motion`。

## 開發

```bash
npm install
npm run dev
```

正式建置：

```bash
npm run build
```

## 線上展示

- GitHub Pages：`https://tamyu321-source.github.io/isle-scent-taiwan-studio/`
- 每次推送到 `main` 分支後，GitHub Actions 會自動重新建置與發布。

首頁中的實務系統案例皆經匿名化；嶼氣則為可公開瀏覽的概念品牌案例。

豬仔仔幼兒園為可操作的作品集展示版本，預約、客戶、費用、相簿、方案與留言資料會儲存在目前瀏覽器中。示範後台帳號為 `admin`，密碼為 `piglet2026`。

Order Flow 為可操作的訂單流程展示版本，客戶下單、訂單狀態、訂貨、庫存與出貨資料會儲存在目前瀏覽器中。示範後台帳號為 `admin`，密碼為 `order2026`；正式商用時應串接共用資料庫與身分驗證。
