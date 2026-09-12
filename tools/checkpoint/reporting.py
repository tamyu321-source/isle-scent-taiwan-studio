"""The browser runner and both report readers share this small document format."""

import html
import json
import platform
import uuid
from datetime import datetime, timezone
from pathlib import Path

VERSION = "1.0.0"
STATUSES = ("passed", "failed", "blocked", "skipped")
LABELS = {"passed": "通過", "failed": "失敗", "blocked": "受阻", "skipped": "未執行"}


def timestamp():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def create_run(directory, *, suite, target, revision="", environment="local"):
    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + uuid.uuid4().hex[:6]
    root = Path(directory).resolve() / run_id
    root.mkdir(parents=True, exist_ok=False)
    report = {
        "schemaVersion": 1,
        "runId": run_id,
        "toolVersion": VERSION,
        "startedAt": timestamp(),
        "finishedAt": None,
        "complete": False,
        "suite": suite,
        "target": target,
        "revision": revision,
        "environment": environment,
        "platform": platform.system(),
        "browser": "Chromium",
        "cases": [],
        "status": "skipped",
    }
    return root, report


def case_status(steps):
    for state in ("failed", "blocked", "skipped"):
        if any(step["status"] == state for step in steps):
            return state
    return "passed" if steps else "skipped"


def finish_report(report, complete=True):
    report["complete"] = complete
    report["finishedAt"] = timestamp()
    report["status"] = case_status(report["cases"])
    report["counts"] = {
        state: sum(case["status"] == state for case in report["cases"]) for state in STATUSES
    }
    return report


def write_json(path, value):
    path = Path(path)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def artifact_path(value):
    """Only runner-owned relative files can become report links."""
    if not isinstance(value, str) or "\\" in value or ":" in value or "?" in value or "#" in value:
        return None
    parts = value.split("/")
    if not value or any(part in ("", ".", "..") for part in parts):
        return None
    return value


def render_html(report):
    escape = lambda value: html.escape(str(value), quote=True)
    sections = []
    for case in report["cases"]:
        steps = []
        for step in case["steps"]:
            picture = artifact_path(step.get("screenshot"))
            figure = (
                f'<a href="{escape(picture)}"><img loading="lazy" src="{escape(picture)}" alt="{escape(step["title"])}的實際截圖"></a>'
                if picture
                else ""
            )
            steps.append(
                f'<li><span class="state {escape(step["status"])}">{LABELS[step["status"]]}</span><h3>{escape(step["title"])}</h3><p>預期：{escape(step["expected"])}</p><p>實際：{escape(step["actual"])}</p>{figure}</li>'
            )
        trace = artifact_path(case.get("trace"))
        trace_link = f'<p><a href="{escape(trace)}">下載失敗追蹤檔</a></p>' if trace else ""
        sections.append(
            f'<section><h2>{escape(case["title"])} / {escape(case["viewport"])} <small>{LABELS[case["status"]]}</small></h2><p>{escape(case.get("browserVersion", ""))} · {case.get("durationMs", 0) / 1000:.1f} 秒</p><ol>{"".join(steps)}</ol>{trace_link}</section>'
        )
    return f"""<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; base-uri 'none'"><title>CHECKPOINT / {escape(report['runId'])}</title>
<style>body{{font:16px/1.6 system-ui,sans-serif;background:#f3f4f5;color:#202226;margin:0;padding:32px}}main{{max-width:1080px;margin:auto}}h1{{font-size:38px}}h2{{font-size:24px}}h3{{font-size:18px;margin:8px 0}}p{{overflow-wrap:anywhere}}section{{background:white;border:1px solid #ddd;padding:24px;margin:24px 0}}ol{{padding:0;list-style:none}}li{{border-top:1px solid #ddd;padding:24px 0}}img{{display:block;max-width:100%;max-height:640px;object-fit:contain;object-position:left top;border:1px solid #ddd}}small,.state{{font-size:14px}}.state{{padding:4px 8px;background:#eee}}.passed{{color:#176346}}.failed{{color:#ac2b1b}}.blocked{{color:#915b13}}a{{color:#b33d14}}@media(max-width:600px){{body{{padding:16px}}section{{padding:16px}}}}</style>
<main><p>CHECKPOINT / BROWSER INSPECTION</p><h1>瀏覽器巡檢報告</h1><p>{escape(report['target'])}</p><p>執行：{escape(report['startedAt'])} · 版本：{escape(report['revision'] or report['toolVersion'])}</p><p>環境：{escape(report['environment'])} · 完成：{escape(report['complete'])} · {LABELS[report['status']]}</p><p>這是實際執行紀錄，不是即時控制台。自訂網站的基本巡檢不等同完整功能、效能或無障礙認證。</p>{''.join(sections)}</main></html>"""


def save_report(root, report):
    write_json(root / "report.json", report)
    (root / "report.html").write_text(render_html(report), encoding="utf-8")
