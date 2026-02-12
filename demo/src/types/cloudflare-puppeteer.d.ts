declare module "@cloudflare/puppeteer" {
  interface BrowserPage {
    setViewport(options: { width: number; height: number }): Promise<void>;
    goto(
      url: string,
      options?: {
        waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
        timeout?: number;
      },
    ): Promise<unknown>;
    evaluate<T>(pageFunction: () => T | Promise<T>): Promise<T>;
  }

  interface BrowserInstance {
    newPage(): Promise<BrowserPage>;
    close(): Promise<void>;
  }

  interface PuppeteerLike {
    launch(binding: Fetcher): Promise<BrowserInstance>;
  }

  const puppeteer: PuppeteerLike;
  export default puppeteer;
}
