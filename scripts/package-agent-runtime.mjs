import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const python = process.platform === "win32" ? "py" : "python";
const prefix = process.platform === "win32" ? ["-3.11"] : [];
const code = `from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path('tools/agent-runtime')
target = Path('public/downloads/agent-runtime-python.zip')
target.parent.mkdir(parents=True, exist_ok=True)
files = ['README.md', 'requirements.txt', 'test_runtime.py', 'test_api.py', 'agent_runtime/__init__.py', 'agent_runtime/runtime.py', 'agent_runtime/api.py', 'agent_runtime/demo.py']
with ZipFile(target, 'w', ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(root / name, 'agent-runtime/' + name)
    archive.write('docs/agent-runtime-architecture.md', 'agent-runtime/docs/agent-runtime-architecture.md')
    archive.write('docs/agent-runtime-role-fit.md', 'agent-runtime/docs/agent-runtime-role-fit.md')
print(target, target.stat().st_size, 'bytes')`;
if (!existsSync("tools/agent-runtime/agent_runtime/runtime.py")) throw new Error("Run from repository root");
const result = spawnSync(python, [...prefix, "-c", code], { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);
