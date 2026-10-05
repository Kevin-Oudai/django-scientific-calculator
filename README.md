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
