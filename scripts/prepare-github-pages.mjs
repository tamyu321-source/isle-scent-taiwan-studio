import { copyFile, cp, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve("dist/client");
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
async function prepareRoutes(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const source = path.join(directory, entry.name);
    if (
      entry.isDirectory() &&
      !entry.name.startsWith("_") &&
      !entry.name.startsWith(".")
    ) {
      await prepareRoutes(source);
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".html") &&
      !["index.html", "404.html", "500.html"].includes(entry.name)
    ) {
      const destination = path.join(directory, entry.name.slice(0, -5));
      await mkdir(destination, { recursive: true });
      await copyFile(source, path.join(destination, "index.html"));
    }
  }
}

await prepareRoutes(outputDirectory);

if (repositoryName) {
  await cp(
    path.join(outputDirectory, repositoryName, "_next"),
    path.join(outputDirectory, "_next"),
    { recursive: true },
  );
}

await writeFile(path.join(outputDirectory, ".nojekyll"), "");
