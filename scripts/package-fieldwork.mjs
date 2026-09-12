import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";

await mkdir("public/downloads", { recursive: true });
const result = spawnSync(
  process.platform === "win32" ? "py" : "python",
  [
    ...(process.platform === "win32" ? ["-3.11"] : []),
    "-m",
    "zipfile",
    "-c",
    "public/downloads/fieldwork-python.zip",
    ...[
      "fieldwork.py",
      "collector.py",
      "sources.py",
      "records.py",
      "exporters.py",
      "test_fieldwork.py",
      "README.md",
    ].map((name) => `tools/fieldwork/${name}`),
  ],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("Packaged the standard-library Python collector and tests.");
