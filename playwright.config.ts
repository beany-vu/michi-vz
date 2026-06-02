import { defineConfig } from "@playwright/test";

const PORT = 6007;

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  // Snapshots live next to the spec in a single OS-agnostic folder so the
  // committed baselines are used regardless of which machine runs them.
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  expect: {
    // Small tolerance for sub-pixel AA noise; intentional curve changes are far larger.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  projects: [
    {
      // browserName "chromium" (no `channel`) = Playwright's pinned bundled build.
      // Do NOT set channel:"chrome" — system Chrome auto-updates and flaps baselines.
      name: "chromium",
      use: { browserName: "chromium", viewport: { width: 1000, height: 620 } },
    },
  ],
  webServer: {
    command: "npm run serve-storybook",
    url: `http://localhost:${PORT}/iframe.html?id=visual-curve--line-multi-svg&viewMode=story`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
