# 嶼氣 ISLE / SCENT

一個以「台灣島嶼地景」為題的高端香氛品牌概念網站，也是可直接放進前端作品集的完整案例。

## 作品定位

- 原創品牌概念、視覺方向與繁體中文內容
- 11 個完整頁面，而非單頁展示稿
- 首頁與產品頁使用 Canvas Sprite Sequence，進入視窗後自動播放 16 格影格融合與多鏡位推拉動畫
- 支援滑鼠、觸控、手機版選單與 `prefers-reduced-motion`
- 圖片採用專案專屬生成素材，並提供 WebP 輕量版本，沒有外部圖庫依賴
- 語意化結構、動態頁面標題、客製 favicon 與 404 頁面

## 頁面

1. `/` 首頁與滾動逐幀敘事
2. `/collections` 香氣系列
3. `/collections/o-01` 單品頁
4. `/story` 品牌故事
5. `/craft` 製作工藝
6. `/ingredients` 島嶼原料
7. `/spaces` 空間香氛
8. `/journal` 誌記列表
9. `/journal/field-note-07` 誌記文章
10. `/stockists` 體驗據點
11. `/contact` 聯絡合作

## 技術

Vinext / React 19 / TypeScript / Tailwind CSS 4 / Canvas 2D / requestAnimationFrame / Next Image

逐幀效果由 `IntersectionObserver` 在舞台進入視窗後觸發，再以 `requestAnimationFrame` 播放 14.4 秒電影式時間軸；產品旋轉、鏡頭推拉、對焦、環境光與四段文字敘事共用同一進度。透過相鄰影格融合降低跳格感，離開視窗時暫停並在返回後續播。畫面提供暫停與重播控制，也會尊重 `prefers-reduced-motion`。裝置像素比上限為 1.5，避免高解析手機進行不必要的 GPU 運算。

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

## 作品集使用方式

這是一個概念品牌案例。對外展示時，可在作品說明中標示：

> Concept brand website — visual direction, responsive front-end development, Canvas scroll sequence and deployment.

若要改成個人正式案件頁，只需將聯絡頁的示範信箱替換成你的信箱，並依需求替換品牌文字與產品素材。
