# Updates

## 2026-06-01

- Converted the project from a root-level virtual environment layout to a Docker-based project.
- Added reusable Python package metadata for future pip installs.
- Moved calculator static assets into the Django app package so they ship with pip installs.
- Added root project documentation and agent notes.
- Added a user manual for future installation and integration work.
- Changed the Docker demo host port to `8010` to avoid common local Django port conflicts.
- Added desktop Playwright coverage for calculator controls and math functions.
- Compact desktop widget sizing so all calculator keys are reachable in a normal desktop viewport.
