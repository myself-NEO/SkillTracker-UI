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

## Lesson content

`content/` holds the Java, DSA, LLD and HLD lessons, problems and cheat sheets. They are Markdown
bodies plus TypeScript curriculum metadata, copied from TheSWEguide and edited here now. The content
build turns them into JSON the app loads:

```bash
npm run validate   # checks the content: curriculum vs bodies, links, widget blocks, animations
npm run content    # writes public/content/** and public/search-index.json (skipped when nothing changed)
```

- Both run automatically: `npm run build` validates and builds the content first, and `npm run dev`
  builds it if needed. The output is git-ignored.
- Each lesson, problem and cheat sheet becomes one file, `public/content/<topic>/<lessons|problems|cheatsheets>/<slug>.json`.
  It holds the page's HTML, highlighted at build time with Shiki, plus the data of its interactive
  widgets (`src/lib/content/doc.ts`).
- The build lives in `tools/content`. The framework-free code it shares with the app is in `src/lib`
  (Markdown helpers, widget parsers, the animation scenes' logic, search scoring).
- How to write content: [docs/authoring-content.md](docs/authoring-content.md) and
  [docs/authoring-animations.md](docs/authoring-animations.md).

## Tests

```bash
npm test           # Angular unit tests (ng test), then the content tests (Vitest in Node, tools/tests)
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

- `src/app/app.routes.ts`: the routes, in three frames:
  - the public pages, always dark (`layouts/game-layout`): Snake (`/home`) and `/login`;
  - the signed-in app, light or dark (`shell/`, with the ⌘K search): `/learn`, the topic pages
    (`/java`, `/dsa`, `/lld`, `/hld`), their lessons (`/java/generics-basics`), practice problems
    (`/lld/problems/parking-lot`) and DSA's cheat sheets, the animations (`/visualize`), and
    `/mock-interview`. Signed-out visitors are sent to `/login?returnUrl=…` and come back afterwards;
  - the old `/dashboard` and `/roadmaps` (`layouts/legacy-layout`), out of the navigation until they
    are removed (docs/plan.md, Phase 6).
- `src/app/pages`: the signed-in pages. `pages/article` holds what lessons, problems and cheat sheets
  share: the three-column layout, the sidebars, and the body renderer, which mounts the interactive
  parts into the build's HTML. `src/app/widgets`: those parts (quiz, drill, checklist, estimator).
  `src/app/viz`: the animation player, its seven scenes, and the FLIP motion they move with.
  `src/app/ui`: smaller shared pieces (progress bars and icons, topic glyphs, the hub's map).
- `src/app/core`: the theme, the learner's progress and checklist ticks (kept in this browser per
  account for now, `user-storage.ts`), the generated content files and their route resolvers,
  scrolling and page titles.
- `src/app/components`: the screens from before the redesign: Snake (`home`), `login`, `dashboard`,
  `roadmaps` and the old `navbar`.
- `src/app/services`: API access and the sign-in state (`auth.service.ts`).
- `src/app/interceptors`: add the backend origin and the token to `/api` calls, and sign out on a 401.
- `src/styles.css`: TheSWEguide's design tokens (light and dark), fonts and typography.
- `public/`: files served as they are (`assets/logo.svg`).
- `e2e/`: Playwright tests.
- `docs/plan.md`: the plan.
