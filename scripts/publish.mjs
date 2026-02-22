#!/usr/bin/env node

/**
 * Publish workspace packages via `yarn npm publish`.
 *
 * Replaces `changeset publish` which internally calls `npm publish <dir>` —
 * that doesn't resolve Yarn's `workspace:*` protocol or apply `publishConfig`
 * field overrides (main, types, exports, bin). `yarn npm publish` handles both
 * natively, so no prepack/postpack workarounds are needed.
 *
 * Changesets is still used for versioning (changeset version) and tagging
 * (changeset tag). Only the publish step is ours.
 *
 * Usage:
 *   node scripts/publish.mjs              # publish for real
 *   node scripts/publish.mjs --dry-run    # test locally (pack + inspect, no publish)
 *   yarn changeset:publish                # via package.json script (CI)
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const rootPkg = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf-8"));
const isCI = Boolean(process.env.CI);
const isDryRun = process.argv.includes("--dry-run");

if (isDryRun) console.log("=== DRY RUN — nothing will be published ===\n");

// ── Discover publishable workspace packages ─────────────────────────────────

function discoverPackages() {
  const packages = [];
  for (const glob of rootPkg.workspaces ?? []) {
    if (glob.includes("*")) {
      const baseDir = join(rootDir, glob.replace(/\/?\*$/, ""));
      if (!existsSync(baseDir)) continue;
      for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const p = readPkg(join(baseDir, entry.name));
        if (p) packages.push(p);
      }
    } else {
      const p = readPkg(join(rootDir, glob));
      if (p) packages.push(p);
    }
  }
  return packages;
}

function readPkg(dir) {
  const path = join(dir, "package.json");
  if (!existsSync(path)) return null;
  const pkg = JSON.parse(readFileSync(path, "utf-8"));
  if (!pkg.name || !pkg.version || pkg.private) return null;
  return { name: pkg.name, version: pkg.version, dir };
}

// ── Check npm registry ──────────────────────────────────────────────────────

function isAlreadyPublished(name, version) {
  try {
    const out = execSync(`npm view "${name}@${version}" version --json 2>/dev/null`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return out === `"${version}"`;
  } catch {
    return false;
  }
}

// ── Dry-run: pack and inspect tarball contents ──────────────────────────────

function dryRunPackage(pkg) {
  const tmpDir = mkdtempSync(join(tmpdir(), "stoma-publish-"));
  try {
    const tag = pkg.version.includes("-") ? "rc" : "latest";
    console.log(`\n--- ${pkg.name}@${pkg.version} (tag: ${tag}) ---`);
    console.log(`dir: ${pkg.dir}`);

    // Pack with yarn (resolves workspace:* and applies publishConfig)
    const tgzName = `package.tgz`;
    execSync(`yarn pack --out ${join(tmpDir, tgzName)}`, {
      cwd: pkg.dir,
      stdio: "pipe",
    });

    // Extract and read the package.json from the tarball
    execSync(`tar xzf ${join(tmpDir, tgzName)} -C ${tmpDir}`, { stdio: "pipe" });
    const packed = JSON.parse(readFileSync(join(tmpDir, "package", "package.json"), "utf-8"));

    // Check workspace:* resolution
    const allDeps = { ...packed.dependencies, ...packed.peerDependencies };
    const unresolvedWorkspace = Object.entries(allDeps).filter(([, v]) => v.startsWith("workspace:"));
    const resolvedWorkspace = Object.entries(allDeps).filter(
      ([name]) => (pkg.dir, readFileSync(join(pkg.dir, "package.json"), "utf-8")).includes(`"${name}": "workspace:`)
    );

    if (unresolvedWorkspace.length > 0) {
      console.log(`  FAIL: unresolved workspace deps:`);
      for (const [name, ver] of unresolvedWorkspace) console.log(`    ${name}: ${ver}`);
      return false;
    }

    if (resolvedWorkspace.length > 0) {
      console.log(`  workspace deps resolved:`);
      for (const [name] of resolvedWorkspace) console.log(`    ${name}: ${allDeps[name]}`);
    }

    // Check publishConfig overrides applied
    const original = JSON.parse(readFileSync(join(pkg.dir, "package.json"), "utf-8"));
    if (original.publishConfig) {
      const overrideFields = ["main", "types", "exports", "bin", "module"].filter((f) => f in original.publishConfig);
      if (overrideFields.length > 0) {
        console.log(`  publishConfig applied: ${overrideFields.join(", ")}`);
        for (const f of overrideFields) {
          const expected = JSON.stringify(original.publishConfig[f]);
          const actual = JSON.stringify(packed[f]);
          if (expected !== actual) {
            console.log(`    FAIL: ${f} expected ${expected}, got ${actual}`);
            return false;
          }
        }
      }
    }

    // Show files
    const files = execSync(`tar tzf ${join(tmpDir, tgzName)}`, { encoding: "utf-8" })
      .trim()
      .split("\n")
      .map((f) => f.replace("package/", "  "));
    console.log(`  files: ${files.length}`);
    for (const f of files) console.log(`  ${f}`);

    console.log(`  OK`);
    return true;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

const packages = discoverPackages();
if (packages.length === 0) {
  console.log("No publishable packages found.");
  process.exit(0);
}

const toPublish = packages.filter((pkg) => {
  if (isAlreadyPublished(pkg.name, pkg.version)) {
    console.log(`skip ${pkg.name}@${pkg.version} (already on npm)`);
    return false;
  }
  return true;
});

if (toPublish.length === 0) {
  console.log("All packages already published.");
  process.exit(0);
}

// ── Dry run ─────────────────────────────────────────────────────────────────

if (isDryRun) {
  let allOk = true;
  for (const pkg of toPublish) {
    if (!dryRunPackage(pkg)) allOk = false;
  }
  console.log(allOk ? "\n=== DRY RUN PASSED ===" : "\n=== DRY RUN FAILED ===");
  process.exit(allOk ? 0 : 1);
}

// ── Publish ─────────────────────────────────────────────────────────────────

const published = [];
const failed = [];

for (const pkg of toPublish) {
  const tag = pkg.version.includes("-") ? "rc" : "latest";
  const flags = [`--access public`, `--tag ${tag}`];
  if (isCI) flags.push("--provenance");

  const cmd = `yarn npm publish ${flags.join(" ")}`;
  console.log(`\n$ cd ${pkg.dir}`);
  console.log(`$ ${cmd}`);

  try {
    execSync(cmd, { cwd: pkg.dir, stdio: "inherit" });
    published.push(pkg);
  } catch {
    console.error(`FAILED: ${pkg.name}@${pkg.version}`);
    failed.push(pkg);
  }
}

// Let changeset handle git tags
if (published.length > 0) {
  console.log("\nCreating git tags...");
  try {
    execSync("yarn changeset tag", { cwd: rootDir, stdio: "inherit" });
  } catch {
    console.warn("Warning: changeset tag failed");
  }
}

// Summary
console.log(`\nPublished: ${published.length}, Failed: ${failed.length}`);
for (const p of published) console.log(`  + ${p.name}@${p.version}`);
for (const f of failed) console.log(`  ! ${f.name}@${f.version}`);
if (failed.length > 0) process.exit(1);
