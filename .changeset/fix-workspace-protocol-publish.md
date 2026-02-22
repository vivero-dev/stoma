---
"@vivero/stoma-cli": patch
"@vivero/stoma": patch
"@vivero/stoma-core": patch
---

fix: resolve `workspace:*` protocols in published packages

Replaces `changeset publish` with a custom publish script (`scripts/publish.mjs`) that uses `yarn pack` to resolve `workspace:*` protocols and apply `publishConfig` overrides, then `npm publish <tarball>` for OIDC trusted publishing with provenance. The prepack/postpack workaround scripts have been removed.
