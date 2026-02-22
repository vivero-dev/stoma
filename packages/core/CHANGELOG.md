# @vivero/stoma-core

## 0.1.0-rc.3
### Patch Changes



- [`c6f0576`](https://github.com/vivero-dev/stoma/commit/c6f05763d6f2ba3e8a3c6845258d57e6f8c1d693) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - fix: resolve `workspace:*` protocols in published packages
  
  Replaces `changeset publish` with a custom publish script (`scripts/publish.mjs`) that uses `yarn pack` to resolve `workspace:*` protocols and apply `publishConfig` overrides, then `npm publish <tarball>` for OIDC trusted publishing with provenance. The prepack/postpack workaround scripts have been removed.

## 0.1.0-rc.2
### Patch Changes



- [`c6f0576`](https://github.com/vivero-dev/stoma/commit/c6f05763d6f2ba3e8a3c6845258d57e6f8c1d693) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - fix: publish via `yarn npm publish` to correctly resolve `workspace:*` protocols
  
  Replaces `changeset publish` (which used `npm publish <dir>` and never resolved workspace protocols) with a custom publish script that runs `yarn npm publish` from each package directory. Yarn natively handles `workspace:*` resolution and `publishConfig` field overrides, so the prepack/postpack workaround scripts have been removed.

## 0.1.0-rc.1
### Patch Changes



- [`a414008`](https://github.com/vivero-dev/stoma/commit/a41400882fbe51f9f5ac7f623dec52f0e2ca1dd6) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Fix npm publish pipeline to correctly resolve workspace protocols and apply publishConfig overrides
  
  Adds prepack/postpack lifecycle scripts that prepare package.json for `npm publish` by resolving `workspace:*` to real versions and applying `publishConfig` field overrides (main, types, exports, bin). This replaces the previous `@changesets/cli` yarn patch approach and restores compatibility with GitHub Actions OIDC tokens for npm authentication and provenance.
