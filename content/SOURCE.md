# Content source

This folder was copied from TheSWEguide (`content/`, at commit `17fdbbf`) on 2026-11-27, when
SkillTracker took over as the home of the lessons. TheSWEguide stays live but frozen; the content is
edited here from now on, and nothing is imported any more. The content build (`tools/content`)
turns it into the JSON the app loads.

TheSWEguide's own record of where the content came from follows.

---

The lessons, problems and curriculum metadata in this folder were imported from the portfolio
repository https://github.com/myself-NEO/myself-NEO.github.io by `scripts/import-content.ts`.

- Commit: `1e43a590a887a2c6e486ba172e1dca8feed6164a` (2026-11-10T20:27:39+05:30): Merge pull request #93 from myself-NEO/develop
- Topics: java, lld, hld

DSA (`dsa/`) was imported once, from commit `1e43a590a887a2c6e486ba172e1dca8feed6164a`, and then
split into one lesson per concept in this repository (Phase 2, `scripts/dsa-split`). It belongs to
TheSWEguide now and is no longer imported.

Changes made during the import (rules: `scripts/lib/import-rules.ts`):

- `learning/` became `dsa/`, with its Markdown guides in `dsa/lessons/`.
- `system-design/hld/` and `system-design/lld/` became `hld/` and `lld/`.
- Relative imports point at the moved modules, and `RubricId` comes from `shared/rubric.ts`.
- `#hash` routes became paths: `#java/learn/x` → `/java/x`, `#system-design/hld/x` → `/hld/x`.
- The LLD and HLD tracks use their own topic page as their home.
- Line endings are LF.

TheSWEguide owns `shared/loaders.ts` and `shared/rubric.ts`: an import never overwrites them.

To pull later edits from the portfolio, run
`npx tsx scripts/import-content.ts <path-to-portfolio-checkout> --topics=java,lld,hld`.
