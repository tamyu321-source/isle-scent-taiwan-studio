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
    "public/downloads/checkpoint-python.zip",
    ...[
      "checkpoint.py",
      "worker.py",
      "browser_checks.py",
      "journeys.py",
      "classnest_journey.py",
      "reporting.py",
      "requirements.txt",
      "README.md",
      "test_checkpoint.py",
    ].map((file) => `tools/checkpoint/${file}`),
  ],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(
  "Packaged CHECKPOINT runner, pinned dependency, documentation and tests.",
);
