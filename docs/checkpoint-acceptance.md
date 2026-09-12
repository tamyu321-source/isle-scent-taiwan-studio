# CHECKPOINT — acceptance record

## Real browser execution

- Python 3.11 and pinned Playwright 1.62.0 / Chromium 151.0.7922.34.
- Built static Pages output with the `/isle-scent-taiwan-studio/` subpath. Six required cases (three journeys, desktop 1440×900 and mobile 390×844) passed, with 44 executed steps and 44 actual screenshots.
- Portfolio: eight sequential project cards, working navigation, actual entry clicks, direct reloads and return navigation.
- PURE WHITE: 450g selection carried into the product route and survived reload; three recipe images and contents matched; FAQ and navigation worked.
- FIELDWORK: browser-observed snapshot, filters, pagination, search, source detail, actual CSV and JSON download events. Downloaded file contents matched the current filter or selected rows; CSV contained a UTF-8 BOM.
- A separate custom-URL run against `https://example.com` passed both viewport checks. This establishes basic public-page inspection, not a general certification of arbitrary websites.
- The first development-server run exposed premature interactions before page scripts had loaded. The runner now waits for page load and asserts selected state before advancing. Static build runs passed without adding forced clicks, fixed sleeps or mutating application internals.

## Failure and evidence checks

- Fourteen Python tests include real local fixture pages for broken images, unhandled JavaScript, overflow, HTTP 404, access denial, verification pages and timeouts, plus report escaping, URL/path limits, unique output directories and case deadlines.
- Five TypeScript tests cover schema validation, evidence paths, repository-scoped Actions links and Taiwan timestamps.
- An actual interrupted CLI retained the first three completed steps and their screenshots; the current case was blocked and remaining cases stayed unexecuted. Fixture and evidence remain locally under `outputs/checkpoint-qa/`.
- Evidence is written per step. A hard process stop may prevent the final trace from being finalized; this is documented and does not convert the case to success.

## Reader UI

- Desktop and mobile layouts have no document-level horizontal overflow.
- Case selection, desktop/mobile keyboard tabs, status filters and empty-filter state were exercised with the actual report.
- Screenshot dialog, Escape, reduced-motion mode and report-fetch failure were exercised. Failed refresh retained the previously loaded report and showed an error.
- The read-only `read_checkpoint_result` page tool returned the selected real case and rejected unexpected arguments without changing page state.
- Screenshot images are real browser captures, not generated interface mockups. The portfolio preview is derived from the completed reader UI.

## Delivery boundary

- Download contains the runner, pinned dependencies, README and tests. No browser binary, account state or credentials are bundled.
- The ZIP was extracted into a fresh directory with a separate virtual environment. Dependency installation, Chromium installation and a visible-browser desktop run all completed; all three journeys passed.
- Public reports are generated into the Pages artifact after testing that same static build. They explicitly identify the build-preview environment and commit; they are not presented as tests against the already-deployed production site.
- The release gate requires all six cases and every required step to complete successfully with screenshot evidence. A failed run keeps the previous site online and uploads diagnostic evidence to Actions for seven days.
- Sites and existing uncommitted About changes are excluded.
