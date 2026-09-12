import { copyFile, cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve("dist/client");
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const routes = [
  "story",
  "collections",
  "collections/o-01",
  "craft",
  "ingredients",
  "spaces",
  "journal",
  "journal/field-note-07",
  "stockists",
  "contact",
  "work/isle-scent",
];

for (const route of routes) {
  const source = path.join(outputDirectory, `${route}.html`);
  const destinationDirectory = path.join(outputDirectory, route);
  await mkdir(destinationDirectory, { recursive: true });
  await copyFile(source, path.join(destinationDirectory, "index.html"));
}

if (repositoryName) {
  await cp(
    path.join(outputDirectory, repositoryName, "_next"),
    path.join(outputDirectory, "_next"),
    { recursive: true },
  );
}

await writeFile(path.join(outputDirectory, ".nojekyll"), "");
