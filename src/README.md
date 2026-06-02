# Django Scientific Calculator

A reusable Django scientific calculator app with a clean template-tag embed and a local demo project.

## Test the Demo

From the project root, run:

```powershell
docker compose up --build
```

Then open:

```text
http://127.0.0.1:8000/
```

For local Python development without Docker, run this from the `src` folder:

```powershell
python manage.py runserver
```

Then open:

```text
http://127.0.0.1:8000/
```

Drag the calculator by its top bar to test the floating whiteboard-style embed.

## Embed in a Django Template

Add the app to `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    ...
    "scientific_calculator",
]
```

Load the static files and template tag in your template:

```django
{% load static %}
{% load scientific_calculator %}
<link rel="stylesheet" href="{% static 'scientific_calculator/calculator.css' %}">

{% scientific_calculator %}

<script src="{% static 'scientific_calculator/calculator.js' %}" defer></script>
```

The calculator has no database models and does not require URLs.

## Current Features

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
- Safe client-side parser, no JavaScript `eval()`
