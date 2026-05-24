#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const command = process.argv[2] || "status";
const root = process.cwd();

if (command === "status") {
  status();
} else if (command === "lint") {
  lint();
} else if (command === "check") {
  check();
} else if (command === "new-change") {
  await newChange(process.argv[3] || "new-change");
} else {
  fail(`Unknown harness command: ${command}`);
}

function status() {
  const changesDir = join(root, ".harness", "changes");
  const changes = existsSync(changesDir)
    ? readdirSync(changesDir).filter((name) => !name.startsWith("_")).sort()
    : [];
  console.log(`AIDM Harness: ${changes.length} change(s)`);
  for (const change of changes) {
    const tasksPath = join(changesDir, change, "tasks.md");
    const tasks = existsSync(tasksPath) ? readFileSync(tasksPath, "utf8").split("\n").filter((line) => line.startsWith("- [")) : [];
    const complete = tasks.filter((line) => line.startsWith("- [x]")).length;
    console.log(`- ${change}: ${complete}/${tasks.length} tasks complete`);
  }
}

function lint() {
  const files = collectFiles(root, [".js", ".mjs"]).filter((file) => !file.includes("/data/") && !file.includes("/node_modules/"));
  for (const file of files) {
    const result = spawnSync(process.execPath, ["--check", file], { stdio: "pipe", encoding: "utf8" });
    if (result.status !== 0) {
      process.stderr.write(result.stderr || result.stdout);
      fail(`Syntax check failed: ${file}`);
    }
  }
  verifyTextFiles();
  console.log(`lint ok: ${files.length} JavaScript files checked`);
}

function check() {
  verifyHarnessStructure();
  const gates = [
    {
      name: "lint",
      cmd: process.execPath,
      args: ["scripts/harness.mjs", "lint"],
      documentedCommand: "npm run lint"
    },
    {
      name: "unit tests",
      cmd: "npm",
      args: ["run", "test"],
      documentedCommand: "npm run test",
      localhostRequired: true
    },
    {
      name: "long-memory eval",
      cmd: "npm",
      args: ["run", "eval:memory:16h", "--", "--no-report"],
      documentedCommand: "npm run eval:memory:16h -- --no-report",
      noReport: true
    },
    {
      name: "production-depth eval",
      cmd: "npm",
      args: ["run", "eval:production-depth"],
      documentedCommand: "npm run eval:production-depth",
      noReport: true
    },
    {
      name: "local smoke",
      cmd: "npm",
      args: ["run", "smoke"],
      documentedCommand: "npm run smoke",
      localhostRequired: true
    },
    {
      name: "campaign simulation",
      cmd: "npm",
      args: ["run", "simulate:campaign"],
      documentedCommand: "npm run simulate:campaign"
    }
  ];
  for (const gate of gates) {
    runGate(gate);
  }
  verifyReports();
  console.log("harness check ok");
}

async function newChange(slug) {
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "change";
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const dir = join(root, ".harness", "changes", `${stamp}-${safeSlug}`);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "spec.md"), `# ${safeSlug}\n\n## Requirement\n\nTBD.\n`);
  await writeFile(join(dir, "review.md"), "# Requirement Review\n\nPending.\n");
  await writeFile(join(dir, "tasks.md"), "# Tasks\n\n- [ ] Define tests.\n- [ ] Implement.\n- [ ] Verify.\n");
  await writeFile(join(dir, "test-report.md"), "# Test Report\n\nPending.\n");
  console.log(dir);
}

function verifyHarnessStructure() {
  const required = [
    "harness.yaml",
    ".harness/README.md",
    ".harness/project-context.md",
    ".harness/quality-gates.md",
    ".harness/workflows/change-flow.md",
    ".harness/skills/aidm-coding.md"
  ];
  for (const file of required) {
    if (!existsSync(join(root, file))) {
      fail(`Missing required Harness file: ${file}`);
    }
  }
  const changesDir = join(root, ".harness", "changes");
  const changes = readdirSync(changesDir).filter((name) => !name.startsWith("_"));
  if (changes.length === 0) {
    fail("At least one change directory is required");
  }
  for (const change of changes) {
    for (const file of ["spec.md", "review.md", "tasks.md", "test-report.md"]) {
      if (!existsSync(join(changesDir, change, file))) {
        fail(`Change ${change} is missing ${file}`);
      }
    }
  }
}

function verifyReports() {
  const changesDir = join(root, ".harness", "changes");
  for (const change of readdirSync(changesDir).filter((name) => !name.startsWith("_"))) {
    const report = readFileSync(join(changesDir, change, "test-report.md"), "utf8");
    if (/Pending implementation|Pending\./i.test(report)) {
      fail(`Change ${change} has an incomplete test report`);
    }
  }
}

function verifyTextFiles() {
  const files = collectFiles(root, [".md", ".yaml", ".json", ".html", ".css"]).filter((file) => !file.includes("/data/"));
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    if (text.includes("\t")) {
      fail(`Tab character found in ${file}`);
    }
  }
}

function collectFiles(dir, extensions, collected = []) {
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") {
      continue;
    }
    const file = join(dir, name);
    const stats = statSync(file);
    if (stats.isDirectory()) {
      collectFiles(file, extensions, collected);
    } else if (extensions.some((extension) => file.endsWith(extension))) {
      collected.push(file);
    }
  }
  return collected;
}

function runGate(gate) {
  console.log(`\n[harness] ${gate.name}: ${gate.documentedCommand}`);
  if (gate.noReport) {
    console.log("[harness] report mode: no-report");
  }
  const result = spawnSync(gate.cmd, gate.args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`[harness] ${gate.name} failed. Report command: ${gate.documentedCommand}`);
    if (gate.localhostRequired) {
      console.error("[harness] If this failed with listen/connect EPERM on localhost, rerun in an environment allowed to bind and connect to 127.0.0.1/::1.");
    }
    process.exit(result.status || 1);
  }
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
