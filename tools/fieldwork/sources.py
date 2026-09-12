"""Small, bounded HTTP adapters. No browser, credentials or third-party packages."""

import io
import json
import re
import time
import urllib.error
import urllib.request
import urllib.robotparser
import zipfile
from html.parser import HTMLParser
from urllib.parse import urlsplit

DATASET_URL = "https://data.gov.tw/dataset/7779"
ARCHIVE_URL = "https://media.taiwan.net.tw/XMLReleaseAll_public/v2.0/Zh_tw/Restaurant-json.zip"
TAINAN_ORIGIN = "https://www.twtainan.net"
USER_AGENT = "FieldworkPortfolio/1.0 (+https://github.com/tamyu321-source/isle-scent-taiwan-studio)"
ALLOWED_HOSTS = {"media.taiwan.net.tw", "www.twtainan.net", "tamyu321-source.github.io"}


class SourceError(Exception):
    pass


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        parsed = urlsplit(newurl)
        if parsed.scheme != "https" or parsed.hostname not in ALLOWED_HOSTS:
            raise SourceError("來源重新導向至未允許的網址")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class HttpClient:
    def __init__(self, timeout=15, interval=1.0):
        self.timeout = timeout
        self.interval = max(1.0, interval)
        self.last_request = {}
        self.opener = urllib.request.build_opener(SafeRedirect())

    def get(self, url, limit=20_000_000):
        parsed = urlsplit(url)
        if parsed.scheme != "https" or parsed.hostname not in ALLOWED_HOSTS:
            raise SourceError("只允許設定好的 HTTPS 公開資料來源")
        for attempt in range(3):
            wait = self.interval - (time.monotonic() - self.last_request.get(parsed.hostname, 0))
            if wait > 0:
                time.sleep(wait)
            self.last_request[parsed.hostname] = time.monotonic()
            try:
                request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
                with self.opener.open(request, timeout=self.timeout) as response:
                    data = response.read(limit + 1)
                if len(data) > limit:
                    raise SourceError("來源超過下載大小限制")
                return data
            except urllib.error.HTTPError as error:
                if attempt == 2 or error.code not in (429, 500, 502, 503, 504):
                    raise
                retry_after = error.headers.get("Retry-After", "")
                delay = min(30, int(retry_after)) if retry_after.isdigit() else 2 ** (attempt + 1)
                time.sleep(delay)
            except (TimeoutError, urllib.error.URLError):
                if attempt == 2:
                    raise
                time.sleep(2 ** (attempt + 1))


def read_archive(raw):
    try:
        with zipfile.ZipFile(io.BytesIO(raw)) as archive:
            names = ("RestaurantList.json", "RestaurantServiceTimeList.json")
            if any(archive.getinfo(name).file_size > 60_000_000 for name in names):
                raise SourceError("解壓後資料超過大小限制")
            return tuple(json.loads(archive.read(name).decode("utf-8-sig")) for name in names)
    except (KeyError, ValueError, zipfile.BadZipFile) as error:
        raise SourceError("官方資料檔格式已變更或下載不完整") from error


class NextDataParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.active = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == "script" and dict(attrs).get("id") == "__NEXT_DATA__":
            self.active = True

    def handle_data(self, data):
        if self.active:
            self.parts.append(data)

    def handle_endtag(self, tag):
        if tag == "script":
            self.active = False


def parse_tainan_html(html, expected_id):
    parser = NextDataParser()
    parser.feed(html)
    try:
        data = json.loads("".join(parser.parts))["props"]["pageProps"]["data"]
        if str(data["id"]) != str(expected_id) or not data.get("name"):
            raise ValueError("record identity mismatch")
        fields = {key: str(data.get(key) or "").strip() for key in
                  ("name", "address", "tel", "open_time", "date_modified")}
        return {
            "updatedAt": fields["date_modified"] or None,
            "values": {"name": fields["name"], "address": fields["address"],
                       "phone": fields["tel"], "hours": fields["open_time"]},
        }
    except (KeyError, TypeError, ValueError) as error:
        raise SourceError("店家頁面格式或識別碼不符；未套用網頁資料") from error


def tainan_url(record_id):
    match = re.fullmatch(r"Restaurant_395000000A_(\d+)", record_id)
    if not match:
        return None
    local_id = str(int(match.group(1)))
    return f"{TAINAN_ORIGIN}/zh-tw/shop/consume/{local_id}/", local_id


def tainan_robots(client):
    url = f"{TAINAN_ORIGIN}/robots.txt"
    parser = urllib.robotparser.RobotFileParser(url)
    try:
        raw = client.get(url, limit=512_000)
        parser.parse(raw.decode("utf-8-sig").splitlines())
        delay = parser.crawl_delay(USER_AGENT) or parser.crawl_delay("*")
        if delay:
            client.interval = max(client.interval, delay)
        return parser, "已讀取 robots.txt"
    except urllib.error.HTTPError as error:
        if error.code == 404:
            parser.parse([])
            return parser, "robots.txt 回傳 404；依公開資料規範低頻讀取"
        raise SourceError(f"robots.txt HTTP {error.code}；本次停止網頁爬取") from error
    except (OSError, SourceError) as error:
        raise SourceError("無法確認 robots 規則；本次停止網頁爬取") from error
