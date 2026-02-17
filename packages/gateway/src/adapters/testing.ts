import type { GatewayAdapter } from "./types";

/**
 * A GatewayAdapter implementation for unit testing.
 *
 * Provides a `waitUntil` implementation that collects background promises,
 * allowing tests to `await adapter.waitAll()` before finishing.
 */
export class TestAdapter implements GatewayAdapter {
  private promises: Promise<unknown>[] = [];

  /**
   * Add a promise to the background work queue.
   */
  waitUntil = (promise: Promise<unknown>): void => {
    this.promises.push(promise);
  };

  /**
   * Await all pending background work collected via `waitUntil`.
   */
  async waitAll(): Promise<void> {
    while (this.promises.length > 0) {
      const batch = [...this.promises];
      this.promises = [];
      await Promise.all(batch);
    }
  }

  /**
   * Reset the collected promises.
   */
  reset(): void {
    this.promises = [];
  }
}

/**
 * Create a new {@link TestAdapter}.
 */
export function createTestAdapter(): TestAdapter {
  return new TestAdapter();
}
