import argparse
import copy
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from exporters import write_outputs
from records import CITIES, attach_observation, catalog_records, mark_failed, valid_snapshot
from sources import (
    ARCHIVE_URL, HttpClient, SourceError, USER_AGENT, parse_tainan_html,
    read_archive, tainan_robots, tainan_url,
)


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def load_previous(client, snapshot_url, seed):
    candidates = []
    if seed and Path(seed).is_file():
        try:
            candidates.append(json.loads(Path(seed).read_text(encoding="utf-8-sig")))
        except (OSError, ValueError):
            print("初始快照無法讀取", file=sys.stderr)
    if snapshot_url:
        try:
            candidates.append(json.loads(client.get(snapshot_url, limit=30_000_000)))
        except (OSError, ValueError, SourceError) as error:
            print(f"上次發佈快照無法讀取：{error}", file=sys.stderr)
    valid = [candidate for candidate in candidates if valid_snapshot(candidate)]
    return max(valid, key=lambda value: value["generatedAt"]) if valid else None


def collect(client, previous=None, cities=CITIES, max_pages=100):
    started_at = now()
    records = copy.deepcopy([row for row in (previous or {}).get("merchants", []) if row["city"] in cities])
    source_runs = []
    old_runs = {source["id"]: source for source in (previous or {}).get("run", {}).get("sources", [])}
    catalog_run = {"id": "tourism", "label": "觀光署開放資料", "attemptedAt": started_at,
                   "lastSuccessAt": old_runs.get("tourism", {}).get("lastSuccessAt"), "status": "ok", "error": None}
    duplicates = 0
    try:
        catalog, times = read_archive(client.get(ARCHIVE_URL))
        fetched_at = now()
        records, duplicates = catalog_records(catalog, times, cities, fetched_at, records)
        catalog_run.update(lastSuccessAt=fetched_at, processed=len(records))
    except (OSError, ValueError, TypeError, KeyError, SourceError) as error:
        if not records or any(not any(row["city"] == city for row in records) for city in cities):
            raise SourceError(f"官方資料讀取失敗，且沒有完整有效快照：{error}") from error
        catalog_run.update(status="failed", error=str(error), processed=0)
    source_runs.append(catalog_run)
    crawl_run = {"id": "tainan", "label": "臺南店家 HTML", "attemptedAt": now(),
                 "lastSuccessAt": old_runs.get("tainan", {}).get("lastSuccessAt"),
                 "status": "skipped", "processed": 0, "failed": 0, "error": None}
    candidates = sorted([row for row in records if tainan_url(row["id"])],
                        key=lambda row: (row["verification"].get("lastAttemptAt") or "", row["id"]))[:max_pages]
    if candidates:
        try:
            robots, note = tainan_robots(client)
            crawl_run.update(status="ok", note=note)
            for record in candidates:
                url, local_id = tainan_url(record["id"])
                attempted_at = now()
                try:
                    if not robots.can_fetch(USER_AGENT, url):
                        raise SourceError("robots 規則禁止讀取此頁")
                    html = client.get(url, limit=3_000_000).decode("utf-8")
                    observed = parse_tainan_html(html, local_id)
                    fetched_at = now()
                    attach_observation(record, {**observed, "id": "tainan", "label": "臺南旅遊網",
                                               "url": url, "fetchedAt": fetched_at}, fetched_at)
                    crawl_run["processed"] += 1
                    crawl_run["lastSuccessAt"] = fetched_at
                except (OSError, ValueError, SourceError) as error:
                    mark_failed(record, attempted_at, error)
                    crawl_run.update(status="partial", failed=crawl_run["failed"] + 1, error=str(error))
                print(f"網頁核對 {crawl_run['processed'] + crawl_run['failed']}/{len(candidates)}：{record['name']} — {record['verification']['status']}", flush=True)
        except (OSError, SourceError) as error:
            crawl_run.update(status="failed", error=str(error))
        if crawl_run["status"] == "partial" and crawl_run["processed"] == 0:
            crawl_run["status"] = "failed"
    else:
        crawl_run["note"] = "本次未要求網頁核對，或所選城市無此來源"
    source_runs.append(crawl_run)
    status = "stale" if catalog_run["status"] == "failed" else (
        "partial" if crawl_run["status"] in ("partial", "failed") else "ok"
    )
    return {
        "schemaVersion": 1, "generatedAt": now(),
        "run": {"startedAt": started_at, "status": status, "sources": source_runs,
                "duplicatesRemoved": duplicates, "total": len(records)},
        "merchants": records,
    }


def main():
    parser = argparse.ArgumentParser(description="FIELDWORK：蒐集官方店家資料、核對公開 HTML、匯出 CSV / JSON")
    parser.add_argument("--cities", nargs="+", choices=CITIES, default=list(CITIES))
    parser.add_argument("--keyword", default="", help="匯出時篩選名稱、地址或電話")
    parser.add_argument("--output-dir", default="output")
    parser.add_argument("--max-pages", type=int, default=100, help="本次網頁核對數量，0–100；0 只更新官方資料")
    parser.add_argument("--snapshot-url", help="上次 GitHub Pages JSON 快照")
    parser.add_argument("--seed", help="首次執行或網路失敗時使用的本機 JSON 快照")
    args = parser.parse_args()
    if not 0 <= args.max_pages <= 100:
        parser.error("--max-pages 必須介於 0 與 100")
    client = HttpClient()
    previous = load_previous(client, args.snapshot_url, args.seed or str(Path(args.output_dir) / "snapshot.json"))
    try:
        snapshot = collect(client, previous, tuple(dict.fromkeys(args.cities)), args.max_pages)
        write_outputs(snapshot, args.output_dir, args.keyword)
    except (OSError, ValueError, SourceError) as error:
        print(f"FIELDWORK 未輸出：{error}", file=sys.stderr)
        return 1
    print(f"完成：{snapshot['run']['total']} 筆來源資料，狀態 {snapshot['run']['status']}，輸出至 {Path(args.output_dir).resolve()}")
    return 0
