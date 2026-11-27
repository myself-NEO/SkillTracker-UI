# Authoring content

Lessons and problems are Markdown files. The curriculum (stages, modules, lesson order and metadata) is TypeScript. Both live in `content/`, and every page of the site is generated from them at build time.

## Where things live

```
content/
  java/   index.ts (the track), stages/*.ts (curriculum), lessons/*.md, problems.ts + problems/*.md, interview.ts + interview/*.md
  dsa/    index.ts (the track), stages/*.ts (curriculum), lessons/*.md, cheatsheets.ts + cheatsheets/*.md,
          redirects.ts (old guide URLs), problems.ts + practiceTopics.ts (the LeetCode practice list)
  lld/    index.ts, stages/*.ts, lessons/*.md, problems.ts + problems/*.md, interview.ts, landing.ts
  hld/    index.ts, stages/*.ts, lessons/*.md, problems.ts + problems/*.md, interview.ts, landing.ts, formats.ts
  shared/ types.ts (the content model), curriculum.ts, loaders.ts, rubric.ts
  system-design/ helpers shared by the LLD and HLD mock interviews
```

A lesson lives at `/<topic>/<slug>`, and a problem at `/<topic>/problems/<slug>`. The DSA cheat sheets, kept whole for revision, live at `/dsa/cheatsheets/<slug>`.

DSA was imported as 16 single-file guides and split into one lesson per concept on TheSWEguide. The split ran once, and the files it generated (`content/dsa/stages/*.ts`, `cheatsheets.ts`, `redirects.ts`) are edited directly.

## Adding a lesson

1. **Write the body** in `content/<topic>/lessons/<slug>.md`.
   - Start with prose or a `##` section. The page renders the title, summary and objectives from the metadata, so don't repeat them.
2. **Add a `LessonMeta` entry** for the slug in the right module of `content/<topic>/stages/*.ts`.
3. **Pick a slug** that is lowercase with hyphens. It can't be one of `problems`, `interview`, `notebook`, `progress`, `estimator`, `cheatsheets` or `notes`, because those are section pages.
4. **Run `npm run validate`.**

A curriculum entry without a body shows as "coming soon", which is a way to publish the plan before the lesson exists. A body without a curriculum entry fails validation.

Problems work the same way, with a `ProblemMeta` entry in `content/<topic>/problems.ts`.

## The Markdown dialect

The app shows GitHub-flavoured Markdown plus the conventions below. The content build renders it at build time (`tools/content/pipeline.ts`, with the markup in `tools/content/render.ts`) into one JSON file per page under `public/content/`. Interactive blocks become placeholders that the app fills with its widgets.

| You write                                                      | You get                                                                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `> [!NOTE]`, `[!TIP]`, `[!WARNING]` or `[!INTERVIEW] Title`    | A callout                                                                                                                |
| ` ```java title="Ticket.java" `                                | Highlighted, copyable code (any language; ` ```text ` is shown as a diagram)                                             |
| ` ```java file="Demo.java" java="21" `                         | The same, with a "Java 21+" badge (`preview="true"` for preview features)                                                |
| ` ```mermaid title="…" `                                       | A Mermaid diagram                                                                                                        |
| ` ```uml ` / ` ```states `                                     | A class diagram / state diagram                                                                                          |
| ` ```quiz `                                                    | A knowledge check (format below)                                                                                         |
| ` ```drill `, ` ```estimator `, ` ```checklist title="…" `     | Estimation drills, the capacity calculator, a saved checklist                                                            |
| ` ````hint title="Hint 1" ` (four backticks; may contain code) | A collapsed hint. Also ` ````solution `, ` ````reveal ` and ` ````question ` (an interview question with a model answer) |
| `<details><summary>Title</summary> … </details>`               | The same as a hint, solution or reveal block, depending on the title                                                     |
| ` ```viz name="…" ` / ` ````scrolly name="…" `                 | An animation, step-through or looping / scroll-driven (see [authoring-animations.md](authoring-animations.md))           |
| `[text](lesson:slug)`, `[text](problem:slug)`                  | A link to a lesson or problem of the same topic                                                                          |
| `[text](/hld/caching-basics)`                                  | A link to any other page of the site                                                                                     |

A quiz block is one or more questions:

```
? Which collection keeps insertion order?
- HashMap
+ LinkedHashMap
! HashMap makes no ordering promise.
> LinkedHashMap threads a doubly linked list through its entries.
```

- `?` is the question.
- `+` marks the correct option and `-` a wrong one.
- `!` explains why the option above it is wrong.
- `>` is the explanation shown once the question is answered.

HLD and DSA lessons follow section contracts. A lesson's `format` in its curriculum entry names a list of required `##` sections, in order. Other sections may appear between them.

- HLD's formats are defined in `content/hld/formats.ts`, and HLD problems have a contract of their own.
- DSA's formats are defined in `content/dsa/formats.ts`:
  - `technique`: two pointers, sliding window and the like;
  - `structure`: a data structure;
  - `recap`: the last lesson of a module;
  - `method`: the problem-solving framework.

Every formatted DSA lesson ends with "Key takeaways" and a "Knowledge check" quiz. Validation warns when a body deviates from its contract.

## Checking your work

- `npm run validate` checks:
  - that every curriculum entry has a body (or is "coming soon") and every body has an entry;
  - that slugs are unique and not reserved;
  - that prerequisites, related lessons and links resolve;
  - that quiz, drill, estimator, checklist and diagram blocks parse;
  - that animation blocks name a scene, pass its parameter checks and, for scroll-driven ones, have one step per frame;
  - the HLD and DSA section contracts.

  It runs automatically before every build.

- `npm run dev` previews the site at http://localhost:3000.

## Where the content came from

The content was copied from TheSWEguide on 2026-11-27 (see `content/SOURCE.md`), and SkillTracker owns it now. It no longer syncs with TheSWEguide or the portfolio repository: edit it here.
