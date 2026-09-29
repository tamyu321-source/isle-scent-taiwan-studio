# AUTHORITY / Agent Runtime Prototype

供作品集展示的 Python 後端原型。所有人名、資源、供應商與金額均為合成資料。`execute` 只在 SQLite 建立一筆 **payment instruction prepared** 紀錄，不會轉帳、呼叫銀行或發送付款。

## 本機執行

從本目錄執行（Windows PowerShell）：

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m unittest discover -p 'test_*.py' -v
.\.venv\Scripts\python -m agent_runtime.demo --output demo.json
.\.venv\Scripts\python -m uvicorn agent_runtime.api:app --host 127.0.0.1 --port 8008
```

本機 API 文件在 `http://127.0.0.1:8008/docs`。先對 `POST /demo/grants` 建立角色授權，再提交任務。API 的 `X-Demo-Principal` 是可任意輸入的示範標識，**不是身分驗證**，因此只應綁定本機迴圈位址，不能直接對外開放。

## 核心設計

1. **Mission Runtime**：`request_key` 去重；`DENIED → 無執行`、`PENDING_APPROVAL → READY → COMPLETED`。SQLite 寫入用 `BEGIN IMMEDIATE` 串接狀態、token 消耗、效果與審計事件。
2. **Authority Graph**：`principal → role → resource`，授權有期限。操作員與覆核員分離，跨資源的授權不相通。
3. **Policy Engine**：500 以下可自動準備；501–1000 需要另一人覆核；超過 1000 或 `blocked:` 目標拒絕。執行前重新檢查策略。
4. **Execution Token**：隨機短效 token，資料庫只存 SHA-256 摘要；綁定單一任務和操作員，使用一次後即失效。
5. **Audit Chain**：每筆事件包含前一筆雜湊與自身雜湊；`verify_audit()` 可發現直接修改舊紀錄。這是篡改偵測原型，沒有外部錨點或數位簽章，**不能抵抗具有資料庫完整寫入權限的對手重新計算整條鏈**。

網站展示的 `public/data/agent-runtime/demo.json` 由 `agent_runtime.demo` 呼叫實際 Python 核心產生，屬於發佈時快照。網站上的情境切換只閱讀該快照；正式互動 API 需在本機啟動。

更完整的資料流、取捨及生產化評審重點見作品倉庫的 `docs/agent-runtime-architecture.md`。

## 生產化前仍需完成

- OIDC/mTLS 身分驗證、服務間授權、集中管理的授權與撤銷；移除任何客戶端自報身分途徑。
- PostgreSQL 交易、outbox/queue、worker 崩潰恢復與重試、跨服務 idempotency；明確決定外部副作用的 exactly-once 限制。
- 策略版本、規則審批、外部不可變審計儲存或定期簽章錨點、金鑰管理、資料遮蔽、觀測性及容量測試。
- 真實金融合規、威脅模型、滲透測試、職責分離和客戶系統整合。
