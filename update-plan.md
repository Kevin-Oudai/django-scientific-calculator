# EL-506TS Behavior Parity Update Plan

- Plan version: 1.2
- Plan status: Active
- Current package baseline: 0.3.1
- Target release: 1.0.0 after verified parity
- Next item: EL506-005
- Last updated: 2026-10-05

## Purpose

This is the controlling implementation plan for turning the reusable Django
scientific calculator into an educational calculator whose user-visible
behavior matches the Sharp EL-506TS.

Parity means that, from the same initial state, the same physical-key sequence
must produce the same:

- upper and lower display content;
- cursor position and scrolling;
- mode and status indicators;
- prompts, menus, and result-page order;
- numerical or exact result;
- memory, history, dataset, matrix, and list changes;
- error message, error position, and recovery behavior.

These comparisons use the applicable reference under **Reference Order**,
including the six documented simulator exceptions. Random outputs are compared
by their required range and state semantics, not by an identical random stream,
unless repeatability is established under EL506-144.

The target is behavioral compatibility for teaching. It is not permission to
copy Sharp logos, product names, artwork, manual illustrations, simulator
assets, or other protected branding into the distributed package.

## Decisions Already Made

1. The pinned official Sharp EL-506TS simulator is the primary behavioral
   oracle.
2. The official simulator outranks written examples except for the six
   simulator-specific differences declared in its bundled ReadMe. For those
   differences, the full manual or a physical EL-506TS defines parity.
3. The calculator will retain the physical key positions and functional labels
   needed to teach EL-506TS sequences.
4. The distributed default will use an original, dark visual theme without
   Sharp branding.
5. Theme colors, typography, surfaces, and safe brand text will be
   customizable. A documented override stylesheet will be shipped.
6. The existing no-argument Django template tag and static asset entry paths
   will remain compatible. Optional configuration may be added without
   invalidating existing integrations.
7. A compatibility break is permitted only when necessary to fix a documented
   security problem. It must include a migration note and an appropriate major
   version change.
8. Only open-source, locally shipped dependencies may be used. No paid API,
   hosted calculator service, CDN, telemetry, or required network connection
   may be introduced.
9. Math.js will be a numerical engine, not the calculator behavior model.
10. The browser will perform calculations locally. Django will continue to
    provide packaging, template integration, and configuration rather than a
    calculation API.
11. Current enhanced behaviors that the simulator does not have, such as
    additional exact-surd presentation, may remain only as an explicitly
    selected enhancement profile. The default parity profile must match the
    simulator.

## Reference Order

Use sources in this order:

1. The exact Sharp EL-506TS simulator build owned by the user, except for the
   six documented simulator differences in the pinned profile. For those
   differences, the full manual or a physical EL-506TS takes precedence.
2. Sharp's full EL-506TS operation manual and official specification.
3. The 44-page local OperationGuide_EL506TS.pdf.
4. Existing application behavior, tests, and documentation.
5. Conventional mathematical behavior.

Record every disagreement in the parity ledger. Never silently choose the
result that is mathematically preferable when the simulator behaves
differently.

Official references:

- Sharp EL-506TS product specification:
  https://global.sharp/products/calculators/sc_calculator/el-506ts/index.html
- Sharp EL-506TS operation guide:
  https://global.sharp/contents/calculator/support/guidebook/documents/OperationGuide_EL506TS.pdf
- Sharp PC simulator software listing:
  https://www.sharp-calculators.com/support/software/
- Math.js expression documentation:
  https://mathjs.org/docs/expressions/
- Math.js security guidance:
  https://mathjs.org/docs/expressions/security.html

The local PDF is a user-provided, untracked reference file. Do not stage or
publish it unless the user explicitly asks and confirms redistribution rights.

The pinned simulator identity, hashes, launch/reset procedure, environment,
automation surface, baseline display, and known simulator limitations are in
`tests/reference/el506ts/simulator-profile.json`. It intentionally contains no
Sharp executable, ReadMe, panel art, or captured image.

### Operation Guide Traceability Anchors

| Guide pages | Behavior families |
| --- | --- |
| 4-7 | Physical key map, six modes, reset, display indicators, display formats, exponent display, and angle units |
| 8-11 | Power, clearing, cursor editing, playback, data entry, random functions, and MDF |
| 12-23 | Arithmetic, percent, powers, roots, logs, factorial, permutations, combinations, DMS, fractions, memories, ANS, and formula memories |
| 24-29 | Trigonometry, inverse and hyperbolic functions, and coordinate conversion |
| 30 | Binary, pental, octal, decimal, hexadecimal, and logical operations |
| 31-33 | Numerical differentiation, numerical integration, and ALGB simulation |
| 34-39 | One- and two-variable statistics, weighted input, correction, browsing, and results |
| 40 | Simultaneous-equation workflow |
| 41 | Complex-number workflow and rectangular/polar paging |
| 42-43 | Matrix entry, storage, calculation, and cell paging |
| 4 only | LIST mode is named but its detailed behavior is absent |
| Not covered | The full constant catalogue, conversion catalogue, generic solver details, complete matrix/list menus, capacities, and most error rules must come from the simulator and full manual |

## Existing Public Contract

The following integration points must remain operational:

- Python package name: django-scientific-calculator
- Django app name: scientific_calculator
- Template tag library: scientific_calculator
- Existing tag call: {% scientific_calculator %}
- Template path: scientific_calculator/calculator.html
- Stylesheet path: scientific_calculator/calculator.css
- Script path: scientific_calculator/calculator.js
- Root selector: [data-scientific-calculator]
- No required models, migrations, URLs, database, or server-side calculator API
- Keyboard handling scoped to the focused calculator

Additive configuration is allowed. Existing pages using the integration above
must still render and operate after an upgrade.

## Current Baseline

Version 0.3.1 currently provides a useful partial calculator:

- basic arithmetic, parentheses, powers, roots, logarithms, and trigonometry;
- a custom decimal parser and a second exact-value parser;
- selected exact fractions, surds, and degree-mode trigonometric results;
- a partial 2ndF layer;
- editable fraction templates and DMS entry;
- ANS, one M memory, history, cursor movement, and basic statistics;
- desktop Chromium Playwright coverage.

Known structural gaps:

- Math.js is not currently installed or bundled.
- The approximately 1,900-line calculator script combines parsing, state,
  display rendering, and DOM behavior.
- There is no pure calculator-core unit test suite.
- There are no Django integration tests or continuous-integration workflow.
- Playwright currently covers a desktop Chromium scenario only.
- The current keys, menus, state rules, and display do not yet match the
  EL-506TS completely.
- There is no documented theme or branding override contract.
- There is no third-party dependency notice file.

## How Every Future Update Must Use This Plan

When the user asks to update the calculator without naming a specific item:

1. Read this entire file.
2. Check the worktree and preserve unrelated or user-owned changes.
3. Select only the item named by **Next item**.
4. If its prerequisite is incomplete, work on the prerequisite instead and
   update **Next item** accordingly.
5. Use the Sharp simulator before implementation to capture the reference
   behavior for that item.
6. Implement only that item and the tests, documentation, and compatibility
   work required to finish it.
7. Do not begin a second roadmap item in the same update.
8. Run the completion gates below.
9. Leave the item unchecked and **Next item** pointing to it. Add a
   READY_TO_PUSH note after local verification passes.
10. Commit only the intended implementation and evidence files, including the
    plan note, push to origin/main, and verify that the remote contains that
    implementation commit.
11. In a separate tracking commit, mark the item complete, record the already
    known implementation SHA, and advance **Next item** using the dependency
    order below. Push and verify the tracking commit before starting another
    item or reporting the update complete.

If the user explicitly requests a later item, verify its dependencies first.
Do not implement a feature on an unverified foundation.

Research and test-infrastructure items count as one update even when they do
not visibly change the calculator.

## Item Status and Completion Records

- [ ] means incomplete.
- [x] means the implementation and evidence commit has passed its applicable
  gates, been pushed to origin/main, and been verified there. Publication of
  the separate tracking commit is also required to finish the update.
- BLOCKED means work cannot continue without missing evidence or authority.
- Only one item may be actively implemented at a time.

When completing an item, add an indented record directly below it:

    Completed: YYYY-MM-DD, implementation commit SHA
    Evidence: fixture IDs and simulator/manual references
    Verification: commands and relevant test counts
    Notes: deviations, migrations, or none

The recorded SHA identifies the implementation commit, never the commit
containing the completion record itself. No commit can contain its own SHA.

If the implementation push or remote verification fails, leave the item
unchecked with READY_TO_PUSH and keep **Next item** on that item. If publication
of the tracking commit fails, report that pending commit and publish and verify
it on the next update before following its advanced **Next item**. Do not claim
that local tracking changes are already on origin/main.

## Completion Gates for Every Item

An item is complete only when all applicable gates pass:

Apply gates to the item's scope and the infrastructure available at that point
in the dependency order. Reference and infrastructure items validate their
artifacts and run the existing regression suite; they do not require future
calculator features, themes, or test suites to exist. Record any inapplicable
gate and why. Once the relevant infrastructure exists, behavior changes must
use it; this does not waive any final release gate.

1. **Reference gate**
   - Record the simulator version, reset state, exact key IDs, significant
     display frames, indicators, prompts, result pages, retained state, and
     errors.
   - Add the evidence to the parity fixtures or reference ledger.

2. **Implementation gate**
   - Route all pointer, touch, and keyboard interactions through the canonical
     physical-key event path.
   - Do not create a UI-only shortcut that bypasses EL-506TS sequencing.
   - Keep numerical values separate from display strings.

3. **Test gate**
   - Add pure unit tests for state and calculations.
   - Add simulator-derived golden sequence tests.
   - Add or update browser tests for user interaction and display.
   - Add a regression test for every bug discovered while implementing the
     item.

4. **Compatibility gate**
   - Verify the existing Django tag and static paths.
   - Verify at least two calculator instances remain isolated when relevant.
   - Preserve existing integrations unless the security exception applies.

5. **Quality gate**
   - Verify keyboard, pointer, and touch behavior where applicable.
   - Verify the dark default theme and the override theme.
   - Verify accessibility names, focus behavior, contrast, and reduced-motion
     behavior for UI changes.
   - Verify no unexpected browser console errors or network requests.

6. **Repository gate**
   - Update README.md when behavior, integration, dependency, or release
     instructions change.
   - Keep pyproject.toml and scientific_calculator/__init__.py versions in
     sync when a release version changes.
   - Run git diff --check.
   - Run python -m compileall src/scientific_calculator.
   - Run python -m pip install --dry-run --no-deps .
   - Run docker compose config.
   - Run the JavaScript unit suite and npm test.
   - Run the Docker demo when Docker Desktop is available.

7. **Publication gate**
   - Never use git add -A or stage unrelated files.
   - Never force-push.
   - Push the tested implementation commit to origin/main and verify that the
     remote contains it before recording completion.
   - Push the separate tracking commit and verify that the remote contains it
     before beginning another item or reporting the update complete.

Pushing main updates the canonical source. Existing installed copies still
require their normal reinstall, static collection, and deployment process.
Never claim that a remote push changed an already deployed copy without
verifying that deployment.

## Simulator Evidence Format

Every golden fixture must identify:

- fixture ID and roadmap item;
- simulator product name, build/version, locale, and operating system;
- initial reset state and setup values;
- ordered canonical physical-key IDs;
- upper display after significant keys;
- lower display after significant keys;
- active indicators and scroll arrows;
- cursor, insert mode, prompt, or selected result component;
- exact stored values affected;
- expected error and recovery sequence;
- source page when the operation guide contains the example;
- capture date and any unresolved ambiguity.

Store facts and independently created transcripts. Do not redistribute Sharp
simulator binaries, screenshots, manuals, logos, or extracted artwork.

## Target Architecture

The final implementation will use these boundaries:

1. **Physical key map**
   - One stable key ID per physical position.
   - Base, 2ndF, ALPHA, HYP, menu, and mode meanings are declarative layers.

2. **Calculator state machine**
   - Owns power, mode, submode, modifiers, prompts, menus, cursor, history,
     entry lifecycle, memories, datasets, matrices, lists, and result paging.

3. **Semantic token editor and AST**
   - Represents calculator operations rather than rendered text or arbitrary
     Math.js source.

4. **Typed value layer**
   - Supports scalar, exact rational, DMS, complex, fixed-width N-base integer,
     statistical dataset, equation result set, matrix, and list values.

5. **Evaluation adapters**
   - Use a pinned, locally bundled Math.js build for compatible numerical
     primitives.
   - Use custom adapters where Sharp behavior, precision, algorithms, or
     workflows differ.
   - Never evaluate arbitrary HTML, JavaScript, or unrestricted user strings.

6. **Sharp-compatible formatter**
   - Owns digit limits, rounding, NORM/FIX/SCI/ENG, exact views, indicators,
     prompts, errors, and multi-page results.

7. **DOM adapter**
   - Renders state and converts all supported input methods into canonical key
     events.
   - Supports multiple independent calculator instances.

8. **Django integration**
   - Keeps the current no-argument tag.
   - Adds only optional, safely escaped configuration.
   - Ships all assets locally inside the reusable package.

9. **Theme and branding**
   - Keeps geometry and educational key labels stable.
   - Uses CSS custom properties for colors, fonts, spacing, borders, glow, and
     display appearance.
   - Ships a dark original default and a documented
     calculator-theme.example.css override file.
   - Supports safe consumer brand text or a Django template override.
   - Does not ship Sharp logos or claim affiliation.

## Ordered Roadmap

Complete these items in order unless a dependency recorded by an earlier item
requires the order to change.

### Bootstrap Dependency Order

The following order takes precedence over the phase layout and numeric IDs:

`EL506-000 -> EL506-013 -> EL506-002 -> EL506-001 -> EL506-005 -> EL506-010 ->
EL506-014 -> EL506-019 -> EL506-003 -> EL506-004 -> EL506-006`

EL506-000 is already complete, so EL506-013 is next. Stable physical-key IDs
must exist before the experiment schema and capability ledger use them. Capture
the 0.3.1 baseline before refactoring its behavior. Unit testing, the reducer,
and observable state snapshots must exist before the golden runner can exercise
the application. The guide fixtures and coverage report then use that runner.
After this chain, resume the remaining incomplete items in phase order,
starting with EL506-011; skip items already completed through this chain.

During bootstrap, EL506-014 and EL506-019 cover all currently implemented state
and define contracts that later feature items extend. EL506-003 must replay and
assert supported baseline sequences through those contracts; unsupported
capabilities remain explicitly pending and must not count as passing parity.
The runner's completion does not require implementing the later feature phases.

### Phase 0 - Reference and Traceability

- [x] **EL506-000 - Pin the reference simulator.** Record its executable or
  launch method, official source, exact version/build, locale, model variant,
  display scaling, default state, reset procedure, and a reproducible session
  setup.
    Completed: 2026-09-07, commit 1a7bc12da9220c87bb857c4f35cd25baa73e732c
    Evidence: `tests/reference/el506ts/simulator-profile.json`; official Sharp
    software listing and ZIP; bundled ReadMe release 1.0; runtime build
    1.0.2.0; repeated simulator Reset captures and MODE probe.
    Verification: JSON parse and required-field assertions; Python compileall;
    Docker Compose configuration; Playwright 12/12 passed; git diff --check.
    Notes: local files match the official ZIP by SHA-256. Simulator binaries,
    documentation, assets, and captures remain local and untracked. The six
    Sharp-documented simulator/device differences are explicit oracle
    exceptions.
- [x] **EL506-001 - Create the 470-capability ledger.** Inventory every
  physical key, base action, 2ndF action, ALPHA action, mode/submode action,
  SET UP choice, MATH menu entry, constant, conversion, statistic, regression,
  solver, matrix function, and list function exposed by the simulator.
    Completed: 2026-10-05, implementation commit
    9b94ee717ac2f9038b05addb8831a3633d8afccb
    Evidence: Ledger contains 430 stable inventory IDs,
    all 48 physical positions and visible layers, observed mode/submode and
    menu selections, 52 constants, 44 conversion directions, named statistics,
    memories, solver, matrix and list operations. Live
    `el506-001-menu-inventory-v1`: 119 physical clicks, 70 significant frames;
    pinned runtime 1.0.2.0/hash verified; fresh chrome Reset; CNST 01 and
    CONV 01 results; Error 2/recovery; cancelled memory/reset confirmations.
    Full English manual linked from Sharp Australia supplies unexecuted
    catalogue names; only independent text and fingerprints are committed.
    Scope note: 470 is the manufacturer's aggregate, not this ledger's count
    of semantic/context entries. Its unpublished counting correspondence is
    explicitly unresolved for EL506-364; no synthetic entries added. Formula
    modifier semantics, capacities, all-mode dispatch, precision and numeric
    parity remain owned by their later roadmap items. Implementation status is
    unassessed pending EL506-005; parity test statuses are independently pending.
    Verification: offline experiment/ledger validation; npm.cmd test 21/21;
    compileall; pip dry run (0.3.1); Docker Compose config; Docker demo rebuild;
    demo HTTP 200; git diff --check. Final ledger validation changes also passed
    the targeted 3/3 inventory tests.
    Inapplicable: future pure-core/golden runner, dispatch refactor, multiple
    embeds, touch, theme and accessibility gates; this item changes reference
    inventory only and runs the existing browser regressions.
- [x] **EL506-002 - Create the simulator experiment schema.** Define the
  evidence fields above and a stable canonical notation for physical key
  sequences.
    Completed: 2026-10-05, implementation commit
    145797e4f26990e702f91246dd52616a39594a61
    Versioned draft-07 experiment schema, canonical
    physical-key sequence notation, offline structural/cross-reference validator,
    and live `el506-002-error-recovery-v1` transcript prepared.
    Evidence: pinned runtime build 1.0.2.0 and matching SHA-256; fresh simulator
    chrome Reset; five physical keys for 1 / 0 = and ON/C; Error 2 and recovery
    frames. Source page inapplicable: no manual example used. Stores unmeasured.
    Verification: npm.cmd test 18/18 (12 calculator, 3 catalogue, 3 schema tests),
    including automatic test:reference validation; compileall; pip dry run;
    Docker Compose config; docker compose up --build -d; demo HTTP 200;
    git diff --check. Ajv 8.20.0 is pinned as a development-only dependency.
    Notes: schema validation proves completeness, not application parity.
    Core unit/golden suites, runtime dispatch, multi-embed, touch, theme and
    accessibility changes are inapplicable to this evidence-only bootstrap item;
    their infrastructure/implementation remains scheduled in later items.
- [ ] **EL506-003 - Create the golden fixture format and runner.** Fixtures
  must drive canonical key IDs and assert displays, indicators, prompts,
  result pages, state mutations, and errors.
- [ ] **EL506-004 - Capture all 44-page guide examples.** Convert every worked
  sequence in the operation guide into reference fixtures, preserving printed
  values and noting any guide/simulator disagreement.
- [ ] **EL506-005 - Capture the version 0.3.1 baseline.** Classify every
  existing feature and test as matching, partial, enhanced-only, incorrect, or
  missing. Record the source revision before EL506-014 refactors the baseline.
- [ ] **EL506-006 - Add a generated parity report.** Report documented,
  simulator-observed, implemented, unit-tested, golden-tested, and
  browser-tested status independently for every ledger entry.

### Phase 1 - Test and Emulator Foundation

- [ ] **EL506-010 - Add pure JavaScript unit testing.** Use an open-source,
  deterministic runner that can test the calculator core without a browser.
- [ ] **EL506-011 - Add Django integration tests.** Verify the template tag,
  template rendering, packaged static assets, escaping, and multiple embeds.
- [ ] **EL506-012 - Add continuous integration.** Run Python checks,
  JavaScript unit tests, Playwright, packaging checks, and dependency/license
  checks without secrets or paid services.
- [x] **EL506-013 - Define canonical physical key IDs.** Keep IDs independent
  of current label, mode, theme, DOM selector, or translated expression. Execute
  before EL506-002 and EL506-001 as specified in the bootstrap order.
    Completed: 2026-10-05, implementation commit
    3d4d486c2bf6ca5a27e2c0533db7e106f0c79239
    Live reference gate passed against pinned build
    1.0.2.0: all 48 panel positions compared, eleven representative physical
    inputs transcribed, and Reset capture SHA-256 matched the pinned baseline.
    Evidence: `el506-013-key-panel-v1` in
    `tests/reference/el506ts/physical-key-reference.json`; guide page 4.
    Verification: npm.cmd test 15/15 (12 calculator regressions, 3 catalogue
    checks); compileall; pip install --dry-run --no-deps .; docker compose config;
    docker compose up --build -d; demo HTTP 200; isolated wheel/sdist build and
    catalogue-content assertions; git diff --check.
    Validation recovery: first test run overlapped the demo rebuild and had
    three connection failures; stable-container rerun passed. Non-isolated
    build lacked setuptools; normal isolated build passed.
    Notes: reference catalogue only; runtime dispatch, function layers, themes,
    pure-core unit suite and golden runner belong to later bootstrap items.
    Existing prepared catalogue, packaging, tests and plan changes preserved.
- [ ] **EL506-014 - Extract a deterministic state reducer.** Move calculator
  behavior out of DOM handlers while preserving existing tested behavior.
- [ ] **EL506-015 - Model entry lifecycle states.** Cover empty, entering,
  editing, evaluated, prompt, menu, data entry, multi-result, and error states.
- [ ] **EL506-016 - Implement modifier and menu layers.** Support base, 2ndF,
  ALPHA, HYP, MODE, SET UP, MATH, STO, RCL, and other waiting-for-selection
  states without string replacement.
- [ ] **EL506-017 - Add the semantic token editor and AST.** Separate
  calculator intent, cursor structure, and implied operations from display
  text.
- [ ] **EL506-018 - Add typed calculator values.** Preserve scalar, rational,
  DMS, complex, N-base, statistics, equation, matrix, and list types across
  evaluation and display conversion.
- [ ] **EL506-019 - Add full state snapshot and restore.** Include all stores,
  settings, prompts, cursors, result pages, and modifiers for history and
  deterministic tests.
- [ ] **EL506-020 - Integrate a pinned local Math.js build.** Bundle it with
  the package, record its version and license notices, expose only an
  allowlisted evaluator adapter, and require no CDN.
- [ ] **EL506-021 - Establish the numerical compatibility model.** Measure
  simulator precision, exponent range, rounding ties, overflow, underflow,
  negative zero, and intermediate precision before selecting Number,
  BigNumber, Fraction, or custom quantization per value type.
- [ ] **EL506-022 - Split the browser adapter from the core.** Keep the
  existing calculator.js asset as the compatible entry point while making
  state, parsing, evaluation, formatting, and DOM responsibilities testable.
- [ ] **EL506-023 - Guarantee independent embeds.** Eliminate shared mutable
  state and verify two or more calculators on one page.

### Phase 2 - Physical Layout, Display, Theme, and Access

- [ ] **EL506-030 - Reproduce physical key positions.** Match the EL-506TS
  instructional layout and key grouping without importing Sharp artwork.
- [ ] **EL506-031 - Reproduce functional labels.** Add verified primary,
  orange 2ndF, and green ALPHA legends at their teaching positions.
- [ ] **EL506-032 - Build the two-line LCD model.** Give the upper equation
  and lower result lines independent content, alignment, clipping, and
  horizontal scrolling.
- [ ] **EL506-033 - Implement all display indicators.** Include 2ndF, HYP,
  ALPHA, FIX, SCI, ENG, DEG, RAD, GRAD, CPLX, MAT, LIST, STAT, M, base,
  hidden-content arrows, and component indicators.
- [ ] **EL506-034 - Implement display cursor and insert marker.** Match
  simulator positions, selection, and horizontal follow. Use the full manual
  or physical device for blinking; the simulator's non-blinking cursor is a
  documented exception.
- [ ] **EL506-035 - Implement multi-result paging UI.** Support coordinate
  pairs, complex components, equation solutions, matrix cells, and list
  elements without recalculation.
- [ ] **EL506-036 - Create the dark default theme.** Use an original,
  high-contrast, Sharp-familiar but unbranded visual treatment.
- [ ] **EL506-037 - Add the theme override contract.** Ship documented CSS
  custom properties and calculator-theme.example.css without changing key
  geometry or semantics.
- [ ] **EL506-038 - Add safe branding customization.** Keep the existing tag
  valid while allowing safely escaped brand text and documented template
  override hooks.
- [ ] **EL506-039 - Add responsive layouts.** Preserve exact key order and
  sequencing on desktop, tablet, and phone without hiding controls.
- [ ] **EL506-040 - Add accessible key semantics.** Expose primary and shifted
  purposes, state changes, display updates, and errors to assistive
  technologies.
- [ ] **EL506-041 - Unify pointer, touch, and keyboard dispatch.** All input
  methods must emit the same canonical key events and support verified
  two-key rollover where applicable.
- [ ] **EL506-042 - Add visual regression coverage.** Cover the default dark
  theme, example override theme, focus, modifiers, menus, errors, long
  expressions, and responsive sizes.
- [ ] **EL506-043 - Complete pre-release trade-dress review.** Confirm the
  distributed appearance and wording remain educationally compatible without
  Sharp logos, false affiliation, copied assets, or unnecessary ornamental
  duplication. Record that this is a release gate, not legal advice.

### Phase 3 - Power, Modes, Clear, Editing, and History

- [ ] **EL506-050 - Implement ON/C power-on and wake behavior.**
- [ ] **EL506-051 - Implement 2ndF plus ON/C power-off behavior.**
- [ ] **EL506-052 - Implement auto-power-off and power-cycle persistence.**
- [ ] **EL506-053 - Implement all six modes.** NORMAL, STAT, EQN, CPLX, MAT,
  and LIST must use the exact MODE selection sequence and indicators.
- [ ] **EL506-054 - Implement mode submenus.** Match numeric selection,
  defaults, cancellation, invalid selection, and retained state.
- [ ] **EL506-055 - Implement HOME.** Return to NORMAL and preserve or clear
  each store exactly as the simulator does.
- [ ] **EL506-056 - Implement ON/C command clearing.** Clear the display and
  pending command while preserving statistics and memories as verified.
- [ ] **EL506-057 - Implement internal clear/CA.** Clear ANS, statistics, and
  other internal values while honoring the simulator's M-memory exception.
- [ ] **EL506-058 - Implement reset-switch behavior.** Restore initial
  settings and erase all stored data.
- [ ] **EL506-059 - Implement modifier-latch rules.** Capture activation,
  indicator, one-shot lifetime, chaining, cancellation, and invalid-key
  behavior for 2ndF, ALPHA, and HYP.
- [ ] **EL506-060 - Implement left/right structured cursor movement.**
- [ ] **EL506-061 - Implement DEL at all token and template boundaries.**
- [ ] **EL506-062 - Implement INS and insert/overwrite lifetime.**
- [ ] **EL506-063 - Implement Multi-Line Playback.** Match up/down ordering,
  boundaries, arrows, capacity, and draft restoration.
- [ ] **EL506-064 - Implement recalled-expression editing and reevaluation.**
- [ ] **EL506-065 - Implement post-result key rules.** Determine which keys
  start fresh, continue from ANS, transform the result, or repeat a command.
- [ ] **EL506-066 - Match entry capacities.** Cover maximum input length,
  nesting, history size, visible width, scroll behavior, and full-buffer
  errors.

### Phase 4 - Display Settings and Formatting

- [ ] **EL506-070 - Implement the complete SET UP menu flow.**
- [ ] **EL506-071 - Implement NORM1 and exact boundary behavior.**
- [ ] **EL506-072 - Implement NORM2 and exact boundary behavior.**
- [ ] **EL506-073 - Implement FIX and TAB decimal-place selection.**
- [ ] **EL506-074 - Implement SCI significant-digit selection.**
- [ ] **EL506-075 - Implement ENG formatting and exponent steps of three.**
- [ ] **EL506-076 - Match the ten-digit mantissa and two-digit exponent.**
- [ ] **EL506-077 - Match three-digit punctuation and regional behavior.**
- [ ] **EL506-078 - Match zeros, decimal points, signs, and trailing-zero
  presentation in entry and results.**
- [ ] **EL506-079 - Implement MDF/Modify.** Commit the rounded displayed value
  to internal state and reproduce chained-result differences.
- [ ] **EL506-080 - Format every typed result.** Add dedicated formatting for
  rational, DMS, complex, N-base, statistics, equation, matrix, and list
  values.

### Phase 5 - NORMAL Entry and Arithmetic

- [ ] **EL506-090 - Match digit and decimal-point entry.**
- [ ] **EL506-091 - Match Exp scientific-literal entry.** Cover mantissa,
  exponent, cursor editing, sign change, and malformed input.
- [ ] **EL506-092 - Match pi and directly accessible constants.**
- [ ] **EL506-093 - Distinguish sign-change/NEG from subtraction.**
- [ ] **EL506-094 - Match addition, subtraction, multiplication, and
  division.**
- [ ] **EL506-095 - Match parentheses, precedence, associativity, and nested
  expressions.**
- [ ] **EL506-096 - Match implied multiplication and automatic closing rules.**
- [ ] **EL506-097 - Match equals and repeated-equals behavior.**
- [ ] **EL506-098 - Match Sharp constant calculations.** Include omitted
  operands, repeated operations, and any K indicator.
- [ ] **EL506-099 - Match chained calculations and ANS continuation.**
- [ ] **EL506-100 - Match contextual percent.** Cover increase, decrease,
  percentage-of, and reverse-percentage sequences, including whether percent
  itself evaluates.
- [ ] **EL506-101 - Match reciprocal.**
- [ ] **EL506-102 - Match square and cube postfix operations.**
- [ ] **EL506-103 - Match general power entry and evaluation.**
- [ ] **EL506-104 - Match square root, cube root, and nth-root sequencing.**
- [ ] **EL506-105 - Match common logarithm and 10^x.**
- [ ] **EL506-106 - Match natural logarithm and e^x.**
- [ ] **EL506-107 - Inventory and match additional NORMAL MATH-menu scalar
  functions.**
- [ ] **EL506-108 - Match factorial.**
- [ ] **EL506-109 - Match permutations.**
- [ ] **EL506-110 - Match combinations.**
- [ ] **EL506-111 - Match domains and boundaries for every NORMAL function.**

### Phase 6 - Angles, Trigonometry, Fractions, DMS, and Coordinates

- [ ] **EL506-120 - Match DEG, RAD, and GRAD setup selection.**
- [ ] **EL506-121 - Match DRG cyclic value conversion and indicator changes.**
- [ ] **EL506-122 - Match sine, cosine, and tangent.**
- [ ] **EL506-123 - Match inverse sine, cosine, and tangent.**
- [ ] **EL506-124 - Match hyperbolic sine, cosine, and tangent.**
- [ ] **EL506-125 - Match inverse hyperbolic functions.**
- [ ] **EL506-126 - Match trig singularities, large angles, inverse domains,
  and mode-dependent rounding.**
- [ ] **EL506-127 - Match fraction-entry grammar.** Cover simple, mixed,
  negative, nested, and in-expression fractions.
- [ ] **EL506-128 - Match exact rational arithmetic and simplification.**
- [ ] **EL506-129 - Match fraction/decimal display toggling without losing the
  exact value.**
- [ ] **EL506-130 - Match mixed/improper fraction toggling and restoration.**
- [ ] **EL506-131 - Match fraction capacity, overflow, and decimal fallback.**
- [ ] **EL506-132 - Match DMS entry, validation, normalization, and carry.**
- [ ] **EL506-133 - Match reversible DMS/decimal display conversion.**
- [ ] **EL506-134 - Match DMS arithmetic, signs, and angle-mode interaction.**
- [ ] **EL506-135 - Match rectangular-to-polar conversion.**
- [ ] **EL506-136 - Match polar-to-rectangular conversion.**
- [ ] **EL506-137 - Match pair separator, component paging, quadrants, signs,
  and active angle-unit behavior.**

### Phase 7 - Random Numbers, Constants, and Unit Conversions

- [ ] **EL506-140 - Match random decimal generation.** Verify range
  0.000-0.999, three-decimal display, repeat command, and state effects.
- [ ] **EL506-141 - Match Random Dice generation and repeat sequencing.**
- [ ] **EL506-142 - Match Random Coin generation and repeat sequencing.**
- [ ] **EL506-143 - Match Random Integer generation and repeat sequencing.**
- [ ] **EL506-144 - Add random property tests.** Test range and distribution
  without requiring the same random stream unless the simulator proves it is
  deterministic and reproducible.
- [ ] **EL506-145 - Match physical-constant menu navigation.**
- [ ] **EL506-146 - Match all 52 physical constants.** Record simulator
  identifier, value, units, significant digits, valid modes, and historical
  constant set rather than silently substituting current CODATA values.
- [ ] **EL506-147 - Match metric-conversion menu navigation.**
- [ ] **EL506-148 - Match all 44 metric conversions.** Verify both directions,
  labels, units, rounding, modes, and errors.
- [ ] **EL506-149 - Match constants and conversions inside expressions,
  memories, and every permitted mode.**

### Phase 8 - Memories, Formula Memories, Simulation, and Solver

- [ ] **EL506-160 - Implement temporary memories A-F, X, and Y.**
- [ ] **EL506-161 - Match STO selection, overwrite, cancellation, and display.**
- [ ] **EL506-162 - Match RCL selection and recalled-value insertion.**
- [ ] **EL506-163 - Match independent memory M, M+, and M-.**
- [ ] **EL506-164 - Match the M display indicator.**
- [ ] **EL506-165 - Match ANS updates and recall for every result type and
  mode.**
- [ ] **EL506-166 - Complete the memory persistence matrix.** Verify ON/C, CA,
  HOME, mode changes, power cycle, and reset for every store.
- [ ] **EL506-167 - Implement formula memories F1-F4 as token streams.**
- [ ] **EL506-168 - Match formula capacity, replacement, recall, editing,
  deletion, persistence, and late-bound variables.**
- [ ] **EL506-169 - Match ALGB/simulation variable discovery and prompt order.**
- [ ] **EL506-170 - Match simulation value entry and repeated runs.** Preserve
  previous prompted values exactly where the simulator does.
- [ ] **EL506-171 - Match simulation navigation, cancellation, errors, and
  retained inputs.**
- [ ] **EL506-172 - Discover and implement the advertised generic solver
  workflow.** Capture formula entry, target, initial estimate, prompts, result,
  and repeat sequence.
- [ ] **EL506-173 - Match solver numerical behavior.** Cover convergence,
  multiple roots, starting-value sensitivity, tolerance, iteration limit, and
  failure display.

### Phase 9 - N-base Operations

- [ ] **EL506-180 - Match DEC, BIN, PEN, OCT, and HEX selection and indicators.**
- [ ] **EL506-181 - Match base-specific digit entry.** Include hexadecimal
  A-F mapping and invalid digits.
- [ ] **EL506-182 - Match conversion of the displayed value among all five
  bases.**
- [ ] **EL506-183 - Match arithmetic and parentheses in every base.**
- [ ] **EL506-184 - Match N-base memory and ANS behavior.**
- [ ] **EL506-185 - Match AND and OR.**
- [ ] **EL506-186 - Match XOR and XNOR.**
- [ ] **EL506-187 - Match NOT and NEG.**
- [ ] **EL506-188 - Determine and match word width and signed representation.**
  Cover two's complement, leading digits, negative display, and cross-base
  interpretation.
- [ ] **EL506-189 - Match N-base limits and errors.** Cover fractions,
  overflow, range, invalid syntax, unavailable functions, and conversions.

### Phase 10 - Numerical Differentiation and Integration

- [ ] **EL506-200 - Match the differentiation template and cursor sequence.**
- [ ] **EL506-201 - Match derivative expression, variable, point, editing, and
  confirmation.**
- [ ] **EL506-202 - Match the simulator's numerical differentiation
  algorithm and displayed precision.**
- [ ] **EL506-203 - Match the integration template and cursor sequence.**
- [ ] **EL506-204 - Match integrand, bounds, variable, optional parameters,
  editing, and confirmation.**
- [ ] **EL506-205 - Match the simulator's numerical integration algorithm and
  displayed precision.**
- [ ] **EL506-206 - Match angle modes, constants, variables, and memories
  inside calculus expressions.**
- [ ] **EL506-207 - Match calculus cancellation and failures.** Cover
  discontinuity, singularity, non-convergence, time/resource limits, and exact
  error recovery.

### Phase 11 - Statistics Data Management

- [ ] **EL506-220 - Match the STAT menu.** Include SD plus LINE, QUAD, EXP,
  LOG, POWER, and INV selections and indicators.
- [ ] **EL506-221 - Match one-variable data entry.**
- [ ] **EL506-222 - Match frequency entry and weighted observations.**
- [ ] **EL506-223 - Match two-variable paired entry and separator behavior.**
- [ ] **EL506-224 - Resolve any regional/simulator claim of three-variable
  statistics.** Do not add it unless this exact EL-506TS simulator exposes it.
- [ ] **EL506-225 - Match dataset clear and persistence rules.**
- [ ] **EL506-226 - Match oldest-first and newest-first dataset browsing.**
- [ ] **EL506-227 - Match X, Y, F, sequence-number, and hidden-data displays.**
- [ ] **EL506-228 - Match single-field data correction and commit.**
- [ ] **EL506-229 - Match whole-record data correction.**
- [ ] **EL506-230 - Match record deletion and addition while browsing.**
- [ ] **EL506-231 - Match dataset capacity and errors.** Cover frequency
  limits, zero/negative frequency, partial records, and full-data behavior.

### Phase 12 - Statistics Results and Regressions

- [ ] **EL506-240 - Match one-variable mean.**
- [ ] **EL506-241 - Match sample standard deviation.**
- [ ] **EL506-242 - Match population standard deviation.**
- [ ] **EL506-243 - Match count, sum, and sum of squares.**
- [ ] **EL506-244 - Match two-variable X and Y means and deviations.**
- [ ] **EL506-245 - Match X/Y sums, squares, and sum of products.**
- [ ] **EL506-246 - Discover and match normal-probability functions exposed
  by the simulator.**
- [ ] **EL506-247 - Match linear regression y = a + bx.**
- [ ] **EL506-248 - Match quadratic regression y = a + bx + cx^2.**
- [ ] **EL506-249 - Match exponential regression y = ae^(bx).**
- [ ] **EL506-250 - Match logarithmic regression y = a + b ln(x).**
- [ ] **EL506-251 - Match power regression y = ax^b.**
- [ ] **EL506-252 - Match inverse regression y = a + b/x.**
- [ ] **EL506-253 - Match all regression coefficients, correlation values,
  and X-hat/Y-hat estimates.**
- [ ] **EL506-254 - Match regression domains and errors.** Cover transformed
  input restrictions, degeneracy, insufficient data, precision, and recovery.
- [ ] **EL506-255 - Reproduce every guide statistics result to the simulator's
  displayed precision.**

### Phase 13 - Equation Mode

- [ ] **EL506-260 - Match the EQN menu and coefficient-prompt controller.**
- [ ] **EL506-261 - Match two-variable simultaneous linear equations.**
- [ ] **EL506-262 - Match three-variable simultaneous linear equations.**
- [ ] **EL506-263 - Match quadratic equations.**
- [ ] **EL506-264 - Match cubic equations.**
- [ ] **EL506-265 - Match coefficient navigation, correction, defaults, and
  retained values.**
- [ ] **EL506-266 - Match solution paging, labels, ordering, and indicators.**
- [ ] **EL506-267 - Match degenerate equation cases.** Cover repeated and
  complex roots, zero leading coefficients, inconsistent/dependent systems,
  and ill-conditioned systems.
- [ ] **EL506-268 - Match EQN errors, recovery, HOME, mode exit, and
  persistence.**

### Phase 14 - Complex Mode

- [ ] **EL506-280 - Match CPLX entry and the i key sequence.**
- [ ] **EL506-281 - Match rectangular complex entry and editing.**
- [ ] **EL506-282 - Match complex arithmetic, parentheses, and supported
  powers.**
- [ ] **EL506-283 - Inventory and match every complex-compatible MATH
  function.** Include real, imaginary, conjugate, magnitude, or argument only
  when exposed by the simulator.
- [ ] **EL506-284 - Match rectangular/polar conversion and angle units.**
- [ ] **EL506-285 - Match component paging and indicators.**
- [ ] **EL506-286 - Match complex ANS and memory behavior.**
- [ ] **EL506-287 - Match complex branches, rounding, unavailable functions,
  divide-by-zero, errors, and recovery.**

### Phase 15 - Matrix Mode

- [ ] **EL506-300 - Discover and record matrix menus, slots, aliases, and
  maximum dimensions.**
- [ ] **EL506-301 - Match matrix dimension prompts.**
- [ ] **EL506-302 - Match row-major cell entry, labels, navigation,
  correction, and storage.**
- [ ] **EL506-303 - Match stored-matrix recall and display.**
- [ ] **EL506-304 - Match result dimensions and cell-by-cell paging.**
- [ ] **EL506-305 - Match matrix addition and subtraction.**
- [ ] **EL506-306 - Match matrix multiplication and scalar/matrix operations.**
- [ ] **EL506-307 - Match square, cube, and supported integer powers.**
- [ ] **EL506-308 - Match matrix inverse.**
- [ ] **EL506-309 - Match matrix transpose.**
- [ ] **EL506-310 - Inventory and match every additional matrix-menu
  operation.** Include determinant or cumulative operations only when exposed.
- [ ] **EL506-311 - Match matrix ANS, memory, copy, replacement, and
  persistence.**
- [ ] **EL506-312 - Match matrix limits and errors.** Cover dimension mismatch,
  non-square, singular, oversized, empty slot, and division restrictions.
- [ ] **EL506-313 - Reproduce the guide transition-matrix example including
  result paging.**

### Phase 16 - LIST Mode

The operation guide names LIST mode but does not document its behavior. Do not
guess any item in this phase; observe it in the reference simulator first.

- [ ] **EL506-320 - Inventory every LIST menu and shifted-key action.**
- [ ] **EL506-321 - Determine and match list slots, aliases, and capacity.**
- [ ] **EL506-322 - Match list length and element-entry prompts.**
- [ ] **EL506-323 - Match list navigation, correction, insertion, deletion,
  and replacement.**
- [ ] **EL506-324 - Match list recall and element-by-element result paging.**
- [ ] **EL506-325 - Match list/list arithmetic.**
- [ ] **EL506-326 - Match scalar/list arithmetic.**
- [ ] **EL506-327 - Match confirmed list aggregates.** Include sum, product,
  minimum, maximum, or mean only if exposed.
- [ ] **EL506-328 - Match confirmed vector-like list operations.** Include
  dot product, sorting, or cumulative operations only if exposed.
- [ ] **EL506-329 - Match LIST ANS, memory, copying, and persistence.**
- [ ] **EL506-330 - Match LIST limits and errors.** Cover mismatched lengths,
  capacity, empty slot, invalid element, and unsupported operations.

### Phase 17 - Errors, Limits, and Cross-mode Parity

- [ ] **EL506-350 - Build the complete simulator error catalogue.**
- [ ] **EL506-351 - Match error cursor placement and fault navigation.**
- [ ] **EL506-352 - Match error clearing and preserved expression/state.**
- [ ] **EL506-353 - Match scalar and exponent limits.**
- [ ] **EL506-354 - Match internal precision and rounding for every result
  type.**
- [ ] **EL506-355 - Match expression length and nesting limits.**
- [ ] **EL506-356 - Match history, formula, dataset, matrix, and list
  capacities.**
- [ ] **EL506-357 - Complete the state persistence matrix for every clear,
  reset, power, HOME, and mode transition.**
- [ ] **EL506-358 - Complete the modifier-by-key-by-mode compatibility
  matrix.**
- [ ] **EL506-359 - Complete the function-by-value-type compatibility
  matrix.**
- [ ] **EL506-360 - Add boundary and invalid-input tests for every ledger
  operation.**
- [ ] **EL506-361 - Add differential coverage for every capability-ledger
  entry.**
- [ ] **EL506-362 - Complete the full operation-guide regression suite.**
- [ ] **EL506-363 - Add property tests.** Cover arithmetic, fractions,
  conversions, statistics, equations, complex values, matrices, and lists.
- [ ] **EL506-364 - Complete the final simulator parity audit with no
  undocumented deviations.** Apply and verify the six documented simulator
  exceptions against the full manual or a physical device.

### Phase 18 - Security, Packaging, Compatibility, and Release

- [ ] **EL506-370 - Threat-model calculator input and embedding.** Cover
  keyboard text, Math.js scope, DOM output, configuration, CSS overrides, and
  hostile host pages.
- [ ] **EL506-371 - Lock down Math.js.** Allow only canonical AST operations,
  disable unnecessary parser/import functions, avoid eval-like behavior, and
  test malicious or oversized input.
- [ ] **EL506-372 - Add resource limits.** Bound expression size, computation
  cost, recursion, matrix/list dimensions, dataset size, and calculus work so
  the UI cannot be frozen intentionally.
- [ ] **EL506-373 - Verify CSP and offline operation.** Require no inline
  executable code, CDN, telemetry, remote font, or network calculation.
- [ ] **EL506-374 - Add dependency and license records.** Pin versions, audit
  vulnerabilities, and ship required open-source LICENSE/NOTICE information.
- [ ] **EL506-375 - Complete the backward-compatibility suite.** Cover the
  existing tag, static paths, root selector, keyboard scoping, multiple
  instances, template overrides, and collected package contents.
- [ ] **EL506-376 - Add cross-browser coverage.** Test current Chromium,
  Firefox, and WebKit desktop behavior.
- [ ] **EL506-377 - Add mobile and touch coverage.** Test representative phone
  and tablet viewports, orientation changes, zoom, and touch interaction.
- [ ] **EL506-378 - Add accessibility conformance coverage.** Test keyboard
  reachability, focus visibility, labels, state announcements, contrast,
  forced colors, text zoom, and reduced motion.
- [ ] **EL506-379 - Validate built distributions.** Install the wheel into a
  clean Django project, collect static files, render multiple calculators, and
  verify no missing or external assets.
- [ ] **EL506-380 - Document upgrades from 0.3.1.** Explain parity-default
  changes, the optional enhanced profile, theming, branding, deployment, and
  any intentional behavior differences.
- [ ] **EL506-381 - Document downstream refresh.** Provide the exact reinstall,
  collectstatic, cache-busting, and deployment steps required for consumers
  pinned to main and consumers pinned to release tags.
- [ ] **EL506-382 - Run the release legal/branding checkpoint.** Confirm no
  Sharp binary, logo, screenshot, manual artwork, or misleading affiliation is
  distributed.
- [ ] **EL506-383 - Publish verified release candidates.** Bump synchronized
  versions, update README release history, tag signed-off milestones, and
  retain direct main installs.
- [ ] **EL506-384 - Release 1.0.0.** Require every ledger entry to be observed,
  implemented or explicitly proven inapplicable, tested, documented, and
  verified against the pinned simulator.

## Highest-priority Simulator Unknowns

These must be measured rather than guessed:

- exact SET UP and MATH menus and all numeric choices;
- full mapping behind Sharp's aggregate 470-function count;
- generic solver key flow and numerical behavior;
- complete LIST functions and capacity;
- complete matrix menu, slots, dimensions, and capacity;
- N-base word width and signed representation;
- formula-memory length, persistence, and variable prompt ordering;
- internal precision, rounding method, overflow, and underflow;
- every error string, cursor position, and recovery rule;
- constant values and the historical reference standard used;
- complex branch conventions and function compatibility;
- polynomial root ordering and degenerate equations;
- derivative and integration algorithms and tolerances;
- preservation rules across clear, HOME, mode, power, and reset;
- maximum expression, history, dataset, matrix, and list sizes;
- exact behavior of two-key rollover;
- any regional difference between the user's simulator and published guides.

## Final Definition of EL-506TS Parity

Version 1.0.0 may be called behaviorally compatible only when:

- every simulator-exposed capability is in the ledger;
- every ledger entry has reference evidence;
- every supported key sequence travels through the canonical state machine;
- every documented guide example has been checked against the applicable
  reference, every disagreement is recorded, and this calculator matches the
  reference selected under **Reference Order**;
- all displays, prompts, indicators, result pages, stores, and errors match the
  applicable reference, including verified physical-device behavior for the
  six documented simulator exceptions;
- random behavior matches ranges and state semantics;
- numerical differences are absent or explicitly approved and documented with
  evidence that exact reproduction is infeasible;
- all unit, golden, browser, accessibility, security, packaging, and Django
  integration tests pass;
- the default UI is dark, original, unbranded, and suitable for teaching the
  physical EL-506TS key sequence;
- theme and branding overrides are documented and verified;
- origin/main contains the tested release commit;
- a clean downstream Django installation has been reinstalled, collected, and
  deployed successfully.
