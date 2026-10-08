# Django Scientific Calculator

A reusable Django scientific calculator app with a template-tag embed, bundled static assets, exact surd display for common Additional Mathematics cases, and a small local demo project.

## Project Shape

Reusable package:

```text
src/scientific_calculator
```

Local demo only:

```text
src/demo_project
src/manage.py
src/templates/demo
src/static/demo
```

The demo project is intentionally excluded from pip installs. Do not copy it into another Django site during integration.

## Package Facts

- Package install name: `django-scientific-calculator`
- Django app name: `scientific_calculator`
- Current version: `0.3.1`
- Python support: `>=3.10`
- Django support: `Django>=5.2,<6.0`
- Repository: `https://github.com/Kevin-Oudai/django-scientific-calculator`

The reusable app includes:

- `scientific_calculator.apps.ScientificCalculatorConfig`
- template tag library: `scientific_calculator`
- template tag: `{% scientific_calculator %}`
- template: `scientific_calculator/calculator.html`
- static files:
  - `scientific_calculator/calculator.css`
  - `scientific_calculator/calculator.js`
  - `scientific_calculator/physical-keys.json` (verified physical key catalogue)

The app has no models, migrations, URLs, database requirements, or server-side views.

## Install

Install from the private GitHub repository:

```powershell
pip install "django-scientific-calculator @ git+ssh://git@github.com/Kevin-Oudai/django-scientific-calculator.git@main"
```

For `requirements.txt`:

```text
django-scientific-calculator @ git+ssh://git@github.com/Kevin-Oudai/django-scientific-calculator.git@main
```

The target machine must have access to the private repository. SSH installs require a GitHub SSH key that can read the repo.

For the existing stable 0.3.1 release, pin its version tag:

```text
django-scientific-calculator @ git+ssh://git@github.com/Kevin-Oudai/django-scientific-calculator.git@v0.3.1
```

### Refresh an existing downstream installation

Main receives roadmap changes while the package version remains 0.3.1. Force a
reinstall to replace a cached installation with the current main commit:

```powershell
python -m pip install --upgrade "Django>=5.2.17,<6.0"
python -m pip install --force-reinstall --no-deps --no-cache-dir "django-scientific-calculator @ git+ssh://git@github.com/Kevin-Oudai/django-scientific-calculator.git@main"
python manage.py check
python manage.py collectstatic --noinput
```

Record the installed Git revision with `python -m pip freeze`. Restart the site's
application workers and deploy the collected static directory using that site's
normal deployment process. Use a new query revision on both calculator.css and
calculator.js, for example `?v=COLLECTED_COMMIT_SHA`; the loader propagates the
JavaScript query to every local module. Purge the site's static CDN cache if one
is configured, then reload the browser and verify a fraction and a LIST result.
For Django manifest storage, keep every collected calculator module together
and preserve its ordinary sibling path because the loader resolves local files
relative to calculator.js.

A consumer pinned to v0.3.1 continues receiving that release. To adopt roadmap
changes, replace the requirement's tag with main or an actually published newer
tag, then run the same reinstall, collectstatic, cache refresh, and deployment
steps. Reinstalling an unchanged tag cannot acquire changes from main. No
database migration is required.

## Django Setup

Add the app and Django static files support:

```python
INSTALLED_APPS = [
    # ...
    "django.contrib.staticfiles",
    "scientific_calculator",
]
```

Embed the calculator in a template:

```django
{% load static %}
{% load scientific_calculator %}

<link rel="stylesheet" href="{% static 'scientific_calculator/calculator.css' %}">

{% scientific_calculator %}

<script src="{% static 'scientific_calculator/calculator.js' %}" defer></script>
```

For a larger Django site, load the CSS once in the page head or CSS block, render `{% scientific_calculator %}` where the calculator should appear, and load the JavaScript once near the end of the page or in the JavaScript block.

No URL include or migration step is required.

## Production Static Files

After installing the package into a production-like Django site, run the target site's normal static collection step:

```powershell
python manage.py collectstatic
```

Expected collected files:

```text
scientific_calculator/calculator.css
scientific_calculator/calculator.js
```

If these files are missing, inspect `pyproject.toml`, `MANIFEST.in`, and the package asset paths.

## Local Demo

Run the Docker demo from the repository root:

```powershell
docker compose up --build
```

Open:

```text
http://127.0.0.1:8010/
```

For local Python development without Docker, run from the `src` folder:

```powershell
python manage.py runserver
```

Open:

```text
http://127.0.0.1:8000/
```

Drag the calculator by its top bar to test the floating whiteboard-style embed.

## Calculator Features

- Basic arithmetic
- Parentheses
- Powers
- Square root
- `sin`, `cos`, `tan`
- `log`, `ln`
- Constants: `pi`, `e`
- `ANS`
- Degree/radian toggle
- Keyboard input
- Safe client-side parser with no JavaScript `eval()`
- Editable stacked fraction entry
- Exact/surd result display for supported cases
- Real second-function layer using labels above the keys
- Inverse trig: `sin^-1`, `cos^-1`, `tan^-1`
- Additional powers and roots: `10^x`, `e^x`, `x^-1`, cube root, and `x-root-y`
- Combinatorics: `n!`, `nCr`, `nPr`
- Percent and absolute value
- Memory controls: `M+`, `M-`, `MR`, `MC`
- Basic statistics accumulator: `Sigma+`, `Sigma x`, `Sigma x^2`, mean, sample standard deviation, and count

## Math Behavior

The calculator keeps a numeric value internally for `ANS`, history, and fallback behavior, but displays exact surd results for supported Additional Mathematics cases.

Supported exact displays include:

- simplified square roots, such as `sqrt(24) = 2*sqrt(6)`
- like-surd addition, such as `sqrt(8) + sqrt(18) = 5*sqrt(2)`
- surd multiplication, such as `sqrt(6) * sqrt(2) = 2*sqrt(3)`
- common DEG trig values, such as `sin(60) = sqrt(3)/2`, `cos(30) = sqrt(3)/2`, and `tan(60) = sqrt(3)`
- exact rational DEG trig values, such as `sin(30) = 1/2`

Exact surd fractions render with the same stacked fraction layout as regular fractions. For example, `(3 + sqrt(2)) / 2` displays with `3 + sqrt(2)` as the numerator and `2` as the denominator.

Unsupported exact symbolic cases intentionally fall back to the decimal evaluator instead of blocking calculation.

## Fraction Entry

The `b/c` button opens an editable stacked fraction template. Press it before typing to create blank numerator and denominator slots.

Use the arrow controls or keyboard arrows while the template is active:

- up or left moves to the numerator
- down moves to the denominator
- right moves from the numerator to the denominator, then exits a filled denominator and places the main expression cursor after the fraction

When a result has an exact surd form, the `b/c` button also rotates between exact/surd and decimal display.

## Validation

Run these checks from the repository root after changes:

```powershell
python -m compileall src\scientific_calculator
python -m pip install --dry-run --no-deps .
docker compose config
npm test
```

When Docker Desktop is running, also verify:

```powershell
docker compose up --build
```

Then open `http://127.0.0.1:8010/` and confirm the calculator renders, buttons respond, keyboard input works, degree/radian toggle works, and static files load without 404s.

The Playwright tests cover the desktop whiteboard use case. They intentionally do not enforce mobile behavior.

## Integration Checklist

Before integrating into another Django project:

1. Check the target project's Django and Python versions.
2. Confirm the target environment can install from the private GitHub repo.
3. Install the package into the target environment.
4. Add `"scientific_calculator"` to `INSTALLED_APPS`.
5. Add the CSS and JavaScript includes to the correct template blocks.
6. Render `{% scientific_calculator %}` in the requested UI location.
7. Run `collectstatic` for production-like checks.
8. Load the target page and verify no static 404s, JavaScript errors, or CSS conflicts.
9. If CSS conflicts exist, scope overrides in the target site rather than editing demo-only files.

## Package Structure

Important package files:

```text
pyproject.toml
MANIFEST.in
src/scientific_calculator/__init__.py
src/scientific_calculator/apps.py
src/scientific_calculator/templatetags/scientific_calculator.py
src/scientific_calculator/templates/scientific_calculator/calculator.html
src/scientific_calculator/static/scientific_calculator/calculator.css
src/scientific_calculator/static/scientific_calculator/calculator.js
```

`pyproject.toml` package discovery intentionally includes only:

```text
scientific_calculator*
```

That keeps the demo project out of pip installs.

## Physical Key Reference

`scientific_calculator/physical-keys.json` defines the 48 keypad positions for
the planned EL-506TS compatibility work. Its fixed IDs, `EL506-K01` through
`EL506-K48`, identify physical keys independently of their labels, mode,
function layer, browser markup, or theme. IDs are permanent literal assignments;
consumers must look them up by `id`, never by array index, display text, or DOM
order. Correcting descriptive metadata does not reassign an existing ID.

Each entry includes its physical `position` and a readable `reference_legend`.
Positions use three regions: `utility` (rows of 2, 2, and 3 keys), `navigation`
(rows of 1, 2, and 1 keys), and `main` (rows of 6, 6, 6, 5, 5, 5, and 4 keys).
Rows run top to bottom and slots run left to right within each region. Legends
describe the primary markings; they do not define base, 2ndF, ALPHA, or HYP
behavior. Alternate functions reuse the same physical ID. The recessed RESET
switch and simulator window controls are outside this keypad catalogue.

The catalogue was verified against the live pinned simulator on 2026-10-05.
Its source transcript is `tests/reference/el506ts/physical-key-reference.json`: the pinned
simulator archive's configured small-panel bitmap, cross-checked against page 4
of the operation guide. The transcript records hashes, approximate panel centers,
exclusions, reset fingerprint, and representative live key sequences. Simulator artwork and the manual are
not included in the package. This update adds reference data; runtime dispatch
and UI mapping remain later roadmap work. Existing embeds still use the same
template tag, CSS, and JavaScript includes.

## Simulator Experiment Evidence

`tests/reference/el506ts/experiment.schema.json` defines version 1 of the
reference experiment contract (JSON Schema draft-07). Store transcripts under
`tests/reference/el506ts/experiments/`; `error-recovery.json` is a live simulator
example. Existing simulator-profile and key-panel transcripts retain their own
formats. This contract records reference evidence; application golden replay is
scheduled for EL506-003.

Use `npm ci` to install the test tools, including the pinned, development-only
Ajv validator, then run `npm run test:reference` and `npm test`. Ajv is not shipped
with the Python package or loaded by the calculator. Validation uses the local
schema and pinned profile without fetching schemas from the network. The schema
uses Ajv's [documented draft-07 support](https://ajv.js.org/json-schema.html).
To validate one new transcript, run
`node tests/reference/el506ts/validate-experiment.js path/to/experiment.json`.

The canonical notation is an ordered JSON array of physical IDs, for example
`["EL506-K40", "EL506-K39", "EL506-K45", "EL506-K48", "EL506-K02"]`.
Each element means one press and release; repeated presses repeat the ID. A
modifier sequence lists each physical press explicitly, never a function name, chord,
translated label, DOM selector, or host shortcut. Simulator chrome Reset belongs
in `initial_state.reset`, outside the key sequence. `setup_sequence` contains
physical keys pressed after reset and before the experiment. It must be empty
when no setup input is needed. Capture its final state as frame 0; main sequence
steps are one-based, and each significant frame uses `after_step`. Always include
frame 0 and the final step. Sparse intermediate frames are allowed.

Each experiment records identity/build/fingerprint, locale/OS, capture date and
method, reset/setup/settings, upper/lower display lines, indicators and scrolling,
cursor/insert/prompt/component selection, exact values, affected stores, errors
and recovery, source pages, oracle exceptions/disagreements, and ambiguities.
Use `""` for an observed blank display and `null` for no visible prompt/component
or no applicable source page. An empty store list means no stores were measured;
describe that scope in `stored_values.coverage`, rather than claiming persistence.
Recovery presses remain in the main sequence; error records reference their
step numbers and require matching error and recovery frames.

State/value observations use `status: "observed"` with a `value`, or
`status: "unknown"` / `"not-applicable"` with a reason. Unknown is not zero or
unchanged. Exact value magnitudes are strings, separate from LCD strings;
`decimal-string`, `rational-string` and `structured-json-string` allow evidence
without JavaScript number rounding. The `basis` states whether a value came from
the display, recall probe, manual, or physical device; displayed digits alone do
not establish an internal stored value. Document unresolved questions in
`ambiguities` and every source disagreement in `oracle.disagreements`.

The validator checks structure and cross-references, ordered frame/recovery
steps, source IDs, and the pinned build/hash. Schema conformance establishes
record completeness, not proof that a transcription is true or that the web
calculator matches it. Keep simulator binaries, screenshots, manuals and artwork
outside Git. New schema versions must not reinterpret existing v1 step or key IDs.

## Docker Notes

Docker is for local demo development only. Other Django sites do not need this repository's `Dockerfile` or `compose.yaml` to use the package.

The Compose service bind-mounts `./src` into `/app`, so edits to the demo and reusable app are visible while developing.

## Current Limitations

- No Python unit test suite exists yet; calculator behavior is covered by desktop Playwright tests.
- No customization API exists yet for theme, initial mode, or button layout.
- The install examples use the private GitHub SSH path. HTTPS token-based installs should be handled carefully and should not commit secrets.

## Change Rules

When changing package behavior:

- update `src/scientific_calculator/__init__.py` if the version changes
- update `pyproject.toml` if the version or dependencies change
- update this `README.md` when integration steps, user-facing behavior, or release history change
- keep reusable package assets inside `src/scientific_calculator`
- do not put package CSS or JavaScript under project-level `src/static/scientific_calculator`; those files will not be included in pip installs
- avoid committing local runtime files such as `src/db.sqlite3`, `src/staticfiles`, caches, virtual environments, or build artifacts

## Capability Inventory

`tests/reference/el506ts/capability-ledger.json` records stable semantic IDs,
canonical physical-key access paths, mode contexts, evidence locations, owning
roadmap items, and independent implementation/test statuses. It covers all 48
physical positions and their visible layers, six modes, seven STAT selections,
four EQN selections, SET UP choices, observed MATH menus, 52 named constants,
44 conversion directions, statistics, memories, matrix and list functions.

`experiments/menu-inventory.json` contains a fresh-reset live transcript of 119
physical clicks and 70 significant frames against the pinned simulator. It
includes CNST 01, CONV 01, an exploratory Error 2 and recovery, and cancelled
M-CLR confirmations. Full-manual catalogue entries are marked documented;
unexecuted values, capacities, modifier behavior and mode availability remain
explicitly pending. Source manuals, binaries and images are not distributed.

The ledger contains 430 inventory entries under its stated counting policy.
Sharp advertises 470 functions, but a one-to-one marketing-count mapping remains
unresolved and assigned to the final audit. No synthetic entries pad that count.
An observed legend or menu does not establish application parity: the inventory's
historical implementation status is unassessed, and parity test statuses are
pending. EL506-005 records the baseline classifications separately below.
`npm run test:reference` validates both experiments and the ledger offline;
`npm test` also checks catalogue completeness, source references and rejected
premature parity claims. EL506-006 will add the generated parity report.

## Version 0.3.1 Baseline

`tests/reference/el506ts/baseline-0.3.1.json` freezes the source revision
`afd4094bee71e27ac963721887a41aa30f75a018` before the core refactor. It records
Git-blob SHA-256 fingerprints, classifications for 82 existing features and
21 original tests, and a classification for every one of the 430 ledger entries.
Classes are matching, partial, enhanced-only, incorrect or missing; each has a
stated scope and rationale. Matching integration/reference-data checks do not
mean matching calculator behavior. No capability is promoted to full parity.

Six browser probes preserve scalar addition, error display, exact-surd output,
pi formatting, tiny-value zeroing and keyboard 2ndF behavior. A separate test
checks focused keyboard input across two embeds. These tests intentionally
record known discrepancies rather than fixing them: error text, twelve-digit
formatting, forced tiny-value zeroing and the Enter/2ndF dispatch difference
remain scheduled work. The exact parser and extra shortcuts are identified as
enhancements. Later behavior work must deliberately revise or retire affected
baseline assertions while retaining the immutable capture. The exact reference
underflow boundary remains unmeasured; the tiny-value probe records the app's
local zeroing policy without claiming a newly verified simulator result.

The baseline uses the existing live simulator transcripts for comparisons.
The simulator was launched and its pinned build/hash and initial display checked
again, but window activation and its recovery failed, so no new key probes are
claimed. The limitation and unmeasured state are recorded in the capture.
`npm run test:reference` verifies the baseline against its original Git objects;
the source commit must be present locally (shallow clones need that history).
The application and package version remain 0.3.1. This capture does not implement
the later reducer, snapshot API, golden runner or generated parity report.

## JavaScript Unit Tests

Development checks require Node.js 22 or newer. `npm run test:unit` uses the
[Node built-in test runner](https://nodejs.org/api/test.html) and runs the files
under `tests/unit` sequentially, without a browser, Django, Docker, DOM shim or
additional runner dependency. `npm test` runs reference validation and the unit
suite before Playwright; `npm run test:e2e` runs Playwright alone.

The existing `calculator.js` exports four pure functions for CommonJS use when
no document exists: `evaluateExpression`, `evaluateExactExpression`,
`formatValue` and `closeOpenParentheses`. The normal browser script entry and
DOMContentLoaded initializer remain operational, including on hosts that define
a `module` global. `createInitialState()` and `reduceCalculator(state, event)`
also expose the existing behavior without a DOM. The reducer returns a new state
and leaves the input and its nested stores unchanged. Browser button and keyboard
handlers dispatch to this same reducer; their existing differences are preserved.
Events are `{type: "button", insert, action, secondInsert, secondAction}` or
`{type: "keyboard", key}`. Canonical physical-key routing and unsupported modes
remain future work; these legacy events do not establish simulator parity.

The initial eight unit tests cover the numeric result of the fresh simulator
`el506-010-addition-v1` reference, scalar grammar, explicit angle/ANS inputs,
combinatorics domains, exact-value enhancements and known formatting/error
policies. Only the addition result has new live simulator evidence; the other
tests characterize 0.3.1 behavior. They do not establish state-machine, LCD or
full capability parity. The package remains version 0.3.1.

Four additional reducer tests cover deterministic replay, immutable state,
memory/statistics isolation, history/cursor/error recovery, fractions, modifiers
and nonfinite values. The fresh `el506-014-reducer-addition-v1` transcript records
the reference addition sequence independently. State snapshots and the full
browser/core asset split remains scheduled separately.

`snapshotCalculator(state)` returns a versioned in-memory snapshot;
`restoreCalculator(snapshot)` validates and copies it. Version 1 covers all
baseline fields, including memories, statistics, staged templates, settings,
history, cursor, modifiers and displayed errors. Nonfinite numbers are retained;
JSON serialization is not supported by this contract. Unsupported future modes
are not implied by an empty store. Their implementation must extend the schema.
In a browser, each initialized calculator root exposes
`root.scientificCalculator.snapshot()` and `.restore(snapshot)`. Restoring
updates that instance's display. Invalid snapshots leave it unchanged.

## Golden Sequence Tests

`npm run test:golden` replays fixtures in `tests/reference/el506ts/golden`.
Version 1 fixtures identify their reference experiment, canonical sequence,
ledger capability IDs, status and expected assertions after every physical key.
Assertions use state paths such as `displayResult`, `history.length`,
`stagedEntry.part` or a future prompt/result-page field. Snapshots preserve each
step for inspection. Missing fields and unsupported key/mode/modifier dispatch
fail explicitly. A pending fixture records a reason and executes no assertions.

The bootstrap adapter covers implemented NORMAL base operations. It is a test
bridge to the baseline reducer, not a completed physical-layout or layer model.
Two supported addition/error-recovery fixtures replay 11 frames in both Node
and the browser. Their complete known display differences are asserted against
the live oracle and reported as `known-differences`, never passing parity.
Unmeasured cursor, prompt, paging and simulator stores remain explicit.
The mode/menu fixture remains pending. `npm test` includes this runner.

## Operation Guide Fixtures

`tests/reference/el506ts/guide-examples.json` records the review of all 44 pages
of the September 2019 guide: 52 connected workflows with 148 printed checkpoints,
canonical physical IDs, prerequisites, printed values and page links. Table
ellipsis entries are expanded from the printed datasets. Repeated conversion,
memory, statistics, equation and matrix steps retain their sequence context.
No guide prose, illustrations or PDF are distributed. The local PDF stays untracked.

`npm run test:reference` validates page coverage and fixture links and uses the
golden runner for the supported live-checked page 14 power sequence. That sequence
agrees numerically at 16, with baseline entry/display differences recorded.
The other 51 workflows remain pending application replay and simulator comparison;
capture completion does not establish their parity. EL506-362 owns the complete
guide regression audit after the required behavior exists.

The printed positive exponent on page 6 conflicts with the problem's negative
exponent, the page 41 polar-angle sign needs verification, and the matrix paging
ellipsis on page 43 leaves a repeated-key count unspecified. These facts remain
explicit in the fixtures; no corrected value or guessed paging count replaces them.

## Parity Evidence Report

Open `tests/reference/el506ts/parity-report.html` for the filterable report;
`parity-report.json` contains the same 430 ledger rows for tooling. Each row
reports documentation, simulator observation, implementation, unit tests,
golden replay and browser tests independently, with evidence and scope.
Inventory observation means a capability was exposed, not that all of its
behavior was measured. Implementation classifications retain the frozen 0.3.1
baseline. Explicit test mappings describe partial assertions; a pending fixture
cannot count as tested. Full verified parity currently remains zero.

Regenerate with `npm run report:parity` after changing source evidence or test
mappings in `report-coverage.json`. `npm run report:check` detects stale generated
JSON/HTML and runs as part of `npm test`. Fingerprints identify report inputs
as UTF-8 text with CRLF normalized to LF, so Windows checkouts remain reproducible.
The report runs offline, includes no external assets and does not modify the
calculator's UI or assert that unimplemented features are complete.

## Physical layout, theme, and branding (Phase 2)

The default tag now renders 48 native buttons in the verified instructional
positions, including a four-direction navigation pad and seven keypad rows
of 6/6/6/5/5/5/4 keys. Orange legends identify 2ndF functions; green legends
identify ALPHA functions. Primary, yellow, and green key labels use 14px text.
The four-direction pad is 44% of the control width with 34px-tall arrow buttons;
its surrounding utility buttons are narrower. Green ALPHA legends sit at the
bottom-right. The 2nd F and ALPHA buttons
use yellow and green backgrounds matching their function colors. Mode-specific legends and formula-memory labels stay
at their teaching positions. All artwork, styling, and browser screenshots
are original. This independent educational project has no affiliation with
or endorsement from Sharp.

The original dark theme uses two independently scrollable LCD lines, status
indicators, a cursor that follows horizontal navigation, insert/overwrite
markers, and a reusable result-page renderer. Arrow keys page coordinate,
complex, equation, matrix, and list results already supplied by the state
machine, without evaluating again or changing stores. Their numerical
algorithms remain assigned to the later feature phases. The numerical
baseline and package version remain 0.3.1; this working-main UI update does
not establish full EL-506TS parity or publish a new release tag. In particular,
the golden cursor fixture records retained-entry and decimal-point display
differences for the later lifecycle/formatting work.

Existing tag and static entry paths remain valid:

```django
{% load static scientific_calculator %}
<link rel="stylesheet" href="{% static 'scientific_calculator/calculator.css' %}">
{% scientific_calculator %}
<script src="{% static 'scientific_calculator/calculator.js' %}" defer></script>
```

Optional consumer brand text is escaped, including strings marked safe by
the host. It is text, not HTML or a CSS selector:

```django
{% scientific_calculator brand="School mathematics lab" %}
```

Consumers that need the earlier key arrangement can explicitly use
`{% scientific_calculator layout="legacy" %}`. Its previous operation mapping
and baseline tests are retained. The default physical layout uses canonical
physical-key sequencing, so shifted functions must be pressed at their verified
positions. Unsupported later-phase functions retain a pending semantic intent;
mode calculations awaiting implementation are announced rather than throwing
uncaught browser errors. The local demo exposes the physical layout at `/`
and the compatibility layout at `/legacy/`.

### Theme override contract

Load the shipped example after the main stylesheet, or copy its declarations
into your own local stylesheet targeting `.scicalc`. No external fonts,
artwork, CDN, telemetry, or calculation service is required.

```django
<link rel="stylesheet" href="{% static 'scientific_calculator/calculator.css' %}">
<link rel="stylesheet" href="{% static 'scientific_calculator/calculator-theme.example.css' %}">
```

| Custom property | Purpose |
| --- | --- |
| `--scicalc-surface`, `--scicalc-border` | Case background and border color |
| `--scicalc-ink`, `--scicalc-muted` | Primary text and contextual legends |
| `--scicalc-screen`, `--scicalc-screen-ink` | LCD surface and text |
| `--scicalc-key`, `--scicalc-number`, `--scicalc-equals` | Key surfaces |
| `--scicalc-second`, `--scicalc-alpha` | Functional legend colors |
| `--scicalc-danger`, `--scicalc-focus` | Clear-key text and keyboard focus |
| `--scicalc-font`, `--scicalc-display-font` | Local UI and LCD font stacks |
| `--scicalc-shadow` | Case shadow |

These properties change appearance while retaining key positions, order,
IDs, and meanings. Avoid overriding grid, button sizing, or functional
legends. The default and example theme pass automated 4.5:1 text/legend
contrast checks; consumer overrides should maintain that contrast and visible
focus. Cursor, selected menu number, and selected ALGB variable blinking follow
the full-manual exceptions to the simulator's stationary markers. Reduced motion
uses stable underlined selections. Forced colors
retain native controls and focus outlines.

### Template override hooks and input

Override `scientific_calculator/calculator.html` in your Django project using
the standard same-name `{% extends "scientific_calculator/calculator.html" %}`
pattern. Its `calculator_brand`, `calculator_display`, and `calculator_keys`
blocks provide narrow hooks. A brand override should retain
`.scicalc__brand`. Display/key overrides must retain the package's `data-*`
nodes, 48 `data-key-id` buttons, native semantics, and accessible announcement
regions; copy the corresponding block from the installed template before
customizing it. Do not include Sharp logos, copied panel artwork, or wording
that implies affiliation.

Mouse and touch keys dispatch on pointer-down. Keyboard and assistive
technology activation use the same physical-key reducer. Overlapping touches
support pressing the next key before releasing the first, including 2ndF
then a function. The official specification confirms two-key rollover;
this UI verifies event ordering, not physical hardware timing. Keyboard
handling belongs only to the focused calculator and leaves host shortcuts,
text fields, and IME composition alone.

| Keyboard input | Physical function |
| --- | --- |
| Digits, `.`, `+`, `-`, `*`, `/`, `(`, `)` | Matching physical key |
| Enter or `=` | Equals |
| Backspace or Delete | DEL |
| Escape / Home | ON/C / HOME |
| Arrow keys | Cursor/history, menu pages, or result pages |
| F2 / F3 / F4 | 2ndF / ALPHA / HYP |
| Tab, then Enter or Space on a button | Native focus and button activation |

Focus either LCD line to scroll its hidden content independently. Hidden
content arrows update after scrolling or resizing. Status, display changes,
selected pages, and errors have accessible announcements. The package remains
usable in 320px, 390px, 768px, and desktop viewports without hiding controls.
Short viewports can scroll the host panel vertically.
LCD lines expand vertically for stacked fractions during entry and display,
so numerators and denominators stay visible while horizontal scrolling remains
available for long expressions.

Phase 2 evidence and the pre-release appearance review are recorded in
`tests/reference/el506ts/phase-2-review.json`. The review is a release gate,
not legal advice; it must be revisited before the final release. Original
Windows Chromium pixel baselines cover both themes, focus, modifiers, menus,
errors, long expressions, phone, and tablet sizes. A dedicated Windows CI job
checks these baselines; Linux CI runs the structural and interaction suite.
Use `npx playwright test tests/e2e/physical-visual.spec.js --update-snapshots`
only after visually reviewing intentional appearance changes.

Reinstall the package, run `collectstatic`, and refresh deployed static caches
to adopt this working-main update in an existing downstream Django project.
Pushing source does not update an installed or deployed copy automatically.
The demo versions its CSS and entry script with `?v=phase2-20261007` to avoid
reusing earlier cached assets. Any query on `calculator.js` propagates to its
locally loaded companion scripts, allowing a host to use its own revision
parameter without changing the established asset paths.

## Release History

### 0.3.1

Scopes keyboard handling for embedded use.

- Keyboard shortcuts now apply only when the calculator has focus.
- The calculator root is focusable for keyboard entry after clicking or tabbing into it.

### 0.3.0

Adds second-function calculator coverage for classroom use.

- Adds physical-calculator-style second-function labels above keys.
- Adds inverse trig, exponential, reciprocal, cube-root, root, combinatorics, percent, and absolute-value functions.
- Adds memory controls and a basic statistics accumulator.
- Expands Playwright coverage for the new function families.

### 0.2.2

Fixes fraction-template navigation and fraction bar styling.

- Right arrow exits a filled denominator and places the main cursor after the inserted fraction.
- Operators can be entered immediately after completing a fraction template.
- Fraction bars only apply to the fraction's direct numerator and denominator cells, avoiding extra lines under nested operators.

### 0.2.1

Improves exact fraction entry and result rotation.

- The `b/c` button opens an editable stacked fraction template.
- Arrow controls move between numerator and denominator while editing the template.
- Result rotation includes exact/surd form when the value has one.

### 0.2.0

Adds Additional Mathematics surd behavior.

- Displays simplified square root answers as exact surds, such as `sqrt(24) = 2*sqrt(6)`.
- Displays common DEG trig answers exactly, such as `sin(60) = sqrt(3)/2`.
- Renders exact surd fractions with stacked numerator and denominator layout.
- Adds desktop Playwright coverage for surd simplification and exact trig output.

### 0.1.0

Initial reusable package baseline.

- Packages only the `scientific_calculator` Django app.
- Includes calculator template, CSS, and JavaScript in the pip package.
- Supports Django 5.2.
- Includes a Dockerized local demo project.
- Includes desktop Playwright tests for calculator UI functions.

## Project Updates

Database-free Django integration checks run with
`python -m unittest discover -s tests/django -v`. They cover the no-argument
tag, app template discovery, packaged static assets, escaped host context,
and repeated embeds. The browser suite checks runtime embed isolation.

GitHub Actions runs these checks on pushes to main and pull requests, together
with the Node/golden/reference/browser suites, isolated wheel/sdist smoke tests,
dependency audits and reviewed dependency licenses. It needs no project secrets.
Actions use read-only permissions and pinned revisions; see
[GitHub's permissions documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions).
Run packaging checks locally with `python tests/ci/check-package.py` after
installing `tests/ci/requirements.txt`; run license checks with
`node tests/ci/check-licenses.js`. Audits use the public npm/PyPI advisory
services and fail on advisories rather than changing dependencies automatically.
The package requires Django 5.2.17 or later within the 5.2 series; the demo pins
5.2.17, the [security release](https://www.djangoproject.com/weblog/2026/aug/04/security-releases/)
that replaces its vulnerable 5.2.13 pin. The package version remains 0.3.1.

The deterministic core tracks entry phases separately from LCD text: empty,
entering, editing, evaluated, error, menu, prompt, data entry and multi-result.
Modal workflow transitions retain the underlying entry and prevent unrelated
input from bypassing a selection. Result paging changes the selected component
without evaluation. These are foundation contracts; later roadmap items supply
mode-specific calculations and LCD presentation. Snapshot schema 3 includes
workflow and key-layer state and migrates schemas 1 and 2 in-memory snapshots
from the legacy profile. `pressKey('EL506-KNN')` on each embed's observable API
dispatches canonical physical IDs. Declarative 2ndF, ALPHA and HYP resolution
retains semantic intent, menus and memory/catalogue selection paths separately
from expression text. Unsupported operations retain explicit pending intents;
unsupported numeric modes reject calculation until their feature tasks exist.
The existing enhanced controls remain the compatibility adapter; the physical
layout and unified pointer/touch/keyboard mapping are Phase 2 tasks.

`semantic-editor.js` owns allowlisted calculator tokens, structural cursors,
staged templates, implied multiplication and an independently validated AST.
Scalar evaluation traverses that AST through numeric operations; it never
evaluates JavaScript or unrestricted engine source. Function tokens edit
atomically, while digits have positions within numeric tokens. Snapshot schema
4 adds the editor and migrates earlier snapshots. The compatible script entry
loads this bundled local asset automatically; existing script includes work.

`values.js` validates tagged scalar, exact rational, DMS, complex, fixed-width
N-base, statistics, equation result, matrix and list values. AST variable bindings
retain their types; unsupported structured arithmetic rejects coercion. Rational
arithmetic uses exact integer numerator/denominator pairs. Display conversion
returns component views without replacing the source value. Typed ANS, last
result, memory, dataset and history stores round-trip in snapshot schema 5.
This type infrastructure does not establish numeric parity for future modes.

### 2026-06-22

- Consolidated project documentation into the root `README.md` and `AGENTS.md`.
- Added physical-calculator-style second-function labels above keys with extra row spacing.
- Added inverse trig, exponential, reciprocal, cube-root, root, combinatorics, percent, absolute-value, memory, and statistics functions.
- Expanded Playwright coverage for each new function family.

### 2026-06-01

- Converted the project from a root-level virtual environment layout to a Docker-based project.
- Added reusable Python package metadata for future pip installs.
- Moved calculator static assets into the Django app package so they ship with pip installs.
- Added root project documentation and agent notes.
- Added installation and integration guidance.
- Changed the Docker demo host port to `8010` to avoid common local Django port conflicts.
- Added desktop Playwright coverage for calculator controls and math functions.
- Compact desktop widget sizing so all calculator keys are reachable in a normal desktop viewport.
- Added exact surd output for simplified square roots and common DEG trig values.
- Updated exact surd fractions to use the regular stacked fraction display.
- Changed the `b/c` button to open an editable fraction template with arrow-key numerator/denominator navigation.
- Added exact/surd display to result rotation when available.
- Fixed fraction-template right-arrow behavior so it exits a filled denominator and allows the next operator.
- Fixed nested fraction display styling so multi-term numerators do not draw extra fraction bars under operators.

The numerical foundation bundles Math.js 15.2.0 locally in `math-engine.js`.
The existing `calculator.js` entry loads its companion assets from the same
static directory; no CDN or calculation service is needed. A bounded adapter
accepts allowlisted numeric operations, not Math.js expression source or its
import API. Existing Number arithmetic remains the compatibility baseline
until numerical profiles are verified. Dependency notices are shipped in
`THIRD_PARTY_NOTICES.txt`; exact npm versions and integrity are locked.
Run `npm run engine:build` after changing its source, and `npm run engine:check`
to verify reproducible bundle bytes, provenance and notices.

EL506-021 adds an explicit, opt-in measured arithmetic foundation
(`numeric-model.js`), separate from the default `legacy-0.3.1` behavior.
Nine live experiments in `tests/reference/el506ts/experiments/numeric-*.json`
measure range, cancellation, display precision and signed rounding ties.
The positive cancellation probes support a provisional 13-significant-digit
truncation model for basic arithmetic. Values below 1e-99 become zero;
1e100 produces Error 2. Evaluated negative zero normalizes to positive zero.
Measured NORM mantissas truncate to ten digit positions including the leading
zero; FIX ties round away from zero. The profile deliberately rejects
unmeasured function accuracy and scientific display formatting. Later
function and formatting items must extend these probes before adopting it
as the calculator default; this foundation does not establish full parity.

The selected value strategy is decimal strings backed by Math.js BigNumber
with 64 working digits and explicit per-operation quantization for measured
scalar arithmetic. Exact rational values use reduced BigInt numerator and
denominator strings; N-base integers use bounded BigInt. DMS retains sign and
components until an explicit rational/decimal conversion. Complex, statistics,
equation, matrix and list values retain their structured numeric components;
their future algorithms must use the measured scalar policy where applicable
and add domain-specific accuracy probes. Number remains limited to the legacy
profile, bounded control metadata and explicit approximate conversions.
These are representation decisions, not claims that future mode algorithms
or all intermediate precision and rounding cases are already verified.

The compatible `calculator.js` entry now loads local companion modules.
`core.js` owns pure state, reduction, snapshots and evaluation;
`semantic-editor.js` owns token/AST parsing; `values.js` owns tagged values;
`numeric-model.js` and `math-engine.js` own numerical primitives and profiles.
`formatting.js` projects state into escaped display markup without a DOM, and
`browser-adapter.js` owns root events, rendering and focus. Node consumers of
the existing entry receive the same core API. Existing Django tags and asset
paths need no template change; collect and deploy all package static assets
together. State snapshots use schema 11 with the legacy profile; older schemas migrate in memory.

Multiple template-tag embeds own independent entry, ANS, memory, statistics,
history, modifiers, settings, token cursors and snapshots. Keyboard input
belongs to the nearest focused calculator; pointer and touch events affect
only their owning root, including nested embeds. Input outside a calculator
does not change its state. Mounting an existing root again, including loading
the compatible entry again, preserves its state and installs no duplicate
handlers; new roots receive a fresh state. Snapshot and restore boundaries
copy mutable values. Key resolution returns fresh events rather than exposing
shared key definitions. Regression tests exercise three simultaneous embeds
with keyboard, mouse and touch input and retain explicit LCD differences.


### Power, modes, clearing, and editing

The physical layout supports ON/C wake, 2ndF + ON/C power-off, and a ten-minute
idle timeout. Stored values survive a power cycle within the mounted instance.
MODE exposes all six modes and STAT/EQN submenus; their numerical algorithms
are implemented in their later roadmap phases. HOME returns to NORMAL; in
NORMAL it clears the command while retaining ANS. CA clears internal values
but retains M and formula memories. M-CLR offers confirmed memory clear and
reset. `root.scientificCalculator.reset()` models the reset switch, restoring
default settings and clearing stores.

Left/right navigation selects complete function cells or individual digits.
DEL removes the selected cell, or backspaces at the end; 2ndF + INS switches
insert/overwrite until reset. UP/DOWN recall equations, and 2ndF + UP recalls
the oldest retained equation. Playback discards unfinished drafts and shares
142 device characters across complete equations. Normal digit entry accepts
ten mantissa digits and two exponent digits. Buffer errors are reported when
equals is pressed. Snapshot schema 6 adds power, idle, subtype, error, and
internal store state; restore validates these fields before changing the UI.

### Display settings and Modify

SET UP exposes DRG (DEG/RAD/GRAD), FSE (FIX/SCI/ENG/NORM1/NORM2), and
TAB. FSE pages cycle with UP/DOWN; numeric shortcuts or the selected item and
ENT commit a setting. TAB is available under FIX, SCI, and ENG; its prompt
accepts 0–9 directly. Reset defaults to DEG, NORM1, and TAB 9. Formatting
changes preserve the current calculation, ANS, memory, history, and typed
values, and resume any existing result page or coefficient prompt.

NORM1 uses decimal notation for magnitudes from `1e-9` inclusive up to
`1e10` exclusive; NORM2 starts at `.01`. The guide prints `9999999999`
as the largest ten-digit integer; the simulator also keeps fractional values
just above that integer in decimal notation until `1e10`. Other magnitudes
use scientific notation.
NORM first rounds to ten significant digits, then limits the LCD to ten numeric
positions, including leading fractional zeros.
FIX rounds to the selected decimal places, capped by the ten-digit capacity.
SCI uses TAB decimal places in its mantissa (`TAB 2` gives three significant
digits). ENG uses exponents in multiples of three. FIX/SCI/ENG round ties away
from zero; scientific exponents have two digits. The pinned English display
uses decimal dots and apostrophes between integer groups. Host locale does
not change that profile; other regional simulator variants remain unassessed.
Entry preserves explicit decimal zeros; results follow their selected format.

2ndF + 0 (MDF) commits the rounded displayed numeric result to the current
value and ANS. For example, `5 ÷ 9` in FIX TAB 1 displays `0.6`. Multiplying
by 9 gives `5.0`; pressing MDF first gives `5.4`. Prior history and other
stores remain intact. MDF leaves an exact fraction in NORM unchanged.

Pure typed formatting covers rational, DMS, complex, N-base, statistics,
equation, matrix, and list values and their result pages without replacing
their stored representation. Fraction views remain available under NORM;
FIX/SCI/ENG display their decimal values. The numerical controllers for these
modes are built in subsequent phases. The optional legacy layout retains its
existing display behavior. Snapshot schema 6 remains compatible; explicit
TAB settings in older snapshots are retained.

Reference evidence is in `tests/reference/el506ts/phase-4-review.json` and
`experiments/phase4-mdf.json`; unit, browser, and golden checks cover the
display rules and modified versus unmodified chains. Raw reducer strings
remain distinct from physical display markup, with those representation
differences explicitly recorded by the golden runner.


The physical NORMAL profile now follows the measured EL-506TS entry and
arithmetic sequences: left-associative powers, implied multiplication before
explicit division, implicit scalar-function arguments, scientific literal
entry, postfix powers/reciprocal/factorial, permutations and combinations.
Repeated ENT preserves the result. A new operand followed by ENT reuses the
retained constant (`34+57=45=` displays `45+K=102`); ON/C and a new operation
clear that constant. Contextual percent evaluates immediately (`200+10%` gives
220; `200÷10%` gives 2000); ENT afterward evaluates the original operands.
MATH exposes SOLV/ENG and →sec/→min; engineering prefixes are local scalar
operations, and seconds/minutes conversions evaluate immediately. SOLV remains
reserved for its later controller phase. Domain/range errors retain ANS and
stores. Fractions, angle functions and the other mode controllers retain their
later roadmap owners; this is not a claim of complete device parity.

Snapshot schema 7 introduced retained arithmetic state; schema 8 adds physical
mixed-fraction templates and migrates schemas 1–7.
The optional enhanced legacy layout keeps its existing arithmetic grammar.
The package release remains 0.3.1 during this parity implementation series.


### Angles, fractions, DMS, and coordinates

NORMAL supports DEG, RAD, and GRAD through SET UP. 2ndF + decimal point
(DRG) converts the current value immediately and cycles the angle unit; ENT
afterward recalculates the original expression using the new unit. The trig
keys provide sine, cosine, tangent and their inverses; HYP and 2ndF + HYP
provide hyperbolic functions and their inverses. Singular tangents, out-of-domain
inverse functions and angles beyond the device limits give Error 2.

Enter `2`, FRAC, `1`, FRAC, `3` for a mixed fraction. Fractions simplify and
arithmetic retains exact numerator/denominator values. After evaluation, FRAC
toggles decimal/mixed views; 2ndF + FRAC toggles improper/mixed views. A fraction
requiring more than ten display positions (including separators) falls back to
decimal without losing its exact value. FIX/SCI/ENG keep their selected numeric
format. Existing stacked fractions and the current key legends remain unchanged. Screen-reader
announcements describe the numerator and denominator using “over”.

DMS enters degrees, minutes, then seconds. Carries normalize at evaluation;
NEG changes the sign of the entire DMS value. Minutes ignore the decimal point;
fractional degree input ignores the DMS entry key. 2ndF + DMS toggles the result
between DMS and decimal views; DMS display falls back to decimal at one million
degrees. DMS arithmetic uses its numeric degree value; trig interprets that
number in the active angle unit.

For coordinates enter the first component, 2ndF + STO (comma), then the second.
2ndF + 8 converts rectangular to polar, and 2ndF + 9 converts polar to
rectangular. Conversion evaluates immediately, displays the first component,
and stores the components in X/Y. Press RCL then the X or Y key to inspect
either component; arrow keys edit the pair expression. The active angle unit
controls polar angles. A zero rectangular pair or negative polar radius gives
Error 2. General memory and solver controllers retain their later roadmap owners.

Reference evidence: `tests/reference/el506ts/phase-6-review.json` and the three
`experiments/phase6-*.json` / `golden/phase6-*.json` sequences. The measured
profile and scoped tests are recorded separately from full capability parity.


### Random numbers, physical constants, and unit conversions

Press 2ndF + 7 to open RAND / R-DICE / R-COIN / R-INT. Select 0, 1, 2,
or 3, then ENT. ENT generates another sample using the same expression.
RAND produces a three-decimal value from 0 through 0.999; dice gives 1-6,
coin gives 0 or 1, and integer gives 0-99. ON/C exits the command. Each
sample replaces Y with the underlying value in [0, 1); ANS contains the
evaluated expression result. Random commands may be multiplied or added
within an expression. NORMAL, STAT, MAT, and LIST expose these scalar
commands; EQN and CPLX do not.

The browser supplies an independent random sample from Web Crypto at ENT.
The DOM-independent reducer also supports an explicit `randomSample` on a
physical-key event for reproducible tests, and uses a deterministic generator
derived from Y when no sample is supplied. Snapshots retain Y and the command;
the browser continues with new samples after restoration. No claim is made
that this reproduces the simulator's private generator or sample stream.

Press 2ndF + 2 (CNST), followed by the two-digit ID 01-52, to insert a
physical constant. Selection preserves ANS until ENT calculates the expression.
For example CNST 03 inserts standard gravity, 9.80665 m/s²; CNST 52 inserts
standard atmosphere, 101325 Pa. Invalid second digits leave the first digit
available for correction. ON/C cancels. The immutable catalogue uses the
historical CODATA 2014 values designated by the EL-506TS manual, including
its older Planck, Boltzmann, and Avogadro values. It is not a catalogue of
current SI definitions. Names, units, values, and IDs are available through
`ScientificCalculatorCore.catalogues.constants` and the lookup table below.

For conversions, enter the value, then 2ndF + 3 (CONV), the numbered conversion,
then ENT. Example: `1 →cv 1` gives 2.54 cm. Conversions accept simple fractions,
negative numbers, scientific notation, arithmetic operands and ANS; successive
reverse conversions use the current result. Fahrenheit/Celsius conversion
includes the 32-degree offset. An invalid conversion ID or result outside
the numeric range gives Error 2. DEL corrects an entered ID; ON/C cancels.
Physical constants and conversions can be inserted into NORMAL, STAT, EQN,
MAT, and LIST scalar entry; CPLX excludes them. EQN coefficient entry resumes
its existing prompt. In NORMAL, store a recalled constant or converted result with STO then A-F,
X, Y, or M; RCL then the slot reads it without replacing ANS. Broader memory entry, formula memories and persistence are described in the
Phase 8 section below. Numerical algorithms of later modes remain their
separate roadmap phases.

The reusable package includes `catalogues.js`; the loader loads it before
the core. Existing version 0.3.1 and earlier snapshot schemas remain compatible through migration.
The current key legends, fraction layout and legacy entry points are retained.

Reference evidence is recorded in `tests/reference/el506ts/phase-7-review.json`,
`phase-7-catalogue-reference.json`, and the Phase 7 experiment/golden files.
The catalogue is cross-checked against the manual and
[NIST's 2014 archive](https://physics.nist.gov/cuu/Constants/ArchiveASCII/allascii_2014.txt).
Representative native menu, result, repeat, and Y recall frames were inspected
on the pinned simulator. Hidden internal digits and full cross-mode numerical
parity are not established by these scoped tests; the final parity audit
remains pending.

Physical constant lookup (SI units unless shown otherwise):

| ID | Constant | Value | Unit |
| --- | --- | ---: | --- |
| 01 | speed of light in vacuum | 299792458 | m s^-1 |
| 02 | Newtonian constant of gravitation | 6.67408e-11 | m^3 kg^-1 s^-2 |
| 03 | standard acceleration of gravity | 9.80665 | m s^-2 |
| 04 | electron mass | 9.10938356e-31 | kg |
| 05 | proton mass | 1.672621898e-27 | kg |
| 06 | neutron mass | 1.674927471e-27 | kg |
| 07 | muon mass | 1.883531594e-28 | kg |
| 08 | atomic mass unit-kilogram relationship | 1.660539040e-27 | kg |
| 09 | elementary charge | 1.6021766208e-19 | C |
| 10 | Planck constant | 6.626070040e-34 | J s |
| 11 | Boltzmann constant | 1.38064852e-23 | J K^-1 |
| 12 | magnetic constant | 1.2566370614359e-6 | N A^-2 |
| 13 | electric constant | 8.8541878176204e-12 | F m^-1 |
| 14 | classical electron radius | 2.8179403227e-15 | m |
| 15 | fine-structure constant | 7.2973525664e-3 | 1 |
| 16 | Bohr radius | 5.2917721067e-11 | m |
| 17 | Rydberg constant | 10973731.568508 | m^-1 |
| 18 | magnetic flux quantum | 2.067833831e-15 | Wb |
| 19 | Bohr magneton | 9.274009994e-24 | J T^-1 |
| 20 | electron magnetic moment | -9.284764620e-24 | J T^-1 |
| 21 | nuclear magneton | 5.050783699e-27 | J T^-1 |
| 22 | proton magnetic moment | 1.4106067873e-26 | J T^-1 |
| 23 | neutron magnetic moment | -9.6623650e-27 | J T^-1 |
| 24 | muon magnetic moment | -4.49044826e-26 | J T^-1 |
| 25 | Compton wavelength | 2.4263102367e-12 | m |
| 26 | proton Compton wavelength | 1.32140985396e-15 | m |
| 27 | Stefan-Boltzmann constant | 5.670367e-8 | W m^-2 K^-4 |
| 28 | Avogadro constant | 6.022140857e23 | mol^-1 |
| 29 | molar volume of ideal gas | 0.022413962 | m^3 mol^-1 |
| 30 | molar gas constant | 8.3144598 | J mol^-1 K^-1 |
| 31 | Faraday constant | 96485.33289 | C mol^-1 |
| 32 | von Klitzing constant | 25812.8074555 | ohm |
| 33 | electron charge-to-mass quotient | -1.758820024e11 | C kg^-1 |
| 34 | quantum of circulation | 3.6369475486e-4 | m^2 s^-1 |
| 35 | proton gyromagnetic ratio | 2.675221900e8 | s^-1 T^-1 |
| 36 | Josephson constant | 4.835978525e14 | Hz V^-1 |
| 37 | electron volt | 1.6021766208e-19 | J |
| 38 | Celsius temperature | 273.15 | K |
| 39 | astronomical unit | 149597870700 | m |
| 40 | parsec | 3.0856775814914e16 | m |
| 41 | molar mass of carbon-12 | 0.012 | kg mol^-1 |
| 42 | Planck constant over 2 pi | 1.054571800e-34 | J s |
| 43 | Hartree energy | 4.359744650e-18 | J |
| 44 | conductance quantum | 7.7480917310e-5 | S |
| 45 | inverse fine-structure constant | 137.035999139 | 1 |
| 46 | proton-electron mass ratio | 1836.15267389 | 1 |
| 47 | molar mass constant | 0.001 | kg mol^-1 |
| 48 | neutron Compton wavelength | 1.31959090481e-15 | m |
| 49 | first radiation constant | 3.741771790e-16 | W m^2 |
| 50 | second radiation constant | 0.0143877736 | m K |
| 51 | characteristic impedance of vacuum | 376.73031346177 | ohm |
| 52 | standard atmosphere | 101325 | Pa |

Conversion lookup: odd IDs convert from the first unit to the second; even
IDs reverse that pair.

| IDs | First unit | Second unit |
| --- | --- | --- |
| 01/02 | in | cm |
| 03/04 | ft | m |
| 05/06 | yd | m |
| 07/08 | mile | km |
| 09/10 | nautical mile | m |
| 11/12 | acre | square meter |
| 13/14 | oz | g |
| 15/16 | lb | kg |
| 17/18 | deg F | deg C |
| 19/20 | US gal | L |
| 21/22 | UK gal | L |
| 23/24 | US fluid oz | mL |
| 25/26 | UK fluid oz | mL |
| 27/28 | J | cal thermochemical |
| 29/30 | J | cal 15 deg C |
| 31/32 | J | cal IT |
| 33/34 | hp | W |
| 35/36 | ps | W |
| 37/38 | kgf/cm2 | Pa |
| 39/40 | atm | Pa |
| 41/42 | mmHg (Torr) | Pa |
| 43/44 | kgf m | J |


## Memories, formula simulation, and solver (Phase 8)

NORMAL supports A-F, X, Y and independent memory M. Press STO followed by the
key bearing the green variable label to replace its value. Press RCL followed
by that key to inspect a value; during an expression, RCL inserts the variable
so it remains late bound. ALPHA followed by the variable key also inserts a
variable. Recalling a value does not change ANS. Successful calculations and
numeric STO update ANS. Fractions retain exact rational values in the stores.
M+ adds the current operand to M; 2ndF M+ subtracts it. The lower display shows
the operand, while the M indicator reflects the accumulated independent store.

F1-F4 hold editable token streams, using STO followed by UP, LEFT, RIGHT or
DOWN respectively. RCL with the same direction expands the saved expression.
Their shared capacity is 256 calculator characters; function atoms count as
one character. Replacement frees the previous slot's capacity. Blank STO
stores literal zero, as observed in the simulator. MEM clear and reset delete
the formulas. Storing a formula does not evaluate it or change ANS.

For simulation, enter or recall an expression containing variables, then press
2ndF MATH (ALGB). Variables are prompted in their order of first appearance.
The active variable is underlined and the lower display offers its current
stored value. Enter a numeric value and press ENT, or press ENT to retain it.
After the last variable, ENT calculates the result. Repeat ALGB to run again
with the retained values. ON/C cancels; previously confirmed inputs remain.
Random expressions and formula input inside numeric prompts are rejected.

For generic solving, enter an expression containing X, then MATH 0 (SOLV).
It solves expression = 0. Enter the Start estimate (initially 0), press ENT,
then accept or replace dx (initially 0.00001) and press ENT. Successful roots
are stored in X and ANS. ENT repeats with the last root as the offered Start.
A fresh MATH 0 starts at 0. Non-convergence reports Error 2 on the upper display,
clears X, and preserves the last successful ANS. ON/C recovers or cancels.

The solver uses bounded finite-difference Newton iteration (100 iterations,
residual and relative-step checks). Positive/negative roots, repeat, zero start,
and no-real-root failure have native observations. The simulator's private
iteration limit and stopping criteria are unmeasured; this is not full numerical
solver parity. Shared memory capacity is tested against the manual specification;
a live exhaustion of all 256 characters has not been measured.

ON/C, NORMAL HOME and power off/on retain memory, formulas and ANS. CA and mode
changes clear temporary variables and ANS, while retaining M and formulas; mode
changes clear imaginary M. MEM clear/reset clear all stores. Temporary memories
are available in NORMAL/MAT/LIST; M and formulas in NORMAL/CPLX. ANS is available
in NORMAL/STAT/CPLX/MAT/LIST, excluding formatted matrix/list results; EQN does
not replace ANS. The shared typed result boundary and mode eligibility are tested;
full numerical controllers for the later modes remain their roadmap phases.

Snapshot schema 9 adds typed temporary variables and token formula stores.
Schemas 1-8 migrate in memory, including the earlier string formula stores.
Deploy the new `solver.js` alongside the other reusable package assets. Native
observations and explicit gaps are recorded in `tests/reference/el506ts/phase-8-review.json`
and the Phase 8 experiment/golden fixtures. Tests cover physical controls,
keyboard numeric prompts, persistence, exact fractions and embed isolation.

## Number bases and logic (Phase 9)

In NORMAL mode, press 2nd F and HEX, BIN, PEN, OCT, or DEC to convert the
current value. The result shows H, b, P, or o beside nondecimal digits. ON/C
clears the entry and retains its base; HOME returns to decimal. In HEX, the
pi through ln keys enter A through F directly; keyboard A-F works too. Invalid
digits, decimal points, fractions, and scientific functions are ignored in
nondecimal bases. Native LCD hexadecimal b and d are rendered in lowercase.

Arithmetic supports parentheses and truncates division toward zero at each
step. The hyp, sin, cos, tan, and integral keys provide NOT, AND, OR, XOR,
and XNOR; the sign key inserts prefix NEG. AND precedes OR/XOR/XNOR, which
associate left to right. All four nondecimal bases use ten digits, with
radix complements for negative values. BigInt preserves the 40-bit hexadecimal
and 30-bit octal words without JavaScript's 32-bit operator coercion.

STO/RCL A-F, X, Y and M, M+/M-, ANS, and F1-F4 formula memories work in
nondecimal bases. A hexadecimal literal A is distinct from an ALPHA memory A.
Formula recall with unavailable functions or invalid digits reports Error 5.
Range/division errors report Error 2; malformed expressions report Error 1.
Errors retain the previous answer and recover with ON/C. Decimal conversions
truncate fractional parts. Snapshot 10 adds the selected base and preserves
radix-complement typed memories; snapshots 1-9 migrate in memory.

Reference observations and limitations are recorded in
`tests/reference/el506ts/phase-9-review.json`. Native display transcripts are
kept separate from implementation regression assertions; this phase does not
claim full simulator parity for unmeasured cursor timing or scrolling.

## Numerical differentiation and integration (Phase 10)

In decimal NORMAL mode, enter a formula using ALPHA X. Press **2nd F, integral**
for a derivative, enter the point at `X?`, then confirm `dx?`. A blank interval
uses `abs(X) * 10^-5`, or `10^-5` at zero. The central difference samples
`f(X + dx/2)` and `f(X - dx/2)`, divides their difference by `dx`, and displays
`d/dx=`. For example, `X squared`, point `2`, and the default interval return `4`.

For an integral, press **integral**, enter the lower and upper bounds at `a?`
and `b?`, then confirm `n?`. Blank `n` uses `100`. Composite Simpson integration
uses `2*n` panels and `2*n + 1` samples. Integrating `X squared` from `0` to `1`
returns `0.333333333`. Press ENT after either result to reuse the formula and
change its conditions. Condition fields accept numbers, scientific notation,
numeric fractions and mixed fractions; DEL and the sign key edit these values.
General expressions such as `2*pi` are not accepted in condition fields.

Calculus follows DEG/RAD/GRAD and the current display settings, constants,
temporary variables, M and ANS. Calculation clears X, preserves other memories,
and replaces ANS only on success. Integration displays `Calculating!` and runs
64 samples per animation frame; ON/C cancels and recovers from errors. Snapshots
retain condition entry and integration progress and resume when restored.
Deploy `calculus.js` with the other reusable package assets; the existing loader
includes it automatically. Phase 10 introduced no snapshot fields; current schema 11 includes statistics entry metadata.

The web implementation bounds `n` to integers `1..10000` (at most 20001 samples)
and calculus expressions to 1000 characters. Invalid numerical conditions,
nonfinite samples, singular sampled points, arithmetic overflow and intervals
that cannot be resolved produce Error 2; malformed expressions/entries produce
Error 1. Zero-width integrals return zero. Reversed bounds and nonpositive `dx`
are rejected. Discontinuities between sampled points can escape detection;
split such integrals into suitable intervals, as the manual advises.

Native evidence and limitations are in `tests/reference/el506ts/phase-10-review.json`
and the calculus experiment/golden fixtures. Polynomial results and the guide's
integral display agree. The guide derivative now displays `0.577350268`, matching
the native capture. Thirteen-digit operation truncation and fourteen-digit sample
truncation reproduce the measured guide and quartic derivative checkpoints;
this is a bounded implementation profile, not a claim about all private arithmetic.
Discontinuities, native work limits and cancellation timing remain unmeasured.
The new tests cover these workflows and bounds without claiming full parity.


## Statistics data management (Phase 11)

Choose MODE, 1 (STAT), then 0 (SD), 1 (LINE), 2 (QUAD), 3 (EXP),
4 (LOG), 5 (PWR), or 6 (INV). STAT supports one variable in SD and paired
X/Y observations in the six regression submodes. The reference has no
three-variable STAT option; 3-VLE belongs to EQN.

Use DATA (the M+ key) to store an observation. Enter `x DATA` in SD or
`x , y DATA` in paired modes. The comma is 2ndF, STO; the keyboard comma
also follows that physical sequence. Add a final comma and frequency for
weighted data. The pinned simulator accepts signed and fractional frequencies.
Zero frequency adds no observation, and setting an existing frequency to zero
removes that record. These are reference behavior, not input recommendations.

DOWN starts at the oldest X field; UP starts at the newest frequency field.
Continue with arrows through X, Y (paired modes), and frequency. The native LCD
calls frequency `N1=`, `N2=`, etc., rather than F. The number identifies the
record; arrow indicators show additional fields. Type a replacement and press
DATA to correct one field. ENT evaluates the entry without committing it to
the dataset. Comma-separated replacement values correct the whole selected
record. 2ndF, DATA (CD) deletes that record and renumbers the rest. ON/C exits
browsing so you can add another observation.

Storage has 100 slots: an SD record costs one slot, a pair costs two, and an
explicit frequency costs one additional slot, even when it equals one.
Exceeding capacity displays Error 3 without changing records; malformed or
incomplete records display Error 1, and numeric overflow displays Error 2.
ON/C and power off/on preserve the dataset; CA, HOME, reset, and a completed
mode/submode selection clear it. Merely opening or canceling MODE preserves it.

Snapshot schema 11 retains paired values, signed weights, explicit-frequency
storage costs, browsing position, and incomplete entry; schemas 1–10 migrate
in memory. All assets stay in the reusable package. Statistics results and
regression calculations are implemented in Phase 12, as described below.

Verification includes the Phase 11 independently transcribed simulator
checkpoints, canonical golden replay, unit tests for capacity and persistence,
and browser tests for physical buttons, keyboard comma, correction, recovery,
snapshots, multiple widgets, and fraction display bounds. Capacity/range rules
also use the pinned full manual. Intermediate golden frames are regression
assertions, not independently observed simulator parity.


## Statistics, equations, complex numbers, and matrices (Phases 12–15)

STAT supports weighted means, sample and population deviations, counts and sums,
paired statistics, and LINE, QUAD, EXP, LOG, PWR, and INV regression. RCL followed
by a green statistical key displays its result; ALPHA inserts it into an
expression. Shifted parentheses estimate X or Y immediately. MATH provides
standardization with the population deviation and P/Q/R normal probabilities;
press ENT to evaluate. Probabilities use six decimal places. Transformed
regressions reject invalid logarithmic or inverse inputs and unavailable results
use Error 2.

EQN provides two- and three-variable linear systems, quadratic equations, and
cubic equations. Enter coefficients with ENT, use 2nd F ENT to move backward,
and page solutions with ENT. Linear systems include a determinant page. Complex
roots switch components with 2nd F →. ON/C clears the current input while keeping
coefficients; CA clears coefficients. EQN results preserve the previous ANS.

CPLX accepts rectangular imaginary terms with the fraction-position i key,
arithmetic, square/cube/reciprocal, and the CONJ MATH command. The white DMS key
enters a polar angle separator. General powers of complex operands report Error 2.
2nd F 8 selects polar
results and 2nd F 9 selects rectangular results. 2nd F → switches components;
angle conversion follows DEG/RAD/GRAD. ANS retains both components and independent
memory supports complex values. Mode exit clears its imaginary component.

MAT provides four slots, matA–matD, each up to 4×4. UP/DOWN opens the edit buffer;
enter ROW, COLUMN, and row-major cells with DATA. ON/C closes the buffer. MATH STO
saves it, CHK recalls it for correction, and MAT inserts a stored operand.
Changing ROW or COLUMN clears the cells; confirming an unchanged dimension
preserves them. CHK of an undefined slot clears the editing buffer. Undefined
operand evaluation reports Error 10, invalid dimensions Error 7, incompatible
shapes Error 8, and oversized computed matrices Error 9. Unsupported value types
and matrix-by-matrix division report Error 1; singular inverses report Error 2.
Results open the edit buffer for dimension and cell paging. Implemented
operations include addition, subtraction, multiplication, scalar scaling,
integer powers, inverse, transpose, determinant, resize, fill, column-wise cumulative,
augmentation, identity, and random matrices. The root menu's matrix-to-list
actions transfer columns into list slots; LIST calculation coverage is described in
the collection section below.

These features use local package assets and bounded semantic AST evaluation.
Native checkpoints, independent guide values, algorithm/domain unit checks,
and physical-button browser tests provide scoped evidence. Cursor timing,
hidden digits, and exhaustive cross-mode limits remain part of the later parity
audit; passing implementation regression frames alone does not establish full
simulator parity.

## Collection buffers and LIST work

LIST uses four independent slots L1–L4 with 1–16 real elements. UP/DOWN opens
SIZE and element prompts; DATA commits an entry. Changing SIZE clears the edit
buffer's elements. ON/C closes the buffer; MATH STO copies it into a slot and
CHK selects a stored copy for subsequent UP/DOWN editing. Calculated lists open
SIZE and element paging. Scalar aggregates retain the collection edit buffer.
DEL removes pending input digits; INS leaves LIST cell input unchanged and
consumes 2nd F. Horizontal arrows discard pending cell input and return to a
blank expression editor. CHK of an undefined list clears the buffer.
2nd F ENT is unavailable in MAT and LIST. Mode changes clear their internal
slots and buffers. Snapshot schema 12 preserves separate matrix and list
buffers and migrates earlier snapshots.

The LIST menus expose sorting, dimension, fill, cumulative and difference
operations, augmentation, minimum, maximum, mean, median, sum, product, sample
standard deviation, sample variance, inner/outer products, and vector magnitude.
Algorithms are implemented, with native evidence and tests recording the
specific confirmed sequences; exhaustive operation/type compatibility remains
in the final parity audit. Pairwise addition, subtraction, multiplication and
division operate element by element. Scalar multiplication works in either
order; list divided by scalar is supported, while scalar divided by list
reports Error 1. `list→mat` maps each list to its corresponding one-column matrix;
`list→matA` combines lists as columns of matA. These distinct mappings follow
the full manual; multi-slot simulator verification remains pending. Adding a
scalar to a list reports the observed Error 1. Evaluating an
empty stored list reports Error 10; entering SIZE 17 reports Error 7.

## Embedding security and release validation

The calculator treats keyboard input and restored state as data. Its canonical
AST permits named numeric operations and symbols; the bundled Math.js facade
does not expose a text evaluator, parser, import, compile, or unit-creation API.
Formatting escapes dynamic text before writing DOM output. Template branding
is escaped, including values marked safe by a host template.

Expressions are limited to 10,000 characters, canonical ASTs to depth 100 and
4,096 visited nodes, and numeric AST text to 1,100 characters. Snapshot restore
checks plain data, text, depth, and collection budgets before cloning and rejects
accessors. Physical entry has its separately tested 142-character budget;
formula stores share 256 characters, STAT shares 100 data units, matrices are
bounded to 4×4, and lists to 16 elements. Integration uses bounded, interruptible
chunks. These budgets stop untrusted calculator data from requesting unlimited
allocation or expression-tree work.

An embedding host controls the page's JavaScript, DOM, styles, and configuration.
The calculator cannot isolate itself from a hostile same-origin host script;
use a separate-origin sandboxed iframe if the host must be untrusted. Theme CSS
and templates are trusted deployment inputs. Keep credentials out of calculator
state and configuration. The widget does not persist state automatically;
hosts choose whether and where to save validated snapshots.

All executable assets are local external files. Tests enforce a self-only
script CSP, no inline executable scripts, no outside asset requests, and offline
calculations after assets load. Chromium, Firefox, and WebKit run the behavior,
touch, orientation, zoom, keyboard, contrast, forced-colors, and reduced-motion
checks. Native simultaneous-touch injection and Windows pixel baselines run in
Chromium; the other engines run structural and ordinary touch checks.

The locked JavaScript dependencies and installed Python runtime licenses are
checked in CI. The package ships its LICENSE and THIRD_PARTY_NOTICES.txt with
the Math.js and decimal dependency notices. Dependency audit results are tied
to their execution date; npm and Python audits on 2026-10-08 reported no known
vulnerabilities. A clean wheel install verifies both embeds and every collected
asset against the wheel; the sdist is also checked for matching package bytes.
Only original UI assets and independent behavior transcripts are distributed;
Sharp binaries, logos, screenshots, source PDFs, and manual artwork are excluded.
The project makes no claim of Sharp affiliation. Version 1.0.0 remains gated by
the final reference audit and downstream deployment verification.

The guide regression suite covers all 52 worked workflows and 148 printed
checkpoints. The derivative example now matches the independently captured
simulator display `0.577350268`. Function denominators now evaluate correctly and retain the physical
fraction separator in the upper display. Passing these regression tests does not
establish full simulator parity.

The LIST magnitude shortcut uses the A-labelled key directly in its MATH menu. Sum, product, minimum, maximum, mean, median, sample standard deviation, variance and magnitude have independent native LCD checkpoints.

The 2026-10-08 independent polynomial check also records `X^4` differentiated
at `X=2`, with default `dx=0.00002`: the simulator displays `32.0000005`,
and the application now matches it exactly. The independently observed reference
is retained in `tests/reference/el506ts/experiments/calculus-polynomial-native.json`.
The complete precision audit remains open beyond these measured cases.

LIST element entry splits pending arithmetic across the two LCD lines, with
a cursor after the operator. Invalid elements such as `1÷0` report `Error 2`.
Generic scalar functions such as `sin L1` report `Error 1`, while list squaring
remains available. Sorting, cumulative totals, adjacent differences and
augmentation have independently observed numerical reference checkpoints in
`tests/reference/el506ts/experiments/vector-limits-native.json`.

LIST STO copies the working buffer into L1-L4; editing a CHK copy does not
replace its stored slot. Combined conversion fills matA columns, while separate
conversion fills the corresponding matrix slots. ON/C and power cycling retain
LIST storage; CA, MEM clearing, RESET, HOME and mode changes clear it. MEM clearing
keeps LIST mode, whereas RESET and HOME restore NORMAL. Independent reference
traces and validation are consolidated in
`tests/reference/el506ts/list-memory-review.json`.

The LIST exposure inventory is consolidated in
`tests/reference/el506ts/list-inventory.json`: every independently captured LIST
menu page and all 48 physical key positions with their complete modifier legends.
This inventory records exposure; the separate modifier-by-mode and value-type
audits determine availability and behavior. Menu labels alone do not establish
calculator parity.

NORMAL errors occupy the upper LCD line with an empty lower line. The native
calculation-buffer boundary accepts 24 nested sine functions; 25 produce Error 3.
RIGHT returns to the retained fault area, and DEL removes one function while
preserving its operand. The recovered result is `6.383145827×10⁻⁴³`; very small
nonzero angles are preserved instead of being mistaken for an exact quadrant.
Other error cursor and recovery combinations remain under the final audit.

The native error catalogue now includes independently observed Error 1 through
Error 10 triggers. Formula recall respects the 142-character expression budget;
a full expression cannot accept ENT or a formula-store marker. A failed shared
formula-memory store reports Error 6 and preserves the old slots. The retained
reference distinguishes these cases from exhaustive cross-mode error recovery.

Final native audit updates match measured NORMAL error arrows: buffer/length
faults select the fault cell, division and formula-memory errors restore end
insertion, and measured syntax errors retain the entered operand and parser
failure position. Physical expressions display uppercase `ANS` and negative
scientific operands in parentheses. Signed `1e-99` values remain nonzero; values
below that magnitude normalize to zero. Signed `9.999999999e99` values are
accepted and doubling either gives Error 2. Broader cross-mode recovery,
precision and final parity/release gates remain tracked in `update-plan.md`.

The final error-navigation audit now includes all ten measured error-code recovery
paths. Both arrows clear unavailable binary formula recalls to an empty cursor;
matrix size faults return to the retained expression end, and undefined matrix
slots select their first character. Matrix augmentation displays both operands.
The manual persistence matrix verifies 72 transitions across all six modes,
including ON/C, CA, OFF/ON, MEM, RESET, HOME and each mode selection. Its source
policy and store coverage are recorded in `persistence-matrix-review.json`.
These checks do not remove the remaining precision, compatibility and release gates.

Physical capacity checks now run before each mode's calculation handler. Expressions
allow 142 calculator characters including ENT, with 24 pending calculation
instructions, ten pending values in NORMAL and five in other modes. Matrix/list
DATA definitions allow one pending value. The observed MAT overflow recovery
selects the sixth plus with either arrow and leaves the lower display empty.
Playback uses a shared 142-character budget and evicts complete oldest equations;
the four formula slots share 256 characters. The manual and native evidence,
including STAT, matrix and list capacities, is recorded in `capacity-review.json`.

Physical CPLX arithmetic now matches the measured real/imaginary cancellation
and scaled intermediate probes. `1E13 + 1 - 1E13` returns zero, and
`1 / 3 * 1E13 - 3333333333E3` returns `333.3`. The independent trace and selected
component arithmetic policy are recorded in `complex-precision-review.json`.
The complete precision audit across all result types remains open.
