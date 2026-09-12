import http from "node:http";
import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist/client");
const repositoryName =
  process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "isle-scent-taiwan-studio";
const prefix = `/${repositoryName}`;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".rsc": "text/x-component",
};
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    if (!url.pathname.startsWith(`${prefix}/`))
      throw new Error("Outside project");
    let file = path.resolve(
      root,
      `.${decodeURIComponent(url.pathname.slice(prefix.length))}`,
    );
    if (file !== root && !file.startsWith(`${root}${path.sep}`))
      throw new Error("Outside output");
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    response.writeHead(200, {
      "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end("Not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}${prefix}/`;
await mkdir("outputs/checkpoint-ci", { recursive: true });
const output = await mkdtemp(path.resolve("outputs/checkpoint-ci/run-"));
const pythonIndex = process.argv.indexOf("--python");
const explicitPython =
  pythonIndex !== -1 ? path.resolve(process.argv[pythonIndex + 1]) : undefined;
const command =
  explicitPython ?? (process.platform === "win32" ? "py" : "python");
const args = [
  ...(!explicitPython && process.platform === "win32" ? ["-3.11"] : []),
  "-X",
  "utf8",
  "tools/checkpoint/checkpoint.py",
  "--suite",
  "portfolio",
  "--base-url",
  baseUrl,
  "--headless",
  "--output",
  output,
];
let code = 1;
try {
  console.log(`CHECKPOINT build preview: ${baseUrl}`);
  const child = spawn(command, args, {
    stdio: "inherit",
    env: { ...process.env, CHECKPOINT_BUILD: "1" },
  });
  code = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (value) => resolve(value ?? 1));
  });
  if (code === 0) {
    const directories = await readdir(output, { withFileTypes: true });
    const run = directories.find((entry) => entry.isDirectory());
    if (!run) throw new Error("No run report was produced");
    const reportDirectory = path.join(output, run.name);
    const report = JSON.parse(
      await readFile(path.join(reportDirectory, "report.json"), "utf8"),
    );
    const required = ["portfolio", "yogurt", "fieldwork"].flatMap((journey) =>
      ["desktop", "mobile"].map((view) => `${journey}-${view}`),
    );
    if (
      !report.complete ||
      report.status !== "passed" ||
      report.cases.length !== 6 ||
      !required.every((id) =>
        report.cases.some(
          (item) =>
            item.id === id &&
            item.status === "passed" &&
            item.steps.length &&
            item.steps.every(
              (step) => step.status === "passed" && step.screenshot,
            ),
        ),
      )
    )
      throw new Error("Required browser cases did not all complete");
    const destination = path.join(root, "data/checkpoint/latest");
    await mkdir(destination, { recursive: true });
    // Reports are assembled into the artifact after the build; no data commits or second build.
    await cp(reportDirectory, destination, {
      recursive: true,
      filter: (source) =>
        !["input.json", "worker.log", "case.json"].includes(
          path.basename(source),
        ),
    });
    console.log(
      `Published ${report.cases.length} verified cases into the Pages artifact.`,
    );
  }
} catch (error) {
  console.error(error);
  code = 1;
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
process.exitCode = code;
