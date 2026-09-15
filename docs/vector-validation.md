# VECTOR validation — 2026-09-15

## Build and model checks

- TypeScript: `npx tsc --noEmit` passed.
- Scoped ESLint: all six new TypeScript implementation files passed with no warnings or errors.
- `node --experimental-strip-types --test tests/vector.test.mjs`: 5 tests passed.
- GitHub Pages static build: 31 routes prerendered, 0 skipped; `/vector/` and repository-prefixed assets served successfully.
- Build reports a bundle-size advisory for large JavaScript chunks. Three.js is included in the interactive workspace; this is not a claim of mobile performance on every device.

## Real browser checks

The following were exercised through the browser UI, on the development page and the local GitHub Pages static export:

| Check | Evidence/result |
| --- | --- |
| WebGL render | Actual point-cloud canvas, approximately 68.8K points and measured 59–60 FPS on this device |
| Edit and invalidate review | Changing X changed the inspector value and cleared the reviewed switch |
| Persistence | Created VEH-010, changed X to 2.8, reloaded and read back the same object and value |
| Role limits | Viewer position input, move tool and review action were disabled |
| Create/delete/undo | Created a new object, deleted it, restored it with Undo, then removed the test object |
| Real 3D drag | Pointer drag on VEH-001 changed X from -3.5 to 1.49; Undo restored the prior annotation |
| Rectangle selection | Dragging a rectangle selected all 9 scene objects |
| Batch review and task completion | Reviewed the 9 selected objects and successfully set the task to done |
| Completion guard | An unreviewed task rejected the done state; editing a completed task returned it to active |
| Playback | Frame advanced from 43 to 97 and could be paused |
| Task order | Moving scene-042 down placed scene-043 first and scene-042 second |
| JSON download | Chrome saved a real JSON file; parsed and verified 3 scenes / 27 tracks |
| CSV download | Chrome saved a real CSV file; verified 27 records and UTF-8 BOM |
| JSON import | Imported X=7.25, reloaded and read it back; invalid version was rejected without overwriting data |
| Report | Print stylesheet and all 27 report rows inspected; native PDF file saving is left to the browser print dialog |
| Console | No page errors observed in the static-export browser checks |

The in-app browser canceled download events, so actual file downloads were verified in Chrome and the resulting files were read from disk. The Chrome extension's file-URL permission prevented automated upload there; JSON imports were verified through the in-app browser's supported file chooser instead. No browser permissions were changed.

## Responsive coverage

Workspace, tasks, analytics, quality and logs were checked at 320, 390, 768 and 1440 CSS pixels (20 combinations). Every check had `document.documentElement.scrollWidth <= document.documentElement.clientWidth`. The vertical scrollbar makes the available content width 15px smaller at some sizes. Wide task tables scroll inside their container. Desktop and full mobile screenshots were visually reviewed.

Working evidence is in the ignored `outputs/vector-qa/` directory. The default desktop screenshot is tracked as `public/images/work-vector-preview.png` and used on the portfolio. GitHub Actions repeats the model checks and the repository's existing six-case portfolio browser release gate before publishing.

This is a static portfolio demo using synthetic data and browser-local state. Production authentication, multiuser concurrency, real-model integration and real-road accuracy are outside the implemented scope. See [technical documentation](./vector-perception.md).
