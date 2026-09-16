# ClassNest 課伴

案件 TK26082812OCYG11 的概念作品，非已交付客戶系統。入口為 `/classnest/`、`/classnest/teacher/`、`/classnest/admin/`，支援既有 GitHub Pages 專案子路徑。

## 操作

家長可切換兩個示範家庭及各自的孩子，篩選六位老師的英文、數學、音樂課。點選 ＋ 暫留時段，或使用連續週次一次安排 2–8 週。右側清單逐堂列出孩子、時間、老師、堂數及 10 分鐘倒數。

確認預約後凍結家庭共用堂數；開課前至少 24 小時可取消、改期。改期只在新預約成立時釋放舊預約。老師在課程結束後標記出席或缺席，兩者均正式扣堂。管理員可補退堂、編輯無預約時段、新增時段、停課及查看團體名單。停課退回全部凍結堂數。

首度開啟會建立待點名的歷史課、額滿團體課及家庭學習計畫。每次載入補足台北當週起 12 週的未來場次，保留過去資料。管理端「堂數與設定」可以重設本作品資料。

## 資料與交易

- 領域模型：`lib/classnest-domain.ts`；純函式接受明確時鐘，回傳新狀態，錯誤不變更輸入。
- 狀態保存：`lib/classnest-store.ts`；IndexedDB 獨立資料庫 `classnest-demo-v1`。讀取最新快照、驗證名額及堂數、寫入預約與帳本均在同一筆 readwrite 交易內完成，等待 complete 才報成功。
- BroadcastChannel 只通知重新讀取；沒有用廣播訊息覆蓋狀態。跨分頁刷新及恢復前景會重新核對到期的暫留。
- 暫留只占名額、不凍結堂數。確認時重新驗證堂數與所有課程；整批全成或全退。唯一操作識別碼及預約狀態避免重複確認、點名與退堂。
- 可用、凍結與已扣均由帳本加總。每次變更校驗非負餘額，以及凍結總額與未結算預約的一致性。
- 讀取／写入失敗保留原始資料並回報失敗；重設只影響課伴。CSV 使用 UTF-8 BOM 並防止試算表公式注入。

這是瀏覽器本機展示。身分選擇是展示控制項，並非真實身分驗證；不同瀏覽器或裝置不共享資料。正式營運需要伺服器端交易、權限驗證、共用資料庫及可信任的伺服器時間，不能將此展示當成多人線上預訂服務。

## 驗證

```powershell
volta run --node 24.11.1 node --experimental-strip-types --test tests/classnest.test.mjs
volta run --node 24.11.1 npx tsc --noEmit
# 安裝 tools/checkpoint/requirements.txt 及 Playwright Chromium 後：
python -X utf8 tools/checkpoint/classnest_qa.py --base http://localhost:5173/
```

本機 QA 實際操作桌面與手機流程，保存每一步截圖、下載的帳本及 320/390/768/1440px 的四路由檢查。`--thumbnail` 可從實際課伴畫面更新作品縮圖。GitHub Actions 在原有 Fieldwork、VECTOR 與 CHECKPOINT 測試之外，執行課伴規則測試；建置產物必須通過全部八個桌面／手機案例才會部署。
