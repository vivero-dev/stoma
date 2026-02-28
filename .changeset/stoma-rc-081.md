---
"@vivero/stoma-cli": patch
---

### @vivero/stoma-cli

**Bug Fix**

- Fix gzipped/garbled response bodies in the playground UI: `/__playground/send` now strips stale `content-encoding`, `content-length`, and `transfer-encoding` headers from proxied responses — these headers become misleading after `fetch()` transparently decompresses the body
- Add tests for stale encoding header stripping in the playground send proxy

**Lint & Formatting**

- Reformat test assertions in `resolve-security.test.ts` and `wrap.test.ts` for consistency

**Test Infrastructure**

- Fix Windows E2E: use `packageName@file:path` syntax with forward slashes for Yarn Berry local tarball installs
- Fix Windows E2E: check for `.bin/stoma.cmd` instead of `.bin/stoma`, pass `shell: true` to execa for .cmd shims
- Fix Windows E2E: bump install timeouts from 60s to 120s for slower CI runners
- Fix Windows E2E: wrap `afterAll` cleanup in try/catch to handle EBUSY file locking
- Fix flaky `cleans up temp files` test: retry `readdir` to account for Linux filesystem propagation delay after `unlink`
- Remove stale biome suppression comments (`noArrayIndexKey` already disabled globally)

**CI/CD**

- Restructure CI into three workflows: `ci.yml` (parallel validation), `changeset-pr.yml` (PR management), `release.yml` (publish + deploy)
- Extract shared setup into `.github/actions/setup-env` composite action (Node, Corepack, Bun, Yarn install)
- Add OS matrix (ubuntu, macos, windows) for E2E tests — catches platform-specific issues before publish
- Parallelize CI jobs: `checks`, `test`, `e2e` run concurrently instead of sequentially
- Remove `github-actions[bot]` actor filter so Version Packages PRs get full CI validation
- Add `@biomejs/biome` as root devDependency (was relying on global install) and enable lint in CI
- Add husky + lint-staged pre-commit hook to run biome on staged files
- Exclude `**/fixtures/syntax-error.ts` from biome (intentional test fixture)
