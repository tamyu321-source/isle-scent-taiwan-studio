import { appendFile, readFile } from "node:fs/promises";

const snapshot = JSON.parse(
  await readFile("public/data/fieldwork/merchants.json", "utf8"),
);
const report = await readFile("public/data/fieldwork/run-report.md", "utf8");
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY)
  await appendFile(process.env.GITHUB_STEP_SUMMARY, report);
if (snapshot.run.status !== "ok") {
  console.log(
    "::warning::Fieldwork sources were not fully refreshed. Published data retains original timestamps; see collection summary.",
  );
}
