#!/usr/bin/env node

/**
 * Publish workspace packages via `pnpm publish`.
 *
 * pnpm publish natively resolves `workspace:*` protocols, applies
 * `publishConfig` overrides, and supports `--provenance` for OIDC
 * trusted publishing.
 *
 * Changesets is still used for versioning (changeset version) and
 * tagging (changeset tag). Only the publish step is ours.
 *
 * Usage:
 *   node scripts/publish.mjs              # publish for real
 *   node scripts/publish.mjs --dry-run    # test locally (no publish)
 *   pnpm changeset:publish                # via package.json script (CI)
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const isCI = Boolean(process.env.CI);
const isDryRun = process.argv.includes("--dry-run");

if (isDryRun) console.log("=== DRY RUN — nothing will be published ===\n");

// ── Discover publishable workspace packages ─────────────────────────────────

function discoverPackages() {
  const packages = [];
  const workspaceFile = readFileSync(join(rootDir, "pnpm-workspace.yaml"), "utf-8");
  const globs = [...workspaceFile.matchAll(/- ["']?([^"'\n]+)["']?/g)].map((m) => m[1]);

  for (const glob of globs) {
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
    const out = execSync(
      `npm view "${name}@${version}" version --json 2>/dev/null`,
      {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    ).trim();
    return out === `"${version}"`;
  } catch {
    return false;
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

const published = [];
const failed = [];

for (const pkg of toPublish) {
  try {
    const tag = pkg.version.includes("-") ? "rc" : "latest";
    const flags = ["--access public", `--tag ${tag}`, "--no-git-checks"];
    if (isCI) flags.push("--provenance");
    if (isDryRun) flags.push("--dry-run");

    const cmd = `pnpm publish ${flags.join(" ")}`;
    console.log(`\n$ ${cmd} (${pkg.name}@${pkg.version})`);

    execSync(cmd, { cwd: pkg.dir, stdio: "inherit" });
    published.push(pkg);
  } catch {
    console.error(`FAILED: ${pkg.name}@${pkg.version}`);
    failed.push(pkg);
  }
}

// Let changeset handle git tags
if (published.length > 0 && !isDryRun) {
  console.log("\nCreating git tags...");
  try {
    execSync("pnpm changeset tag", { cwd: rootDir, stdio: "inherit" });
  } catch {
    console.warn("Warning: changeset tag failed");
  }
}

// Summary
console.log(`\nPublished: ${published.length}, Failed: ${failed.length}`);
for (const p of published) console.log(`  + ${p.name}@${p.version}`);
for (const f of failed) console.log(`  ! ${f.name}@${f.version}`);
if (failed.length > 0) process.exit(1);
