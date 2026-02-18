---
"@vivero/stoma": patch
---

### Fixes

- Refactored JWT auth validation: Extracted duplicated validation logic from `handler` and `evaluate.onRequest` into a shared `validateJwt()` function. Returns a discriminated `JWTValidationResult`, so each runtime path maps to its own error model.

### Docs

- Docs have been updated with new about and sustainability pages.
