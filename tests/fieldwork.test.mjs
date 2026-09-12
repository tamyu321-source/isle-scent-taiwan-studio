import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  csvCell,
  emptyFilters,
  filterMerchants,
  isSnapshot,
  merchantCsv,
  normalizeSearch,
  safeSourceUrl,
} from "../lib/fieldwork.ts";

const snapshot = JSON.parse(
  await readFile(
    new URL("../public/data/fieldwork/merchants.json", import.meta.url),
    "utf8",
  ),
);

test("published seed contains valid real records and HTML observations", () => {
  assert.ok(isSnapshot(snapshot));
  assert.ok(snapshot.merchants.some((row) => row.city === "臺南市"));
  assert.ok(snapshot.merchants.some((row) => row.city === "桃園市"));
  assert.ok(
    snapshot.merchants.filter((row) => row.verification.checkedAt).length >= 10,
  );
  assert.equal(isSnapshot({ ...snapshot, merchants: [] }), false);
  assert.equal(isSnapshot({ ...snapshot, merchants: [null] }), false);
});

test("city, district, status and keyword filters compose", () => {
  const row = snapshot.merchants.find((item) => item.sources.length > 1);
  const rows = filterMerchants(snapshot.merchants, {
    ...emptyFilters,
    city: row.city,
    district: row.district,
    status: row.verification.status,
    keyword: row.name,
  });
  assert.ok(rows.some((item) => item.id === row.id));
  assert.ok(
    rows.every(
      (item) => item.city === row.city && item.district === row.district,
    ),
  );
  assert.equal(
    filterMerchants(snapshot.merchants, {
      ...emptyFilters,
      keyword: "___no_such_shop___",
    }).length,
    0,
  );
  assert.equal(normalizeSearch("台南　Ａ"), normalizeSearch("臺南 a"));
});

test("sorting never mutates records and filtered CSV has exact rows", () => {
  const before = snapshot.merchants.map((row) => row.id);
  const rows = filterMerchants(snapshot.merchants, {
    ...emptyFilters,
    city: "桃園市",
    sort: "updated",
  });
  assert.deepEqual(
    snapshot.merchants.map((row) => row.id),
    before,
  );
  assert.equal(
    rows.length,
    snapshot.merchants.filter((row) => row.city === "桃園市").length,
  );
  const csv = merchantCsv(rows);
  assert.ok(csv.startsWith("\ufeff"));
  for (const row of rows) assert.ok(csv.includes(csvCell(row.id)));
  const notIncluded = snapshot.merchants.find((row) => row.city === "臺南市");
  assert.ok(!csv.includes(notIncluded.id));
});

test("CSV escapes quotes, newlines and formula prefixes", () => {
  assert.equal(csvCell('名稱,"引號"\n下一行'), '"名稱,""引號""\n下一行"');
  for (const input of ["=1", " +1", "-1", "@SUM(1)", "\tfoo", "\rfoo"])
    assert.ok(csvCell(input).startsWith("\"'"));
});

test("source links reject scripts and unrelated hosts", () => {
  assert.equal(safeSourceUrl("javascript:alert(1)"), undefined);
  assert.equal(safeSourceUrl("https://example.com"), undefined);
  assert.ok(safeSourceUrl("https://data.gov.tw/dataset/7779"));
});
