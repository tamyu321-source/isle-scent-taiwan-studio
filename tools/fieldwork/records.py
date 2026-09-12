"""Source observations stay intact; display values never hide a disagreement."""

import copy
import re
import unicodedata

from sources import DATASET_URL, SourceError

CITIES = ("臺南市", "桃園市")
FIELDS = ("name", "address", "phone", "hours")
DAYS = dict(zip(
    ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"),
    ("一", "二", "三", "四", "五", "六", "日"),
))


def normalize(value, field="name"):
    text = unicodedata.normalize("NFKC", str(value or "")).replace("台", "臺")
    if field == "phone":
        text = re.sub(r"\D", "", text)
        return "0" + text[3:] if text.startswith("886") else text
    return re.sub(r"[\s,，。｜|·]+", "", text).casefold()


def format_hours(services):
    result = []
    for item in services:
        days = "、".join(DAYS.get(day, day) for day in item.get("ServiceDays", []))
        span = "–".join(str(item.get(key) or "")[:5] for key in ("StartTime", "EndTime")).strip("–")
        line = " ".join(part for part in (f"週{days}" if days else "", span, item.get("Description")) if part)
        if line:
            result.append(line)
    return "；".join(dict.fromkeys(result))


def reconcile(record):
    sources = record["sources"]
    record["differences"] = [field for field in FIELDS if len({
        normalize(source["values"].get(field), field)
        for source in sources if source["values"].get(field)
    }) > 1]
    for field in FIELDS:
        record[field] = next((source["values"].get(field) for source in sources
                              if source["values"].get(field)), "")
    if record["verification"]["status"] != "failed":
        record["verification"]["status"] = (
            "conflict" if record["differences"] else "matched"
        ) if len(sources) > 1 else "unverified"
    return record


def catalog_records(catalog, times, cities, fetched_at, previous):
    if not isinstance(catalog.get("Restaurants"), list) or not isinstance(times.get("RestaurantServiceTimes"), list):
        raise SourceError("官方清單缺少必要欄位")
    opening = {item["RestaurantID"]: item for item in times["RestaurantServiceTimes"]}
    old = {record["id"]: record for record in previous}
    records = []
    seen = set()
    duplicate_count = 0
    for item in catalog["Restaurants"]:
        address = item.get("PostalAddress") or {}
        city = str(address.get("City") or "").replace("台", "臺")
        if city not in cities:
            continue
        identity, name = item.get("RestaurantID"), item.get("RestaurantName")
        if not isinstance(identity, str) or not isinstance(name, str) or not name.strip():
            raise SourceError("官方店家缺少識別碼或名稱")
        # Provider IDs preserve branches; never collapse records just because phones match.
        if identity in seen:
            duplicate_count += 1
            continue
        seen.add(identity)
        district = address.get("Town") or ""
        street = address.get("StreetAddress") or ""
        full_address = street if street.startswith((city, city.replace("臺", "台"))) else city + ("" if street.startswith(district) else district) + street
        service = opening.get(identity, {})
        hours = item.get("ServiceTimeInfo") or format_hours(service.get("ServiceTimes", []))
        phone = " / ".join(entry.get("Tel", "") for entry in item.get("Telephones", []) if entry.get("Tel"))
        observation = {
            "id": "tourism", "label": "交通部觀光署", "url": DATASET_URL,
            "fetchedAt": fetched_at, "updatedAt": item.get("UpdateTime") or catalog.get("UpdateTime"),
            "hoursUpdatedAt": service.get("UpdateTime"),
            "values": {"name": name.strip(), "address": full_address, "phone": phone, "hours": hours},
        }
        prior = old.get(identity, {})
        record = {
            "id": identity, "city": city, "district": district,
            "sources": [observation] + copy.deepcopy([source for source in prior.get("sources", []) if source["id"] != "tourism"]),
            "verification": copy.deepcopy(prior.get("verification", {
                "status": "unverified", "checkedAt": None, "lastAttemptAt": None, "error": None,
            })),
        }
        records.append(reconcile(record))
    if not records or any(not any(record["city"] == city for record in records) for city in cities):
        raise SourceError("官方資料未包含所選城市；保留舊快照")
    return records, duplicate_count


def attach_observation(record, observation, attempted_at):
    record["sources"] = [source for source in record["sources"] if source["id"] != observation["id"]] + [observation]
    record["verification"] = {"status": "matched", "checkedAt": attempted_at,
                              "lastAttemptAt": attempted_at, "error": None}
    return reconcile(record)


def mark_failed(record, attempted_at, error):
    record["verification"].update(status="failed", lastAttemptAt=attempted_at, error=str(error))
    return record


def valid_snapshot(value):
    if not isinstance(value, dict) or value.get("schemaVersion") != 1 or not value.get("merchants"):
        return False
    try:
        identities = set()
        for record in value["merchants"]:
            if record["id"] in identities or not record["name"] or record["city"] not in CITIES or not record["sources"]:
                return False
            identities.add(record["id"])
            for source in record["sources"]:
                if not isinstance(source["values"], dict) or not source["fetchedAt"]:
                    return False
            if record["verification"]["status"] not in ("unverified", "matched", "conflict", "failed"):
                return False
        return isinstance(value["run"]["sources"], list) and bool(value["generatedAt"])
    except (KeyError, TypeError):
        return False
