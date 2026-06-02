# User Manual

This manual is for installing, testing, and integrating the Django Scientific Calculator package into other Django sites. It also records the project facts future agents need before making integration changes.

## Project Purpose

`django-scientific-calculator` is a reusable Django app that renders a scientific calculator through a template tag.

It is not a full Django project dependency. The reusable package is only:

```text
src/scientific_calculator
```

The demo project is only for local testing:

```text
src/demo_project
src/manage.py
src/templates/demo
src/static/demo
```

Do not copy the demo project into another Django site during integration.

## Repository

Private GitHub repository:

```text
https://github.com/Kevin-Oudai/django-scientific-calculator
```

Current package install name:

```text
django-scientific-calculator
```

Current Django app name:

```python
"scientific_calculator"
```

Current version:

```text
0.2.0
```

## What The Package Includes

The Python package includes:

- `scientific_calculator.apps.ScientificCalculatorConfig`
- template tag library: `scientific_calculator`
- template tag: `{% scientific_calculator %}`
- template: `scientific_calculator/calculator.html`
- static files:
  - `scientific_calculator/calculator.css`
  - `scientific_calculator/calculator.js`

The app currently has no models, migrations, URLs, database requirements, or server-side views.

## Calculator Math Behavior

The calculator keeps a numeric value internally for `ANS`, history, and fallback behavior, but displays exact surd results for supported Additional Mathematics cases.

Supported exact displays include:

- simplified square roots, such as `sqrt(24) = 2√6`
- like-surd addition, such as `sqrt(8) + sqrt(18) = 5√2`
- surd multiplication, such as `sqrt(6) * sqrt(2) = 2√3`
- common DEG trig values, such as `sin(60) = √3/2`, `cos(30) = √3/2`, and `tan(60) = √3`
- exact rational DEG trig values, such as `sin(30) = 1/2`

Exact surd fractions render with the same stacked fraction layout as regular fractions. For example, `(3 + sqrt(2)) / 2` displays with `3 + √2` as the numerator and `2` as the denominator.

Unsupported exact symbolic cases intentionally fall back to the existing decimal evaluator instead of blocking calculation.

## Compatibility

The package metadata currently requires:

```text
Django>=5.2,<6.0
Python>=3.10
```

Before integrating into another Django site, check that the target project uses a compatible Django version.

## Install Into Another Django Site

Preferred private GitHub install command:

```powershell
pip install "django-scientific-calculator @ git+ssh://git@github.com/Kevin-Oudai/django-scientific-calculator.git@main"
```

For a `requirements.txt` entry:

```text
django-scientific-calculator @ git+ssh://git@github.com/Kevin-Oudai/django-scientific-calculator.git@main
```

The target machine must have access to the private GitHub repository. SSH install requires a GitHub SSH key that can read the repo.

For future stable installs, prefer a version tag instead of `main`, for example:

```text
django-scientific-calculator @ git+ssh://git@github.com/Kevin-Oudai/django-scientific-calculator.git@v0.2.0
```

Only use that form after the tag exists.

## Django Settings

Add the reusable app to the target project's `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    # ...
    "scientific_calculator",
]
```

The target project must also have static files enabled:

```python
INSTALLED_APPS = [
    # ...
    "django.contrib.staticfiles",
]
```

No URL include is required.

No migrations are required.

## Template Usage

In the page or base template where the calculator should appear:

```django
{% load static %}
{% load scientific_calculator %}

<link rel="stylesheet" href="{% static 'scientific_calculator/calculator.css' %}">

{% scientific_calculator %}

<script src="{% static 'scientific_calculator/calculator.js' %}" defer></script>
```

For a larger Django site, the usual integration pattern is:

- load the CSS once in the page `<head>` or the project's CSS block
- render `{% scientific_calculator %}` where the calculator should appear
- load the JavaScript once near the end of the page or in the project's JavaScript block

Do not load the same calculator JavaScript multiple times on one page unless the script has first been verified to handle repeated initialization safely.

## Production Static Files

In production, the target Django site should run its normal static collection step after installing the package:

```powershell
python manage.py collectstatic
```

The expected collected files are:

```text
scientific_calculator/calculator.css
scientific_calculator/calculator.js
```

If these files are missing after `collectstatic`, inspect `pyproject.toml`, `MANIFEST.in`, and the package asset paths.

## Local Demo

The local demo can be run with Docker:

```powershell
docker compose up --build
```

Then open:

```text
http://127.0.0.1:8010/
```

The local demo can also run without Docker from the `src` folder:

```powershell
python manage.py runserver
```

Then open:

```text
http://127.0.0.1:8000/
```

## Docker Notes

Docker is for local demo development only. Other Django sites do not need this repository's `Dockerfile` or `compose.yaml` to use the package.

The Compose service bind-mounts `./src` into `/app`, so edits to the demo and reusable app are visible while developing.

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

The `pyproject.toml` package discovery intentionally includes only:

```text
scientific_calculator*
```

That keeps the demo project out of pip installs.

## Validation Checklist

Run these from the repository root after package changes:

```powershell
python -m compileall src\scientific_calculator
python -m pip install --dry-run --no-deps .
docker compose config
```

When Docker Desktop is running, also test the demo and desktop calculator functions:

```powershell
docker compose up --build
npm install
npx playwright install chromium
npm test
```

Then verify:

- the Docker demo page loads at `http://127.0.0.1:8010/`
- the calculator renders
- buttons respond
- keyboard input works
- degree/radian toggle works
- static files load without 404s

The Playwright tests cover the desktop whiteboard use case. They intentionally do not enforce mobile behavior.

## Integration Checklist For Future Agents

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

## Current Limitations

- No Python unit test suite exists yet; calculator behavior is covered by desktop Playwright tests.
- No customization API exists yet for theme, initial mode, or button layout.
- No release tags exist yet unless one has been created after this manual was written.
- The README uses the private GitHub SSH install path. HTTPS token-based installs should be handled carefully and should not commit secrets.

## Change Rules

When changing package behavior:

- update `src/scientific_calculator/__init__.py` if the version changes
- update `pyproject.toml` if the version or dependencies change
- update `VERSIONS.md` for release-level changes
- update `UPDATES.md` for project history
- update this manual when integration steps change
