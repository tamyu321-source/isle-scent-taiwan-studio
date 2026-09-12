"""Synthetic fixtures are used only in tests, never as published merchant data."""
import copy
import csv
import io
import json
import tempfile
import unittest
import urllib.error
import zipfile
from pathlib import Path
from unittest.mock import patch

from collector import collect
from exporters import safe_cell, to_csv, write_outputs
from records import attach_observation, catalog_records, mark_failed, normalize, valid_snapshot
from sources import HttpClient, SourceError, parse_tainan_html, read_archive, tainan_robots, tainan_url

STAMP = "2026-09-13T00:00:00+00:00"


def catalog_fixture():
    return {"UpdateTime": STAMP, "Restaurants": [{
        "RestaurantID": "Restaurant_395000000A_001052", "RestaurantName": "測試店家",
        "PostalAddress": {"City": "臺南市", "Town": "後壁區", "StreetAddress": "測試路1號"},
        "Telephones": [{"Tel": "(06)6621877"}], "ServiceTimeInfo": "", "UpdateTime": STAMP,
    }]}


def time_fixture():
    return {"RestaurantServiceTimes": [{
        "RestaurantID": "Restaurant_395000000A_001052", "UpdateTime": STAMP,
        "ServiceTimes": [{"ServiceDays": ["Monday"], "StartTime": "09:00:00", "EndTime": "17:00:00"}],
    }]}


def fixture_record():
    return catalog_records(catalog_fixture(), time_fixture(), ("臺南市",), STAMP, [])[0][0]


def fixture_snapshot():
    return {"schemaVersion": 1, "generatedAt": STAMP,
            "run": {"startedAt": STAMP, "status": "ok", "sources": [{"id": "tourism", "label": "官方", "status": "ok", "lastSuccessAt": STAMP}], "total": 1, "duplicatesRemoved": 0},
            "merchants": [fixture_record()]}


def archive_bytes():
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("RestaurantList.json", json.dumps(catalog_fixture()))
        archive.writestr("RestaurantServiceTimeList.json", json.dumps(time_fixture()))
    return buffer.getvalue()


class RecordTests(unittest.TestCase):
    def test_html_extracts_only_allowed_fields(self):
        page = {"props": {"pageProps": {"data": {"id": 1052, "name": "測試店家", "tel": "+886-6-6621877", "address": "測試路1號", "open_time": "09:00–17:00", "summary": "不應轉載", "gg_place_rating": "4.9"}}}}
        html = '<script type="application/json" id="__NEXT_DATA__">' + json.dumps(page) + "</script>"
        result = parse_tainan_html(html, "1052")
        self.assertEqual(result["values"]["phone"], "+886-6-6621877")
        self.assertNotIn("summary", json.dumps(result))
        with self.assertRaises(SourceError):
            parse_tainan_html(html, "1053")
        with self.assertRaises(SourceError):
            parse_tainan_html("<html>Captcha</html>", "1052")

    def test_service_time_join_and_missing_fields(self):
        record = fixture_record()
        self.assertEqual(record["hours"], "週一 09:00–17:00")
        self.assertEqual(record["address"], "臺南市後壁區測試路1號")
        catalog = catalog_fixture()
        catalog["Restaurants"][0]["Telephones"] = []
        record = catalog_records(catalog, {"RestaurantServiceTimes": []}, ("臺南市",), STAMP, [])[0][0]
        self.assertEqual((record["phone"], record["hours"]), ("", ""))

    def test_duplicate_ids_removed_but_branches_kept(self):
        catalog = catalog_fixture()
        branch = copy.deepcopy(catalog["Restaurants"][0])
        branch["RestaurantID"] = "Restaurant_395000000A_001053"
        branch["PostalAddress"]["StreetAddress"] = "測試路2號"
        catalog["Restaurants"].extend([copy.deepcopy(catalog["Restaurants"][0]), branch])
        records, duplicates = catalog_records(catalog, time_fixture(), ("臺南市",), STAMP, [])
        self.assertEqual((len(records), duplicates), (2, 1))

    def test_normalization_and_conflict_provenance(self):
        self.assertEqual(normalize("+886-6-6621877", "phone"), normalize("(06)6621877", "phone"))
        record = fixture_record()
        observation = {"id": "tainan", "label": "臺南旅遊網", "url": "https://www.twtainan.net/zh-tw/shop/consume/1052/", "fetchedAt": STAMP, "updatedAt": STAMP,
                       "values": {**record["sources"][0]["values"], "phone": "06-1234567"}}
        attach_observation(record, observation, STAMP)
        self.assertEqual(record["verification"]["status"], "conflict")
        self.assertEqual(record["differences"], ["phone"])
        self.assertEqual(record["phone"], "(06)6621877")
        self.assertEqual(record["sources"][1]["values"]["phone"], "06-1234567")
        mark_failed(record, "2026-09-14T00:00:00+00:00", TimeoutError("timeout"))
        self.assertEqual(record["verification"]["checkedAt"], STAMP)
        self.assertEqual(record["sources"][1]["fetchedAt"], STAMP)
        self.assertEqual(record["verification"]["status"], "failed")

    def test_source_identifier_allowlist(self):
        self.assertEqual(tainan_url("Restaurant_395000000A_001052")[1], "1052")
        self.assertIsNone(tainan_url("Restaurant_376430000A_001052"))
        self.assertIsNone(tainan_url("../admin"))

    def test_snapshot_validation(self):
        self.assertTrue(valid_snapshot(fixture_snapshot()))
        self.assertFalse(valid_snapshot({"schemaVersion": 1, "merchants": []}))
        snapshot = fixture_snapshot()
        snapshot["merchants"].append(snapshot["merchants"][0])
        self.assertFalse(valid_snapshot(snapshot))


class FailureTests(unittest.TestCase):
    def test_archive_format(self):
        self.assertEqual(read_archive(archive_bytes()), (catalog_fixture(), time_fixture()))
        with self.assertRaises(SourceError):
            read_archive(b"not a zip")

    def test_source_failure_keeps_previous_fetch_time(self):
        client = HttpClient()
        with patch.object(client, "get", side_effect=TimeoutError("timeout")):
            result = collect(client, fixture_snapshot(), cities=("臺南市",), max_pages=0)
        self.assertEqual(result["run"]["status"], "stale")
        self.assertEqual(result["merchants"][0]["sources"][0]["fetchedAt"], STAMP)
        self.assertEqual(result["run"]["sources"][0]["lastSuccessAt"], STAMP)

    def test_no_snapshot_stops(self):
        client = HttpClient()
        with patch.object(client, "get", side_effect=TimeoutError("timeout")), self.assertRaises(SourceError):
            collect(client, cities=("臺南市",), max_pages=0)

    def test_robot_failure_stops_html_only(self):
        client = HttpClient()
        denied = urllib.error.HTTPError("https://www.twtainan.net/robots.txt", 403, "forbidden", {}, None)
        with patch.object(client, "get", side_effect=[archive_bytes(), denied]):
            result = collect(client, fixture_snapshot(), cities=("臺南市",), max_pages=1)
        self.assertEqual(result["run"]["status"], "partial")
        self.assertEqual(result["run"]["sources"][1]["processed"], 0)

    def test_robots_disallow_and_404(self):
        client = HttpClient()
        with patch.object(client, "get", return_value=b"User-agent: *\nDisallow: /zh-tw/shop/"):
            robots, _ = tainan_robots(client)
            self.assertFalse(robots.can_fetch("FieldworkPortfolio", tainan_url(fixture_record()["id"])[0]))
        missing = urllib.error.HTTPError("https://www.twtainan.net/robots.txt", 404, "missing", {}, None)
        with patch.object(client, "get", side_effect=missing):
            robots, _ = tainan_robots(client)
            self.assertTrue(robots.can_fetch("FieldworkPortfolio", tainan_url(fixture_record()["id"])[0]))

    def test_timeout_retries_bounded_and_hosts_restricted(self):
        client = HttpClient()
        with patch.object(client.opener, "open", side_effect=TimeoutError("timeout")) as call, patch("sources.time.sleep"), self.assertRaises(TimeoutError):
            client.get("https://www.twtainan.net/robots.txt")
        self.assertEqual(call.call_count, 3)
        with self.assertRaises(SourceError):
            client.get("http://127.0.0.1/admin")


class ExportTests(unittest.TestCase):
    def test_csv_unicode_quotes_newlines_formulas(self):
        row = fixture_record()
        row["name"] = '繁體中文,"雙引號"\n下一行'
        row["phone"] = "=HYPERLINK(1)"
        result = to_csv([row])
        self.assertTrue(result.startswith("\ufeff"))
        parsed = list(csv.reader(io.StringIO(result.lstrip("\ufeff"))))
        self.assertEqual(parsed[1][1], row["name"])
        self.assertEqual(parsed[1][5], "'=HYPERLINK(1)")
        for unsafe in ["=1", " +1", "-1", "@SUM(1)", "\tfoo", "\rbar"]:
            self.assertTrue(safe_cell(unsafe).startswith("'"))

    def test_filtered_output_keeps_full_checkpoint(self):
        with tempfile.TemporaryDirectory() as directory:
            write_outputs(fixture_snapshot(), directory, keyword="不存在")
            data = json.loads((Path(directory) / "merchants.json").read_text(encoding="utf-8"))
            self.assertEqual(data["export"]["count"], 0)
            checkpoint = json.loads((Path(directory) / "snapshot.json").read_text(encoding="utf-8"))
            self.assertEqual(len(checkpoint["merchants"]), 1)


if __name__ == "__main__":
    unittest.main()
