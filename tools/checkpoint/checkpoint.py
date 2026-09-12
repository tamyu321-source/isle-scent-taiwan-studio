"""CHECKPOINT CLI. Run cases in owned processes so a hung page has a hard limit."""

import argparse
import os
import signal
import subprocess
import sys
from pathlib import Path

from browser_checks import validate_url
from reporting import (
    VERSION,
    create_run,
    finish_report,
    read_json,
    save_report,
    timestamp,
    write_json,
)

DEFAULT_BASE = "https://tamyu321-source.github.io/isle-scent-taiwan-studio/"
VIEWPORTS = {"desktop": {"width": 1440, "height": 900}, "mobile": {"width": 390, "height": 844}}
CASE_LIMIT = 180


def parser():
    result = argparse.ArgumentParser(
        description="CHECKPOINT：實際操作 Chromium，保存巡檢結果與截圖。僅測試有權操作的網站。"
    )
    result.add_argument("--suite", choices=["portfolio"], default="portfolio")
    result.add_argument(
        "--base-url", default=DEFAULT_BASE, help="內建作品集的根網址，支援本機建置與 Pages 子路徑"
    )
    result.add_argument("--url", help="改為基本巡檢單一公開網址；不點擊或提交表單")
    result.add_argument("--viewport", choices=["desktop", "mobile", "both"], default="both")
    result.add_argument("--output", default="output", help="輸出父目錄，每次產生獨立子目錄")
    result.add_argument(
        "--headless", action="store_true", help="不顯示工具自己的 Chromium 視窗（CI 用）"
    )
    result.add_argument("--version", action="version", version=VERSION)
    return result


def stop_owned_process(process):
    if process.poll() is not None:
        return
    try:
        if os.name == "nt":
            process.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            os.killpg(process.pid, signal.SIGTERM)
        process.wait(timeout=5)
    except (OSError, subprocess.TimeoutExpired):
        if os.name == "nt":
            subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], capture_output=True)
        else:
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
        process.wait(timeout=5)


def interrupted_case(path, config, reason):
    case = (
        read_json(path)
        if path.exists()
        else {
            "id": config["id"],
            "title": config["title"],
            "viewport": config["viewport"],
            "dimensions": VIEWPORTS[config["viewport"]],
            "steps": [],
            "durationMs": 0,
        }
    )
    unfinished = next((step for step in case["steps"] if step["status"] == "skipped"), None)
    if unfinished:
        unfinished.update(status="blocked", actual=reason)
    else:
        case["steps"].append(
            {
                "id": "runner",
                "title": "執行程序",
                "expected": "在時限內完成",
                "actual": reason,
                "status": "blocked",
                "durationMs": 0,
            }
        )
    case.update(status="blocked", finishedAt=timestamp())
    write_json(path, case)
    return case


def run(args):
    target = (
        validate_url(args.url)
        if args.url
        else validate_url(args.base_url, allow_local=True).rstrip("/") + "/"
    )
    suite = "custom" if args.url else "portfolio"
    environment = "build-preview" if os.environ.get("CHECKPOINT_BUILD") == "1" else "local"
    root, report = create_run(
        args.output,
        suite=suite,
        target=target,
        revision=os.environ.get("GITHUB_SHA", ""),
        environment=environment,
    )
    report["headless"] = args.headless
    report["actionsUrl"] = (
        f"https://github.com/{os.environ['GITHUB_REPOSITORY']}/actions/runs/{os.environ['GITHUB_RUN_ID']}"
        if os.environ.get("GITHUB_RUN_ID") and os.environ.get("GITHUB_REPOSITORY")
        else ""
    )
    viewports = list(VIEWPORTS) if args.viewport == "both" else [args.viewport]
    journeys = (
        [("custom", "公開頁面基本巡檢")]
        if args.url
        else [
            ("portfolio", "作品集導覽"),
            ("yogurt", "PURE WHITE 產品體驗"),
            ("fieldwork", "FIELDWORK 資料操作"),
        ]
    )
    configs = []
    for viewport in viewports:
        for journey, title in journeys:
            config = {
                "id": f"{journey}-{viewport}",
                "journey": journey,
                "title": title,
                "viewport": viewport,
                "dimensions": VIEWPORTS[viewport],
                "target": target,
                "headless": args.headless,
            }
            configs.append(config)
            report["cases"].append({**config, "status": "skipped", "steps": [], "durationMs": 0})
    save_report(root, report)
    print(f"CHECKPOINT {VERSION} / {len(configs)} cases / {root}", flush=True)
    complete = True
    for index, config in enumerate(configs):
        case_root = root / config["id"]
        case_root.mkdir()
        config_path, result_path = case_root / "input.json", case_root / "case.json"
        write_json(config_path, config)
        process = None
        try:
            with (case_root / "worker.log").open("w", encoding="utf-8") as log:
                process = subprocess.Popen(
                    [
                        sys.executable,
                        "-X",
                        "utf8",
                        str(Path(__file__).with_name("worker.py")),
                        str(config_path),
                    ],
                    stdout=log,
                    stderr=subprocess.STDOUT,
                    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
                    start_new_session=os.name != "nt",
                )
                process.wait(timeout=CASE_LIMIT)
            if not result_path.exists() or process.returncode != 0:
                report["cases"][index] = interrupted_case(
                    result_path, config, "瀏覽器程序未正常完成；請查看 worker.log"
                )
            else:
                report["cases"][index] = read_json(result_path)
        except subprocess.TimeoutExpired:
            stop_owned_process(process)
            report["cases"][index] = interrupted_case(
                result_path, config, f"單案例超過 {CASE_LIMIT} 秒，已停止工具自己的瀏覽器程序"
            )
        except KeyboardInterrupt:
            if process:
                stop_owned_process(process)
            report["cases"][index] = interrupted_case(
                result_path, config, "使用者中斷；後续案例未執行"
            )
            complete = False
        except OSError as error:
            report["cases"][index] = interrupted_case(result_path, config, str(error))
        finish_report(report, False)
        save_report(root, report)
        case = report["cases"][index]
        print(
            f"  {case['status'].upper():7} {config['id']} / {case.get('durationMs', 0) / 1000:.1f}s",
            flush=True,
        )
        if not complete:
            break
    finish_report(report, complete)
    save_report(root, report)
    print(f"Report: {root / 'report.html'}", flush=True)
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
            output.write(f"report-dir={root.as_posix()}\n")
    return 0 if complete and report["status"] == "passed" else 1


if __name__ == "__main__":

    def cancel_run(signum, frame):
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, cancel_run)
    if hasattr(signal, "SIGBREAK"):
        signal.signal(signal.SIGBREAK, cancel_run)
    if sys.version_info < (3, 11):
        sys.exit("需要 Python 3.11 或更新版本")
    try:
        sys.exit(run(parser().parse_args()))
    except ValueError as error:
        sys.exit(str(error))
