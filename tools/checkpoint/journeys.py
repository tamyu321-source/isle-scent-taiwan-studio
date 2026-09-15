"""Portfolio-specific journeys. All changes are made through visible controls."""

import csv
import io
import json
import re
from urllib.parse import urljoin, urlsplit

from playwright.sync_api import expect

from browser_checks import navigate, page_health


def portfolio_steps(page, base, mobile, errors, evidence):
    titles = [
        "VECTOR",
        "Isle / Scent",
        "PURE WHITE",
        "豬仔仔幼兒園",
        "Order Flow",
        "MORI 留白陶作",
        "ShareFlow",
        "FIELDWORK",
        "CHECKPOINT",
    ]

    def navigation():
        if mobile:
            page.get_by_role("button", name="開啟選單", exact=True).click()
            nav = page.get_by_role("navigation", name="行動版作品集導覽")
        else:
            nav = page.get_by_role("navigation", name="作品集導覽", exact=True)
        nav.get_by_role("link", name="WORK", exact=not mobile).click()
        expect(page).to_have_url(re.compile(r"#work$"))
        return "導覽已移至作品區"

    def order():
        cards = page.locator("#work article")
        expect(cards).to_have_count(len(titles))
        assert cards.locator("h3").all_text_contents() == titles, "作品順序與預期不同"
        assert cards.locator(".portfolio-real-number").all_text_contents() == [
            f"{i:02}" for i in range(1, len(titles) + 1)
        ], "作品編號不連續"
        return "9 件作品依照 01–09 排列，名稱與順序一致（含 VECTOR）"

    def entries():
        checked = []
        for title in titles:
            link = page.get_by_role("link", name=f"進入 {title}", exact=True)
            destination = urljoin(base, link.get_attribute("href"))
            assert destination.startswith(base), "作品入口離開指定的作品集"
            with page.expect_navigation(wait_until="load"):
                link.click()
            expect(page).to_have_url(destination)
            response = page.reload(wait_until="load")
            assert response and response.status < 400, f"{title} 載入失敗"
            assert page.title().strip(), f"{title} 沒有標題"
            page.locator("main").wait_for(state="visible")
            checked.append(title)
            page.go_back(wait_until="load")
            page.locator("#work").wait_for(state="visible")
        return "成功開啟並返回：" + "、".join(checked)

    return [
        ("開啟作品集", "取得作品集頁面", lambda: navigate(page, base)),
        ("操作導覽", "桌面或手機導覽可到達作品區", navigation),
        ("核對作品順序", "9 件作品，編號 01–09（含 VECTOR）", order),
        ("逐一開啟作品入口", "9 個入口成功載入並可返回", entries),
        ("核對畫面與錯誤", "沒有未處理錯誤或水平溢出", lambda: page_health(page, errors)),
    ]


def yogurt_steps(page, base, mobile, errors, evidence):
    recipes = [
        ("早餐", "藍莓香蕉燕麥碗", "breakfast", "150g"),
        ("午後", "蜜橙杏仁優格杯", "afternoon", "80g"),
        ("餐桌", "檸檬香草優格沾醬", "savory", "300g"),
    ]

    def size():
        size_tab = page.get_by_role("tab", name=re.compile(r"分享罐\s*450g"))
        size_tab.click()
        expect(size_tab).to_have_attribute("aria-selected", "true")
        expect(page.get_by_role("link", name="探索產品細節")).to_have_attribute(
            "href", re.compile("size=jar$")
        )
        page.get_by_role("link", name="探索產品細節").click()
        expect(page).to_have_url(re.compile(r"/pure-white/original/?\?size=jar$"))
        expect(page.get_by_role("tab", name=re.compile(r"分享罐\s*450g"))).to_have_attribute(
            "aria-selected", "true"
        )
        page.reload(wait_until="load")
        expect(page.get_by_role("tab", name=re.compile(r"分享罐\s*450g"))).to_have_attribute(
            "aria-selected", "true"
        )
        return "450g 選擇帶入產品頁；重新整理後仍為分享罐"

    def recipe(label, title, image, amount):
        page.get_by_role("tab", name=label, exact=True).click()
        panel = page.get_by_role("tabpanel", name=label, exact=True)
        expect(panel.get_by_role("heading", name=title)).to_be_visible()
        expect(panel).to_contain_text(amount)
        expect(panel).to_contain_text("食材提醒")
        picture = page.locator("#ritual img")
        expect(picture).to_have_attribute("src", re.compile(f"recipe-{image}\\.webp"))
        page.wait_for_function(
            "() => {const i=document.querySelector('#ritual img'); return i?.complete && i.naturalWidth>0;}"
        )
        assert panel.locator("li").count() >= 3, "食譜步驟不足"
        page.locator("#ritual").scroll_into_view_if_needed()
        return f"{title}：照片已載入，材料、步驟、食材提醒可讀"

    def faq():
        button = page.get_by_role("button", name="希臘優格，為什麼比較濃厚？", exact=True)
        button.click()
        expect(button).to_have_attribute("aria-expanded", "true")
        content = page.locator('[id="' + button.get_attribute("aria-controls") + '"]')
        expect(content).to_be_visible()
        assert content.inner_text().strip(), "FAQ 答案為空"
        return "FAQ 已展開且顯示完整答案"

    def menu():
        if mobile:
            page.get_by_role("button", name="開啟導覽選單").click()
            page.get_by_role("navigation", name="行動版品牌導覽").get_by_role(
                "link", name="日常搭配"
            ).click()
        else:
            page.get_by_role("navigation", name="品牌導覽", exact=True).get_by_role(
                "link", name="日常搭配"
            ).click()
        expect(page).to_have_url(re.compile("#ritual$"))
        return "品牌選單導向日常搭配，對話框已關閉"

    return [
        (
            "開啟優格首頁",
            "取得 PURE WHITE 首頁",
            lambda: navigate(page, urljoin(base, "pure-white/")),
        ),
        ("規格帶入與重新整理", "分享罐 450g 在產品頁與重新整理後保持選取", size),
        *[
            (
                f"切換{label}食譜",
                f"{title}的照片、材料與步驟相符",
                lambda values=(label, title, image, amount): recipe(*values),
            )
            for label, title, image, amount in recipes
        ],
        ("展開常見問題", "點擊後可閱讀答案", faq),
        ("操作品牌導覽", "選單可導向日常搭配", menu),
        ("核對畫面與錯誤", "沒有未處理錯誤或水平溢出", lambda: page_health(page, errors)),
    ]


def fieldwork_steps(page, base, mobile, errors, evidence):
    state = {}
    results = page.locator("#merchant-results")

    def open_workspace():
        with page.expect_response(
            lambda response: urlsplit(response.url).path.endswith("/data/fieldwork/merchants.json")
        ) as payload:
            message = navigate(page, urljoin(base, "fieldwork/"))
        response = payload.value
        assert response.status == 200, "資料快照讀取失敗"
        state["snapshot"] = response.json()
        state["records"] = state["snapshot"]["merchants"]
        expect(results).to_have_attribute("aria-busy", "false")
        count(len(state["records"]))
        return f"{message} · 同次快照 {len(state['records'])} 筆"

    def count(number):
        expect(results.locator(".fw-section-heading")).to_contain_text(f"{number:,} RESULTS")

    def select(label, option):
        page.get_by_role("combobox", name=label, exact=True).click()
        page.get_by_role("option", name=option, exact=True).click()

    def filters():
        city = "桃園市"
        rows = [r for r in state["records"] if r["city"] == city]
        assert rows, "快照中缺少桃園資料"
        select("城市", city)
        count(len(rows))
        district = next(r["district"] for r in rows if r["district"])
        select("行政區", district)
        matches = [r for r in rows if r["district"] == district]
        count(len(matches))
        return f"{city} {len(rows)} 筆；{district} {len(matches)} 筆，與快照一致"

    def paginate():
        page.get_by_role("button", name="重設篩選").click()
        expect(results.locator("tbody tr")).to_have_count(15)
        before = results.locator("tbody tr").first.inner_text()
        page.get_by_role("button", name="下一頁", exact=True).click()
        expect(results.locator(".fw-pagination")).to_contain_text("16–30")
        assert results.locator("tbody tr").first.inner_text() != before, "翻頁後仍為同一筆"
        page.get_by_role("button", name="上一頁", exact=True).click()
        expect(results.locator(".fw-pagination")).to_contain_text("1–15")
        return "每頁 15 筆，成功翻到第 2 頁並返回"

    def search():
        sample = next((r for r in state["records"] if len(r["sources"]) > 1), state["records"][0])
        state["sample"] = sample
        query = sample["name"]
        normalize = lambda s: re.sub(r"[\s,，。｜|·]+", "", s.replace("台", "臺")).lower()
        state["matches"] = [
            r
            for r in state["records"]
            if normalize(query) in normalize(" ".join([r["name"], r["address"], r["phone"]]))
        ]
        page.get_by_role("textbox", name="搜尋店家").fill(query)
        count(len(state["matches"]))
        return f"搜尋「{query}」：{len(state['matches'])} 筆，與快照一致"

    def detail():
        sample = state["sample"]
        results.get_by_role("button", name=sample["name"], exact=True).first.click()
        dialog = page.get_by_role("dialog")
        expect(dialog.get_by_role("heading", name=sample["name"], exact=True)).to_be_visible()
        expect(dialog).to_contain_text(sample["id"])
        expect(dialog.locator(".fw-observation")).to_have_count(len(sample["sources"]))
        return f"{sample['name']}明細：{len(sample['sources'])} 個來源，識別碼一致"

    def download(format, selected=False):
        if page.get_by_role("dialog").is_visible():
            page.keyboard.press("Escape")
        if selected:
            sample = state["sample"]
            results.get_by_role("checkbox", name=f"選取 {sample['name']}", exact=True).first.check()
            select("匯出範圍", "勾選資料（1）")
            rows = [sample]
        else:
            rows = state["matches"]
        with page.expect_download() as event:
            page.get_by_role("button", name=format.upper(), exact=True).click()
        destination = evidence / f"fieldwork-{format}.{format}"
        event.value.save_as(destination)
        assert event.value.failure() is None, "下載未完成"
        if format == "csv":
            raw = destination.read_bytes()
            assert raw.startswith(b"\xef\xbb\xbf"), "CSV 缺少 UTF-8 BOM"
            exported = list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
            assert {r["識別碼"] for r in exported} == {
                r["id"] for r in rows
            }, "CSV 與目前篩選資料不同"
            assert len(exported) == len(rows), "CSV 筆數不符"
        else:
            exported = json.loads(destination.read_text(encoding="utf-8"))
            assert exported["export"]["scope"] == "selected", "匯出範圍不符"
            assert exported["export"]["count"] == len(rows)
            assert exported["merchants"] == rows, "JSON 欄位或來源資料不符"
        return f"實際下載 {destination.name}，{len(rows)} 筆資料與畫面條件一致"

    def empty():
        page.get_by_role("textbox", name="搜尋店家").fill("CHECKPOINT_NO_MATCH_829164")
        count(0)
        expect(results).to_contain_text("沒有符合條件的店家")
        return "無符合資料時顯示空結果，沒有替換成假資料"

    return [
        ("讀取工作台與快照", "畫面筆數與實際取得的快照一致", open_workspace),
        ("城市與行政區篩選", "兩層篩選筆數與快照一致", filters),
        ("操作分頁", "第 1、2 頁內容不同且可返回", paginate),
        ("搜尋店家", "關鍵字結果與快照一致", search),
        ("查看來源明細", "店家識別碼與來源數量一致", detail),
        ("下載篩選 CSV", "實際下載含 BOM 的 CSV，內容與篩選相符", lambda: download("csv")),
        ("勾選並下載 JSON", "JSON 僅包含勾選資料及完整來源", lambda: download("json", True)),
        ("驗證空結果", "不存在的關鍵字回傳 0 筆", empty),
        ("核對畫面與錯誤", "沒有未處理錯誤或水平溢出", lambda: page_health(page, errors)),
    ]
