import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against `npm run dev` (ng serve on port 3000), which talks to the Spring Boot
 * backend on http://localhost:8080. The sign-in tests need that backend running (SkillTracker-Srcv:
 * `docker compose up -d`, then `mvn spring-boot:run`) and skip themselves when it isn't.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // More workers queue up client navigations on the dev server and time out.
  workers: 4,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180_000
  }
});
