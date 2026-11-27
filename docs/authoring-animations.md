# Authoring animations

Animations ("scenes") explain a concept frame by frame: a `HashMap` resizing, a request crossing the network, a node joining a hash ring. This guide covers how a scene is built, how to embed one in a lesson, and how to add a new one. Content authoring in general is in [authoring-content.md](authoring-content.md).

Every scene is listed at `/visualize`, and each has its own page at `/visualize/<scene>`.

## How a scene works

A scene is two things:

- **A pure function** `build(params) → Frame[]` that turns the scene's parameters into a list of frames. Each frame is `{ state, caption, line? }`: what to draw, one sentence saying what is happening, and optionally the code line to highlight.
- **A view** that draws one frame's `state`. Motion animates the change from one frame to the next. Elements that keep their identity between frames, such as a key moving to another bucket, use the same `layoutId`, so they glide to their new place.

Because the frames are computed up front, stepping backwards just shows an earlier frame, and `build()` can be unit-tested without a browser.

Each scene's logic is in `src/lib/viz/scenes/<id>/logic.ts`: the parameter type, the defaults, `build()` and any code the scene shows. It is pure TypeScript, so the content build, the validator and the tests import it. The view that draws a frame, and the player that plays a scene in each mode, are Angular components; they arrive with Phase 4 of `docs/plan.md`. (On TheSWEguide they were `View.tsx` and `Player.tsx`, using Motion's `layoutId`.)

Three lists in `src/lib/viz` tie the scenes together:

| File          | What it maps                                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `registry.ts` | Each scene's title, summary, topic, the lesson it belongs to, the modes it can play in (the first is the default) and any code it shows. |
| `schemas.ts`  | Each scene's parameter schema (zod) and defaults, plus rules that involve more than one field.                                           |
| `builders.ts` | Each scene's `build()`, for the validator and the tests.                                                                                 |

Parameters are checked on the server when a page is built, and the first frame is part of the page's HTML, so a page shows something sensible without JavaScript.

## Three ways to play a scene

| Mode              | How it plays                                                                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Step-through**  | Play and pause, previous and next, a scrubber, speed and restart. With focus on the scene, Space or Enter plays and pauses, and the arrow keys step. A scene with code highlights the line each frame is about. A scene can offer an input editor ("Try your own input"). |
| **Loop**          | Plays on its own while at least a third of it is on screen, with a small pause button. With reduced motion it doesn't start until the reader presses play.                                                                                                                |
| **Scroll-driven** | The scene stays pinned beside the text (on top of it on narrow screens). Each step of the text shows one frame, and the frame changes as the reader scrolls to the next step.                                                                                             |

Step-through and scroll-driven scenes announce each caption to screen readers. A loop doesn't, because it would interrupt every couple of seconds. With reduced motion, the frames change without animating.

## Embedding a scene in a lesson

A step-through or looping scene is a `viz` block. Its body is the scene's parameters as JSON; fields you leave out take the scene's defaults, so `{}` plays the defaults:

````
```viz name="hashmap-put"
{ "capacity": 4, "keys": ["cat", "dog", 1, 5] }
```

```viz name="load-balancer" mode="loop"
{ "servers": 3, "failing": 1 }
```
````

`mode` picks one of the scene's modes; without it the scene plays in its first mode.

A scroll-driven scene is a `scrolly` block, with four backticks so the steps can contain code. Its first part is the JSON parameters. Each part after a line of just `---` is one step, written in Markdown; step 1 shows frame 1, step 2 shows frame 2, and so on:

`````
````scrolly name="gc-generations"
{ "tenuringThreshold": 3 }
---
**Allocation.** A new object goes into **Eden**…
---
**Eden fills up.** A **minor GC** pauses the application…
````
`````

A scrolly block needs exactly one step per frame. `npm run validate` checks this.

### In lessons

Put the block straight into the lesson's Markdown. (On TheSWEguide, imported lessons got their blocks from `content/embeds/` through the portfolio import; that folder is kept for reference, and the import no longer exists.)

DSA lessons belong to this repository, so a block goes straight into the lesson.

## Adding a scene

1. **Write `logic.ts`.** Define the parameters, `DEFAULTS` and `build()`, which must be pure and deterministic.
   - Compute captions from the frames instead of hard-coding numbers, so they stay true when a lesson changes the parameters. Where a parameter could make the point untrue, say what does happen. For example, with only a few virtual nodes the consistent-hashing ring stays uneven, and its caption says so.
   - If the scene shows code, export the source and give each frame a 1-based `line`.
2. **Test it** in `tools/tests/viz.test.ts`. Assert the facts the scene teaches, such as the largest window sum or which keys move when a node joins, not just the number of frames. A shared test already checks that every scene builds captioned frames from its defaults.
3. **Write the view** (an Angular component, from Phase 4 on). Draw from `state` alone.
   - Use the design tokens (`bg-surface`, `text-muted`, `border-border`, `accent`, and `info`, `success`, `warning`, `danger` and `insight` for categories), so the scene works in both themes and takes on its topic's colour.
   - Lay it out with container queries (`@md:`, `@lg:`) rather than viewport breakpoints. The same scene can sit in a narrow column beside scroll-driven text or fill a wide page.
   - Don't repeat the caption: the player shows it under the view.
   - Keep frames close in height. The player keeps a scene as tall as its tallest frame, so that stepping never moves the controls or the text around it. It measures every frame once after the page loads. A scene that grows a lot, like `hashmap-put` doubling its buckets, shows empty space in its early frames.
4. **Hook it into the player** the way the other scenes are.
5. **Register it** in `registry.ts`, `schemas.ts` (a `.partial().strict()` object schema, the defaults, and any rule that involves more than one field) and `builders.ts`.
6. **Embed it** in its lesson (see above) and run `npm run validate`. The validator reports:
   - an unknown scene name;
   - parameters the schema rejects;
   - a mode the scene can't play in;
   - a scrolly block whose step count doesn't match the frame count.

   It also warns when a registered scene isn't embedded in the lesson the registry names.

7. **Check it** with `npm run dev`, on the lesson and at `/visualize/<scene>`. Check light and dark themes, a phone-width window, and reduced motion (the operating system's setting).
