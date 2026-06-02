# Django Scientific Calculator

A reusable Django scientific calculator app with a template-tag embed, bundled static assets, and a local demo project.

## Install

For a future private GitHub install:

```text
django-scientific-calculator @ git+ssh://git@github.com/Kevin-Oudai/django-scientific-calculator.git@main
```

Or install directly:

```powershell
pip install "django-scientific-calculator @ git+ssh://git@github.com/Kevin-Oudai/django-scientific-calculator.git@main"
```

The private repo requires GitHub access from the machine running `pip install`.

## Django Setup

Add the app:

```python
INSTALLED_APPS = [
    ...,
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

## Local Demo With Docker

From the project root:

```powershell
docker compose up --build
```

Open:

```text
http://127.0.0.1:8010/
```

## Local Demo Without Docker

From the `src` folder:

```powershell
python manage.py runserver
```

Open:

```text
http://127.0.0.1:8000/
```

## Tests

From the project root:

```powershell
npm install
npx playwright install chromium
npm test
```

The Playwright suite runs the calculator in a desktop browser viewport against the Docker demo URL.

## Package Contents

The pip package includes:

- `scientific_calculator` Django app
- template tag: `{% scientific_calculator %}`
- calculator template
- calculator CSS and JavaScript
- exact surd output for simplified square roots and common DEG trig values

The demo project is intentionally excluded from the Python package.

## Manual

See [USER_MANUAL.md](USER_MANUAL.md) for the full installation, integration, validation, and future-agent checklist.
