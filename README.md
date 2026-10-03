# SkillTracker-UI


## Running locally

```bash
npm install
npm run dev        # uses the LOCAL backend  (http://localhost:8080) -> local MySQL
npm run dev:live   # uses the LIVE backend   (https://skilltracker-srcv.onrender.com) -> live DB
```

Both serve the app on `http://localhost:3000`. The backend is chosen at build time via
`src/environments/environment*.ts` (see `fileReplacements` in `angular.json`); `npm run build`
(production) always uses the live backend.

- `npm run dev` needs `SkillTracker-Srcv` running locally with the `local` profile (see its README).
- `npm run dev:live` needs the live backend's `FRONTEND_URL` (set on Render) to include
  `http://localhost:3000`, otherwise the browser blocks the requests with a CORS error.
