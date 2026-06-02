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
- Keep `pyproject.toml`, `VERSIONS.md`, `UPDATES.md`, and `USER_MANUAL.md` in sync when changing release or integration behavior.
- Avoid committing local runtime files such as `src/db.sqlite3`, `src/staticfiles`, caches, virtual environments, or build artifacts.

## Validation

Use these checks after changes:

```powershell
python -m compileall src\scientific_calculator
docker compose config
```

When Docker Desktop is running, also verify:

```powershell
docker compose up --build
```

Then open `http://127.0.0.1:8000/`.
