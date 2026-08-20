# Repository Guidelines

## Project Structure & Module Organization

This repository is a static front-end for the AI Emailer dashboard. `index.html` contains the authenticated dashboard and its page sections; `login.html` contains the sign-in screen. Keep page-specific markup in the relevant HTML file. Shared presentation lives in `css/`: use `style.css` for the dashboard and `auth.css` for login. Browser logic is organized in `js/`: `script.js` handles dashboard interactions, `auth.js` handles login validation, `theme.js` controls theme persistence, `data.js` supplies demo data, and `api.js` centralizes backend requests. Referenced icons belong under `icon/` when added.

## Development & Verification

There is no package manager, build step, or automated test suite. Serve the directory with any static HTTP server rather than opening files directly; for example:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000/login.html` or `index.html`. Verify both light and dark themes, responsive layouts, navigation, login validation, charts, and browser console errors. The production API base URL is currently defined by `API_BASE_URL` in `js/api.js`; update it deliberately for the target environment and ensure the API permits the frontend origin.

## Coding Style & Naming Conventions

Match the existing vanilla HTML/CSS and jQuery style. Use two-space indentation in HTML, CSS, and JavaScript. Prefer `const`/`let`, camelCase functions and variables (`renderInbox`, `API_BASE_URL` for constants), kebab-case CSS classes (`inbox-item`), and semantic IDs with page prefixes (`page-dashboard`). Reuse CSS custom properties in `:root` instead of hard-coding repeated colors. Keep UI data in `data.js` and send authenticated requests through `apiFetch()` or `apiUpload()`—do not call `fetch()` directly from feature code.

## Testing Guidelines

No test framework or coverage threshold is configured. Manually test affected flows in current Chromium- and Firefox-based browsers, at desktop and narrow mobile widths. For API changes, test success, validation failure, network failure, and expired-token (`401`) behavior. If tests are introduced, place them in a top-level `tests/` directory and name them after the feature, e.g. `tests/auth.test.js`.


## Commit & Pull Request Guidelines

Git history is unavailable in this environment, so use concise imperative commit subjects such as `Add inbox search filtering`. Keep each commit focused. Pull requests should explain the user-facing change, note API/configuration impacts, link the relevant issue when available, and include before/after screenshots for visual changes. State the manual checks performed.

## Permissions and Review

Allways ask my permission before editing any files.
After doing any change review and cross verify that your change didn't broke anything in the existing code, workflow, logic. 
If you have any questions or doubts then ask me first.

## Session Log

After every complete session create a session log md file under this folder "D:\AIEmailer\Ai-Emailer-Frontend\Ai-Emailer-Frontend\app\SessionLog"