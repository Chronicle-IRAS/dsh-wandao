import { defineConfig } from "@playwright/test";
import os from "node:os";
import path from "node:path";
export default defineConfig({
  testDir: "./test/browser",
  testMatch: "*.spec.ts",
  workers: 1,
  timeout: 30000,
  outputDir: path.join(os.tmpdir(), "wandao-ui-test-results"),
  reporter: "list",
  use: {
    launchOptions: process.env.WANDAO_UI_BROWSER
      ? { executablePath: process.env.WANDAO_UI_BROWSER }
      : {},
    baseURL: "http://127.0.0.1:4793",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    colorScheme: "dark",
  },
  webServer: {
    command: "node --import tsx test/browser/server.mjs",
    url: "http://127.0.0.1:4793",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
