---
"@homegrower-club/stoma": patch
---

Accept trailing slashes on route paths

### Fixes

- **Trailing-slash route aliases**: The gateway now registers both `/path` and `/path/` for every non-wildcard route, so requests with a trailing slash no longer 404. This also covers CORS preflight — if a `cors` policy is present, the OPTIONS handler is registered on both variants.
- **Scope path normalisation**: `scope()` and the internal `joinPaths` helper now strip trailing slashes from prefixes and handle root-path (`"/"`) children correctly, avoiding double-slash joins or unintended `/path/` suffixes.
