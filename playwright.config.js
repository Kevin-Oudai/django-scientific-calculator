const { defineConfig, devices } = require("@playwright/test");

const baseURL = process.env.BASE_URL || "http://127.0.0.1:8010";

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: process.env.CALCULATOR_TEST_SERVER_CMD || "docker compose up --build",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
