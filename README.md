# SkillTracker-UI

The Angular frontend of SkillTracker (NeoLevelUP). Signed-out visitors get a Snake game; signing in
leads into the app. The app is becoming the home of TheSWEguide's Java, DSA, LLD and HLD lessons:
the phases are in [docs/plan.md](docs/plan.md).

- Angular 21 (standalone components, `@angular/build:application`), Tailwind CSS 4
- Backend: [SkillTracker-Srcv](../SkillTracker-Srcv) (Spring Boot), on Render, with a Neon PostgreSQL database
- Hosting: Vercel (static files only; see [Deploying](#deploying))

## Running locally

Use Node 24 (`package.json` → `engines`). Angular 21 doesn't support Node 26 yet: it runs, with warnings.

```bash
npm install
npm run dev        # uses the LOCAL backend (http://localhost:8080) -> local PostgreSQL
npm run dev:live   # uses the LIVE backend (https://skilltracker-api-2ae9.onrender.com) -> live database
```

Both serve the app on `http://localhost:3000`. The backend is chosen at build time via
`src/environments/environment*.ts` (see `fileReplacements` in `angular.json`); `npm run build`
(production) always uses the live backend.

- `npm run dev` needs `SkillTracker-Srcv` running locally (`docker compose up -d`, then
  `mvn spring-boot:run`; see its README).
- `npm run dev:live` needs the live backend's `FRONTEND_URL` (set on Render) to include
  `http://localhost:3000`, otherwise the browser blocks the requests with a CORS error.

## Tests

```bash
npm test           # unit tests (Vitest, through Angular's unit-test builder)
npm run e2e        # end-to-end tests (Playwright, desktop Chrome and a Pixel 7)
```

- `npm run e2e` starts `npm run dev` itself, or reuses one already running on port 3000.
- Its sign-in tests need the local backend on port 8080, and skip themselves when it isn't running.
- They reuse one test account, `e2e-tester@example.com`, in the local database.
- On Node 25 and later, `src/test-setup.ts` restores the simulated browser's `localStorage`, which
  Node's own `localStorage` global would otherwise hide.

## Deploying

Vercel builds and serves the app from this repository ([vercel.json](vercel.json)):

- **Build:** framework preset Angular, build command `npm run build`, output directory `dist/browser`.
- **Routing:** every path without a file falls back to `index.html`, so deep links like `/dashboard` work on refresh.
- **Branches:** production comes from `main`. Every other branch gets a preview URL, and the `dev`
  branch keeps a stable one: `https://<project>-git-dev-<team>.vercel.app`.

The backend only accepts calls from origins listed in its `FRONTEND_URL` (Render → the service →
Environment, comma-separated). Add the production URL and the `dev` preview URL there. The same list
decides where Google sign-in may return.

## Layout

- `src/app/components`: the screens:
  - Snake (`home`);
  - `login`;
  - `dashboard` and `roadmaps`, which are replaced by the learning app in later phases;
  - `navbar`.
- `src/app/services`: API access and the sign-in state (`auth.service.ts`).
- `src/app/interceptors`: add the backend origin and the token to `/api` calls, and sign out on a 401.
- `src/styles.css`: TheSWEguide's design tokens (light and dark), fonts and typography.
- `public/`: files served as they are (`assets/logo.svg`).
- `e2e/`: Playwright tests.
- `docs/plan.md`: the plan.
