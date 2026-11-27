<!-- The phased plan for turning SkillTracker into the learning app (approved 2026-11-27).
     Working copy kept with the code; each phase stops for review. -->

# SkillTracker becomes the final product

## Context
- **SkillTracker** has three parts:
  - an Angular 21 UI (`E:\SkillTracker\SkillTracker-UI`);
  - a Spring Boot 3.3 API (`E:\SkillTracker\SkillTracker-Srcv`), on Render Free in Docker;
  - a MySQL database on Aiven Free.
- **TheSWEguide** (`E:\TheSWEguide`, Next.js 16 on Vercel) holds the Java, DSA, LLD and HLD learning content.
- **The goal is one product, SkillTracker:**
  - Logged out, users see the Snake game (already built).
  - Logged in, they get TheSWEguide's content plus a Mock Interview tab.
  - Angular and Spring Boot, all hosted for free.

**Aiven is retiring free MySQL.** On **21 Dec 2026** free MySQL services are powered off, and their data and backups are deleted.
- **Update 2026-11-27:** the user chose to start Neon **from scratch**. The data is not migrated, so everyone signs up again.
- The database move still comes first, because the live backend must leave Aiven before 21 Dec.

## Decisions (user, 2026-11-27)
| Topic | Decision |
|---|---|
| Logged-in app | Only TheSWEguide's content plus a **Mock Interview** tab. Dashboard and Roadmaps are dropped. |
| Mock Interview tab | Both: TheSWEguide's timed LLD/HLD mock interviews and Java question bank, plus SkillTracker's scheduler (book, 1–5 feedback, history). |
| the-swe-guide.vercel.app | Stays live and **frozen**. `E:\TheSWEguide` is not changed; its content is copied into SkillTracker, which owns it from now on. |
| Database | **Neon Postgres Free**: 1 GB per project, 100 CU-hours per month, sleeps after 5 idle minutes and wakes in a few hundred ms, never paused for inactivity, no card, free branches. |
| Neon project | Project **NeoLevelUp** (`jolly-rain-59052796`): AWS Singapore, PostgreSQL 18, branch `production`, database `neondb` (role `neondb_owner`). Fresh, with no data migration. |
| Login | **Keep SkillTracker's own Spring Boot auth**: email/password, Google redirect flow, JWT. Neon's managed Better Auth was considered on 2026-11-27 and set aside for now. Its roadmap says separate frontend and backend deployments are "not yet supported"; Angular isn't a supported framework; Safari blocks its cross-site session cookie; and password reset needs its React UI. Revisit when Neon supports standalone frontends. |
| Gating | Behind the login screen only. Lessons are static JSON files on the CDN, and the app shows them only after login. |
| Backend host | Stay on **Render Free** (0.1 CPU / 512 MB, sleeps after 15 idle minutes, about 1 minute to wake). The design works around the wake time. The current service is in a US region, so a **new free service in Singapore** replaces it, next to Neon. |
| Frontend host | **Vercel Hobby**. |
| Look | TheSWEguide's design (light/dark themes, topic colours) for the logged-in app. The Snake and login pages keep their dark look. |

## Target architecture
```
Browser ── Angular SPA on Vercel CDN
            ├─ /home (Snake), /login ............................ public
            ├─ /learn, /java|dsa|lld|hld/..., /visualize, /mock-interview ... authGuard
            └─ fetches /content/**.json (built from Markdown at build time; static, same CDN)
                 │  JWT (local expiry check: no backend wait on startup)
                 ▼
         Spring Boot on Render Free: /api/auth/*, /api/state (progress, notebook, interviews), /api/interviews
                 │  JDBC over TLS, small pool that releases idle connections
                 ▼
         Neon Postgres Free (Singapore, same region as the new Render service)
```
How the design hides Render's cold start:
- Lessons, search and animations never touch the API.
- The token expiry is checked locally, so startup doesn't wait for the backend.
- Progress is saved in the browser first and synced in the background.
- The Snake page already calls `GET /api/health` on load, which wakes the backend.

## Working rules
- Work on each repo's `dev` branch. The user opens and merges the PRs (there's no `gh`). Production changes only on merge to `main`: Render deploys the API from it, and Vercel will deploy the UI from it.
- **Stop after every phase for review.** Never chain phases. The big ones (3–6) may be split into sub-phases (3a, 3b, …), each with its own stop.
- Keep the live app working at every merge. Backend changes are additive until the new UI is live; tables are dropped only after launch.
- Secrets never go into the repo. The user types the database, JWT and Google credentials into the Render, Neon and Vercel dashboards and into the local `.env`.
- Backend builds use the JDK at `%USERPROFILE%\.jdks\temurin-17.0.11` and IntelliJ's bundled Maven (`C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2023.2\plugins\maven\lib\maven3\bin\mvn`). There's no wrapper in the repo. Docker Desktop is installed, for a local Postgres.

## Phase 0: the backend on a fresh Neon database (now, well before 21 Dec)
**Repo:** SkillTracker-Srcv, branch `dev`.

**0a: PostgreSQL-only backend.** Done locally on 2026-11-27, not committed yet.
- `pom.xml`:
  - `org.postgresql:postgresql` and `flyway-database-postgresql`; the MySQL driver and `flyway-mysql` are removed.
  - Testcontainers 1.21.4 for tests.
- `db/migration/V1__baseline.sql`: a PostgreSQL baseline generated by Hibernate's schemagen.
  - Adds indexes on the foreign-key columns and a unique index on `lower(email)`.
  - Migration history starts fresh; the MySQL V1/V2 are in git history.
- `application.yml`:
  - `flyway.connect-retries: 5` (Neon wake-up); `baseline-on-migrate` removed.
  - Hikari pool: 3 connections, `minimum-idle` 0, 60 s idle timeout, so Neon can sleep.
- Profiles:
  - `application-prod.yml`: `DB_*` without defaults.
  - `application-local.yml`: Docker Postgres from `compose.yaml` (`postgres:18-alpine`, host port 5433).
- Emails are normalised (`service/Emails.java`) on register, login and Google sign-in.
- Tests: `PostgresSchemaTest` (Testcontainers, PostgreSQL 18), `AuthServiceEmailTest`, and mixed-case cases in `GoogleSignInAccountLinkingTest`.
- README and `.env.example` cover Neon and the new Render service.
- Verified: 31/31 tests pass; a local boot on Postgres 18 applied V1; a smoke test of register, mixed-case login, dashboard, roadmap and writes passed.

**0b: go live on Neon** (user, in the dashboards; Claude guides):
1. Neon: set the compute's maximum size to 0.25 CU. Copy the direct (non-pooler) connection for `neondb`.
2. Render, **before** merging: turn off Auto-Deploy on the old US service. The new code has no MySQL driver, so a redeploy there would fail.
3. Render: create a new free web service in **Singapore** from this repo, on branch `main`, using Docker. Give it these environment variables:
   - `SPRING_PROFILES_ACTIVE=prod`
   - Neon's `DB_*`
   - a new strong `JWT_SECRET`
   - `FRONTEND_URL`
   - `GOOGLE_*`, with the redirect URI `https://<new>.onrender.com/api/auth/google/callback`, also added in the Google Cloud Console
   - Health check: `/api/health`.
4. Merge `dev` → `main`; the new service deploys and Flyway creates the schema in Neon.
5. Point the UI at the new backend URL (`environment.ts`). This happens in Phase 1, with the move to Vercel.
6. Retire the old US service and the Aiven database.

**0d: hardening** (after go-live):
- Rate-limit path matching on `getServletPath()`.
- `GlobalExceptionHandler` extends `ResponseEntityExceptionHandler`, with a generic 500 body.
- Dockerfile: `exec java` plus `-XX:+ExitOnOutOfMemoryError`.
- `open-in-view: false`, graceful shutdown.

## Phase 1: UI groundwork (SkillTracker-UI)
- **Backend URL:** point `src/environments/environment.ts` at the new Singapore Render service. Deploying this UI to Vercel takes the live app off the old US backend.
- **Builder:** switch to `@angular/build:application` (`ng update @angular/cli --name use-application-builder`). Static files go in `public/` and the output in `dist/browser`. Add `vercel.json` with an SPA rewrite: paths without a dot go to `/index.html`.
- **Remove AI Studio leftovers:**
  - `vite.config.ts`, `metadata.json`, the root `index.html`, `src/index.css`;
  - unused packages (express, @google/genai, http-proxy-middleware, dotenv, vite, @tailwindcss/vite, platform-browser-dynamic, @types/express);
  - tsconfig's `jsx`/`allowJs`.
  - Replace the `@/*` → `./*` alias with `@lib/*` and `@content/*`.
- **Delete `mock-api.interceptor.ts`.** It's out of date and hard-codes the owner's personal Gmail and name, which can end up in the shipped bundle.
- **Lazy-load every route except Snake and login,** so the landing page stays small.
- **Design system:**
  - Port TheSWEguide's `globals.css` tokens (light/dark, topic colours, Shiki CSS variables, prose rules, `content-visibility`) into `src/styles.scss`.
  - Add `@tailwindcss/typography` and `@fontsource` Inter, Space Grotesk and JetBrains Mono.
  - Theme toggle, with a pre-paint script in `src/index.html` (key `theme`).
- **Tests:** Vitest via Angular's `unit-test` builder; Playwright with a login fixture that registers a test user on the local backend and dev database.
- **Docs:** copy this plan to `docs/plan.md`.

- **Also from the review:**
  - Set up the Vercel project and its stable `dev` branch preview now, and add that origin to Render's `FRONTEND_URL`.
  - `.gitattributes` gets `* text=auto eol=lf`. This machine has `core.autocrlf=true`, and quiz-prompt hashes depend on exact text.
  - Pin Node 22/24 via `engines`; Node 26 may be outside Angular 21's support.
  - Force `data-theme="dark"` outside the new shell until the old screens are gone.
  - If the host expects `dist/`, use `outputPath: {base:'dist', browser:''}`.

**Done when:** Snake, login and the old pages still work on the new builder, and `npm test` and `npm run e2e` run.

## Phase 2: content pipeline (SkillTracker-UI)
- **Copy content and docs.** `E:\TheSWEguide\content\**` → `content/`, except `.generated/`. `docs/authoring-content.md` and `authoring-animations.md` → `docs/`.
- **Copy the framework-free TS to `src/lib/**`, mostly verbatim:**
  - `lib/markdown/*`, `lib/search/score.ts`, `lib/progress/hash.ts` (never change it);
  - the pure parts of the stores, `viz/{registry,schemas,builders,fence}.ts`, `viz/scenes/*/logic.ts`;
  - `formats`, `estimate`, `numbers`, `revision`, `settings`, the content and track helpers.
  - Strip `server-only` and `'use cache'`.
  - Move `parseUml`, `parseStates` and `diagramType` out of `.tsx` files.
- **Build step `tools/content/build.ts`** (tsx), run by `prebuild`, `prestart` and `pretest`. It writes:
  - `public/content/catalog.json`: topics → stages → modules → lessons, plus problems, interview banks, cheat sheets and scenes, with everything sidebars, hubs and prev/next need.
  - `public/content/<topic>/<kind>/<slug>.json`: `{ meta, toc, html, widgets }` (format to be finalized).
    - `html` comes from remark/rehype with the same heading ids as `toc.ts`, callouts, Shiki dual-theme code, server-side UML/state diagrams, and reveal blocks as `<details>`.
    - Each interactive fence becomes a placeholder element; its zod-validated payload goes in `widgets`.
    - Reveal blocks and scrolly steps are rendered recursively, as `Fence` in `E:\TheSWEguide\src\components\markdown\Markdown.tsx` does today, so placeholders can sit inside them.
    - Top-level h2s get a bookmark-button placeholder.
    - Code blocks get a `data-copy` button and the Java version badge.
    - `links.ts` replaces react-markdown's `defaultUrlTransform` with a safe-URL check (http(s), mailto, relative, `#`).
    - Problems also carry what the mock interviews need (sections and `<!-- match -->` keywords).
  - `public/search-index.json`: the ported `build-search-index.ts`.
- **Validation:** port `validate-content.ts` and the manifest; the build fails on content errors.
- **Port the vitest suites:** parsers, preprocessing, callouts, TOC id parity against the new pipeline, search ranking, animation facts.

**Done when:** the files are generated, the validator is clean, the tests are green, and gzip sizes are recorded.

## Phase 3: learning shell and lesson reader
- **Routes,** all lazy and behind `authGuard`. TheSWEguide's URL scheme is kept at the root, so content links (`lesson:`, `problem:`, absolute cross-topic paths) work unchanged:
  - `/learn`: the hub and post-login landing: totals, continue, map, topic cards.
  - `/java`, `/dsa`, `/lld`, `/hld`: four explicit route groups sharing one child config, with the topic in route data. They are not a `/:topic` param, which would swallow `/home` and `/login`. Static children (`problems`, `interview`, `notebook`, `progress`, …) come before `:lesson`.
  - Under each topic: `/:lesson`, `/problems`, `/problems/:problem`.
  - `/dsa/cheatsheets/:slug`, `/hld/estimator`, `/visualize`, `/visualize/:scene`, plus a not-found page.
  - `/home` (Snake) and `/login` stay public.
  - `authGuard` sends users to `/login?returnUrl=…`.
  - The three hard-coded `/dashboard` redirects become `/learn` or the return URL.
  - The Snake page's signed-in button becomes "Continue learning".
- **Header:** tabs Java · DSA · LLD · HLD · Mock Interview, ⌘K search, theme toggle, avatar and logout.
- **Lesson page:** curriculum sidebar (a drawer on phones), table of contents with scroll spy, meta pills, objectives and prerequisites, body, prev/next. `ContentService` fetches and caches the JSON.
- **`LessonBodyComponent`:**
  - Trusts only build output (`bypassSecurityTrustHtml`), never user text.
  - Mounts widget components into the placeholders with `createComponent({ hostElement, bindings })` and destroys them on navigation.
  - Sends internal link clicks to the Router.
  - Delegates heading-bookmark and copy-button clicks.
- **Mermaid:** loaded on demand (`import('mermaid')`) within 1200 px of the viewport and redrawn on theme change (ported from `MermaidDiagram.tsx`).
- **Search dialog:** fetches the index lazily and uses the ported scoring.
- **Local stores** (moved here from Phase 4): TheSWEguide's stores ported to signals, local-only and per user. Bookmarks and copy-to-snippet need them already.
- **Lesson loading:** a route resolver fetches the lesson JSON (LRU cache, prev/next prefetched when idle) and re-applies `#fragment` after mounting. Event delegation runs outside the zone. Content files live under a build-hash path with immutable caching.

**Phase 3a (done 2026-11-27, committed):**
- The routes, guards and return URLs above.
- The signed-in shell: a header with the topics, Mock Interview, a theme toggle (in the account menu on phones) and an account menu, plus a footer.
- `/learn` and the four topic roadmaps, ported from TheSWEguide. Progress is per account in this browser (`st:<userId>:learning-progress-v1`).
- `/mock-interview` with the scheduler moved out of the Dashboard and restyled. It still calls `/api/dashboard/interview*` until Phase 6.
- A not-found page, which says "on its way" for topic pages not ported yet.
- `index.json` carries each topic's lesson slugs, so the hub needs no curriculum file.
- AppComponent and the dark layouts keep default change detection: the screens from before the redesign update plain fields after async work.

**Phase 3b (done 2026-11-27, in review):**
- Lesson pages (`/:topic/:lesson`):
  - the curriculum sidebar (a drawer on phones), "On this page" with scroll spy (a menu on smaller screens), and the meta pills;
  - what the lesson covers and what to read first, "Mark as complete", previous and next, and related lessons;
  - opening a lesson and reading through it moves the topic's resume point.
- Java, LLD and HLD practice: the library (`/:topic/problems`, search and filters) and problem pages (status picker; opening a hint or solution marks the problem started).
- DSA cheat sheets (`/dsa/cheatsheets/:slug`).
- The body renderer (`pages/article/lesson-body`):
  - It sets the build's HTML as is, since it is trusted build output.
  - Copy buttons work, and links to app pages and #sections go through the router.
  - Mermaid diagrams are drawn near the viewport, redrawn on theme change, with step-through and expand.
  - Other widgets show an "on its way" note until Phase 4.
- ⌘K search over `/search-index.json`.
- Section links (#id) scroll with the browser's `scrollIntoView`, so each element's `scroll-margin-top` is kept.
- `strictTemplates` is on.
- `track.json` lists the problems with a written breakdown (`writtenProblems`).

Not in 3b:
- DSA's coding-question tracker (`/dsa/problems`) needs the notebook store, so it moves to Phase 5 with the notebooks and the progress pages.
- Interview prep stays in Phase 6, and the estimator page in Phase 4.
- Until then, those URLs show "This page is on its way".

## Phase 4: interactive widgets and animations
- **Widgets:** Quiz, Drill, Checklist, Estimator, hint/reveal tracking, copy button.
- **Stores:** the widgets use the Phase 3 local stores (`st:<userId>:<key>`). Server sync comes in Phase 5.
- **Animation engine:** ScenePlayer's three modes (stepper, loop, scroll-driven), with reduced motion, captions and the code panel, plus the 7 scene views.
  - motion's `layoutId` is replaced by a small FLIP directive built on the Web Animations API.
  - The `/visualize` gallery and scene pages; `viz` and `scrolly` fences inside lessons.

**Phase 4a (done 2026-11-27, in review): the widgets.**
- Quiz:
  - A wrong option says why; you can show the answer, and reset.
  - On lessons, every choice is recorded, and answering all correctly marks the knowledge check passed. On other pages it is practice only.
- Drill: reads estimates like 1.2K/s or 40 GB and says how far off they are; answers on lessons are recorded with the quiz answers.
- Checklist: ticks are kept per page in the new interviews store (`st:<userId>:learning-interviews-v1`); on cheat sheets they last for the visit.
- Estimator, in lessons and on `/hld/estimator` (with the latency and conversion tables).
- `UserStorage` (`core/user-storage.ts`) keeps any state per account. ProgressStore and the new InterviewsStore use it.
- `lib/progress/interviews.ts` has TheSWEguide's interviews model: the types, sanitizing and checklist updates. The session updates come with the mock interviews in Phase 6.
- Animations (`viz` and `scrolly`) still show "on its way" until **Phase 4b**: the animation engine, the scenes, `/visualize`, and the hub's animation showcase.

**Phase 4b (done 2026-11-27, in review): the animations.**
- The scene player (`src/app/viz`) has TheSWEguide's three modes:
  - stepper: play/pause, step, slider, speed, keyboard, the scene's code with the current line, and "Try your own input" for the sliding window;
  - loop: plays while on screen, unless the visitor prefers reduced motion;
  - scroll-driven: the frame follows the step being read.
- Each frame keeps the height of the scene's tallest frame (measured from invisible copies), and scenes lay themselves out with container queries.
- The 7 scene views are ported.
- Motion's `layoutId` is replaced by FLIP directives on the Web Animations API (`viz/motion.ts`). Elements entering and leaving use Angular's `animate.enter` / `animate.leave` with the `.viz-*` keyframes in `styles.css`. With reduced motion nothing animates.
- In lessons the player and the scenes load separately (`@defer`), so lessons without animations don't download them.
- `/visualize` (the gallery) and `/visualize/:scene` (a scene on its own) read `public/content/visualize.json`. The build writes it: each scene with its default parameters and its code, highlighted.
- The hub has the load-balancer animation showcase. The footer links to the gallery.
- Angular's runtime for `@defer` and enter/leave animations adds about 6 KB (gzipped) to the first download.

## Phase 5: progress tied to the account (both repos)
- **Backend:**
  - Flyway `V2__user_state.sql`: `user_state(user_id fk → users on delete cascade, kind check in ('progress','notebook','interviews'), data jsonb, updated_at)`, with PK (user_id, kind).
  - Entity: `@JdbcTypeCode(SqlTypes.JSON)`.
  - `GET /api/state` returns all three documents.
  - `PATCH /api/state/{kind}` takes JSON Merge Patch (RFC 7396): changed keys carry their new value, removed keys are `null`. It's applied under a row lock.
  - Limits: a whitelist of top-level fields per kind, a 1 MB cap per document (413), and a per-user rate limit.
  - Tests.
- **Frontend `SyncService`:**
  - It diffs each store update at the field → key level into a pending patch. The patch is persisted, debounced (about 3 s) and flushed on `pagehide` with `keepalive`.
  - On start it shows the local copy at once, then reads the server copy, applies the pending patch on top and flushes it.
  - It retries with backoff while Render wakes up, and shows a small "Saving / Saved / Offline" indicator.
  - On logout it tries to flush first and warns if changes haven't synced.
- **Pages:**
  - per-topic progress dashboard and notebook (revision list, saved items, notes, snippets);
  - DSA notes and LeetCode list, problem library status;
  - complete button, status picker, bookmarks and flags, "continue where you left off".
- **Import:** a TheSWEguide backup file (`theswe-guide-backup-*.json`, version 1) is sanitized and merged into the account. Export uses the same format.

Split into three, each with its own review:
- **5a:** progress and checklist ticks saved to the account.
- **5b:** the notebook store and revision tools (bookmarks, notes, snippets, saved diagrams, revisit flags), the notebook page, and TheSWEguide backup import and export.
- **5c:** the progress pages, DSA's coding-question tracker (`/dsa/problems`, `/dsa/problems/:topic`) and its interview notes page.

**Phase 5a (done 2026-11-28, in review): progress saved to the account.**
- Backend (SkillTracker-Srcv):
  - `V2__user_state.sql` and the `UserState` entity, as above.
  - `GET /api/state` returns the user's documents. `PATCH /api/state/{kind}` (`application/merge-patch+json`) applies a merge patch under a row lock and returns the document as stored.
  - Refused:
    - an unknown kind (404);
    - a top-level field the kind doesn't have, or a value that isn't an object (400);
    - a request over 1 MB (413), or one without a length (411);
    - a document over 1 MB after the merge (413);
    - more than 60 saves a minute from one user (429).
  - Tests:
    - the RFC 7396 examples;
    - the endpoint's rules, on H2;
    - the jsonb column and the cascade on user deletion, on PostgreSQL 18 (Testcontainers).
- UI:
  - `StateSync` (`core/state-sync.service.ts`) saves progress and the interviews store (checklist ticks) to the account. The notebook joins it in 5b.
  - **How changes are tracked:** the plan above collected patches as the stores changed. Instead, each document keeps the server's last copy beside it (`…:synced` in localStorage), and what to send is the difference between the two (`lib/progress/merge-patch.ts`).
    - A lost or repeated request changes nothing.
    - A change made while a save is in flight goes out with the next one.
  - **After sign-in,** the local copy shows at once. The server's copy is then read, with local changes kept on top of it.
  - **When changes are sent:**
    - 3 s after the last change;
    - once more, without waiting for the answer, when the page is hidden or closed (`keepalive`).
  - **Reading the server's copy again:** a tab that comes back after a minute away does so.
  - **Retries:** while the backend is asleep or unreachable, saves retry after 3 s, doubling up to a minute.
  - **The header indicator:** "Saving…" and "Saved" show from 640 px wide; "Offline" and "Not saved" always show.
  - **Signing out** waits up to 4 s for the last save. If the save didn't get through, it asks first. What wasn't sent stays in this browser and goes out at the next sign-in there.
- Tests:
  - the merge-patch helpers (tools tests);
  - `StateSync`, with fake timers;
  - an e2e test that marks a lesson complete and sees it in a fresh browser.
  - The e2e tests use one account per Playwright project and sign each in once per run (`e2e/global-setup.ts`).
- Deploy the backend first. Until `/api/state` is live, the new UI shows "Offline" and keeps retrying, and progress stays in the browser only. The current backend answers 500 for a path it doesn't have (its catch-all exception handler, Phase 0d), and the UI reads that as unreachable.

## Phase 6: Mock Interview tab, and removing Dashboard and Roadmaps
Split into three:
- **6a:** the Mock Interview tab.
- **6b:** the UI stops calling the old APIs, and that version is deployed.
- **6c:** backend deletion plus `V3__drop_legacy.sql`, with a Neon snapshot taken first. Remove `UserSeedService` in the same deploy as the table drop.
- **`/mock-interview`:**
  - **Practise:** the Java question bank (`/java/interview/*`) and timed LLD/HLD mock interviews (`/lld|hld/interview/*`), ported with their kits, rubric and the diagram and UML editors, with attempt history.
  - **Schedule:** SkillTracker's scheduler (book, upcoming, 1–5 feedback, history), moved out of the Dashboard into its own component.
- **Backend:** the interview endpoints move to `/api/interviews` (list, schedule, feedback). The old `/api/dashboard/interview*` routes stay until launch.
- **Remove from the UI:** dashboard, roadmaps, their services and their types in `types.ts`.
- **Prepare on a branch, merge only after launch:**
  - delete the Dashboard, Roadmap and StaticRoadmap code (controllers, services, seeders, `UserSeedService`, `ADMIN_EMAILS`, entities, repos, DTOs);
  - `V3__drop_dashboard_roadmaps.sql`, which drops 7 tables.
  - `users` and `mock_interviews` stay.

## Phase 7: hosting and launch
- **Vercel:** use the UI's Vercel project, or create one if it isn't on Vercel yet. Framework preset Angular, build `npm run build`, output `dist/browser`, production branch `main`.
  - The stable branch URL `…-git-dev-….vercel.app` serves reviews.
  - Add it, the production origin and localhost to Render's `FRONTEND_URL` (this covers both CORS and Google sign-in returns).
- **Render:**
  - Health check `/api/health`.
  - Optional faster start-up: a CDS archive from a training run on the `dev` profile at image build. Measure "Started … in X s" before and after.
  - Optional free keep-awake pinger (cron-job.org → `/api/health` every 10 minutes). It doesn't touch the database, so Neon still sleeps.
- **Launch order:**
  1. Merge UI `dev` → `main`, which updates Vercel production.
  2. Smoke-test production.
  3. Merge the Phase 6 backend cleanup, which drops the old tables.
- **Then:** run e2e against production with a test account, and update both READMEs (stack, local run with Docker Postgres or the Neon dev branch, deploy).

## Reuse map (TheSWEguide → SkillTracker-UI)
- **Verbatim:**
  - `content/**`;
  - `src/lib/progress/hash.ts`, `src/lib/search/score.ts`, `src/lib/markdown/*`;
  - the `src/viz` pure files and the 7 `logic.ts`;
  - `scripts/build-search-index.ts`, `build-manifest.ts`, `validate-content.ts` with `scripts/lib/*`;
  - most vitest tests.
- **Adapted:**
  - `src/lib/progress/{store,progress,notebook,interviews,backup}.ts`: signals instead of `useSyncExternalStore`, per-user keys, sync hooks;
  - `globals.css` → `styles.scss`.
- **Rewritten in Angular:** all React UI, about 12.5–13K LOC (listed per phase above).
- **Left behind:**
  - SEO-only code (share images, sitemap, JSON-LD, metadata);
  - the Next-specific analytics;
  - the portfolio import and DSA-split scripts.

## Risks and mitigations
| Risk | Mitigation |
|---|---|
| Aiven powers off on 21 Dec | Phase 0b moves the live backend to the new Singapore service on Neon first. No data needs keeping. |
| Neon's 100 CU-hours per month | 0.25 CU fixed; the pool releases idle connections; `/api/health` never touches the database; check usage in the Neon console after launch. |
| Render cold start (~1 min) | Static content, local token check, local-first progress, wake-up ping from the Snake page; optional CDS and keep-awake pinger. |
| Bundle budget (1 MB warning) | Lazy routes; Mermaid and animations load on demand; Shiki runs only at build time. |
| motion `layoutId` has no Angular equivalent | FLIP directive using the Web Animations API; respects reduced motion. |
| XSS through `innerHTML` | Only build output is trusted. Notes and other user text render through Angular's sanitizer. |
| Stored progress keys | `questionHash` and the key formats are copied byte for byte, with tests. |
| Preview origins and CORS | The stable Vercel branch URL is added to `FRONTEND_URL`. |

## Verification
- **Backend, every phase:**
  - `mvn test` on JDK 17 (H2 in PostgreSQL mode).
  - A local `local`-profile run against the Docker Postgres: Flyway applies, Hibernate validate passes.
  - A smoke test of register, login, Google sign-in and the Phase 5/6 endpoints with the UI on `npm run dev`.
- **Phase 0 cutover:** row counts match; existing users can log in on production; their dashboard data shows in the old UI; the Neon compute suspends when idle.
- **UI, every phase:**
  - `npm run build` within budget; `npm test` (Vitest); `npm run e2e` (Playwright on desktop Chrome and a Pixel 7) against the local backend and dev database.
  - Spot checks in the browser pane, and the Vercel preview link after each push.
- **End to end, before launch:**
  1. Register a fresh account. It lands on `/learn`.
  2. Open lessons of every kind: code, callouts, reveals, UML/state, Mermaid, quiz, drill, checklist, estimator, all three animation modes.
  3. Answer a quiz and mark the lesson complete.
  4. Open the app in a second browser: the progress is there.
  5. Let Render sleep for 15 minutes, reopen: content shows at once, and changes sync once the backend is up.
  6. Import a TheSWEguide backup. Book a mock interview and leave feedback. Run a timed HLD mock.
  7. Log out: Snake shows.
