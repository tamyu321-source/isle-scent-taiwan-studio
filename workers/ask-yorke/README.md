# ASK YORKE API

GitHub Pages 只提供靜態頁面。本 Worker 是公開 AI 工具唯一能呼叫 Qwen 的入口；Qwen Key、Turnstile Secret 與計數雜湊鹽只存在 Cloudflare Secret。服務端不保存對話內容或需求摘要。

目前部署於 `https://yorke-ask.tamyu321.workers.dev/v1/ask`，D1 資料庫為 `yorke-ask-usage`。GitHub Pages 工作流程透過公開 repository variables 注入 API URL 與 Turnstile Site Key。

## 首次部署

1. 在百煉北京地域重置本次對話中提供的 API Key，建立僅允許 `qwen3.8-flash` 的專用 Key。若控制台提供預算管理，為該 Key 設定每月 ¥20、到額停用及提醒。不要把 Key 貼進檔案、命令列參數或 GitHub 變數。
2. 在 Cloudflare 建立 Turnstile Widget，允許 `tamyu321-source.github.io`，記下公開 Site Key；Secret Key 僅配置在 Worker。
3. D1 資料庫 `yorke-ask-usage` 已建立，ID 已填入 `wrangler.jsonc`。從儲存庫根目錄執行 `npx wrangler d1 execute yorke-ask-usage --remote --config workers/ask-yorke/wrangler.jsonc --file=workers/ask-yorke/schema.sql` 建立資料表。
4. 依次透過 `npx wrangler secret put DASHSCOPE_API_KEY`、`npx wrangler secret put TURNSTILE_SECRET`、`npx wrangler secret put USAGE_SALT` 互動式輸入私密值。`USAGE_SALT` 使用新產生的隨機字串，不要重用密碼。
5. 執行 `npx wrangler deploy`，確認回傳的 Worker URL。設定 GitHub repository variables：`ASK_YORKE_API_URL=<Worker URL>/v1/ask` 與 `TURNSTILE_SITE_KEY=<公開 Site Key>`，然後觸發 GitHub Pages workflow。
6. 在已發佈的頁面進行一次真實呼叫，確認作品連結、需求摘要、Turnstile、每日限制、用量及預算頁的記錄。檢查部署產物中沒有私密 Key。

北京地域預設使用官方相容接口的 `dashscope.aliyuncs.com` Host；若新 Key 建立時提供 workspace 專屬 API Host，可將 `QWEN_API_HOST` 換成該 Host 的 `/compatible-mode/v1/chat/completions`。

## 限制與回應

- 每個瀏覽器訪客 ID 每台北日 5 次；同一 IP 雜湊每台北日 20 次；全站每台北月 500 次。匿名 ID 可被清除或重建，不能等同身分驗證；Turnstile 與全站上限仍保護公開接口。
- 每次限 9 則訊息、每則 1,500 字、模型最多輸出 800 tokens。請求在 Turnstile 伺服器驗證成功後才占用計數；上游失敗也計入限額，以保守控制成本。
- 目前尚未確認百煉 API Key 的月度預算開關，先以每月 500 次、18 KB 請求與 800 輸出 tokens 的程式限制保守控費。依 2026-09-29 北京地域公開單價估算，即使每次都接近輸入上限，全月 Qwen 費用仍預期低於 ¥20；價格或計費規則變動時需重新核算。百煉預算到額停用即使啟用也可能延遲，¥20 不是絕對費用保證。
- 每日排程清理 35 天前的訪客與 IP 計數。`SITE_ORIGIN` 只允許正式 GitHub Pages 的瀏覽器來源；開發環境須另用本地 Worker 設定。

## 驗證

在儲存庫根目錄執行：

```powershell
volta run --node 24.11.1 node --experimental-strip-types --test tests/ask-yorke.test.mjs
volta run --node 24.11.1 npx tsc --noEmit
```
