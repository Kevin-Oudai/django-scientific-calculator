# EL-506TS Behavior Parity Update Plan

- Plan version: 1.2
- Plan status: Active
- Current package baseline: 0.3.1
- Target release: 1.0.0 after verified parity
- Next item: EL506-354
- Last updated: 2026-10-08

## Progress Overview

As of 2026-10-08, **237 of 245 roadmap tasks are complete (96.7%)**, with
**8 remaining**. The next task is **EL506-354**. These counts measure
completed checklist items, not elapsed effort or verified calculator parity;
individual tasks vary in size. The detailed checklist below describes every
remaining task and preserves its evidence and completion requirements.
Phase 0 is complete (7/7 reference and traceability items), including its reducer
and snapshot prerequisites. Phase 1 is complete (14/14 test and emulator
foundation items). Phase 2 is complete (14/14 physical layout, display, theme,
and access items). Phase 3 is complete (17/17 power, modes, clearing, editing,
and playback items). Phase 4 is complete (11/11 display settings and
formatting items). Phase 5 is complete (22/22 NORMAL entry and arithmetic
items). Phase 6 is complete (18/18 angles, trigonometry, fractions, DMS,
and coordinate items). Phase 7 is complete (10/10 random, constant and
conversion items). Phase 8 is complete (14/14 memories, formula simulation,
and solver items). Phase 9 is complete (10/10 number bases, arithmetic, logic,
memories and limits). Phase 10 is complete (8/8 numerical differentiation,
integration, condition entry, cancellation and bounded errors). Phase 11 is
complete (12/12 statistics menus, entry, weighted/paired data, browsing,
correction, deletion, persistence and capacity). Phase 12 is complete (16/16
statistics results and regression items). Phase 13 is complete (9/9 equation
items), and Phase 14 is complete (8/8 complex items). Phase 15 is complete (14/14 matrix
items). Phase 16 is complete (11/11 LIST items), including entry, arithmetic,
aggregates, vector operations, paging, memory, copying, conversions,
persistence and observed limits/errors.
Phase 17 has 9/15 items complete (error catalogue, recovery, scalar and capacity limits, persistence, guide regressions and property tests).
Phase 18 has 13/15 items complete; release candidates and 1.0.0 remain gated. Pending simulator/application behavior is visible
in the generated report; phase completion does not establish full parity.

| Roadmap phase | Completed | Remaining |
| --- | ---: | ---: |
| Phase 0 - Reference and Traceability | 7 | 0 |
| Phase 1 - Test and Emulator Foundation | 14 | 0 |
| Phase 2 - Physical Layout, Display, Theme, and Access | 14 | 0 |
| Phase 3 - Power, Modes, Clear, Editing, and History | 17 | 0 |
| Phase 4 - Display Settings and Formatting | 11 | 0 |
| Phase 5 - NORMAL Entry and Arithmetic | 22 | 0 |
| Phase 6 - Angles, Trigonometry, Fractions, DMS, and Coordinates | 18 | 0 |
| Phase 7 - Random Numbers, Constants, and Unit Conversions | 10 | 0 |
| Phase 8 - Memories, Formula Memories, Simulation, and Solver | 14 | 0 |
| Phase 9 - N-base Operations | 10 | 0 |
| Phase 10 - Numerical Differentiation and Integration | 8 | 0 |
| Phase 11 - Statistics Data Management | 12 | 0 |
| Phase 12 - Statistics Results and Regressions | 16 | 0 |
| Phase 13 - Equation Mode | 9 | 0 |
| Phase 14 - Complex Mode | 8 | 0 |
| Phase 15 - Matrix Mode | 14 | 0 |
| Phase 16 - LIST Mode | 11 | 0 |
| Phase 17 - Errors, Limits, and Cross-mode Parity | 9 | 6 |
| Phase 18 - Security, Packaging, Compatibility, and Release | 13 | 2 |
| **Total** | **237** | **8** |

Refresh this overview's date, counts, percentage, and next task in every
roadmap completion tracking commit, using the checklist as the source of truth.

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
- Pure evaluator and baseline reducer tests now run in Node.
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

The bootstrap chain and Phase 1 are complete as of 2026-10-05.
Resume with Phase 17, EL506-351.
Stable physical-key IDs
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
- [x] **EL506-003 - Create the golden fixture format and runner.** Fixtures
  must drive canonical key IDs and assert displays, indicators, prompts,
  result pages, state mutations, and errors.
    Completed: 2026-10-05, implementation commit
    `42b39b74ce860131522077d48a32f9d7554b2f0d` verified on origin/main.
    Version 1 canonical-sequence fixtures and
    deterministic Node runner assert explicit observable state paths at every
    step, retaining complete snapshots. Two supported baseline sequences replay
    11 frames; mode/menu fixture stays pending with no assertions or parity pass.
    Oracle display differences are compared against their exact recorded set;
    unexpected assertions, physical IDs, paths or dispatch fail. Prompts/pages
    absent from baseline remain pending; future state fields use the same paths.
    Evidence: fresh el506-003-golden-addition-v1, Reset then K40 K43 K41 K48,
    five inspected frames, DEG and result 3.; pinned runtime verified. Existing
    error-recovery and menu-inventory evidence supplies other references.
    A legacy CP1252 division glyph in error-recovery JSON was exposed by exact
    comparison; normalized that transcript to UTF-8 without changing content,
    and added strict UTF-8/glyph regression coverage.
    Verification: 18/18 pure unit tests, golden runner and 28/28 browser
    tests including canonical replay; existing
    two-embed/compatibility regressions; reference validation; compileall; pip
    dry run; Compose config/demo; HTTP 200; diff check.
    Scope: bootstrap test bridge covers NORMAL base keys only; unimplemented
    layers/modes do not count as passing parity. No UI layout/theme, touch,
    accessibility, evaluator algorithm or package version change.
- [x] **EL506-004 - Capture all 44-page guide examples.** Convert every worked
  sequence in the operation guide into reference fixtures, preserving printed
  values and noting any guide/simulator disagreement.
    Completed: 2026-10-05, implementation commit
    `7b6635244c82a552a89057becd1406b1c1252674` verified on origin/main.
    All 44 pages reviewed visually and through text;
    52 connected workflows, 148 printed checkpoints independently transcribed
    with canonical key IDs, page review index, printed values and prerequisites.
    Weighted/paired datasets expand printed ellipses; repeated result selections,
    conversion and memory steps remain connected. No source PDF/artwork/prose
    committed. Local source SHA-256 0fd2dda1f5a38757624c03a4ae5c72f0d9f531244f6a056af708e7e67addf0e2.
    Evidence: fresh el506-004-guide-power-v1, chrome Reset then K41 K19 K35 K48;
    five inspected LCD frames, numeric 16./DEG agrees with guide page 14;
    pinned runtime/hash verified in this session. Its baseline golden replay
    records entry/display differences. No internal simulator stores measured.
    Remaining 51 workflows are reference-only, pending simulator/application
    replay under owning feature items and EL506-362; never counted as parity.
    Printed exponent discrepancy (page 6), polar-angle sign ambiguity (41) and
    unspecified matrix paging repeat (43) retained without guessed corrections.
    Verification: guide coverage/canonical/reference validators; 20/20 unit
    tests; 28 existing browser tests and 3/3 targeted golden replays passed.
    Initial power DOM expectation used a caret instead of rendered superscript;
    corrected DOM text plus explicit sup assertions, then replay passed; compileall; pip dry run; Compose config/demo; HTTP 200;
    diff check. UI, dispatch, touch/theme/accessibility and future mode gates
    are inapplicable to reference capture. No release or algorithm change.
- [x] **EL506-005 - Capture the version 0.3.1 baseline.** Classify every
  existing feature and test as matching, partial, enhanced-only, incorrect, or
  missing. Record the source revision before EL506-014 refactors the baseline.
    Completed: 2026-10-05, implementation commit
    b90c5480d54c194ffbf1885ea1965ac0636667e9
    `el506-005-baseline-0.3.1-v1` freezes source
    afd4094bee71e27ac963721887a41aa30f75a018 and Git-blob SHA-256 fingerprints.
    Evidence: 82 existing feature classifications, 21 original test records,
    all 430 ledger entries (123 partial, 307 missing); six browser probes and
    two-embed keyboard/focus isolation. Existing exact-value extensions remain
    enhanced-only; error wording, formatting and keyboard 2ndF discrepancies
    are explicit. No calculator behavior or release version changed.
    Reference gate: simulator launched before capture; runtime 1.0.2.0 and
    pinned SHA-256 matched, initial blank upper/0. lower/DEG display observed.
    Window activation failed during Reset and after target reselection recovery;
    no further input issued and no new reset/key sequence claimed. Existing
    live `el506-013-key-panel-v1`, `el506-002-error-recovery-v1` and
    `el506-001-menu-inventory-v1` transcripts supply comparisons. Internal stores,
    new surd probes and exact underflow boundary remain explicitly unmeasured.
    Verification: frozen-source/coverage validator; npm.cmd test 24/24 including
    original 21 regressions and three baseline tests; compileall; pip dry run;
    Docker Compose config; docker compose up --build -d; demo HTTP 200;
    git diff --check. Initial capture assertion expected no equals after a
    nonfinite result; observed `1/0=` corrected in transcript, then tests passed.
    Notes: future pure-core unit/golden runner, runtime dispatch, snapshot API,
    generated report, touch/theme/accessibility gates are inapplicable to this
    baseline-only item. Original Git history is required for offline validation.
- [x] **EL506-006 - Add a generated parity report.** Report documented,
  simulator-observed, implemented, unit-tested, golden-tested, and
  browser-tested status independently for every ledger entry.
    Completed: 2026-10-05, implementation commits
    `7d88c3e4ebc64f4278d362b6693e536685225441` and
    `cfb38f09e05ecfe7973ff3e05e2f0ae57e613666` verified on origin/main.
    Deterministic JSON and filterable offline HTML
    report includes all 430 ledger rows with six independent status/evidence
    columns, explicit scope and input fingerprints. Frozen baseline
    implementation classifications stay separate from inventory observation,
    guide capture, unit assertions, golden differences and browser assertions.
    Explicit test manifest verifies source anchors/IDs; pending menu fixtures
    execute no assertions and cannot count as tested. Full verified parity=0.
    Evidence: validated pinned-profile live transcripts and guide source,
    including this session's fresh addition/power/clear/modifier captures.
    Report is derived reference data; no new simulator state mutation claimed.
    Guide summary: 52 workflows, 148 checkpoints, 1 baseline replay, 51 pending.
    Golden summary: 16 asserted baseline frames, 1 pending fixture.
    Verification: deterministic/staleness/status-independence/escaping tests;
    filterable HTML browser check; reference validation, 22/22 unit tests,
    golden checks and 30/30 browser tests; visual report screenshot reviewed;
    compileall; pip dry run; Compose config/demo; HTTP 200; diff check.
    No calculator UI, algorithm, package version or dependency changes.
    Physical dispatch, touch/theme and calculator accessibility gates are
    inapplicable to derived reporting. Report labels/search are accessible;
    no external assets or requests required. Regenerate/check commands documented.
    Publication review found that raw text hashes would vary after a Windows
    CRLF checkout. Fingerprints and stale checks now normalize CRLF to LF;
    both LF and CRLF report comparisons are covered by the regression test.

### Phase 1 - Test and Emulator Foundation

- [x] **EL506-010 - Add pure JavaScript unit testing.** Use an open-source,
  deterministic runner that can test the calculator core without a browser.
    Completed: 2026-10-05, implementation commit
    `91f561911b3ef09cecefaa2ba9c5d3ac1c6c2031` verified on origin/main.
    Node 22+ built-in node:test runner, sequential
    test:unit command and npm test integration added without a runner dependency.
    CommonJS-only/no-document exports expose the four existing pure evaluator
    functions; DOM handlers, algorithms and package version remain unchanged.
    Evidence: fresh `el506-010-addition-v1`, chrome Reset then K40 K43 K41 K48,
    five LCD frames and numeric result 3; pinned runtime 1.0.2.0/hash matched.
    Initial target capture mismatch recovered by exact returned id/app selection;
    all physical actions then used fresh target snapshots. Stores unmeasured,
    no errors in reference, guide source page inapplicable.
    Verification: npm.cmd test ran 8/8 pure unit tests and 25/25 browser tests;
    reference/schema/ledger/baseline validation; compileall; pip dry run;
    Docker Compose config; rebuilt Docker demo; HTTP 200; git diff --check.
    Unit tests separate numeric/format output, explicit angle/ANS inputs and
    exact enhancements; legacy precision/errors remain characterized. First
    exact-output assertion omitted internal parentheses; observed output fixed
    in test expectation and rerun passed, confirming runner failure exit status.
    Browser compatibility check covers hosts with a CommonJS module global;
    existing baseline also verifies two independent focused embeds.
    Notes: reducer state tests await EL506-014; snapshots await EL506-019 and
    full golden replay awaits EL506-003. Runtime canonical dispatch, new theme,
    touch and accessibility gates are inapplicable to this test-infrastructure
    item; no full calculator parity is claimed. Unit tests require no DOM shim,
    browser, Django or Docker. No dependency or release version bump.
- [x] **EL506-011 - Add Django integration tests.** Verify the template tag,
  template rendering, packaged static assets, escaping, and multiple embeds.
    Completed: 2026-10-05, implementation commit
    `6f3edcd938ea0cf4d021340a4ce3daabab7a275e` verified on origin/main.
    Four database-free Django integration tests
    cover tag/template discovery, static resource bytes, host escaping and
    duplicate-ID-free embeds. Runtime build 1.0.2.0/hash reverified and initial
    blank upper/0./DEG observed; no new numeric oracle required for test-only
    scope. Existing golden/browser regressions retained. Verification:
    Django 4/4, unit 22/22, browser 30/30, reference/golden/report checks,
    compileall, pip dry run, Compose config/demo rebuild and diff check.
    No UI/theme, evaluator, modifier or release change.
- [x] **EL506-012 - Add continuous integration.** Run Python checks,
  JavaScript unit tests, Playwright, packaging checks, and dependency/license
  checks without secrets or paid services.
    Completed: 2026-10-05, implementation commit
    `4b0bef84059ebbd920ae2069bfb29a07ef4dd545` verified on origin/main.
    Read-only SHA-pinned GitHub Actions workflow
    with full-history checkout, Python/Node checks, public dependency audits,
    explicit license review, isolated installed-wheel and sdist byte checks,
    Compose demo and complete npm suite. No secrets/paid services. Existing
    pinned simulator baseline/evidence retained; no calculator behavior changed.
    Audit exposed vulnerable demo Django 5.2.13; demo pin/package minimum moved
    to security release 5.2.17 with official release reference in README.
    Verification: audit zero known vulnerabilities, npm audit zero, pip check,
    license/YAML/package smoke checks, Django 4/4, unit 22/22, browser 30/30,
    reference/golden/report, compileall, pip dry run, Compose rebuild/diff check.
    Recovery: old sqlparse license classifier handled; isolated smoke installs
    dependencies rather than assuming user site packages. UI gates inapplicable.
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
- [x] **EL506-014 - Extract a deterministic state reducer.** Move calculator
  behavior out of DOM handlers while preserving existing tested behavior.
    Completed: 2026-10-05, implementation commit
    `11900fb9cddcc210b153f635ba4d2148b2b80d00` verified on origin/main.
    Existing behavior now runs through immutable
    createInitialState/reduceCalculator, with DOM rendering and input adapters
    consuming returned state. Includes all current stores, staged templates,
    cursor/history, modifiers, error display and nonfinite values. Legacy
    pointer/keyboard differences and evaluator algorithms remain unchanged.
    Evidence: fresh el506-014-reducer-addition-v1; Reset, K40 K43 K41 K48;
    five inspected LCD frames, result 3., DEG; runtime build/hash matched.
    Internal simulator stores remain unmeasured; guide example not used.
    Verification: 12/12 pure unit tests and 25/25 browser regression tests;
    reference validators; compileall; pip dry run; Compose config/rebuild;
    HTTP 200; diff check. Browser tests retain two focused independent embeds.
    Scope: this prerequisite preserves baseline behavior, not new parity;
    canonical physical routing, future modes, golden runner and snapshots
    remain separate tasks. Theme, touch and accessibility gates are
    inapplicable because controls, labels and style are unchanged. Version 0.3.1.
- [x] **EL506-015 - Model entry lifecycle states.** Cover empty, entering,
  editing, evaluated, prompt, menu, data entry, multi-result, and error states.
    Completed: 2026-10-05, implementation commit
    197fe35f348c031fc67216fb377300723fc69449 verified on origin/main. Explicit lifecycle and modal workflow contracts,
    immutable transitions, retained underlying entry, bounded result paging and
    snapshot schema 2 with schema 1 migration. Pure tests cover all nine states;
    existing simulator golden fixtures now assert lifecycle paths; browser
    checks input and restored modal dismissal. Future numeric modes/UI remain
    owned by their later tasks, not claimed as implemented parity.
    Evidence: el506-015-entry-lifecycle-v1, fresh Reset/K40/K09/K48 captures;
    discarded lone lower-line digit on left navigation recorded as legacy
    difference for Phase 3. Existing menu-inventory/error/addition references
    supply remaining workflow oracle context. Pinned runtime/hash matched.
    Verification: Django 4/4, unit 25/25, browser 31/31; golden/reference/report;
    compileall, pip dry run, Compose rebuilt demo, diff check. No visual/theme
    change. CI EL506-012 implementation run 37343374982 passed on GitHub.
- [x] **EL506-016 - Implement modifier and menu layers.** Support base, 2ndF,
  ALPHA, HYP, MODE, SET UP, MATH, STO, RCL, and other waiting-for-selection
  states without string replacement.
    Completed: 2026-10-05, implementation commit
    4d42530b6b063c06328422b03507473ebdb24497 verified on origin/main. Declarative physical intent resolution, combined
    inverse HYP, one-shot modifier consumption, MODE/SETUP/MATH selections,
    STO/RCL letter prompts, RANDOM/clear and two-digit CNST/CONV selection
    contracts. Layers, pending intents and settings round-trip in schema 3
    snapshots; schemas 1/2 migrate. Per-embed pressKey API uses physical IDs.
    Unsupported feature algorithms remain explicit pending intents; non-NORMAL
    arithmetic rejects until its owning feature item. Existing enhanced controls
    remain the compatibility adapter; physical DOM/input mapping is Phase 2.
    Evidence: fresh el506-016-key-layers-v1, Reset then K03 K12 K13 K02 K05
    K48 K04; 8 LCD frames, modifier consumption/ANS/MODE observed; build/hash
    matched. Menu inventory supplies other selection references; stores unmeasured.
    Golden replay asserts exact current state and LCD differences, not parity.
    Verification: unit 28/28, browser 33/33, Django 4/4; all reference/golden/report
    checks; compileall, pip dry run, Compose/demo rebuild, diff check. Regression
    protects settings/mode from ON/C reset. Test corrected legacy ANS projection
    expectation to assert semantic intent. No new visual/theme or release change.
- [x] **EL506-017 - Add the semantic token editor and AST.** Separate
  calculator intent, cursor structure, and implied operations from display
  text.
    Completed: 2026-10-05, implementation commit
    d147895ad844aab9c54f0925ac5e49b644459301 verified on origin/main. Bundled semantic editor with allowlisted tokens,
    atomic function edits, numeric digit offsets, structural/template cursors,
    explicit/implied multiplication and validated AST traversal. Scalar evaluation
    now traverses AST operations rather than executing source. Existing scalar
    precedence, exact enhancement and formatting remain characterized. Schema 4
    snapshots include editor state and migrate schemas 1-3. The compatible entry
    loads the local module without requiring an additional consumer include.
    Evidence: fresh el506-017-implied-multiplication-v1, Reset/K41/K18/K48;
    4 inspected LCD frames and result 6.283185307. Golden replay asserts AST
    implied intent and exact retained baseline display differences. Build/hash
    matched; no internal precision/store values asserted.
    Verification: unit 32/32, browser 35/35, Django 4/4; reference/golden/report;
    compileall, pip dry run, Compose rebuilt demo, diff check. Browser verifies
    snapshot/AST/format independence and exclusively local asset requests.
    Hostile input, unbound variables, depth/arity limits and immutable branches
    covered. No layout/theme/release change; physical input layout remains Phase 2.
- [x] **EL506-018 - Add typed calculator values.** Preserve scalar, rational,
  DMS, complex, N-base, statistics, equation, matrix, and list types across
  evaluation and display conversion.
    Completed: 2026-10-05, implementation commit
    ec2622aea4bb2faf936df5fed25989974f17b422 verified on origin/main. Validated nine-family value model, exact rational
    arithmetic, fixed-width bounds, retained DMS/complex/structured components,
    explicit scalar coercion guards and type-preserving AST variable bindings.
    Conversion returns component views without overwriting source values.
    Typed ANS/last/memory/statistics/history stores and schema 5 snapshot migrations
    coexist with unchanged legacy LCD projections. Future mode arithmetic rejects
    unsupported coercion and remains owned by its feature tasks.
    Evidence: fresh el506-018-fraction-type-v1, Reset/K40/K25/K42/K48; displayed
    exact 1/3, five inspected LCD frames; dedicated fraction separator transcribed
    as [frac] with explicit notation note. Build/hash matched; internal stores
    unmeasured. Existing addition/power/pi golden fixtures now assert typed ANS.
    Verification: unit 36/36, browser 36/36, Django 4/4; golden/reference/report;
    compileall, pip dry run, Compose/demo rebuild, diff check. Regression covers
    typed history rollover, malformed values, matrix shape, exact fractions,
    large-rational conversion and negative-zero retention. No LCD/theme/release
    change; full numeric mode parity remains pending.
    Browser test initially targeted a nonexistent rotation action; changed to
    the real fraction control and added an assertion that the view actually
    changes. Removed that nonexistent action from shifted-key resolution;
    fraction conversions retain named intents for their owning feature items.
- [x] **EL506-019 - Add full state snapshot and restore.** Include all stores,
  settings, prompts, cursors, result pages, and modifiers for history and
  deterministic tests.
    Completed: 2026-10-05, implementation commit
    `d22ea3595697f4c84b803f33a2338787eb88ba1c` verified on origin/main.
    Versioned legacy-0.3.1 in-memory snapshot and
    validated restore cover every currently implemented field, nested template,
    memory/statistics/history store, setting, cursor, modifier and error display.
    Independent deep copies preserve nonfinite numbers. Per-root browser API
    restores and renders atomically; malformed/version-mismatched input rejects.
    Evidence: el506-019-retained-ans-v1 extends fresh addition with ON/C,
    2ndF and equals; blank upper/0. lower, modifier on then off observed.
    No numeric ANS recall or internal simulator store value is asserted.
    Verification: 15/15 unit tests, 25 existing browser regressions and
    the targeted snapshot test passed. Initial test focus clicked a key;
    corrected to explicit root focus, then snapshot test passed; reference validation; compileall; pip dry run; Compose
    config/rebuild; HTTP 200; diff check. Two-embed regression remains covered.
    Scope: all baseline state is covered; unimplemented prompts, modes and
    result pages must extend the versioned contract in their future items.
    JSON persistence, canonical dispatch, touch/theme/accessibility changes
    are inapplicable to this bootstrap contract. No algorithm/version change.
- [x] **EL506-020 - Integrate a pinned local Math.js build.** Bundle it with
  the package, record its version and license notices, expose only an
  allowlisted evaluator adapter, and require no CDN.
    Completed: 2026-10-05, implementation commit
    e613243affe912039928d6d71088946e46138cd5 verified on origin/main.
    Evidence: fraction-type and existing five golden sequences; pinned
    simulator 1.0.2.0 final 1/3 frame freshly inspected this session. Bundle
    infrastructure retains Number behavior; no new numerical parity claimed.
    Verification: 37 unit, 37 browser, 4 Django tests; 28 golden frames;
    reproducible bundle/provenance/notices check, license review, compileall,
    pip dry run, Compose config/build/healthy demo, wheel/sdist installed
    smoke, diff check. Local engine is 138323 bytes; Math.js 15.2.0 exact
    lock plus seven included dependency notices. Negative adapter tests
    reject expression text, prototype names and unbounded decimal controls.
    Scope: pure allowlisted numeric engine; physical UI, LCD formatting and
    non-NORMAL algorithms remain assigned to later items. Release unchanged.
- [x] **EL506-021 - Establish the numerical compatibility model.** Measure
  simulator precision, exponent range, rounding ties, overflow, underflow,
  negative zero, and intermediate precision before selecting Number,
  BigNumber, Fraction, or custom quantization per value type.
    Completed: 2026-10-05, implementation commit
    5513ce6b07fe96b5c06e8083311b9652e447d31f verified on origin/main.
    Evidence: nine numeric-* live experiments, 112 physical key presses
    observed individually on pinned simulator 1.0.2.0. Exponents +/-99
    retained; 1e100 Error 2; 1e-100 zero; evaluated -0 displays 0.
    Cancellation retained unit at 1e11/1e12 but lost it at 1e13/1e14;
    increments 5/6 at 1e13 also lost. NORM 1/7=0.142857142, FIX TAB9
    0.142857143, FIX TAB1 +/-1.25 displays +/-1.3. Store bits unmeasured.
    Verification: 41 unit, 38 browser, 4 Django; numeric golden assertions
    against measured frames and existing 28 state golden frames; bundle
    reproducibility, reference/report checks, compileall, pip dry run,
    Compose config/build/healthy demo and diff check. Regression fixes cover
    zero formatting and explicit unmeasured error recovery. The first numeric
    assertion compared equivalent scientific encodings; corrected to compare
    the observed value, with all tests passing afterward.
    Decision: 64-digit BigNumber working values with provisional 13-digit
    truncation per measured basic operation; reduced BigInt rationals and
    bounded BigInt N-base values, structured components retained. README
    records every family and the future function-specific probe requirement.
    Scope: separate measured foundation; legacy-0.3.1 remains default.
    Full formatting, function accuracy, signed intermediate rounding and
    future mode algorithms remain pending their own items; no full parity
    claim, release change or visible theme/accessibility change.
- [x] **EL506-022 - Split the browser adapter from the core.** Keep the
  existing calculator.js asset as the compatible entry point while making
  state, parsing, evaluation, formatting, and DOM responsibilities testable.
    Completed: 2026-10-05, implementation commit
    c8ea4e79df0f89e16e850b86082162c3737f89e6 verified on origin/main.
    Evidence: module-addition fresh simulator Reset K40 K43 K41 K48,
    five inspected frames; upper 1+2= / lower 3. / DEG retained. Existing
    golden addition LCD differences remain explicit; architecture only.
    Verification: 43 unit, 39 browser, 4 Django tests; 28 golden frames;
    Node entry identity, core VM with DOM access blocked, pure escaping
    and fraction view checks, local companion load and host module safety;
    bundle/reference/report checks, compileall, pip dry run, Compose config
    and healthy rebuild, wheel/sdist installed smoke (13 assets), diff check.
    Initial VM reducer test mixed structuredClone realms and correctly hit
    prototype validation; test now checks VM pure evaluation and performs
    state replay in its native realm. All checks pass after correction.
    Scope: calculator.js remains the compatible entry; core.js, formatter,
    parser/value/numeric modules and DOM adapter have separate test seams.
    Legacy state schema/profile, UI behavior and release version retained.
    Full physical dispatch and visual/accessibility changes stay with their
    existing later roadmap items. No new parity claim.
- [x] **EL506-023 - Guarantee independent embeds.** Eliminate shared mutable
  state and verify two or more calculators on one page.
    Completed: 2026-10-05, implementation commit
    d5f1833f1a63b58422c154f1c34e2b4ef399c610 verified on origin/main.
    Evidence: retained-answer live sequence extends the actual preceding
    module-addition observation: ON/C, ALPHA, equals (ANS), equals yields
    upper ANS= / lower 3. / DEG. Nine reference frames; no multiple-simulator
    claim. Browser isolation is verified as an application property.
    Verification: 46 unit, 44 browser, 4 Django tests; 37 golden frames;
    three-embed keyboard/mouse/touch test isolates ANS, rational memory,
    statistics, settings, history/cursors and copied snapshots/restores;
    remount, nested dispatch, repeated entry load and fresh root tests pass.
    Bundle/reference/report checks, compileall, pip dry run, Compose config
    and healthy rebuild, diff check; npm audit zero vulnerabilities; license
    check and pip check pass. Wheel/sdist asset coverage passed EL506-022.
    Regression fixes: returned physical events exposed shared definitions;
    repeated mount redefined the instance API; nested roots handled the same
    event. Events now copy definitions, mount is idempotent, and listeners
    belong to each nearest root. A second-layer M+ test exposed typed values
    using the unresolved base action; effective action normalization now
    retains the exact rational. Initial test selectors and overlapping demo
    shell fixture were corrected; real pointer/touch tests pass in an ordinary
    three-embed host without forced clicks.
    Scope: independent current stores/contracts; future algorithms retain
    their own roadmap items. LCD differences, legacy profile and release
    version remain explicit; no theme/layout change or full parity claim.

### Phase 2 - Physical Layout, Display, Theme, and Access


- [x] **EL506-030 - Reproduce physical key positions.** Match the EL-506TS
  instructional layout and key grouping without importing Sharp artwork.

    Completed: 2026-10-07, d37c763cec8610d44a9f4ff8c7e4b9d4b10946db
    Evidence: phase-2-ui-review-v1 (EL506-030); physical-key-reference.json, tests/e2e/physical-ui.spec.js.
    Verification: npm test (52 unit, 79 browser including 18 visual cases);
    reference/golden checks (43 asserted frames); Django integration (7);
    compileall, pip dry-run, Docker config/build/start, package wheel/sdist
    clean installation (15 assets), git diff --check; implementation SHA
    verified on origin/main.
    Notes: 48 native buttons in verified regions and row groups; navigation has no center key. Full-phase delivery explicitly authorized;
    numerical algorithms and known LCD lifecycle differences remain in later phases.

- [x] **EL506-031 - Reproduce functional labels.** Add verified primary,
  orange 2ndF, and green ALPHA legends at their teaching positions.

    Completed: 2026-10-07, d37c763cec8610d44a9f4ff8c7e4b9d4b10946db
    Evidence: phase-2-ui-review-v1 (EL506-031); capability-ledger.json, tests/unit/physical-ui.test.js.
    Verification: npm test (52 unit, 79 browser including 18 visual cases);
    reference/golden checks (43 asserted frames); Django integration (7);
    compileall, pip dry-run, Docker config/build/start, package wheel/sdist
    clean installation (15 assets), git diff --check; implementation SHA
    verified on origin/main.
    Notes: All orange 2ndF and green ALPHA legend keys covered by catalog and browser accessible names; mode/formula labels retained. Full-phase delivery explicitly authorized;
    numerical algorithms and known LCD lifecycle differences remain in later phases.

- [x] **EL506-032 - Build the two-line LCD model.** Give the upper equation
  and lower result lines independent content, alignment, clipping, and
  horizontal scrolling.

    Completed: 2026-10-07, d37c763cec8610d44a9f4ff8c7e4b9d4b10946db
    Evidence: phase-2-ui-review-v1 (EL506-032); experiments/lcd-cursor.json, tests/e2e/physical-ui.spec.js.
    Verification: npm test (52 unit, 79 browser including 18 visual cases);
    reference/golden checks (43 asserted frames); Django integration (7);
    compileall, pip dry-run, Docker config/build/start, package wheel/sdist
    clean installation (15 assets), git diff --check; implementation SHA
    verified on origin/main.
    Notes: Independent upper/lower content, clipping, alignment, user scrolling and hidden-content indicators. Full-phase delivery explicitly authorized;
    numerical algorithms and known LCD lifecycle differences remain in later phases.

- [x] **EL506-033 - Implement all display indicators.** Include 2ndF, HYP,
  ALPHA, FIX, SCI, ENG, DEG, RAD, GRAD, CPLX, MAT, LIST, STAT, M, base,
  hidden-content arrows, and component indicators.

    Completed: 2026-10-07, d37c763cec8610d44a9f4ff8c7e4b9d4b10946db
    Evidence: phase-2-ui-review-v1 (EL506-033); tests/unit/physical-ui.test.js, tests/e2e/physical-ui.spec.js.
    Verification: npm test (52 unit, 79 browser including 18 visual cases);
    reference/golden checks (43 asserted frames); Django integration (7);
    compileall, pip dry-run, Docker config/build/start, package wheel/sdist
    clean installation (15 assets), git diff --check; implementation SHA
    verified on origin/main.
    Notes: Projects every requested modifier, angle, format, mode, memory, N-base and component flag from represented state; future algorithms own their state transitions. Full-phase delivery explicitly authorized;
    numerical algorithms and known LCD lifecycle differences remain in later phases.

- [x] **EL506-034 - Implement display cursor and insert marker.** Match
  simulator positions, selection, and horizontal follow. Use the full manual
  or physical device for blinking; the simulator's non-blinking cursor is a
  documented exception.

    Completed: 2026-10-07, d37c763cec8610d44a9f4ff8c7e4b9d4b10946db
    Evidence: phase-2-ui-review-v1 (EL506-034); experiments/lcd-cursor.json, golden/physical-lcd-cursor.json, tests/unit/physical-ui.test.js.
    Verification: npm test (52 unit, 79 browser including 18 visual cases);
    reference/golden checks (43 asserted frames); Django integration (7);
    compileall, pip dry-run, Docker config/build/start, package wheel/sdist
    clean installation (15 assets), git diff --check; implementation SHA
    verified on origin/main.
    Notes: Measured end/selection coordinates, INS toggle, cursor follow, overwrite marker, blinking manual exception and reduced motion. Full-phase delivery explicitly authorized;
    numerical algorithms and known LCD lifecycle differences remain in later phases.

- [x] **EL506-035 - Implement multi-result paging UI.** Support coordinate
  pairs, complex components, equation solutions, matrix cells, and list
  elements without recalculation.

    Completed: 2026-10-07, d37c763cec8610d44a9f4ff8c7e4b9d4b10946db
    Evidence: phase-2-ui-review-v1 (EL506-035); tests/unit/physical-ui.test.js, tests/e2e/physical-ui.spec.js.
    Verification: npm test (52 unit, 79 browser including 18 visual cases);
    reference/golden checks (43 asserted frames); Django integration (7);
    compileall, pip dry-run, Docker config/build/start, package wheel/sdist
    clean installation (15 assets), git diff --check; implementation SHA
    verified on origin/main.
    Notes: Five supplied page families share bounded canonical arrow dispatch, without evaluation or store mutation. Full-phase delivery explicitly authorized;
    numerical algorithms and known LCD lifecycle differences remain in later phases.

- [x] **EL506-036 - Create the dark default theme.** Use an original,
  high-contrast, Sharp-familiar but unbranded visual treatment.

    Completed: 2026-10-07, d37c763cec8610d44a9f4ff8c7e4b9d4b10946db
    Evidence: phase-2-ui-review-v1 (EL506-036); tests/e2e/physical-visual.spec.js, tests/e2e/physical-ui.spec.js.
    Verification: npm test (52 unit, 79 browser including 18 visual cases);
    reference/golden checks (43 asserted frames); Django integration (7);
    compileall, pip dry-run, Docker config/build/start, package wheel/sdist
    clean installation (15 assets), git diff --check; implementation SHA
    verified on origin/main.
    Notes: Original unbranded dark case, accessible legend contrast and visible focus. Full-phase delivery explicitly authorized;
    numerical algorithms and known LCD lifecycle differences remain in later phases.

- [x] **EL506-037 - Add the theme override contract.** Ship documented CSS
  custom properties and calculator-theme.example.css without changing key
  geometry or semantics.

    Completed: 2026-10-07, d37c763cec8610d44a9f4ff8c7e4b9d4b10946db
    Evidence: phase-2-ui-review-v1 (EL506-037); README.md, src/scientific_calculator/static/scientific_calculator/calculator-theme.example.css, tests/e2e/physical-ui.spec.js.
    Verification: npm test (52 unit, 79 browser including 18 visual cases);
    reference/golden checks (43 asserted frames); Django integration (7);
    compileall, pip dry-run, Docker config/build/start, package wheel/sdist
    clean installation (15 assets), git diff --check; implementation SHA
    verified on origin/main.
    Notes: Documented color/font/surface/shadow custom properties and shipped example; tests compare all key bounds unchanged. Full-phase delivery explicitly authorized;
    numerical algorithms and known LCD lifecycle differences remain in later phases.

- [x] **EL506-038 - Add safe branding customization.** Keep the existing tag
  valid while allowing safely escaped brand text and documented template
  override hooks.

    Completed: 2026-10-07, d37c763cec8610d44a9f4ff8c7e4b9d4b10946db
    Evidence: phase-2-ui-review-v1 (EL506-038); tests/django/test_integration.py, README.md.
    Verification: npm test (52 unit, 79 browser including 18 visual cases);
    reference/golden checks (43 asserted frames); Django integration (7);
    compileall, pip dry-run, Docker config/build/start, package wheel/sdist
    clean installation (15 assets), git diff --check; implementation SHA
    verified on origin/main.
    Notes: No-argument tag remains valid; brand text force-escaped even when marked safe; narrow template blocks tested. Full-phase delivery explicitly authorized;
    numerical algorithms and known LCD lifecycle differences remain in later phases.

- [x] **EL506-039 - Add responsive layouts.** Preserve exact key order and
  sequencing on desktop, tablet, and phone without hiding controls.

    Completed: 2026-10-07, d37c763cec8610d44a9f4ff8c7e4b9d4b10946db
    Evidence: phase-2-ui-review-v1 (EL506-039); tests/e2e/physical-ui.spec.js, tests/e2e/physical-visual.spec.js.
    Verification: npm test (52 unit, 79 browser including 18 visual cases);
    reference/golden checks (43 asserted frames); Django integration (7);
    compileall, pip dry-run, Docker config/build/start, package wheel/sdist
    clean installation (15 assets), git diff --check; implementation SHA
    verified on origin/main.
    Notes: 320/390/768/1440px bounds, original ordering, all controls visible and pairwise nonoverlap; short host panels scroll. Full-phase delivery explicitly authorized;
    numerical algorithms and known LCD lifecycle differences remain in later phases.

- [x] **EL506-040 - Add accessible key semantics.** Expose primary and shifted
  purposes, state changes, display updates, and errors to assistive
  technologies.

    Completed: 2026-10-07, d37c763cec8610d44a9f4ff8c7e4b9d4b10946db
    Evidence: phase-2-ui-review-v1 (EL506-040); tests/e2e/physical-ui.spec.js.
    Verification: npm test (52 unit, 79 browser including 18 visual cases);
    reference/golden checks (43 asserted frames); Django integration (7);
    compileall, pip dry-run, Docker config/build/start, package wheel/sdist
    clean installation (15 assets), git diff --check; implementation SHA
    verified on origin/main.
    Notes: Native buttons, primary and modifier purposes, modifier pressed states, display/page status and error announcements, focus, text zoom, forced colors. Full-phase delivery explicitly authorized;
    numerical algorithms and known LCD lifecycle differences remain in later phases.

- [x] **EL506-041 - Unify pointer, touch, and keyboard dispatch.** All input
  methods must emit the same canonical key events and support verified
  two-key rollover where applicable.

    Completed: 2026-10-07, d37c763cec8610d44a9f4ff8c7e4b9d4b10946db
    Evidence: phase-2-ui-review-v1 (EL506-041); tests/unit/physical-ui.test.js, tests/e2e/physical-ui.spec.js.
    Verification: npm test (52 unit, 79 browser including 18 visual cases);
    reference/golden checks (43 asserted frames); Django integration (7);
    compileall, pip dry-run, Docker config/build/start, package wheel/sdist
    clean installation (15 assets), git diff --check; implementation SHA
    verified on origin/main.
    Notes: Pointer-down, touch, keyboard and assistive button activation produce physical-key events; independent focus, host shortcuts and overlapping touch tested. Full-phase delivery explicitly authorized;
    numerical algorithms and known LCD lifecycle differences remain in later phases.

- [x] **EL506-042 - Add visual regression coverage.** Cover the default dark
  theme, example override theme, focus, modifiers, menus, errors, long
  expressions, and responsive sizes.

    Completed: 2026-10-07, d37c763cec8610d44a9f4ff8c7e4b9d4b10946db
    Evidence: phase-2-ui-review-v1 (EL506-042); tests/e2e/physical-visual.spec.js, .github/workflows/checks.yml.
    Verification: npm test (52 unit, 79 browser including 18 visual cases);
    reference/golden checks (43 asserted frames); Django integration (7);
    compileall, pip dry-run, Docker config/build/start, package wheel/sdist
    clean installation (15 assets), git diff --check; implementation SHA
    verified on origin/main.
    Notes: 18 original Windows Chromium baselines: both themes with default, focus, 2ndF, ALPHA, menu, error, long expression, phone and tablet. Full-phase delivery explicitly authorized;
    numerical algorithms and known LCD lifecycle differences remain in later phases.

- [x] **EL506-043 - Complete pre-release trade-dress review.** Confirm the
  distributed appearance and wording remain educationally compatible without
  Sharp logos, false affiliation, copied assets, or unnecessary ornamental
  duplication. Record that this is a release gate, not legal advice.

    Completed: 2026-10-07, d37c763cec8610d44a9f4ff8c7e4b9d4b10946db
    Evidence: phase-2-ui-review-v1 (EL506-043); README.md, tests/ci/check-package.py.
    Verification: npm test (52 unit, 79 browser including 18 visual cases);
    reference/golden checks (43 asserted frames); Django integration (7);
    compileall, pip dry-run, Docker config/build/start, package wheel/sdist
    clean installation (15 assets), git diff --check; implementation SHA
    verified on origin/main.
    Notes: Completed review of the package and original screenshots; release-gate findings above, not legal advice. Full-phase delivery explicitly authorized;
    numerical algorithms and known LCD lifecycle differences remain in later phases.

### Phase 3 - Power, Modes, Clear, Editing, and History

Phase completion: 2026-10-07. Full-phase delivery was explicitly requested.
Implementation 5e31f2966b03498bb62342ea7cbef70c3a2c009d was pushed and verified on origin/main.
Numerical algorithms and detailed display/error parity retain their later phases.


- [x] **EL506-050 - Implement ON/C power-on and wake behavior.**

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-050); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: ON/C wake retains stored values; reference power sequence reobserved.


- [x] **EL506-051 - Implement 2ndF plus ON/C power-off behavior.**

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-051); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: OFF is a physical key sequence; application close is outside its scope.


- [x] **EL506-052 - Implement auto-power-off and power-cycle persistence.**

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-052); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: Deterministic idle event and browser timer; stored values survive instance power cycling.


- [x] **EL506-053 - Implement all six modes.** NORMAL, STAT, EQN, CPLX, MAT,
  and LIST must use the exact MODE selection sequence and indicators.

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-053); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: All six mode selectors are implemented; numerical algorithms remain their dedicated phases.


- [x] **EL506-054 - Implement mode submenus.** Match numeric selection,
  defaults, cancellation, invalid selection, and retained state.

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-054); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: STAT/EQN selection commits only after confirmation; invalid digits and ON/C cancellation preserve stores.


- [x] **EL506-055 - Implement HOME.** Return to NORMAL and preserve or clear
  each store exactly as the simulator does.

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-055); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: HOME in NORMAL preserves ANS; returning from another mode follows mode-clear rules.


- [x] **EL506-056 - Implement ON/C command clearing.** Clear the display and
  pending command while preserving statistics and memories as verified.

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-056); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: Command clearing retains stores and the active EQN coefficient prompt.


- [x] **EL506-057 - Implement internal clear/CA.** Clear ANS, statistics, and
  other internal values while honoring the simulator's M-memory exception.

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-057); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: CA preserves M and formula memories; mode selection also clears imaginary M according to the manual.


- [x] **EL506-058 - Implement reset-switch behavior.** Restore initial
  settings and erase all stored data.

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-058); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: Reset event and instance reset API model the host reset switch without adding a physical key.


- [x] **EL506-059 - Implement modifier-latch rules.** Capture activation,
  indicator, one-shot lifetime, chaining, cancellation, and invalid-key
  behavior for 2ndF, ALPHA, and HYP.

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-059); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: One-shot modifiers and inverse HYP ordering covered; unsupported later-phase operations remain explicitly pending.


- [x] **EL506-060 - Implement left/right structured cursor movement.**

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-060); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: Function cells move atomically; cursor selection discards unfinished lower-line entry.


- [x] **EL506-061 - Implement DEL at all token and template boundaries.**

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-061); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: Selected cells and template components delete; separator deletion retains fraction/power bases.


- [x] **EL506-062 - Implement INS and insert/overwrite lifetime.**

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-062); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: Insert/overwrite mode persists until reset, including clear, mode selection and power cycles.


- [x] **EL506-063 - Implement Multi-Line Playback.** Match up/down ordering,
  boundaries, arrows, capacity, and draft restoration.

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-063); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: NORMAL playback discards temporary drafts, recalls oldest with 2nd UP and evicts whole equations at 142 characters.


- [x] **EL506-064 - Implement recalled-expression editing and reevaluation.**

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-064); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: Recalled equations edit and reevaluate without mutating prior result values.


- [x] **EL506-065 - Implement post-result key rules.** Determine which keys
  start fresh, continue from ANS, transform the result, or repeat a command.

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-065); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: Digits start fresh; arithmetic uses ANS; modifiers preserve the answer.


- [x] **EL506-066 - Match entry capacities.** Cover maximum input length,
  nesting, history size, visible width, scroll behavior, and full-buffer
  errors.

    Completed: 2026-10-07, 5e31f2966b03498bb62342ea7cbef70c3a2c009d
    Evidence: phase-3-control-review-v1 (EL506-066); el506-050-power-v1;
    phase3-power-retention-v1; pinned simulator and full manual.
    Verification: npm test (73 unit, 94 browser, 52 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; SHA verified on origin/main.
    Notes: Capacity errors occur on equals; separate 24-calculation/10-value limits verified with native nesting probes. Exact cross-mode error placement remains Phase 17.

### Phase 4 - Display Settings and Formatting

Publication: Git transport returned GitHub internal server errors. The repository
API created the identical tree and commit, then advanced main without force.
Exact implementation SHA was verified via git ls-remote before these records.


- [x] **EL506-070 - Implement the complete SET UP menu flow.**

    Completed: 2026-10-07, 9ec7e0d308b750aa6a8bfe0fea136c8f094b4e91
    Evidence: phase-4-display-review-v1 (EL506-070); el506-079-mdf-v1;
    phase4-display-ties and phase4-mdf; pinned simulator and official guide.
    Verification: npm test (84 unit, 102 browser, 88 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; exact SHA verified on origin/main.
    Notes: DRG/FSE menus, cyclic FSE pages, conditional TAB, numeric/cursor confirmation and workflow resumption.


- [x] **EL506-071 - Implement NORM1 and exact boundary behavior.**

    Completed: 2026-10-07, 9ec7e0d308b750aa6a8bfe0fea136c8f094b4e91
    Evidence: phase-4-display-review-v1 (EL506-071); el506-079-mdf-v1;
    phase4-display-ties and phase4-mdf; pinned simulator and official guide.
    Verification: npm test (84 unit, 102 browser, 88 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; exact SHA verified on origin/main.
    Notes: Ten-digit truncation; inclusive lower cutoff 1e-9 and exclusive upper cutoff 1e10 verified against live fractional boundary.


- [x] **EL506-072 - Implement NORM2 and exact boundary behavior.**

    Completed: 2026-10-07, 9ec7e0d308b750aa6a8bfe0fea136c8f094b4e91
    Evidence: phase-4-display-review-v1 (EL506-072); el506-079-mdf-v1;
    phase4-display-ties and phase4-mdf; pinned simulator and official guide.
    Verification: npm test (84 unit, 102 browser, 88 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; exact SHA verified on origin/main.
    Notes: NORM2 lower cutoff .01 inclusive; format selection preserves typed values.


- [x] **EL506-073 - Implement FIX and TAB decimal-place selection.**

    Completed: 2026-10-07, 9ec7e0d308b750aa6a8bfe0fea136c8f094b4e91
    Evidence: phase-4-display-review-v1 (EL506-073); el506-079-mdf-v1;
    phase4-display-ties and phase4-mdf; pinned simulator and official guide.
    Verification: npm test (84 unit, 102 browser, 88 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; exact SHA verified on origin/main.
    Notes: TAB defaults to 9; decimal places 0-9, half-away ties, capacity, signed rounded zero and overflow notation.


- [x] **EL506-074 - Implement SCI significant-digit selection.**

    Completed: 2026-10-07, 9ec7e0d308b750aa6a8bfe0fea136c8f094b4e91
    Evidence: phase-4-display-review-v1 (EL506-074); el506-079-mdf-v1;
    phase4-display-ties and phase4-mdf; pinned simulator and official guide.
    Verification: npm test (84 unit, 102 browser, 88 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; exact SHA verified on origin/main.
    Notes: Native TAB n selects n mantissa decimal places, or n+1 significant digits; zero-padded exponents and carry.


- [x] **EL506-075 - Implement ENG formatting and exponent steps of three.**

    Completed: 2026-10-07, 9ec7e0d308b750aa6a8bfe0fea136c8f094b4e91
    Evidence: phase-4-display-review-v1 (EL506-075); el506-079-mdf-v1;
    phase4-display-ties and phase4-mdf; pinned simulator and official guide.
    Verification: npm test (84 unit, 102 browser, 88 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; exact SHA verified on origin/main.
    Notes: Engineering exponents in multiples of three; capped decimal precision and carry.


- [x] **EL506-076 - Match the ten-digit mantissa and two-digit exponent.**

    Completed: 2026-10-07, 9ec7e0d308b750aa6a8bfe0fea136c8f094b4e91
    Evidence: phase-4-display-review-v1 (EL506-076); el506-079-mdf-v1;
    phase4-display-ties and phase4-mdf; pinned simulator and official guide.
    Verification: npm test (84 unit, 102 browser, 88 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; exact SHA verified on origin/main.
    Notes: Ten displayed mantissa digits, exponent padding, negative-zero entry exponent and overflow protection.


- [x] **EL506-077 - Match three-digit punctuation and regional behavior.**

    Completed: 2026-10-07, 9ec7e0d308b750aa6a8bfe0fea136c8f094b4e91
    Evidence: phase-4-display-review-v1 (EL506-077); el506-079-mdf-v1;
    phase4-display-ties and phase4-mdf; pinned simulator and official guide.
    Verification: npm test (84 unit, 102 browser, 88 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; exact SHA verified on origin/main.
    Notes: Pinned English apostrophe grouping and dot decimals; other regional variants remain unassessed.


- [x] **EL506-078 - Match zeros, decimal points, signs, and trailing-zero
  presentation in entry and results.**

    Completed: 2026-10-07, 9ec7e0d308b750aa6a8bfe0fea136c8f094b4e91
    Evidence: phase-4-display-review-v1 (EL506-078); el506-079-mdf-v1;
    phase4-display-ties and phase4-mdf; pinned simulator and official guide.
    Verification: npm test (84 unit, 102 browser, 88 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; exact SHA verified on origin/main.
    Notes: Entry decimal dots/zeros, signed rounded zero, and result trailing zeros; fraction geometry retained.


- [x] **EL506-079 - Implement MDF/Modify.** Commit the rounded displayed value
  to internal state and reproduce chained-result differences.

    Completed: 2026-10-07, 9ec7e0d308b750aa6a8bfe0fea136c8f094b4e91
    Evidence: phase-4-display-review-v1 (EL506-079); el506-079-mdf-v1;
    phase4-display-ties and phase4-mdf; pinned simulator and official guide.
    Verification: npm test (84 unit, 102 browser, 88 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; exact SHA verified on origin/main.
    Notes: MDF commits displayed numeric precision to current value/ANS; exact NORM fractions and prior history retained.


- [x] **EL506-080 - Format every typed result.** Add dedicated formatting for
  rational, DMS, complex, N-base, statistics, equation, matrix, and list
  values.

    Completed: 2026-10-07, 9ec7e0d308b750aa6a8bfe0fea136c8f094b4e91
    Evidence: phase-4-display-review-v1 (EL506-080); el506-079-mdf-v1;
    phase4-display-ties and phase4-mdf; pinned simulator and official guide.
    Verification: npm test (84 unit, 102 browser, 88 golden frames); Django (7);
    compileall, pip dry run, Compose config/build/start, wheel/sdist smoke
    (15 assets), browser inspection, git diff --check; exact SHA verified on origin/main.
    Notes: Dedicated immutable typed views and paged formatting; later statistical/equation/complex/N-base/matrix/list algorithms remain pending.

### Phase 5 - NORMAL Entry and Arithmetic

Phase 5 implementation `0a16ca6d2fe09fa5a940167044b847ba46d1d64e` was pushed
and verified on origin/main. The user explicitly requested this full phase batch.

- [x] **EL506-090 - Match digit and decimal-point entry.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-090); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-091 - Match Exp scientific-literal entry.** Cover mantissa,
  exponent, cursor editing, sign change, and malformed input.

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-091); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-092 - Match pi and directly accessible constants.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-092); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-093 - Distinguish sign-change/NEG from subtraction.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-093); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-094 - Match addition, subtraction, multiplication, and
  division.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-094); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-095 - Match parentheses, precedence, associativity, and nested
  expressions.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-095); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-096 - Match implied multiplication and automatic closing rules.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-096); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-097 - Match equals and repeated-equals behavior.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-097); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-098 - Match Sharp constant calculations.** Include omitted
  operands, repeated operations, and any K indicator.

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-098); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-099 - Match chained calculations and ANS continuation.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-099); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-100 - Match contextual percent.** Cover increase, decrease,
  percentage-of, and reverse-percentage sequences, including whether percent
  itself evaluates.

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-100); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-101 - Match reciprocal.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-101); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-102 - Match square and cube postfix operations.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-102); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-103 - Match general power entry and evaluation.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-103); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-104 - Match square root, cube root, and nth-root sequencing.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-104); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-105 - Match common logarithm and 10^x.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-105); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-106 - Match natural logarithm and e^x.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-106); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-107 - Inventory and match additional NORMAL MATH-menu scalar
  functions.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-107); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-108 - Match factorial.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-108); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-109 - Match permutations.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-109); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-110 - Match combinations.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-110); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

- [x] **EL506-111 - Match domains and boundaries for every NORMAL function.**

    Completed: 2026-10-07, 0a16ca6d2fe09fa5a940167044b847ba46d1d64e
    Evidence: phase-5-normal-arithmetic-review-v1 (EL506-111); native
    percent/constant/power experiments and golden fixtures; pinned simulator.
    Verification: npm test (132 unit, 109 browser, 114 golden frames), Django (7),
    compileall, pip dry run, Compose config/build/start, wheel/sdist installed
    smoke (15 assets), rebuilt browser inspection and git diff --check.
    Implementation SHA verified on origin/main; tracking published separately.

### Phase 6 - Angles, Trigonometry, Fractions, DMS, and Coordinates

Implementation: 77d65b5b29964504e6a4cd90c585c66aaea187ef verified on origin/main.
User requested the full Phase 6 batch. General memory remains Phase 8;
coordinate X/Y recall is included here. Full device parity is still pending.

- [x] **EL506-120 - Match DEG, RAD, and GRAD setup selection.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-121 - Match DRG cyclic value conversion and indicator changes.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-122 - Match sine, cosine, and tangent.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-123 - Match inverse sine, cosine, and tangent.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-124 - Match hyperbolic sine, cosine, and tangent.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-125 - Match inverse hyperbolic functions.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-126 - Match trig singularities, large angles, inverse domains,
  and mode-dependent rounding.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-127 - Match fraction-entry grammar.** Cover simple, mixed,
  negative, nested, and in-expression fractions.
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-128 - Match exact rational arithmetic and simplification.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-129 - Match fraction/decimal display toggling without losing the
  exact value.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-130 - Match mixed/improper fraction toggling and restoration.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-131 - Match fraction capacity, overflow, and decimal fallback.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-132 - Match DMS entry, validation, normalization, and carry.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-133 - Match reversible DMS/decimal display conversion.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-134 - Match DMS arithmetic, signs, and angle-mode interaction.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-135 - Match rectangular-to-polar conversion.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-136 - Match polar-to-rectangular conversion.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

- [x] **EL506-137 - Match pair separator, component paging, quadrants, signs,
  and active angle-unit behavior.**
    Completed: 2026-10-07, commit 77d65b5b29964504e6a4cd90c585c66aaea187ef.
    Evidence: phase-6-review.json and Phase 6 coordinate, DMS, and fraction
    experiment/golden fixtures, with independent simulator observations.
    Verification: npm test (203 unit, 118 browser, 147 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start, installed
    wheel/sdist smoke (15 assets), browser inspection and git diff --check.

### Phase 7 - Random Numbers, Constants, and Unit Conversions


Phase 7 implementation `d2200d6a93b62d5a224c49d20cc442677033b435` was pushed to
origin/main and its exact remote SHA verified on 2026-10-07. This is the
user-requested EL506-140 through EL506-149 phase batch. The historical primary
catalogue and significant native observations remain distinct evidence;
completion does not establish every hidden native digit or full later-mode
algorithm parity. General memories, formula memories, simulation and solver
continue in Phase 8.

- [x] **EL506-140 - Match random decimal generation.** Verify range
  0.000-0.999, three-decimal display, repeat command, and state effects.

    Completed: 2026-10-07, implementation commit d2200d6a93b62d5a224c49d20cc442677033b435
    Evidence: phase-7-review.json, phase-7-catalogue-reference.json and
    Phase 7 experiment/golden fixtures; pinned manual and primary archive.
    Verification: npm test (312 unit, 127 browser, 160 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (16 assets), report and browser checks,
    and git diff --check.
    Notes: RAND produces thousandths in 0..0.999; ENT repeats the expression, Y keeps the raw sample, and ANS keeps its result.

- [x] **EL506-141 - Match Random Dice generation and repeat sequencing.**

    Completed: 2026-10-07, implementation commit d2200d6a93b62d5a224c49d20cc442677033b435
    Evidence: phase-7-review.json, phase-7-catalogue-reference.json and
    Phase 7 experiment/golden fixtures; pinned manual and primary archive.
    Verification: npm test (312 unit, 127 browser, 160 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (16 assets), report and browser checks,
    and git diff --check.
    Notes: R-DICE produces 1..6 and repeats with ENT through the native menu order.

- [x] **EL506-142 - Match Random Coin generation and repeat sequencing.**

    Completed: 2026-10-07, implementation commit d2200d6a93b62d5a224c49d20cc442677033b435
    Evidence: phase-7-review.json, phase-7-catalogue-reference.json and
    Phase 7 experiment/golden fixtures; pinned manual and primary archive.
    Verification: npm test (312 unit, 127 browser, 160 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (16 assets), report and browser checks,
    and git diff --check.
    Notes: R-COIN produces 0 or 1 and repeats with ENT.

- [x] **EL506-143 - Match Random Integer generation and repeat sequencing.**

    Completed: 2026-10-07, implementation commit d2200d6a93b62d5a224c49d20cc442677033b435
    Evidence: phase-7-review.json, phase-7-catalogue-reference.json and
    Phase 7 experiment/golden fixtures; pinned manual and primary archive.
    Verification: npm test (312 unit, 127 browser, 160 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (16 assets), report and browser checks,
    and git diff --check.
    Notes: R-INT produces 0..99 and repeats with ENT.

- [x] **EL506-144 - Add random property tests.** Test range and distribution
  without requiring the same random stream unless the simulator proves it is
  deterministic and reproducible.

    Completed: 2026-10-07, implementation commit d2200d6a93b62d5a224c49d20cc442677033b435
    Evidence: phase-7-review.json, phase-7-catalogue-reference.json and
    Phase 7 experiment/golden fixtures; pinned manual and primary archive.
    Verification: npm test (312 unit, 127 browser, 160 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (16 assets), report and browser checks,
    and git diff --check.
    Notes: 24,000 range/distribution samples plus endpoint and snapshot checks; no identical private random stream claim.

- [x] **EL506-145 - Match physical-constant menu navigation.**

    Completed: 2026-10-07, implementation commit d2200d6a93b62d5a224c49d20cc442677033b435
    Evidence: phase-7-review.json, phase-7-catalogue-reference.json and
    Phase 7 experiment/golden fixtures; pinned manual and primary archive.
    Verification: npm test (312 unit, 127 browser, 160 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (16 assets), report and browser checks,
    and git diff --check.
    Notes: Two-digit CNST selection, invalid digit correction, cancellation and current display settings are covered.

- [x] **EL506-146 - Match all 52 physical constants.** Record simulator
  identifier, value, units, significant digits, valid modes, and historical
  constant set rather than silently substituting current CODATA values.

    Completed: 2026-10-07, implementation commit d2200d6a93b62d5a224c49d20cc442677033b435
    Evidence: phase-7-review.json, phase-7-catalogue-reference.json and
    Phase 7 experiment/golden fixtures; pinned manual and primary archive.
    Verification: npm test (312 unit, 127 browser, 160 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (16 assets), report and browser checks,
    and git diff --check.
    Notes: All 52 IDs, names, units and historical values use the manual-designated CODATA 2014 primary catalogue. Hidden simulator digits for every value remain unmeasured.

- [x] **EL506-147 - Match metric-conversion menu navigation.**

    Completed: 2026-10-07, implementation commit d2200d6a93b62d5a224c49d20cc442677033b435
    Evidence: phase-7-review.json, phase-7-catalogue-reference.json and
    Phase 7 experiment/golden fixtures; pinned manual and primary archive.
    Verification: npm test (312 unit, 127 browser, 160 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (16 assets), report and browser checks,
    and git diff --check.
    Notes: CONV numbered entry, DEL correction, cancellation and immediate successful calculation match significant native frames.

- [x] **EL506-148 - Match all 44 metric conversions.** Verify both directions,
  labels, units, rounding, modes, and errors.

    Completed: 2026-10-07, implementation commit d2200d6a93b62d5a224c49d20cc442677033b435
    Evidence: phase-7-review.json, phase-7-catalogue-reference.json and
    Phase 7 experiment/golden fixtures; pinned manual and primary archive.
    Verification: npm test (312 unit, 127 browser, 160 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (16 assets), report and browser checks,
    and git diff --check.
    Notes: All 44 directions, inverse pairs, Fahrenheit offset, fractions, ANS, scientific input, output rounding and Error 2 boundaries are covered.

- [x] **EL506-149 - Match constants and conversions inside expressions,
  memories, and every permitted mode.**

    Completed: 2026-10-07, implementation commit d2200d6a93b62d5a224c49d20cc442677033b435
    Evidence: phase-7-review.json, phase-7-catalogue-reference.json and
    Phase 7 experiment/golden fixtures; pinned manual and primary archive.
    Verification: npm test (312 unit, 127 browser, 160 golden frames),
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (16 assets), report and browser checks,
    and git diff --check.
    Notes: NORMAL scalar STO/RCL retains catalogue precision and evaluated results without recalculation. Documented scalar entry/mode gates and EQN prompt continuation are covered; complete later-mode algorithms and general memory audits retain their later owners.

### Phase 8 - Memories, Formula Memories, Simulation, and Solver

Phase 8 implementation `793fb959fc8fcfd7be1645483b6923566d2aebe6` was pushed
to origin/main and its exact remote SHA verified on 2026-10-07. This is the
user-requested EL506-160 through EL506-173 batch. Native significant frames
remain independent of intermediate implementation characterizations. Snapshot
9 migrates schemas 1-8. Full later-mode algorithms, unobserved editing edges,
and private solver iteration/stopping criteria remain explicit parity gaps;
completion of this phase does not establish full emulator parity.

- [x] **EL506-160 - Implement temporary memories A-F, X, and Y.**

    Completed: 2026-10-07, implementation commit 793fb959fc8fcfd7be1645483b6923566d2aebe6
    Evidence: phase-8-review.json, Phase 8 memory/solver experiment and golden
    fixtures, pinned full manual and Operation Guide; phase8 unit/browser tests.
    Verification: npm test passed (345 unit, 134 browser, 226 golden frames),
    final full unit suite (350), focused module/memory/solver/browser checks,
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (17 assets), report and browser checks,
    git diff --check.
    Notes: A-F, X and Y retain numeric and exact rational/DMS tagged values; coordinate/random writes keep typed stores synchronized.

- [x] **EL506-161 - Match STO selection, overwrite, cancellation, and display.**

    Completed: 2026-10-07, implementation commit 793fb959fc8fcfd7be1645483b6923566d2aebe6
    Evidence: phase-8-review.json, Phase 8 memory/solver experiment and golden
    fixtures, pinned full manual and Operation Guide; phase8 unit/browser tests.
    Verification: npm test passed (345 unit, 134 browser, 226 golden frames),
    final full unit suite (350), focused module/memory/solver/browser checks,
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (17 assets), report and browser checks,
    git diff --check.
    Notes: STO selection retains the display with ALPHA, overwrites its target, and ON/C cancels. Evaluated values are stored without recalculating random or ANS-based results.

- [x] **EL506-162 - Match RCL selection and recalled-value insertion.**

    Completed: 2026-10-07, implementation commit 793fb959fc8fcfd7be1645483b6923566d2aebe6
    Evidence: phase-8-review.json, Phase 8 memory/solver experiment and golden
    fixtures, pinned full manual and Operation Guide; phase8 unit/browser tests.
    Verification: npm test passed (345 unit, 134 browser, 226 golden frames),
    final full unit suite (350), focused module/memory/solver/browser checks,
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (17 assets), report and browser checks,
    git diff --check.
    Notes: Standalone RCL shows slot= without changing ANS. During entry it inserts a late-bound variable and previews its value.

- [x] **EL506-163 - Match independent memory M, M+, and M-.**

    Completed: 2026-10-07, implementation commit 793fb959fc8fcfd7be1645483b6923566d2aebe6
    Evidence: phase-8-review.json, Phase 8 memory/solver experiment and golden
    fixtures, pinned full manual and Operation Guide; phase8 unit/browser tests.
    Verification: npm test passed (345 unit, 134 browser, 226 golden frames),
    final full unit suite (350), focused module/memory/solver/browser checks,
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (17 assets), report and browser checks,
    git diff --check.
    Notes: M+ and 2ndF M+ accumulate or subtract the current operand; the lower display is the operand. Recall followed by M+ uses the recalled slot, not an older ANS.

- [x] **EL506-164 - Match the M display indicator.**

    Completed: 2026-10-07, implementation commit 793fb959fc8fcfd7be1645483b6923566d2aebe6
    Evidence: phase-8-review.json, Phase 8 memory/solver experiment and golden
    fixtures, pinned full manual and Operation Guide; phase8 unit/browser tests.
    Verification: npm test passed (345 unit, 134 browser, 226 golden frames),
    final full unit suite (350), focused module/memory/solver/browser checks,
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (17 assets), report and browser checks,
    git diff --check.
    Notes: M indicator covers nonzero real or imaginary independent memory. Complex mode numerical controllers remain Phase 14.

- [x] **EL506-165 - Match ANS updates and recall for every result type and
  mode.**

    Completed: 2026-10-07, implementation commit 793fb959fc8fcfd7be1645483b6923566d2aebe6
    Evidence: phase-8-review.json, Phase 8 memory/solver experiment and golden
    fixtures, pinned full manual and Operation Guide; phase8 unit/browser tests.
    Verification: npm test passed (345 unit, 134 browser, 226 golden frames),
    final full unit suite (350), focused module/memory/solver/browser checks,
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (17 assets), report and browser checks,
    git diff --check.
    Notes: Shared typed result boundary applies manual mode eligibility: EQN and formatted matrix/list/statistics pages preserve ANS. Full later-mode numerical controllers remain deferred.

- [x] **EL506-166 - Complete the memory persistence matrix.** Verify ON/C, CA,
  HOME, mode changes, power cycle, and reset for every store.

    Completed: 2026-10-07, implementation commit 793fb959fc8fcfd7be1645483b6923566d2aebe6
    Evidence: phase-8-review.json, Phase 8 memory/solver experiment and golden
    fixtures, pinned full manual and Operation Guide; phase8 unit/browser tests.
    Verification: npm test passed (345 unit, 134 browser, 226 golden frames),
    final full unit suite (350), focused module/memory/solver/browser checks,
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (17 assets), report and browser checks,
    git diff --check.
    Notes: Tests cover all eight temporary variables, M, all four formulas, matrix/list slots and statistics across ON/C, CA, HOME, every mode, power/idle and reset. Seeded later-mode data do not claim later-mode calculation parity.

- [x] **EL506-167 - Implement formula memories F1-F4 as token streams.**

    Completed: 2026-10-07, implementation commit 793fb959fc8fcfd7be1645483b6923566d2aebe6
    Evidence: phase-8-review.json, Phase 8 memory/solver experiment and golden
    fixtures, pinned full manual and Operation Guide; phase8 unit/browser tests.
    Verification: npm test passed (345 unit, 134 browser, 226 golden frames),
    final full unit suite (350), focused module/memory/solver/browser checks,
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (17 assets), report and browser checks,
    git diff --check.
    Notes: F1-F4 store lexical token arrays and recall editable expressions. Snapshot 9 migrates older string stores.

- [x] **EL506-168 - Match formula capacity, replacement, recall, editing,
  deletion, persistence, and late-bound variables.**

    Completed: 2026-10-07, implementation commit 793fb959fc8fcfd7be1645483b6923566d2aebe6
    Evidence: phase-8-review.json, Phase 8 memory/solver experiment and golden
    fixtures, pinned full manual and Operation Guide; phase8 unit/browser tests.
    Verification: npm test passed (345 unit, 134 browser, 226 golden frames),
    final full unit suite (350), focused module/memory/solver/browser checks,
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (17 assets), report and browser checks,
    git diff --check.
    Notes: Shared 256-character capacity, function atoms, replacement and late binding are tested. Native blank STO replaces a formula with literal 0; MEM clear/reset delete formulas. Live 256-character exhaustion is unmeasured.

- [x] **EL506-169 - Match ALGB/simulation variable discovery and prompt order.**

    Completed: 2026-10-07, implementation commit 793fb959fc8fcfd7be1645483b6923566d2aebe6
    Evidence: phase-8-review.json, Phase 8 memory/solver experiment and golden
    fixtures, pinned full manual and Operation Guide; phase8 unit/browser tests.
    Verification: npm test passed (345 unit, 134 browser, 226 golden frames),
    final full unit suite (350), focused module/memory/solver/browser checks,
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (17 assets), report and browser checks,
    git diff --check.
    Notes: Token discovery orders variables by first appearance, including beside numeric coefficients. Native B+A prompts B before A.

- [x] **EL506-170 - Match simulation value entry and repeated runs.** Preserve
  previous prompted values exactly where the simulator does.

    Completed: 2026-10-07, implementation commit 793fb959fc8fcfd7be1645483b6923566d2aebe6
    Evidence: phase-8-review.json, Phase 8 memory/solver experiment and golden
    fixtures, pinned full manual and Operation Guide; phase8 unit/browser tests.
    Verification: npm test passed (345 unit, 134 browser, 226 golden frames),
    final full unit suite (350), focused module/memory/solver/browser checks,
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (17 assets), report and browser checks,
    git diff --check.
    Notes: Numeric values are accepted with ENT, retained in their stores, and offered on repeat. Mantissa/exponent limits follow the existing physical numeric entry behavior.

- [x] **EL506-171 - Match simulation navigation, cancellation, errors, and
  retained inputs.**

    Completed: 2026-10-07, implementation commit 793fb959fc8fcfd7be1645483b6923566d2aebe6
    Evidence: phase-8-review.json, Phase 8 memory/solver experiment and golden
    fixtures, pinned full manual and Operation Guide; phase8 unit/browser tests.
    Verification: npm test passed (345 unit, 134 browser, 226 golden frames),
    final full unit suite (350), focused module/memory/solver/browser checks,
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (17 assets), report and browser checks,
    git diff --check.
    Notes: Observed RIGHT/DOWN do not advance variables. ON/C clears command but retains confirmed values; numeric syntax/domain errors and unconfirmed-entry cancellation are covered. Unobserved editing edges remain explicit.

- [x] **EL506-172 - Discover and implement the advertised generic solver
  workflow.** Capture formula entry, target, initial estimate, prompts, result,
  and repeat sequence.

    Completed: 2026-10-07, implementation commit 793fb959fc8fcfd7be1645483b6923566d2aebe6
    Evidence: phase-8-review.json, Phase 8 memory/solver experiment and golden
    fixtures, pinned full manual and Operation Guide; phase8 unit/browser tests.
    Verification: npm test passed (345 unit, 134 browser, 226 golden frames),
    final full unit suite (350), focused module/memory/solver/browser checks,
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (17 assets), report and browser checks,
    git diff --check.
    Notes: MATH 0 solves an X expression for zero; Start defaults to 0 and dx to 0.00001. Success stores X/ANS; ENT repeats with the previous root. Failure clears X and preserves prior ANS.

- [x] **EL506-173 - Match solver numerical behavior.** Cover convergence,
  multiple roots, starting-value sensitivity, tolerance, iteration limit, and
  failure display.

    Completed: 2026-10-07, implementation commit 793fb959fc8fcfd7be1645483b6923566d2aebe6
    Evidence: phase-8-review.json, Phase 8 memory/solver experiment and golden
    fixtures, pinned full manual and Operation Guide; phase8 unit/browser tests.
    Verification: npm test passed (345 unit, 134 browser, 226 golden frames),
    final full unit suite (350), focused module/memory/solver/browser checks,
    Django (7), compileall, pip dry run, Compose config/build/start,
    installed wheel/sdist smoke (17 assets), report and browser checks,
    git diff --check.
    Notes: Finite-difference Newton iteration is bounded at 100 iterations. Tests cover convergence, multiple roots, start sensitivity, dx/tolerance/domain failures and bounded work. Exact private native iteration limits/stopping rules are unmeasured, so full numerical algorithm parity is not claimed.

### Phase 9 - N-base Operations

User requested the full Phase 9 batch (EL506-180 through EL506-189).
Completed: 2026-10-07. Implementation commit
09e34af380be114aab54d737b235762517caef51 was published to origin/main and its
exact remote SHA verified. All ten Phase 9 items are complete; next is EL506-200.

Verification: npm test passed (403 unit, 140 browser, 293 golden frames); final
full unit suite passed (404), focused final memory/compatibility/golden checks,
Django (7), compileall, pip dry run, Compose config/build/start, installed
wheel/sdist smoke (18 assets), report and open browser checks, git diff --check.
Native runtime and agent-opened extractor were closed after verification.

Evidence: `tests/reference/el506ts/phase-9-review.json`, Phase 9 experiment and
67-frame golden fixture, pinned full manual, unit/browser coverage and generated
parity report. Native ten-digit complements, invalid BIN digits, OR/AND priority,
XOR/XNOR, NOT/NEG, HOME and DEC 512-to-BIN Error 2 were observed. Other boundaries
and all memory/base pairs supplement native evidence with manual-backed tests.
Native viewport/raw-state differences, cursor timing, deep buffer transitions and
unmeasured pental logical corner cases remain explicit; completion is not full
simulator parity. Snapshot 10 preserves the selected base and radix-complement
memories; schemas 1-9 migrate in memory.

- [x] **EL506-180 - Match DEC, BIN, PEN, OCT, and HEX selection and indicators.**

    Completed: 2026-10-07, implementation commit 09e34af380be114aab54d737b235762517caef51
    Evidence and verification: shared Phase 9 completion record above.

- [x] **EL506-181 - Match base-specific digit entry.** Include hexadecimal
  A-F mapping and invalid digits.

    Completed: 2026-10-07, implementation commit 09e34af380be114aab54d737b235762517caef51
    Evidence and verification: shared Phase 9 completion record above.

- [x] **EL506-182 - Match conversion of the displayed value among all five
  bases.**

    Completed: 2026-10-07, implementation commit 09e34af380be114aab54d737b235762517caef51
    Evidence and verification: shared Phase 9 completion record above.

- [x] **EL506-183 - Match arithmetic and parentheses in every base.**

    Completed: 2026-10-07, implementation commit 09e34af380be114aab54d737b235762517caef51
    Evidence and verification: shared Phase 9 completion record above.

- [x] **EL506-184 - Match N-base memory and ANS behavior.**

    Completed: 2026-10-07, implementation commit 09e34af380be114aab54d737b235762517caef51
    Evidence and verification: shared Phase 9 completion record above.

- [x] **EL506-185 - Match AND and OR.**

    Completed: 2026-10-07, implementation commit 09e34af380be114aab54d737b235762517caef51
    Evidence and verification: shared Phase 9 completion record above.

- [x] **EL506-186 - Match XOR and XNOR.**

    Completed: 2026-10-07, implementation commit 09e34af380be114aab54d737b235762517caef51
    Evidence and verification: shared Phase 9 completion record above.

- [x] **EL506-187 - Match NOT and NEG.**

    Completed: 2026-10-07, implementation commit 09e34af380be114aab54d737b235762517caef51
    Evidence and verification: shared Phase 9 completion record above.

- [x] **EL506-188 - Determine and match word width and signed representation.**
  Cover two's complement, leading digits, negative display, and cross-base
  interpretation.

    Completed: 2026-10-07, implementation commit 09e34af380be114aab54d737b235762517caef51
    Evidence and verification: shared Phase 9 completion record above.

- [x] **EL506-189 - Match N-base limits and errors.** Cover fractions,
  overflow, range, invalid syntax, unavailable functions, and conversions.

    Completed: 2026-10-07, implementation commit 09e34af380be114aab54d737b235762517caef51
    Evidence and verification: shared Phase 9 completion record above.

### Phase 10 - Numerical Differentiation and Integration

User requested the full Phase 10 batch (EL506-200 through EL506-207).
Completed: 2026-10-07. Implementation commit
4d6c53c44e376497eae33092ee6f6dfb7a9588dc was published to origin/main and its
exact remote SHA verified. All eight Phase 10 items are complete; next is
EL506-220. Completion remains scoped to the evidence and limitations below.

Verification: npm test passed (418 unit, 147 browser, 335 golden frames),
focused calculus/NORMAL arithmetic checks (62), Django (7), compileall, pip dry
run, Compose config, installed wheel/sdist smoke (19 assets), report checks,
live browser display checks and git diff --check. Docker build/start was
attempted, but Docker Desktop's Linux backend pipe is unavailable; the local
Django server at 127.0.0.1:8010 exercised the browser suite and remains open.
Agent-opened native runtime and extractor were confirmed closed.

Evidence: `tests/reference/el506ts/phase-10-review.json`, calculus experiment
and 42-frame golden fixture (24 independent native checkpoints), pinned manual
section 6, visually inspected guide pages 31-32, unit/browser mappings and
generated parity report. Native polynomial derivatives/integrals, prompts,
default dx/n, integration repeat and n=0 Error 2/recovery were observed. The
guide integral agrees at 0.785357562; its earlier OCR transcription was corrected.

Notes: Central differences and composite Simpson (2*n panels) use fourteen-
digit sample arithmetic as an explicit approximation. The guide derivative
shows 0.577350268 natively versus 0.57735027 here (2e-9 absolute difference).
Private rounding, all discontinuities, native resource limits and cancellation
timing remain unmeasured; full native numerical parity is not claimed. Web work
is bounded to 10000 Simpson pairs, 64 samples per animation frame and 1000-
character formulas. Numeric fractions use the user's stacked display. ON/C
cancellation, numeric/domain failures, memories/angles, snapshots, stale-job
protection and general powers of variables have implementation coverage.
Snapshot remains schema 10; the package version remains 0.3.1.

- [x] **EL506-200 - Match the differentiation template and cursor sequence.**

    Completed: 2026-10-07, implementation commit 4d6c53c44e376497eae33092ee6f6dfb7a9588dc
    Evidence and verification: shared Phase 10 completion record above.
    Notes: native/private numerical limits and precision gap remain explicit.

- [x] **EL506-201 - Match derivative expression, variable, point, editing, and
  confirmation.**

    Completed: 2026-10-07, implementation commit 4d6c53c44e376497eae33092ee6f6dfb7a9588dc
    Evidence and verification: shared Phase 10 completion record above.
    Notes: native/private numerical limits and precision gap remain explicit.

- [x] **EL506-202 - Match the simulator's numerical differentiation
  algorithm and displayed precision.**

    Completed: 2026-10-07, implementation commit 4d6c53c44e376497eae33092ee6f6dfb7a9588dc
    Evidence and verification: shared Phase 10 completion record above.
    Notes: native/private numerical limits and precision gap remain explicit.

- [x] **EL506-203 - Match the integration template and cursor sequence.**

    Completed: 2026-10-07, implementation commit 4d6c53c44e376497eae33092ee6f6dfb7a9588dc
    Evidence and verification: shared Phase 10 completion record above.
    Notes: native/private numerical limits and precision gap remain explicit.

- [x] **EL506-204 - Match integrand, bounds, variable, optional parameters,
  editing, and confirmation.**

    Completed: 2026-10-07, implementation commit 4d6c53c44e376497eae33092ee6f6dfb7a9588dc
    Evidence and verification: shared Phase 10 completion record above.
    Notes: native/private numerical limits and precision gap remain explicit.

- [x] **EL506-205 - Match the simulator's numerical integration algorithm and
  displayed precision.**

    Completed: 2026-10-07, implementation commit 4d6c53c44e376497eae33092ee6f6dfb7a9588dc
    Evidence and verification: shared Phase 10 completion record above.
    Notes: native/private numerical limits and precision gap remain explicit.

- [x] **EL506-206 - Match angle modes, constants, variables, and memories
  inside calculus expressions.**

    Completed: 2026-10-07, implementation commit 4d6c53c44e376497eae33092ee6f6dfb7a9588dc
    Evidence and verification: shared Phase 10 completion record above.
    Notes: native/private numerical limits and precision gap remain explicit.

- [x] **EL506-207 - Match calculus cancellation and failures.** Cover
  discontinuity, singularity, non-convergence, time/resource limits, and exact
  error recovery.

    Completed: 2026-10-07, implementation commit 4d6c53c44e376497eae33092ee6f6dfb7a9588dc
    Evidence and verification: shared Phase 10 completion record above.
    Notes: native/private numerical limits and precision gap remain explicit.

### Phase 11 - Statistics Data Management

User requested the full Phase 11 batch (EL506-220 through EL506-231).
Completed: 2026-10-07. Implementation commit
83d3e9706a294d2e232f785e21c55962ff31ed74 was published to origin/main and its
exact remote SHA verified. All twelve Phase 11 items are complete; next is
EL506-240. Completion remains scoped to the evidence and limitations below.

Verification: npm test passed (433 unit, 154 browser, 401 golden frames),
focused statistics/browser checks, Django (7), compileall, pip dry runs,
Compose config, installed wheel/sdist smoke (19 assets), report checks,
live browser display and git diff --check. Explicit STAT ledger mappings were
then added and verified with five report/golden unit tests and the report
browser test. Docker build/start was attempted but its Linux backend pipe is
unavailable; the local Django server at 127.0.0.1:8010 exercised browser tests.
Agent-opened native runtime and extractor were confirmed closed.

Evidence: `tests/reference/el506ts/phase-11-review.json`, statistics experiment
and 66-frame golden fixture (40 independent native checkpoints), pinned full
manual statistics/data/capacity/error sections, unit/browser mappings and
regenerated parity report. SD and paired data, field/whole-record corrections,
frequency signs/fractions/zero, CD deletion, browsing, ON/C recovery, power
persistence and CA were observed in the exact pinned simulator.

Notes: The native frequency label is Nn= rather than Fn=. STAT exposes seven
submodes; three-variable STAT is inapplicable. The third paired operand is a
frequency, while 3-VLE belongs to EQN. Capacity is 100 storage slots, with one
extra slot for explicit frequency; full/partial/range errors are atomic.
The full manual defines capacity/Error 3; the simulator was not filled with
101 live records. Hidden precision at extreme boundaries, cross-mode buffers
and all private rounding remain the later audit; full parity is not claimed.
Physical means, deviations and regression algorithms remain Phase 12.
Snapshot schema 11 retains entry/browse metadata and migrates schemas 1–10;
the package version remains 0.3.1. The requested 12px legends and fraction
layout remain covered by the existing UI regressions.

- [x] **EL506-220 - Match the STAT menu.** Include SD plus LINE, QUAD, EXP,
  LOG, POWER, and INV selections and indicators.

    Completed: 2026-10-07, implementation commit 83d3e9706a294d2e232f785e21c55962ff31ed74
    Evidence and verification: shared Phase 11 completion record above.
    Notes: Native seven selections use PWR; results/regressions remain Phase 12.

- [x] **EL506-221 - Match one-variable data entry.**

    Completed: 2026-10-07, implementation commit 83d3e9706a294d2e232f785e21c55962ff31ed74
    Evidence and verification: shared Phase 11 completion record above.
    Notes: Physical DATA stores scalar observations and displays record count.

- [x] **EL506-222 - Match frequency entry and weighted observations.**

    Completed: 2026-10-07, implementation commit 83d3e9706a294d2e232f785e21c55962ff31ed74
    Evidence and verification: shared Phase 11 completion record above.
    Notes: Signed/fractional frequencies retained; explicit frequency consumes a slot.

- [x] **EL506-223 - Match two-variable paired entry and separator behavior.**

    Completed: 2026-10-07, implementation commit 83d3e9706a294d2e232f785e21c55962ff31ed74
    Evidence and verification: shared Phase 11 completion record above.
    Notes: Comma separates X/Y; a third operand is frequency.

- [x] **EL506-224 - Resolve any regional/simulator claim of three-variable
  statistics.** Do not add it unless this exact EL-506TS simulator exposes it.

    Completed: 2026-10-07, implementation commit 83d3e9706a294d2e232f785e21c55962ff31ed74
    Evidence and verification: shared Phase 11 completion record above.
    Notes: Proven inapplicable: no three-variable STAT in the pinned seven-choice menu.

- [x] **EL506-225 - Match dataset clear and persistence rules.**

    Completed: 2026-10-07, implementation commit 83d3e9706a294d2e232f785e21c55962ff31ed74
    Evidence and verification: shared Phase 11 completion record above.
    Notes: ON/C/power preserve data; CA, HOME, confirmed mode/submode and reset clear.

- [x] **EL506-226 - Match oldest-first and newest-first dataset browsing.**

    Completed: 2026-10-07, implementation commit 83d3e9706a294d2e232f785e21c55962ff31ed74
    Evidence and verification: shared Phase 11 completion record above.
    Notes: DOWN starts oldest X; UP starts newest frequency; boundaries clamp.

- [x] **EL506-227 - Match X, Y, F, sequence-number, and hidden-data displays.**

    Completed: 2026-10-07, implementation commit 83d3e9706a294d2e232f785e21c55962ff31ed74
    Evidence and verification: shared Phase 11 completion record above.
    Notes: Native frequency is labeled Nn=, not Fn=; indexed fields and hidden arrows match.

- [x] **EL506-228 - Match single-field data correction and commit.**

    Completed: 2026-10-07, implementation commit 83d3e9706a294d2e232f785e21c55962ff31ed74
    Evidence and verification: shared Phase 11 completion record above.
    Notes: DATA commits current field; ENT evaluates without dataset commit.

- [x] **EL506-229 - Match whole-record data correction.**

    Completed: 2026-10-07, implementation commit 83d3e9706a294d2e232f785e21c55962ff31ed74
    Evidence and verification: shared Phase 11 completion record above.
    Notes: Comma-separated correction replaces a whole record from any selected field.

- [x] **EL506-230 - Match record deletion and addition while browsing.**

    Completed: 2026-10-07, implementation commit 83d3e9706a294d2e232f785e21c55962ff31ed74
    Evidence and verification: shared Phase 11 completion record above.
    Notes: Shifted CD removes the selected record; ON/C allows addition; indices renumber.

- [x] **EL506-231 - Match dataset capacity and errors.** Cover frequency
  limits, zero/negative frequency, partial records, and full-data behavior.

    Completed: 2026-10-07, implementation commit 83d3e9706a294d2e232f785e21c55962ff31ed74
    Evidence and verification: shared Phase 11 completion record above.
    Notes: 100 storage slots and Error 3 use the full manual; zero/sign/partial/full/range cases tested; native extreme hidden digits remain the later audit.

### Phase 12 - Statistics Results and Regressions

#### Authorized 44-item batch — implementation published (2026-10-08)

The user's explicit request to complete the next 44 parts authorizes this batch
across EL506-240–255, EL506-260–268, EL506-280–287, and EL506-300–310.
EL506-311–313 remain outside the batch. Implementation commit
`3df89deda3bf1135cc06d575374aab6dd4b10c14` has been pushed to origin/main and
verified there. This separate tracking update records the 44 completions; its
publication and remote verification finish the batch.

Evidence: pinned Sharp simulator 1.0.2.0; `phase12-native-notes.json` records
396 canonical keys and 111 independent significant LCD checkpoints. The
`phase12-15-native` experiment and golden fixture retain that trace. Independent
printed guide results are replayed by `guide-p34-weighted-statistics-replay`,
`guide-p36-statistics-correction-replay`, and `guide-p38-paired-statistics-replay`.
Algorithm/domain tests cover weighted statistics, all six regression families,
linear and polynomial equations, complex arithmetic and memory, and the scoped
matrix operations. Golden intermediate state frames remain application
regression assertions; they do not claim independent native parity.

Verification: `npm test` passes 465 unit tests, 981 asserted golden frames and
165 browser tests, with reference validators, engine and report checks passing.
`python -m compileall src/scientific_calculator`, seven Django integration tests,
`python -m pip install --dry-run --no-deps .`, `docker compose config --quiet`,
and `git diff --check` pass. The isolated installed-wheel/sdist smoke verifies
23 packaged assets and no local references or runtime files. Browser checks
include keyboard/pointer/touch, two-widget isolation, dark/override themes,
focus, contrast, reduced motion, errors, and fraction geometry. Native windows
opened for the evidence work have been closed; the local Django demo remains
available at port 8010.

Notes: Docker Desktop's Linux engine pipe is unavailable, so container startup
could not be verified; the local Django demo and Compose configuration pass.
Package version stays 0.3.1, and snapshot schema stays 11. Hidden digits,
cursor timing and exhaustive cross-mode limits remain the later parity audit.
Matrix ANS/memory/persistence, complete limit parity, and the guide transition
example remain EL506-311–313. No private manual or simulator binary is shipped.

- [x] **EL506-240 - Match one-variable mean.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-241 - Match sample standard deviation.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-242 - Match population standard deviation.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-243 - Match count, sum, and sum of squares.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-244 - Match two-variable X and Y means and deviations.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-245 - Match X/Y sums, squares, and sum of products.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-246 - Discover and match normal-probability functions exposed
  by the simulator.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-247 - Match linear regression y = a + bx.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-248 - Match quadratic regression y = a + bx + cx^2.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-249 - Match exponential regression y = ae^(bx).**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-250 - Match logarithmic regression y = a + b ln(x).**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-251 - Match power regression y = ax^b.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-252 - Match inverse regression y = a + b/x.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-253 - Match all regression coefficients, correlation values,
  and X-hat/Y-hat estimates.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-254 - Match regression domains and errors.** Cover transformed
  input restrictions, degeneracy, insufficient data, precision, and recovery.

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-255 - Reproduce every guide statistics result to the simulator's
  displayed precision.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

### Phase 13 - Equation Mode

- [x] **EL506-260 - Match the EQN menu and coefficient-prompt controller.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-261 - Match two-variable simultaneous linear equations.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-262 - Match three-variable simultaneous linear equations.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-263 - Match quadratic equations.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-264 - Match cubic equations.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-265 - Match coefficient navigation, correction, defaults, and
  retained values.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-266 - Match solution paging, labels, ordering, and indicators.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-267 - Match degenerate equation cases.** Cover repeated and
  complex roots, zero leading coefficients, inconsistent/dependent systems,
  and ill-conditioned systems.

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-268 - Match EQN errors, recovery, HOME, mode exit, and
  persistence.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

### Phase 14 - Complex Mode

- [x] **EL506-280 - Match CPLX entry and the i key sequence.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-281 - Match rectangular complex entry and editing.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-282 - Match complex arithmetic, parentheses, and supported
  powers.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-283 - Inventory and match every complex-compatible MATH
  function.** Include real, imaginary, conjugate, magnitude, or argument only
  when exposed by the simulator.

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-284 - Match rectangular/polar conversion and angle units.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-285 - Match component paging and indicators.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-286 - Match complex ANS and memory behavior.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-287 - Match complex branches, rounding, unavailable functions,
  divide-by-zero, errors, and recovery.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

### Remaining-phase batch review (2026-10-08)

The user authorized work across all 44 remaining items. The current batch
implements LIST operations and collection buffers, adds security/resource
budgets, expands browser/package checks, and fixes independently checked guide
regressions. Its evidence is in
`tests/reference/el506ts/remaining-phase-review.json` and the canonical
`phase16-native` experiment/golden trace (218 keys, 63 observed checkpoints).
All 52 guide workflows and 148 printed checkpoints now have application
regressions; the derivative discrepancy is explicitly recorded rather than
accepted as parity.

Published scoped implementation batch: EL506-311, EL506-313, EL506-321, EL506-322, EL506-324,
EL506-362, EL506-363, and EL506-370 through EL506-382 (20 items). Implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007 was pushed and its exact SHA verified
on origin/main. This separate tracking commit records the 20 scoped completions.
The implementation carried **READY_TO_PUSH** after local gates passed. The 537-case browser run passed 493 cases and
skipped 38 platform-specific cases; its six ordinary upper-fraction failures
were corrected and all affected cases passed in the subsequent 78-case display
and guide run (76 passed, two Chromium-only touch skips). Current unit suite:
534 passed; golden characterization: 1,200 frames; report/reference checks,
seven Django integration tests, compileall, Compose config, dependency/license
checks, and clean wheel/sdist installation with 24 assets passed. Docker Linux
engine remains unavailable locally, so the local Django demo exercised port
8010. No 1.0.0 parity claim follows from this scoped publication.

The other 24 items remain open. In particular, LIST algorithms and menu
inventory do not prove exhaustive operation/type compatibility. Current error
placement, capacities, cross-mode persistence, modifier/type matrices, internal
precision, and all 430 ledger operations need their final differential audit.
The derivative display still differs. Function-fraction upper-line glyphs now
match the independent native checkpoint. Full-manual menu and ALGB blinking
exceptions passed in Chromium, Firefox and WebKit, including reduced motion. EL506-362 means the
complete guide regression suite exists, not that its recorded discrepancies
are waived. No release candidate or 1.0.0 tag is authorized by a passing
partial regression suite alone; the final release gates remain in force.

### Phase 15 - Matrix Mode

- [x] **EL506-300 - Discover and record matrix menus, slots, aliases, and
  maximum dimensions.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-301 - Match matrix dimension prompts.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-302 - Match row-major cell entry, labels, navigation,
  correction, and storage.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-303 - Match stored-matrix recall and display.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-304 - Match result dimensions and cell-by-cell paging.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-305 - Match matrix addition and subtraction.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-306 - Match matrix multiplication and scalar/matrix operations.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-307 - Match square, cube, and supported integer powers.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-308 - Match matrix inverse.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-309 - Match matrix transpose.**

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-310 - Inventory and match every additional matrix-menu
  operation.** Include determinant or cumulative operations only when exposed.

    Completed: 2026-10-08, implementation commit 3df89deda3bf1135cc06d575374aab6dd4b10c14
    Evidence and verification: shared authorized 44-item batch record above.
    Notes: Scoped behavior and tests complete; later parity audit and EL506-311–313 remain as recorded above.

- [x] **EL506-311 - Match matrix ANS, memory, copy, replacement, and
  persistence.**

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

Matrix limits review (2026-10-08): implementation commit
c0df14138bb4345380c010faf241a5ac305bb22c pushed and its exact SHA verified on origin/main.
142 independently inspected native keys cover 46 significant LCD checkpoints;
the first 133 keys and all 44 matrix checkpoints are replayed in phase15.test.js.
They distinguish invalid dimensions (7), shape mismatch/non-square inverse (8),
oversized computed augmentation (9), undefined operand (10), singular inverse (2)
and unsupported type/matrix division (1). Dimension edits clear buffer cells;
unchanged dimensions retain cells, CHK of undefined slots clears the buffer, and
fault navigation retains the final entered digit at the measured cursor.
ALGB is unavailable and consumes 2nd F in MAT/CPLX/LIST. The independent oracle is
experiments/matrix-errors-native.json; application output did not supply it.
Validation: npm.cmd test -- tests/e2e/phase13-15.spec.js --workers=3 passed
538 unit tests, reference/guide/ledger validators, 29 golden fixtures (1200
asserted frames), current report, and all 18 browser cases across Chromium,
Firefox and WebKit. Python compileall, compose config and git diff --check passed.
Docker engine remains unavailable; the local Django demo was used.
Final cross-mode/type/capacity audits remain separate pending tasks.

- [x] **EL506-312 - Match matrix limits and errors.** Cover dimension mismatch,
  non-square, singular, oversized, empty slot, and division restrictions.

    Completed: 2026-10-08, implementation commit c0df14138bb4345380c010faf241a5ac305bb22c
    Evidence and verification: matrix limits review above; 44 independent matrix LCD checkpoints, 538 unit tests and 18 browser tests.
    Notes: Final cross-mode/type/precision audit and release gates remain pending.
- [x] **EL506-313 - Reproduce the guide transition-matrix example including
  result paging.**

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.


### Phase 16 - LIST Mode

The operation guide names LIST mode but does not document its behavior. Do not
guess any item in this phase; observe it in the reference simulator first.

- [x] **EL506-320 - Inventory every LIST menu and shifted-key action.**

    Completed: 2026-10-08, implementation commit bfea7d39f18882f9cc086238cb2f377fe7bf29b2
    Evidence: list-inventory.json; native menu-inventory frames 56..73;
    physical-key-reference.json, all 48 panel positions and modifier legends.
    Verification: 544 unit tests; 29 golden fixtures/1200 frames; 27 LIST browser
    cases across Chromium/Firefox/WebKit; compileall, compose config, diff check.
    Browser runner exited 0 after its finished WebKit worker required cleanup;
    list-inventory-browser.log retains all 27 passing cases and final summary.
    Notes: Exposure inventory complete; availability and dispatch remain EL506-358.
    Implementation SHA verified on origin/main before this tracking commit.

- [x] **EL506-321 - Determine and match list slots, aliases, and capacity.**

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-322 - Match list length and element-entry prompts.**

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-323 - Match list navigation, correction, insertion, deletion,
  and replacement.**

    Completed: 2026-10-08, implementation commit a9686934fbd4c9d9e479b8c16cd65523663fd5a9
    Evidence: collection-operations-native experiment and list-operations-review.json; 341 independent native keys and significant LCD checkpoints.
    Verification: 540 unit tests, 29 golden fixtures / 1200 frames, 15 LIST browser tests across three engines; nine-aggregate replay passed all three after correcting the WebKit test time budget. Python compileall and Compose config passed.
    Notes: Published SHA verified against origin/main. Full parity and release gates remain pending.

- [x] **EL506-324 - Match list recall and element-by-element result paging.**

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-325 - Match list/list arithmetic.**

    Completed: 2026-10-08, implementation commit a9686934fbd4c9d9e479b8c16cd65523663fd5a9
    Evidence: collection-operations-native experiment and list-operations-review.json; 341 independent native keys and significant LCD checkpoints.
    Verification: 540 unit tests, 29 golden fixtures / 1200 frames, 15 LIST browser tests across three engines; nine-aggregate replay passed all three after correcting the WebKit test time budget. Python compileall and Compose config passed.
    Notes: Published SHA verified against origin/main. Full parity and release gates remain pending.

- [x] **EL506-326 - Match scalar/list arithmetic.**

    Completed: 2026-10-08, implementation commit a9686934fbd4c9d9e479b8c16cd65523663fd5a9
    Evidence: collection-operations-native experiment and list-operations-review.json; 341 independent native keys and significant LCD checkpoints.
    Verification: 540 unit tests, 29 golden fixtures / 1200 frames, 15 LIST browser tests across three engines; nine-aggregate replay passed all three after correcting the WebKit test time budget. Python compileall and Compose config passed.
    Notes: Published SHA verified against origin/main. Full parity and release gates remain pending.

- [x] **EL506-327 - Match confirmed list aggregates.**

    Completed: 2026-10-08, implementation commit a9686934fbd4c9d9e479b8c16cd65523663fd5a9
    Evidence: collection-operations-native experiment and list-operations-review.json; 341 independent native keys and significant LCD checkpoints.
    Verification: 540 unit tests, 29 golden fixtures / 1200 frames, 15 LIST browser tests across three engines; nine-aggregate replay passed all three after correcting the WebKit test time budget. Python compileall and Compose config passed.
    Notes: Published SHA verified against origin/main. Full parity and release gates remain pending.
 Include sum, product,
  minimum, maximum, or mean only if exposed.
- [x] **EL506-328 - Match confirmed vector-like list operations.** Include
  dot product, sorting, or cumulative operations only if exposed.

    Completed: 2026-10-08, implementation commit 74e1e7d28f6b35b859dfaf125064205e7f930759
    Evidence: experiments/vector-limits-native.json and experiments/phase16-native.json; vector-operations-review.json.
    Verification: 541 unit tests, 29 golden fixtures / 1200 frames, 21 LIST browser tests across three engines, reference/report checks, compileall and Compose config passed.
    Notes: Exact observed LIST scopes complete; broader persistence, precision and final parity remain separately tracked.

- [x] **EL506-329 - Match LIST ANS, memory, copying, and persistence.**

    Completed: 2026-10-08, implementation commit b99019a06e3183261c8719ce0b97a97802a61a41
    Evidence: list-memory-review.json, experiments/list-copy-conversion-native.json (103 observed keys), phase16-native.json and vector-limits-native.json.
    Verification: 542 unit tests, 29 golden fixtures / 1200 frames; four-slot conversion passed all three engines (3 tests), clearing/RESET/cursor recovery passed all three engines (9 tests); reference/report checks, compileall and Compose config passed.
    Notes: LIST-specific ANS, four slots, independent copies, both conversion mappings, ON/C, power, CA, MEM, RESET, HOME and mode changes verified. Exhaustive cross-mode persistence remains EL506-357.

- [x] **EL506-330 - Match LIST limits and errors.** Cover mismatched lengths,
  capacity, empty slot, invalid element, and unsupported operations.

    Completed: 2026-10-08, implementation commit 74e1e7d28f6b35b859dfaf125064205e7f930759
    Evidence: experiments/vector-limits-native.json and experiments/phase16-native.json; vector-operations-review.json.
    Verification: 541 unit tests, 29 golden fixtures / 1200 frames, 21 LIST browser tests across three engines, reference/report checks, compileall and Compose config passed.
    Notes: Exact observed LIST scopes complete; broader persistence, precision and final parity remain separately tracked.

### Phase 17 - Errors, Limits, and Cross-mode Parity

- [x] **EL506-350 - Build the complete simulator error catalogue.**

    Completed: 2026-10-08, implementation commit effcb6aad43c1d09d0306d3d38150630b47a171b.
    All ten documented native error numbers independently observed.
    Error3/4/6 capture completes the catalogue and includes adjacent formula
    storage and retained-state checks. Measured calculus discrepancies resolved;
    exhaustive EL506-351..361/364 and release gates remain open.
    Evidence: error-catalogue-review.json and its independent native references.
    Validation: 550 unit tests, 29 golden fixtures / 1200 frames, six browser tests
    across Chromium, Firefox and WebKit, reference/report gates, compileall and
    docker compose config passed. Fresh IAB quartic derivative: 32.0000005.
    Docker Desktop unavailable; no runtime verification claimed.
- [x] **EL506-351 - Match error cursor placement and fault navigation.**
- [x] **EL506-352 - Match error clearing and preserved expression/state.**

    EL506-351/352 published implementation 12a8f3854ecc9ce6b758ae1ef6e93ad37fe396ab.
    Ten-code native arrow paths and manual failed-operation/ON-C store preservation
    verified; fault-navigation-review.json records references and scope.
    Validation: 561 full unit checks plus ten new preservation tests; 39 browser
    checks across Chromium, Firefox and WebKit, golden/reference/report gates,
    compileall and Compose config passed; fresh IAB matrix recovery verified.
- [x] **EL506-353 - Match scalar and exponent limits.**

    Published implementation 01c86a2dc3bcc92b0b66278f2ef9a53a8a7099f0; independently measured signed scalar minimum,
    underflow zero, largest ten-digit scalar, signed overflow and retained ANS.
    Evidence: scalar-limits-review.json and independent native traces.
    Scope: NORMAL scalar/exponent range; result-type precision retains EL506-354.
    Validation: 557 unit tests, 29 golden fixtures / 1200 frames, 57 browser
    checks across Chromium, Firefox and WebKit; compileall and compose config passed.
    Fresh IAB signed minimum display verified; Docker Desktop remains unavailable.
- [ ] **EL506-354 - Match internal precision and rounding for every result
  type.**

    Measured CPLX precision patch published as
    d55cbb0ba090ca9471b3a049e010d77569019451, verified on origin/main.
    Independent74-key native trace
    reproduces real/imaginary cancellation, storedANS reuse and scaled333.3
    residual. Selected component policy and its limits are recorded in
    complex-precision-review.json. This is progress within the item; other
    result types and complex algorithms still require precision assessment.
    Validation: 682 unit tests, 29 golden fixtures / 1200 frames, reference/report
    gates,21 browser tests across three engines, compileall and Compose config;
    fresh IAB333.3 proof. Docker runtime unavailable.
    Additional MAT/LIST component patch published as
    b2f6991a32870a3729191963903fc28c9f41b2ca, verified on origin/main, after 684 unit tests,
    24 browser checks across three engines, reference/report and golden gates,
    compileall and Compose config. Independent 101-key native evidence and
    scoped policy: collection-precision-review.json. EL506-354 remains open.
    Additional34-key native scaled-matrix probe reproduces333.3 with bounded
    component division and14-digit scalar products. Published as
    5d012f5ab0b6742f0354a6615317b1d073febc1f, verified on origin/main, after687 unit
    tests and six browser checks across three engines; the complete result-type
    precision audit remains open.
    SD X-sum/mean accumulation now reproduces independently measured zero
    at1E13 cancellation andone at1E12 cancellation. Independent48-key trace
    includes ALPHA, RCL andSTATVAR. Published as ca4eda327d423b9a0b1b1aaa8ea2125380316484,
    verified on origin/main:720 unit tests,18 focused
    browser checks across three engines,29 golden fixtures/1200 frames and
    reference/report,compileall/Compose gates passed; fresh previewproof.
    weighted products, higher moments andregression precision remain open.
    Additional78 independent native actions establish scientific MAT/LIST
    definition entry, exponent-sign editing, and LIST sum/mean cancellation0.
    Corrected droppedExp, wrongmantissa NEG and precision; scoped review:
    collection-entry-aggregate-review.json. Same720/18 validation batch;
    fresh preview verifies exponent input and LIST cancellation. Published in
    ca4eda327d423b9a0b1b1aaa8ea2125380316484, verified on origin/main.

    Local continuation: matrix definition division retains the independently
    observed scaled cancellation; pending MAT arithmetic uses the measured
    two-line LCD projection. Fresh eight-key punctuation evidence verifies
    integer-entry decimal points. Eighteen intermediate golden expectations
    were updated without rewriting the earlier native evidence. Focused gates:
    two unit checks, six browser checks across three engines, seven Django
    checks, installed wheel/sdist (24 assets), compileall, pip dry run and
    Compose config passed. Full result-type precision remains open.
    READY_TO_PUSH (scoped continuation, not whole-item completion): final unit
    suite 747/747; 30 golden fixtures / 1209 frames; full three-engine browser
    run 601 passed, 12 failed and 38 platform skips, followed by 12/12 repaired
    cases passing on final code. Thus all 613 applicable browser cases are
    verified. Native ANSM+ casing is restored; stale NORMAL error-line and MAT
    integer-entry DOM expectations were corrected. A long LIST workflow gets
    180 seconds for WebKit actionability checks without relaxing assertions.
    Final installed wheel/sdist smoke passed. Docker build/start attempted;
    its Linux engine pipe is absent. Package remains 0.3.1; eight tasks remain.

- [x] **EL506-355 - Match expression length and nesting limits.**
- [x] **EL506-356 - Match history, formula, dataset, matrix, and list
  capacities.**

    EL506-355/356 completed 2026-10-08; implementation
    7de6032b0136f11329ba95df1a898e8cd026a166 verified on origin/main.
    Shared early capacity checks and serializable
    failed definition/coefficient workflows; capacity-review.json records the
    independent 24-key MAT fault trace and full-manual policy. User authorized
    completion of all remaining phases, so adjacent capacity prerequisites were
    addressed together while EL506-354 remains next.
    Validation: 681 unit checks, 29 golden fixtures / 1200 frames,
    reference/report checks, nine focused browser checks across three engines,
    compileall and Compose config passed. Broader run passed93 checks; its three
    snapshot failures were repaired and reverified in the focused run.
    Fresh IAB MAT fault cursor verified. Docker Desktop runtime unavailable.
- [x] **EL506-357 - Complete the state persistence matrix for every clear,
  reset, power, HOME, and mode transition.**

    Published implementation 12a8f3854ecc9ce6b758ae1ef6e93ad37fe396ab.
    Full-manual clearing policy matrix: 72 validated transitions across six modes,
    all variable/formula/dataset/matrix/list/buffer/history stores and settings.
    Evidence: persistence-matrix-review.json; 72 new unit tests passed.
    Existing native power, EQN prompt and complex-memory transition checks retained.
- [ ] **EL506-358 - Complete the modifier-by-key-by-mode compatibility
  matrix.**

    Local continuation: cross-mode-key-invariants.test.js verifies 3,456
    canonical transitions across all 48 keys, six modes, four modifier prefixes
    and three entry contexts. All 24 groups pass immutable-input, snapshot,
    deterministic-replay and independent-branch assertions. This is state
    integrity coverage, not native compatibility evidence; item remains open.

    Scoped menu differential published as
    6c008d4d9c94dd8a6b2811074ebf417aae4e9452, verified on origin/main, after 686 unit tests,67
    independently observed menu checkpoints,10 fresh native engineering/nCr
    keys, three browser engines, golden/reference/report checks, compileall and
    Compose config. See menu-differential-review.json. Corrected engineering
    4/5 paging with wrap and staged0C/right-operand display. Full EL506-358 and
    EL506-361 remain open; expanded report mappings retain partial evidence.

- [ ] **EL506-359 - Complete the function-by-value-type compatibility
  matrix.**

    Scoped native determinant/transpose/dimension scalar-operand audit found
    and corrected determinant1 anddim(1,1,1) accepting a scalar. Allthree now
    matchError1, preserve matrix slots and recover withONC. Published as
    ee5129749ca3b604ca66913909e63ea0a934f8b8, verified on origin/main, after690 full unit tests,
    focused unit and nine browser checks across three engines; fullcompatibility
    remains open. See matrix-type-review.json.
- [ ] **EL506-360 - Add boundary and invalid-input tests for every ledger
  operation.**
- [ ] **EL506-361 - Add differential coverage for every capability-ledger
  entry.**

    Every430 entry now has an explicit partialunit assertion; the earlier
    unmapped-test gap is closed. Added printed digits0..9, allnine scalarALPHA
    variables, ANS, HEXB..E andindependently observedSTATVAR evidence. The
    frozenbaseline is unchanged andfullcurrentbehavior/boundary assessment
    remains open; counts alone do not establishfullparity.
- [x] **EL506-362 - Complete the full operation-guide regression suite.**

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-363 - Add property tests.** Cover arithmetic, fractions,
  conversions, statistics, equations, complex values, matrices, and lists.

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [ ] **EL506-364 - Complete the final simulator parity audit with no
  undocumented deviations.** Apply and verify the six documented simulator
  exceptions against the full manual or a physical device.

### Phase 18 - Security, Packaging, Compatibility, and Release

- [x] **EL506-370 - Threat-model calculator input and embedding.** Cover
  keyboard text, Math.js scope, DOM output, configuration, CSS overrides, and
  hostile host pages.

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-371 - Lock down Math.js.** Allow only canonical AST operations,
  disable unnecessary parser/import functions, avoid eval-like behavior, and
  test malicious or oversized input.

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-372 - Add resource limits.** Bound expression size, computation
  cost, recursion, matrix/list dimensions, dataset size, and calculus work so
  the UI cannot be frozen intentionally.

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-373 - Verify CSP and offline operation.** Require no inline
  executable code, CDN, telemetry, remote font, or network calculation.

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-374 - Add dependency and license records.** Pin versions, audit
  vulnerabilities, and ship required open-source LICENSE/NOTICE information.

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-375 - Complete the backward-compatibility suite.** Cover the
  existing tag, static paths, root selector, keyboard scoping, multiple
  instances, template overrides, and collected package contents.

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-376 - Add cross-browser coverage.** Test current Chromium,
  Firefox, and WebKit desktop behavior.

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-377 - Add mobile and touch coverage.** Test representative phone
  and tablet viewports, orientation changes, zoom, and touch interaction.

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-378 - Add accessibility conformance coverage.** Test keyboard
  reachability, focus visibility, labels, state announcements, contrast,
  forced colors, text zoom, and reduced motion.

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-379 - Validate built distributions.** Install the wheel into a
  clean Django project, collect static files, render multiple calculators, and
  verify no missing or external assets.

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-380 - Document upgrades from 0.3.1.** Explain parity-default
  changes, the optional enhanced profile, theming, branding, deployment, and
  any intentional behavior differences.

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-381 - Document downstream refresh.** Provide the exact reinstall,
  collectstatic, cache-busting, and deployment steps required for consumers
  pinned to main and consumers pinned to release tags.

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

- [x] **EL506-382 - Run the release legal/branding checkpoint.** Confirm no
  Sharp binary, logo, screenshot, manual artwork, or misleading affiliation is
  distributed.

    Completed: 2026-10-08, implementation commit 96d066d5bf321f508229f4552a71eaac53a6e007
    Evidence and verification: shared remaining-phase batch review above.
    Notes: Scoped item complete; unresolved final parity and release gates remain documented.

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
