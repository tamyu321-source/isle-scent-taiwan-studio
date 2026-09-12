# CHECKPOINT — 瀏覽器巡檢工具

Python + Playwright，實際操作獨立 Chromium，將結果存成可閱讀的 HTML、JSON 與截圖。
只測試你有權操作的網站。工具不讀取日常瀏覽器的個人設定、Cookie 或登入資料，也不自動上傳本機報告。

## Windows 執行

需要 Python 3.11 以上及受 Playwright 支援的 Windows 版本；不支援 Windows 7。
下載 ZIP、解壓縮，在工具資料夾開啟 PowerShell：

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m playwright install chromium
.\.venv\Scripts\python.exe checkpoint.py --suite portfolio
```

不需要啟用 PowerShell 腳本執行權限。第一次需要下載 Chromium（數百 MB）。
依賴若受本機 pip 鏡像限制，可由你決定改用官方索引：`-m pip install --index-url https://pypi.org/simple -r requirements.txt`。
Linux / macOS 使用相同 CLI，虛擬環境的 Python 路徑是 `.venv/bin/python`；Linux CI 安裝瀏覽器時使用 `python -m playwright install --with-deps chromium`。

## 巡檢範圍

預設依序執行作品集、PURE WHITE、FIELDWORK，分別檢查桌面 1440×900、手機 390×844。預設顯示工具自己的瀏覽器視窗；每個案例使用新的環境。

- 作品集：導覽、01–08 順序、8 個作品入口及重新載入。
- PURE WHITE：規格帶入、重新整理、3 道食譜照片與文字、FAQ、手機選單。
- FIELDWORK：讀取頁面實際收到的快照，比對城市／行政區、搜尋、分頁、來源明細與實際下載的 CSV／JSON。

```powershell
.\.venv\Scripts\python.exe checkpoint.py --url https://example.com --viewport both
.\.venv\Scripts\python.exe checkpoint.py --suite portfolio --base-url http://127.0.0.1:5174/isle-scent-taiwan-studio/ --headless --output output
```

| 參數 | 用途 |
| --- | --- |
| `--suite portfolio` | 內建作品流程，預設正式 GitHub Pages 網址 |
| `--base-url URL` | 作品根網址，保留專案子路徑；可測試自己的本機建置 |
| `--url URL` | 改為基本巡檢單一公開網址，不執行內建流程 |
| `--viewport desktop/mobile/both` | 預設 both |
| `--output DIRECTORY` | 預設 output，每次建立新的時間戳記目錄 |
| `--headless` | 不顯示視窗，供 CI 使用 |

自訂網址只檢查主頁回應、標題、未處理 JavaScript 錯誤、圖片及水平溢出。最多捲動 16,000px 觸發 lazy loading，超出範圍的未載入圖片會列為未檢查。沒有圖片的頁面會如實顯示 0 張。
不遞迴爬站、不按未知按鈕、不提交表單、不猜登入、不繞過 TLS、存取限制或 CAPTCHA。登入／驗證頁無法執行後續功能測試；僅有標題辨識不能辨認所有驗證畫面。
基本巡檢不是完整功能、效能或無障礙認證；手機尺寸也不等於真實手機硬體測試。

## 報告與中斷

`output/<UTC時間>-<識別碼>/` 包含：

- `report.html`：離線可開啟。截圖使用相對路徑，分享時需保留整個資料夾。
- `report.json`：版本化報告，與線上巡檢台相同格式。
- `<案例>/step-xx.png`：實際執行截圖。
- `<案例>/trace.zip`：失敗案例的 Playwright trace；可能包含該網站的公開內容與請求，分享前自行檢查。
- `<案例>/case.json`、`worker.log`：逐步紀錄與環境錯誤。
- FIELDWORK 案例另保存實際下載的 CSV／JSON。

狀態為通過、失敗、受阻、未執行。失敗後不重試到成功；依賴步驟停止，其他案例继续。HTTP 401/403/429、TLS 或網路錯誤及逾時屬於受阻，仍然是非成功結果。
導覽最多 30 秒、操作 10 秒、案例 180 秒。Ctrl+C 中斷後保存已完成紀錄，後續案例保持未執行，只清理工具自己建立的程序。若必須強制終止程序，最後未完成的 trace 可能無法保存，已寫入的截圖仍保留。
退出碼：全部通過為 0；失敗、受阻、中斷或未完整執行為 1。

Trace 可在本機開啟，不必上傳：

```powershell
.\.venv\Scripts\python.exe -m playwright show-trace output\你的執行目錄\案例\trace.zip
```

## 發佈紀錄

作品集 Actions 對**本次靜態建置產物**執行巡檢，不是宣稱已測過正式站。所有 6 個必要案例通過後，報告才隨 Pages artifact 發佈；失败時保留上一版，診斷 artifact 保留 7 天。
線上頁面無法控制其他分頁或啟動訪客電腦上的程式。本機執行不會更新線上報告。

## 測試與來源

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s . -p "test_*.py" -v
```

測試使用本機故障頁，沒有對第三方網站送出表單。
Playwright 固定為 1.62.0；套件以 Apache-2.0 授權提供，參見 [官方專案](https://github.com/microsoft/playwright-python)。
安裝與瀏覽器支援範圍以 [官方說明](https://playwright.dev/python/docs/intro) 為準。
