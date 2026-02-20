# @vivero/stoma-core

## 0.1.0-rc.1
### Patch Changes



- [`a414008`](https://github.com/vivero-dev/stoma/commit/a41400882fbe51f9f5ac7f623dec52f0e2ca1dd6) Thanks [@JonathanBennett](https://github.com/JonathanBennett)! - Fix npm publish pipeline to correctly resolve workspace protocols and apply publishConfig overrides
  
  Adds prepack/postpack lifecycle scripts that prepare package.json for `npm publish` by resolving `workspace:*` to real versions and applying `publishConfig` field overrides (main, types, exports, bin). This replaces the previous `@changesets/cli` yarn patch approach and restores compatibility with GitHub Actions OIDC tokens for npm authentication and provenance.
