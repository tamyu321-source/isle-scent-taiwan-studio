"""ClassNest integration checks: actions use the app's visible controls only."""
import csv
import io
import re
from datetime import datetime, timezone
from urllib.parse import urljoin
from playwright.sync_api import expect
from browser_checks import navigate, page_health

CLOCK = datetime(2026, 9, 14, 1, 0, tzinfo=timezone.utc)

def classnest_steps(page, base, mobile, errors, evidence):
    def nav(label):
        expect(page.locator(".cn-save-status")).to_contain_text("已存於本機")
        if mobile:
            page.get_by_role("tab", name=label, exact=True).click()
        else:
            page.get_by_role("navigation", name="課伴主導覽").get_by_role("button", name=label, exact=True).click()

    def balance(available, frozen, spent):
        expect(page.get_by_test_id("available-credits")).to_have_text(f"{available}堂")
        expect(page.get_by_test_id("frozen-credits")).to_have_text(f"{frozen}堂")
        expect(page.get_by_test_id("spent-credits")).to_have_text(f"{spent}堂")

    def open_app():
        page.clock.install(time=CLOCK)
        navigate(page, urljoin(base, "classnest/"))
        expect(page.get_by_role("combobox", name="示範家庭", exact=True)).to_be_visible()
        balance(29, 3, 0)
        page.get_by_role("button", name="展示說明", exact=True).click()
        expect(page.get_by_role("dialog")).to_contain_text("並非正式登入")
        page.keyboard.press("Escape")
        return "本機資料載入成功；展示身分與預約規則可讀，鍵盤可關閉說明"

    def recurring():
        page.get_by_role("button", name="下一週", exact=True).click()
        page.get_by_role("combobox", name="老師", exact=True).select_option("emma")
        card = page.locator('[data-session-id="course-0-2026-09-21"]')
        card.get_by_role("button", name="連續週次", exact=True).click()
        dialog = page.get_by_role("dialog")
        dialog.get_by_role("combobox", name="連續週次", exact=True).select_option("2")
        expect(dialog.locator(".cn-series-list label")).to_have_count(2)
        dialog.get_by_role("button", name="保留所選 2 個時段", exact=True).click()
        expect(page.locator("#classnest-basket .cn-hold")).to_have_count(2)
        balance(29, 3, 0)
        page.get_by_role("button", name="確認預約", exact=True).click()
        balance(27, 5, 0)
        page.reload(wait_until="load")
        balance(27, 5, 0)
        return "連續 2 週預約成功：暫留未扣堂、確認凍結 2 堂，重新整理仍保留"

    def reschedule_cancel():
        nav("我的預約")
        row = page.locator(".cn-booking-row").filter(has_text="用英文說世界").filter(has_text="21日")
        row.get_by_role("button", name="改期", exact=True).click()
        page.get_by_role("combobox", name="改期至", exact=True).select_option("course-0-2026-09-22")
        page.get_by_role("button", name="確認改期", exact=True).click()
        expect(page.get_by_role("dialog")).to_have_count(0)
        balance(27, 5, 0)
        row = page.locator(".cn-booking-row").filter(has_text="用英文說世界").filter(has_text="22日")
        row.get_by_role("button", name="取消預約", exact=True).click()
        page.get_by_role("alertdialog").get_by_role("button", name="確定", exact=True).click()
        expect(page.get_by_role("alertdialog")).to_have_count(0)
        balance(28, 4, 0)
        return "單堂改期成功且堂數不變；取消改期後的新課退回 1 堂"

    def attendance():
        page.get_by_role("combobox", name="切換示範身分", exact=True).select_option("teacher")
        expect(page.get_by_role("heading", name="課表與出席紀錄", exact=True)).to_be_visible()
        page.get_by_role("button", name="出席扣堂", exact=True).click()
        expect(page.get_by_role("status")).to_contain_text("正式扣除 1 堂")
        page.get_by_role("combobox", name="切換示範身分", exact=True).select_option("parent")
        balance(28, 3, 1)
        return "老師點名歷史課，家長端同步顯示凍結減 1、已扣加 1"

    def grant_export():
        page.get_by_role("combobox", name="切換示範身分", exact=True).select_option("admin")
        nav("堂數與設定")
        page.get_by_role("spinbutton", name="調整堂數", exact=True).fill("4")
        page.get_by_role("textbox", name="補退堂原因", exact=True).fill("CHECKPOINT 補堂驗證")
        page.get_by_role("button", name="儲存堂數調整", exact=True).click()
        balance(32, 3, 1)
        with page.expect_download() as event:
            page.get_by_role("button", name="匯出 CSV", exact=True).click()
        path = evidence / "classnest-ledger.csv"
        event.value.save_as(path)
        raw = path.read_bytes()
        assert raw.startswith(b"\xef\xbb\xbf"), "CSV 缺少 BOM"
        rows = list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
        assert any(row["原因"] == "CHECKPOINT 補堂驗證" and row["可用變動"] == "4" for row in rows)
        assert any(row["類型"] == "上課扣堂" for row in rows)
        assert sum(int(row["可用變動"]) for row in rows) == 32
        assert sum(int(row["凍結變動"]) for row in rows) == 3
        assert sum(int(row["已扣變動"]) for row in rows) == 1
        return "管理端補 4 堂並留下原因；實際下載 CSV 核對補堂與扣堂紀錄"

    def group_stop():
        nav("課程管理")
        page.get_by_role("combobox", name="篩選老師", exact=True).select_option("oliver")
        row = page.locator(".cn-admin-session").filter(has_text="陳家・樂樂")
        expect(row).to_contain_text("陳家・安安")
        row.get_by_role("button", name="停課", exact=True).click()
        page.get_by_role("textbox", name="停課原因", exact=True).fill("CHECKPOINT 團體停課")
        page.get_by_role("button", name="確認停課並退堂", exact=True).click()
        expect(page.get_by_role("dialog")).to_have_count(0)
        page.get_by_role("combobox", name="示範家庭", exact=True).select_option("chen")
        balance(24, 0, 0)
        return "兩位孩子的額滿團體課停開，陳家 2 堂凍結全數退回"

    def tabs_compete():
        page.get_by_role("combobox", name="切換示範身分", exact=True).select_option("parent")
        page.get_by_role("button", name="下一週", exact=True).click()
        page.get_by_role("combobox", name="老師", exact=True).select_option("leo")
        second = page.context.new_page()
        try:
            second.clock.install(time=CLOCK)
            navigate(second, urljoin(base,"classnest/"))
            second.get_by_role("combobox", name="示範家庭", exact=True).select_option("chen")
            second.get_by_role("button", name="下一週", exact=True).click()
            second.get_by_role("combobox", name="老師", exact=True).select_option("leo")
            first_button = page.get_by_role("button", name="保留 數學探險家 2026-09-21 15:30", exact=True)
            last_button = second.get_by_role("button", name="保留 數學探險家 2026-09-21 15:30", exact=True)
            expect(last_button).to_be_enabled()
            first_button.click()
            expect(page.locator("#classnest-basket .cn-hold")).to_have_count(1)
            expect(last_button).to_be_disabled()
            page.get_by_role("button", name="移除清單 數學探險家 2026-09-21", exact=True).click()
            expect(last_button).to_be_enabled()
            last_button.click()
            second.get_by_role("button", name="確認預約", exact=True).click()
            expect(second.get_by_test_id("frozen-credits")).to_have_text("1堂")
            expect(first_button).to_be_disabled()
        finally:
            second.close()
        return "雙分頁同一名額：暫留即互斥、釋放後另一家庭能預約，原頁同步額滿"

    def expiry():
        page.get_by_role("combobox", name="老師", exact=True).select_option("noah")
        page.get_by_role("button", name="保留 小小節奏合奏團 2026-09-21 18:00", exact=True).click()
        expect(page.locator("#classnest-basket .cn-hold")).to_have_count(1)
        before = page.get_by_test_id("frozen-credits").inner_text()
        page.clock.fast_forward(601_000)
        expect(page.locator("#classnest-basket .cn-hold")).to_have_count(0)
        expect(page.get_by_test_id("frozen-credits")).to_have_text(before)
        page.locator(".cn-heading").scroll_into_view_if_needed()
        return "倒數逾時釋放名額，沒有凍結或扣除堂數"

    def storage_failure():
        isolated = page.context.browser.new_context(viewport=page.viewport_size, locale="zh-TW", timezone_id="Asia/Taipei")
        try:
            # Inject a transient storage fault, not application state or reservations.
            isolated.add_init_script("""(() => {
              const original = IDBObjectStore.prototype.put;
              let failed = false;
              IDBObjectStore.prototype.put = function(value, ...args) {
                if (!failed && value?.holds?.length) {
                  failed = true;
                  throw new DOMException('示範儲存寫入失敗', 'QuotaExceededError');
                }
                return original.call(this, value, ...args);
              };
            })();""")
            blocked = isolated.new_page()
            blocked.clock.install(time=CLOCK)
            navigate(blocked,urljoin(base,"classnest/"))
            expect(blocked.locator(".cn-save-status")).to_contain_text("已存於本機")
            button = blocked.get_by_role("button",name="保留 用英文說世界 2026-09-14 15:30",exact=True)
            button.click()
            expect(blocked.get_by_role("alert")).to_contain_text("儲存寫入失敗")
            expect(blocked.locator("#classnest-basket .cn-hold")).to_have_count(0)
            expect(blocked.get_by_test_id("available-credits")).to_have_text("29堂")
            blocked.screenshot(path=str(evidence/"storage-failure.png"),animations="disabled")
            button.click()
            expect(blocked.locator("#classnest-basket .cn-hold")).to_have_count(1)
            expect(blocked.get_by_role("alert")).to_have_count(0)
        finally:
            isolated.close()
        return "模擬寫入失敗：不報成功、不新增暫留、不動堂數；再次操作可正常儲存"

    return [
        ("開啟課伴", "家長端載入與鍵盤說明操作", open_app),
        ("連續週次預約", "暫留、批次確認及重新整理後堂數正確", recurring),
        ("改期與取消", "原子改期與 24 小時前取消退堂", reschedule_cancel),
        ("老師點名扣堂", "跨角色凍結轉已扣", attendance),
        ("教務補堂與匯出", "管理調整和實際 CSV 下載正確", grant_export),
        ("團體課停開", "團體名單與全體退堂正確", group_stop),
        ("跨分頁名額互斥", "同瀏覽器兩個家庭不重複占位", tabs_compete),
        ("暫留逾時", "逾時釋放且不扣堂", expiry),
        ("儲存失敗與恢復", "寫入失敗保持原資料且可以重試", storage_failure),
        ("核對畫面與錯誤", "没有未處理錯誤或水平溢出", lambda: page_health(page,errors)),
    ]
