# FIELDWORK — 商家資料蒐集工具

Python 3.11+，僅使用標準函式庫，不需要安裝套件或提供 API 金鑰。

## Windows 執行

解壓縮工具 ZIP，在有 `fieldwork.py` 的資料夾開啟 PowerShell：

```powershell
py -3.11 -X utf8 fieldwork.py --output-dir output --max-pages 100
```

若安裝其他版本，將 `-3.11` 改為該版本，例如 `-3.12`。macOS / Linux 使用 `python3 fieldwork.py` 加上相同參數。

```powershell
# 只更新桃園官方資料，不執行臺南網頁核對
py -3.11 -X utf8 fieldwork.py --cities 桃園市 --max-pages 0

# 蒐集臺南，匯出名稱、地址或電話包含「安平」的店家
py -3.11 -X utf8 fieldwork.py --cities 臺南市 --keyword 安平 --output-dir output

# 本機測試，不對外發送請求
py -3.11 -X utf8 -m unittest discover -p test_fieldwork.py -v
```

## 輸出與資料介面

- `merchants.csv`：UTF-8 BOM、完整引號跳脫、試算表公式注入防護，可用 Excel 開啟。
- `merchants.json`：schemaVersion 1，保留各來源欄位、差異、擷取及核對時間。
- `snapshot.json`：完整蒐集快照，不受 `--keyword` 影響，下次執行自動作為失敗備援。
- `run-report.md`：成功／失敗来源、執行摘要及授權。

每筆包含穩定 `id`、名稱、城市、行政區、地址、電話、營業時間、`sources` 和 `verification`。`sources[].values` 是來源提供的基本事實；顯示值優先採官方資料，官方缺值才以網頁補齊。`differences` 保留不同來源不一致的欄位，不猜測哪一方正確。店家識別碼優先，不因電話相同而合併分店。

## 真實來源與限制

1. [交通部觀光署餐飲開放資料](https://data.gov.tw/dataset/7779)：官方 Restaurant JSON ZIP，以 RestaurantID 整合店家及營業時間，限臺南、桃園。依政府資料開放授權條款第 1 版使用。
2. [臺南旅遊網](https://www.twtainan.net/zh-tw/gwoia/)：已知臺南供應機關識別碼對應店家頁面，下載 HTML、解析內嵌 `__NEXT_DATA__`，核對識別碼後讀取基本店家資訊。不使用介紹文章、照片、Google 評分或評論。

一次最多 100 個頁面，優先未嘗試或最久未嘗試的店家。每站請求至少間隔 1 秒；15 秒逾時，最多重試兩次，429 / 5xx 有限退避。ZIP 上限 20 MB，每個解壓 JSON 上限 60 MB；不直接解壓外部檔案目錄。

robots.txt 禁止時不讀取。404 表示沒有可讀規則，仍依公開資料規範低頻存取；403 或無法確認規則則停止當次 HTML 工作。不繞過驗證碼、登入或 TLS 驗證。

「已核對欄位」表示成功讀取且有值的欄位未發現差異，不代表已打電話或確認仍在營業。缺值不算相同的證據；來源可能互相引用，這不是獨立第三方查證。資料量不是全市商家總數。

網頁失敗不清除先前有效欄位、`fetchedAt` 或 `checkedAt`，另記本次 `lastAttemptAt` 與錯誤。官方失敗使用完整有效快照，狀態為 `stale`；沒有有效快照則非零退出，不輸出假資料。零筆搜尋結果是合法匯出。

`--seed path/to/snapshot.json` 指定備援；`--snapshot-url` 只接受此作品 GitHub Pages 網域的 HTTPS 快照。來源是固定允許名單，不是任意 URL 爬蟲。擴充來源時需增加明確 adapter、使用規範與測試。

## 網站與排程

GitHub Pages 靜態發佈，每日預計臺灣時間 08:17、推送 main 或管理者手動執行會更新資料後建置。排程可能延遲；公開儲存庫長時間沒有活動可能停用排程，請以 Actions 與實際擷取時間為準。

建置先讀上次發佈 JSON，首次使用儲存庫真實初始快照。資料只寫入發佈產物，不每日自動提交。訪客的「重載發佈資料」不啟動遠端爬取。非完整成功狀態會在 Actions 摘要及頁面保留警告。
