# Testing Strategy & Action Plan

This document outlines the current state of testing within the `@vivero/stoma-cli` project and the immediate actions required to optimize the suite.

## Current State Assessment: High Quality

The `@vivero/stoma-cli` test suite is robust, pragmatic, and well-suited to the specific challenges of a CLI tool. 

**Key Strengths:**
*   **Comprehensive E2E Suite:** The use of `execa` to run the actual built binary and simulate package manager installations (`npx`, `yarn dlx`, etc.) provides critical confidence in the distribution logic.
*   **Targeted Unit/Integration Tests:** Behavior is well-isolated in unit tests (e.g., `wrap.test.ts` for playground logic) and integration tests (`run-integration.test.ts` via `clipanion`).
*   **Effective Mocking:** Network boundaries (`fetch` in `resolve-remote.test.ts`) and system APIs (`console`, `process` in commands) are correctly mocked to ensure deterministic, offline-capable test runs.

---

## Immediate Action Plan

The primary area for improvement is addressing redundancy and execution speed within the E2E suite, specifically balancing the need to catch distribution bugs against the cost of re-verifying behavior.

### 1. Optimize the E2E Testing Pyramid

Currently, the `pack-install.e2e.test.ts` file re-verifies deep behavioral logic (such as playground header stripping) for every single package manager installation. This behavior is already covered by unit tests (`wrap.test.ts`) and the built binary is covered by smoke tests (`binary-smoke.e2e.test.ts`).

**Action: Trim Package-Runner Tests to "Wiring Only"**
*   Modify `assertInstalledBinaryWorks` in `pack-install.e2e.test.ts` to focus exclusively on distribution and wiring.
*   The assertions should be reduced to a bare-minimum smoke test:
    1.  Can the package manager install the tarball?
    2.  Does `execa(bin, ["--version"])` execute successfully?
    3.  Can the binary start the server, and does `/health` return a 200 OK?
*   **Rationale:** If `yarn dlx` can resolve the modules required to boot the server, the packaging is correct. Re-testing the playground proxy behavior in this file is redundant triple-coverage that increases execution time and the likelihood of timeout flakiness.

**Action: Maintain a "Canary" Assertion in Binary Smoke Tests**
*   Keep the behavioral assertion regarding encoding headers in `binary-smoke.e2e.test.ts`.
*   **Rationale:** While unit tests cover the logic, previous regressions (like the gzip bug) demonstrated that behavioral bugs can still manifest in the compiled artifact. Maintaining a single behavioral canary test against the compiled binary prevents regressions without duplicating the test across every package manager environment.
