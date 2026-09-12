"""Read-only checks for a single, user-selected public page."""

import ipaddress
import re
from urllib.parse import urlsplit


class BlockedError(Exception):
    pass


def validate_url(value, *, allow_local=False):
    parsed = urlsplit(value)
    if (
        parsed.scheme not in ("https", "http")
        or not parsed.hostname
        or parsed.username
        or parsed.password
    ):
        raise ValueError("網址必須是沒有帳密的 HTTP / HTTPS 網址")
    host = parsed.hostname.lower()
    local = host == "localhost" or host.endswith((".localhost", ".local")) or "." not in host
    try:
        local = not ipaddress.ip_address(host).is_global
    except ValueError:
        pass
    if local and not allow_local:
        raise ValueError("自訂巡檢僅接受公開網址；本機建置請使用 --suite portfolio --base-url")
    return value


def navigate(page, url):
    response = page.goto(url, wait_until="load")
    if not response:
        raise BlockedError("導覽沒有取得 HTTP 回應")
    if response.status in (401, 403, 429):
        raise BlockedError(f"來源拒絕存取：HTTP {response.status}")
    if response.status >= 400:
        raise AssertionError(f"頁面回傳 HTTP {response.status}")
    page.locator("body").wait_for(state="visible")
    title = page.title()
    if re.search(r"just a moment|access denied|verify you are human|驗證您是人類", title, re.I):
        raise BlockedError("頁面要求存取驗證，未繼續操作")
    return f"HTTP {response.status} · {title}"


def page_health(page, page_errors):
    title = page.title().strip()
    assert title, "頁面標題為空"
    measurements = page.evaluate(
        """() => ({width: innerWidth, content: document.documentElement.scrollWidth})"""
    )
    assert (
        measurements["content"] <= measurements["width"] + 1
    ), f"水平溢出：內容 {measurements['content']}px / 視窗 {measurements['width']}px"
    assert not page_errors, "JavaScript 錯誤：" + " | ".join(page_errors)[:1000]
    return f"標題存在 · 無未處理錯誤 · {measurements['width']}px 無水平溢出"


def inspect_images(page):
    # Bounded scrolling lets native lazy images load without crawling another page.
    height = page.evaluate("document.documentElement.scrollHeight")
    for offset in range(0, min(height, 16000), 700):
        page.mouse.wheel(0, 700)
        page.wait_for_function(
            "() => !Array.from(document.images).some(i => { const r=i.getBoundingClientRect(); return r.top<innerHeight && r.bottom>0 && !i.complete; })",
            timeout=10000,
        )
    images = page.evaluate(
        """() => Array.from(document.images).filter(i => i.getClientRects().length && getComputedStyle(i).visibility !== 'hidden').map(i => ({src: i.currentSrc || i.src, complete: i.complete, width: i.naturalWidth, lazy:i.loading==='lazy'}))"""
    )
    broken = [item["src"] for item in images if item["complete"] and item["width"] == 0]
    pending = [item["src"] for item in images if not item["complete"] and not item["lazy"]]
    assert not broken and not pending, "圖片未載入：" + " | ".join((broken + pending)[:5])
    page.keyboard.press("Control+Home")
    deferred = sum(not item["complete"] for item in images)
    return f"檢查 {len(images) - deferred} 張圖片" + (
        f"；另 {deferred} 張超出捲動範圍，未檢查" if deferred else "，未發現載入失敗"
    )


def generic_steps(page, url, errors):
    return [
        ("開啟指定頁面", "取得成功回應，沒有存取驗證", lambda: navigate(page, url)),
        ("檢查標題與畫面", "標題存在、沒有未處理錯誤或水平溢出", lambda: page_health(page, errors)),
        ("檢查圖片", "已載入的可見圖片有效；最多捲動 16,000px", lambda: inspect_images(page)),
        ("完成後再次核對", "捲動後沒有新增錯誤或水平溢出", lambda: page_health(page, errors)),
    ]
