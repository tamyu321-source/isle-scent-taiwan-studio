import csv
import io
import json
from pathlib import Path

CSV_FIELDS = [
    ("id", "識別碼"), ("name", "店家名稱"), ("city", "城市"), ("district", "行政區"),
    ("address", "地址"), ("phone", "電話"), ("hours", "營業時間"),
    ("status", "核對狀態"), ("sourceUrls", "來源網址"),
    ("sourceUpdatedAt", "來源更新時間"), ("fetchedAt", "擷取時間"), ("checkedAt", "網頁核對時間"),
]
STATUS_LABELS = {"unverified": "官方資料", "matched": "已核對欄位", "conflict": "來源有差異", "failed": "核對失敗"}


def export_row(record):
    return {
        **{key: record.get(key, "") for key, _ in CSV_FIELDS},
        "status": STATUS_LABELS[record["verification"]["status"]],
        "sourceUrls": " | ".join(source["url"] for source in record["sources"]),
        "sourceUpdatedAt": " | ".join(f"{source['label']}: {source.get('updatedAt') or '未提供'}" for source in record["sources"]),
        "fetchedAt": " | ".join(f"{source['label']}: {source['fetchedAt']}" for source in record["sources"]),
        "checkedAt": record["verification"].get("checkedAt") or "",
    }


def safe_cell(value):
    text = str(value or "")
    # Quoting is not enough: spreadsheet programs still evaluate quoted formulas.
    return "'" + text if text.lstrip().startswith(("=", "+", "-", "@")) or text.startswith(("\t", "\r", "\n")) else text


def to_csv(records):
    stream = io.StringIO(newline="")
    writer = csv.writer(stream, lineterminator="\r\n", quoting=csv.QUOTE_ALL)
    writer.writerow([label for _, label in CSV_FIELDS])
    for record in records:
        row = export_row(record)
        writer.writerow([safe_cell(row[key]) for key, _ in CSV_FIELDS])
    return "\ufeff" + stream.getvalue()


def write_outputs(snapshot, output_dir, keyword=""):
    destination = Path(output_dir)
    destination.mkdir(parents=True, exist_ok=True)
    records = snapshot["merchants"]
    if keyword:
        from records import normalize
        records = [record for record in records if normalize(keyword) in normalize(" ".join(
            str(record.get(field) or "") for field in ("name", "city", "district", "address", "phone")
        ))]
    payload = {**snapshot, "merchants": records, "export": {"keyword": keyword, "count": len(records)}}
    for name, content in {
        "snapshot.json": json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n",
        "merchants.json": json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        "merchants.csv": to_csv(records),
        "run-report.md": "\n".join([
            "# FIELDWORK 蒐集摘要", "", f"- 完成時間：{snapshot['generatedAt']}",
            f"- 執行狀態：{snapshot['run']['status']}", f"- 輸出筆數：{len(records)}", "",
            *[f"- {source['label']}：{source['status']}；{source.get('error') or source.get('note') or '完成'}" for source in snapshot["run"]["sources"]],
            "", "資料只代表公開來源的記載；不等於確認仍在營業。", "",
            "來源：交通部觀光署 https://data.gov.tw/dataset/7779 （政府資料開放授權條款第1版）",
            "臺南旅遊網：https://www.twtainan.net/zh-tw/gwoia/ ，僅核對基本店家資訊。", "",
        ]),
    }.items():
        target = destination / name
        temporary = target.with_suffix(target.suffix + ".tmp")
        temporary.write_text(content, encoding="utf-8", newline="")
        temporary.replace(target)
