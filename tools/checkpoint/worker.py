"""One isolated browser case. Checkpoint progress after each individual action."""

import signal
import sys
import time
from pathlib import Path

from reporting import case_status, read_json, timestamp, write_json


def interrupted(signum, frame):
    raise InterruptedError("巡檢已中斷")


def execute(config_path):
    config_path = Path(config_path)
    config = read_json(config_path)
    directory = config_path.parent
    result_path = directory / "case.json"
    result = {
        **config,
        "startedAt": timestamp(),
        "finishedAt": None,
        "status": "skipped",
        "steps": [],
        "durationMs": 0,
    }
    write_json(result_path, result)
    start = time.monotonic()
    browser = context = None
    try:
        from playwright.sync_api import sync_playwright, expect, TimeoutError as PlaywrightTimeout
        from browser_checks import BlockedError, generic_steps
        from journeys import portfolio_steps, yogurt_steps, fieldwork_steps

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=config["headless"])
            context = browser.new_context(
                viewport=config["dimensions"],
                locale="zh-TW",
                timezone_id="Asia/Taipei",
                accept_downloads=True,
                is_mobile=config["viewport"] == "mobile",
                has_touch=config["viewport"] == "mobile",
            )
            context.set_default_timeout(10000)
            context.set_default_navigation_timeout(30000)
            expect.set_options(timeout=10000)
            result["browserVersion"] = f"Chromium {browser.version}"
            context.tracing.start(screenshots=True, snapshots=True, sources=False)
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)[:1000]))
            if config["journey"] == "custom":
                actions = generic_steps(page, config["target"], errors)
            else:
                actions = {
                    "portfolio": portfolio_steps,
                    "yogurt": yogurt_steps,
                    "fieldwork": fieldwork_steps,
                }[config["journey"]](
                    page, config["target"], config["viewport"] == "mobile", errors, directory
                )
            result["steps"] = [
                {
                    "id": f"step-{index + 1:02}",
                    "title": title,
                    "expected": expected,
                    "actual": "前置步驟尚未完成",
                    "status": "skipped",
                    "durationMs": 0,
                }
                for index, (title, expected, _) in enumerate(actions)
            ]
            write_json(result_path, result)
            try:
                for index, (_, _, action) in enumerate(actions):
                    step = result["steps"][index]
                    before = time.monotonic()
                    try:
                        step["actual"] = action()
                        step["status"] = "passed"
                    except (BlockedError, PlaywrightTimeout, InterruptedError) as error:
                        step.update(status="blocked", actual=str(error)[:2000])
                    except Exception as error:
                        message = str(error)
                        blocked = (
                            "net::ERR_" in message or "TargetClosedError" in type(error).__name__
                        )
                        step.update(
                            status="blocked" if blocked else "failed",
                            actual=message[:2000] or type(error).__name__,
                        )
                    step["durationMs"] = round((time.monotonic() - before) * 1000)
                    try:
                        screenshot = f"{step['id']}.png"
                        page.screenshot(
                            path=str(directory / screenshot), animations="disabled", timeout=5000
                        )
                        step["screenshot"] = f"{config['id']}/{screenshot}"
                    except Exception as error:
                        step["evidenceError"] = str(error)[:400]
                        if step["status"] == "passed":
                            step.update(status="blocked", actual=step["actual"] + "；截圖未完成")
                    result["status"] = case_status(result["steps"])
                    result["durationMs"] = round((time.monotonic() - start) * 1000)
                    write_json(result_path, result)
                    if step["status"] != "passed":
                        break
            finally:
                result["status"] = case_status(result["steps"])
                if result["status"] != "passed":
                    try:
                        context.tracing.stop(path=str(directory / "trace.zip"))
                        result["trace"] = f"{config['id']}/trace.zip"
                    except Exception as error:
                        result["traceError"] = str(error)[:400]
                else:
                    context.tracing.stop()
                context.close()
                browser.close()
    except BaseException as error:
        result["status"] = "blocked"
        result["steps"].append(
            {
                "id": "environment",
                "title": "執行環境",
                "expected": "啟動並完成獨立 Chromium 巡檢",
                "actual": str(error)[:2000],
                "status": "blocked",
                "durationMs": 0,
            }
        )
    finally:
        result["durationMs"] = round((time.monotonic() - start) * 1000)
        result["finishedAt"] = timestamp()
        write_json(result_path, result)


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    if hasattr(signal, "SIGBREAK"):
        signal.signal(signal.SIGBREAK, interrupted)
    execute(sys.argv[1])
