# CHECKPOINT — acceptance record

## ClassNest release update — 2026-09-16

- The current release gate requires **eight cases**: portfolio, PURE WHITE, FIELDWORK and ClassNest, each at desktop 1440×900 and mobile 390×844. All eight passed on the static Pages build for commit `89cac6d68c155b734d730b60ed776fc56d5f00cd`, with 66 executed steps and 66 screenshots. [Verified Actions run](https://github.com/tamyu321-source/isle-scent-taiwan-studio/actions/runs/35053446518).
- Portfolio checks now require ten projects, with ClassNest first, and exercise the category counts: all 10, brand 2, application 5, automation 3. Existing project anchors and entry points are retained.
- ClassNest checks cover keyboard-accessible help, recurring bookings, reload persistence, rescheduling and cancellation, teacher attendance, administrator credit adjustment, group cancellation, cross-tab seat exclusion and release, hold expiry, and failed IndexedDB writes followed by retry. Downloaded CSV values are parsed and reconciled with the displayed credit totals.
- Sixteen ClassNest domain tests cover collision, capacity, credit, rollback, expiry, idempotency, cancellation boundary, attendance, schedule management and ledger invariants. Existing VECTOR, FIELDWORK and CHECKPOINT tests remain in the workflow.
- Separate responsive checks passed for the portfolio and all three ClassNest role routes at 320, 390, 768 and 1440px (16 route/width combinations). Desktop and mobile captures are retained locally under `outputs/classnest-release-qa/`; the portfolio thumbnail comes from the working ClassNest UI.
- The downloadable CHECKPOINT ZIP includes the ClassNest journey. The gate requires every case and required step to pass with a screenshot; failure keeps the previous deployment online. Reports continue to identify the tested build and its Actions run, rather than claiming that a build-preview test ran against production.
- Public parent, teacher and admin routes were opened after deployment. A parent booking was confirmed in the public demo, survived reload and appeared in the admin schedule; the portfolio category filter displayed five application projects.

## Initial release evidence (historical)

The following records the original CHECKPOINT delivery. Its eight-project catalog and six-case gate have been superseded by the update above; earlier checks and delivery evidence are retained for reference.

### Real browser execution

- Python 3.11 and pinned Playwright 1.62.0 / Chromium 151.0.7922.34.
- Built static Pages output with the `/isle-scent-taiwan-studio/` subpath. Six required cases (three journeys, desktop 1440×900 and mobile 390×844) passed, with 44 executed steps and 44 actual screenshots.
- Portfolio: eight sequential project cards, working navigation, actual entry clicks, direct reloads and return navigation.
- PURE WHITE: 450g selection carried into the product route and survived reload; three recipe images and contents matched; FAQ and navigation worked.
- FIELDWORK: browser-observed snapshot, filters, pagination, search, source detail, actual CSV and JSON download events. Downloaded file contents matched the current filter or selected rows; CSV contained a UTF-8 BOM.
- A separate custom-URL run against `https://example.com` passed both viewport checks. This establishes basic public-page inspection, not a general certification of arbitrary websites.
- The first development-server run exposed premature interactions before page scripts had loaded. The runner now waits for page load and asserts selected state before advancing. Static build runs passed without adding forced clicks, fixed sleeps or mutating application internals.

### Failure and evidence checks

- Fourteen Python tests include real local fixture pages for broken images, unhandled JavaScript, overflow, HTTP 404, access denial, verification pages and timeouts, plus report escaping, URL/path limits, unique output directories and case deadlines.
- Five TypeScript tests cover schema validation, evidence paths, repository-scoped Actions links and Taiwan timestamps.
- An actual interrupted CLI retained the first three completed steps and their screenshots; the current case was blocked and remaining cases stayed unexecuted. Fixture and evidence remain locally under `outputs/checkpoint-qa/`.
- Evidence is written per step. A hard process stop may prevent the final trace from being finalized; this is documented and does not convert the case to success.

### Reader UI

- Desktop and mobile layouts have no document-level horizontal overflow.
- Case selection, desktop/mobile keyboard tabs, status filters and empty-filter state were exercised with the actual report.
- Screenshot dialog, Escape, reduced-motion mode and report-fetch failure were exercised. Failed refresh retained the previously loaded report and showed an error.
- The read-only `read_checkpoint_result` page tool returned the selected real case and rejected unexpected arguments without changing page state.
- Screenshot images are real browser captures, not interface illustrations. The portfolio preview is derived from the completed reader UI.

### Delivery boundary

- Download contains the runner, pinned dependencies, README and tests. No browser binary, account state or credentials are bundled.
- The ZIP was extracted into a fresh directory with a separate virtual environment. Dependency installation, Chromium installation and a visible-browser desktop run all completed; all three journeys passed.
- Public reports are generated into the Pages artifact after testing that same static build. They explicitly identify the build-preview environment and commit; they are not presented as tests against the already-deployed production site.
- The release gate requires all six cases and every required step to complete successfully with screenshot evidence. A failed run keeps the previous site online and uploads diagnostic evidence to Actions for seven days.
- Existing uncommitted About changes were excluded from the initial delivery.
