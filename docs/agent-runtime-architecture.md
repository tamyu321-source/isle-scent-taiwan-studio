# AUTHORITY：架構決策與評審說明

本作品對應職缺中的 Mission Runtime、Audit Chain、Authority Graph、Policy Engine、Execution Token。範圍限定為單機、單一 SQLite 資料庫的金融支付**指令準備**示範。模型中的 `agent-ops` 是合成主體，不代表接入真實 LLM、銀行或支付服務。

## 執行契約

```text
principal → resource grant → submit(request_key)
  → policy decision [DENIED | PENDING_APPROVAL | READY]
  → optional independent approval
  → short-lived mission token
  → recheck policy and authority
  → one SQLite transaction: prepared-effect + token consume + mission state + audit event
```

不可變條件：

- 沒有指定資源的 `payment_operator` 授權就不能建立可執行任務。
- 501–1000 USD 的任務由不同的 `payment_approver` 批准；同一人自批被拒絕。
- 超過 1000 USD、封鎖目標與過期授權都不能產生準備指令。
- `request_key` 對同一內容去重；相同 key 搭配不同內容拒絕。
- token 只存雜湊，綁定一個任務、一位操作者，最多 300 秒；執行後不可重放。
- 產生模擬效果、消耗 token、更新任務和寫審計事件在同一個 SQLite 交易內。任何一步失敗都回滾。

## 主要取捨

| 決策 | 原因 | 限制 |
| --- | --- | --- |
| SQLite + `BEGIN IMMEDIATE` | 清楚示範單庫交易和競爭時的序列化，能在本機直接重現 | 無法展示跨服務交易、隊列與多節點擴展 |
| 申請時判斷策略，執行時重查 | 降低核准後權限或策略改變造成的錯誤執行 | 目前規則寫在程式碼中，未版本化或遠端配置 |
| 只記錄模擬 prepared-effect | 能驗證狀態與重放防護，不接觸真實金融副作用 | 不能證明銀行整合或 end-to-end exactly-once |
| 全局 SHA-256 前後雜湊鏈 | 可偵測一般修改、插入和中間刪除 | 有完整資料庫寫權的對手可重算；刪除尾端也需外部錨點才能發現 |
| 自報 `X-Demo-Principal` | 方便本機操作 API | 沒有真實認證；不得對外開放或用於正式授權 |

## 若升級為企業系統

先引入可信任的 OIDC 或 mTLS 身分，再以 PostgreSQL 處理交易和唯一約束。外部執行器需採用 outbox + worker，把資料庫提交與外部指令排程分開；每筆外部命令須有穩定的 idempotency key，並明確處理「對方已完成但回覆遺失」的狀態。政策應有版本、審批、回滾及執行時所用版本紀錄。審計鏈需要定期將 head hash 簽章並送入外部不可變儲存，且要規劃隱私資料遮蔽、保存期限與復原演練。

評審時先核對：所有狀態轉移是否封閉、每個拒絕是否有原因、權限撤銷是否在執行前生效、重試是否可能重複外部副作用、審計是否能偵測預期威脅、流程降級時是否仍然拒絕未授權行為。對應測試位於 `tools/agent-runtime/test_runtime.py` 與 `test_api.py`。
