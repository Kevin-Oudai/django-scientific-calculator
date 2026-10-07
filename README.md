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

For future stable installs, prefer a version tag after that tag exists:

```text
django-scientific-calculator @ git+ssh://git@github.com/Kevin-Oudai/django-scientific-calculator.git@v0.3.1
```

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
identify ALPHA functions. Primary, yellow, and green key labels use 12px text;
green ALPHA legends sit at the bottom-right. The 2nd F and ALPHA buttons
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
focus. Cursor blinking follows the full-manual exception to the simulator's
stationary cursor and is disabled by `prefers-reduced-motion`. Forced colors
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
together. State snapshots use schema 6 with the legacy profile; older schemas migrate in memory.

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
