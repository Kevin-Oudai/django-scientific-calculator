# Agent Notes

## Project Shape

- Reusable Django app package: `src/scientific_calculator`
- Local demo project: `src/demo_project`
- Demo entry point: `src/manage.py`
- Docker entry point: `docker compose up --build`

## Development Rules

- Keep reusable package assets inside `src/scientific_calculator`.
- Do not put package CSS or JavaScript under project-level `src/static/scientific_calculator`; those files will not be included in pip installs.
- Keep the demo project lightweight. It exists to exercise the reusable app locally.
- Keep `README.md`, `pyproject.toml`, and `src/scientific_calculator/__init__.py` in sync when changing release, integration, dependency, or user-facing behavior.
- Keep documentation consolidated in the root `README.md`; avoid adding duplicate project-level or `src`-level Markdown files unless there is a clear new audience.
- Avoid committing local runtime files such as `src/db.sqlite3`, `src/staticfiles`, caches, virtual environments, or build artifacts.

## Validation

Use these checks after changes:

```powershell
python -m compileall src\scientific_calculator
docker compose config
npm test
```

When Docker Desktop is running, also verify:

```powershell
docker compose up --build
```

Then open `http://127.0.0.1:8010/`.
