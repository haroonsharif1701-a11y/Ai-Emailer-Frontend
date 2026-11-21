# Frontend UI checks

`ui-smoke.cjs` serves the app on a temporary loopback port and intercepts every `/api/` request with fixtures. It never sends login, upload, delete, or settings requests to the real API. External frontend assets (jQuery, Chart.js, fonts, and icons) still require internet access.

Prerequisites: Node.js, the `playwright` package, and a Playwright browser. There is no production build step.

If Playwright is not already available, install it in your development environment. From the repository root, one option is:

```powershell
npm install --no-save --package-lock=false playwright
npx playwright install chromium firefox
node tests/ui-smoke.cjs
$env:PLAYWRIGHT_BROWSER = 'firefox'
node tests/ui-smoke.cjs
```

Optional environment variables:

- `PLAYWRIGHT_MODULE`: absolute path to an existing Playwright package, instead of a local installation.
- `PLAYWRIGHT_EXECUTABLE`: browser executable path; useful for testing an installed Edge with the default Chromium engine.
- `PLAYWRIGHT_BROWSERS_PATH`: location of downloaded Playwright browsers.
- `AIEMAILER_APP_ROOT`: application directory; defaults to `app/` in this repository.
- `AIEMAILER_UI_ARTIFACTS`: screenshot and result directory; defaults to `aiemailer-ui-check` in the system temporary directory.

The 24 checks cover navigation, light/dark themes, desktop/tablet/mobile overflow, keyboard access, summary retry, reply success/failure/races, clipboard feedback, uploads, attachment preview/download/delete, settings dialogs, login/logout, and expired sessions. Clipboard permissions, API responses, and document contents are simulated. Live OAuth, SQL, LLM output, and real file extraction need separate integration verification.

Targeted visual checks cover Settings row alignment, shared tabs, organization identity visibility, attachment panel sizing and scrolling, and favicon/logo assets.


## RBAC checks

Run `node tests/rbac-ui.cjs` with the same Playwright environment as ui-smoke.cjs. It tests denied direct URLs for all menus, read-only users, the four-action permission editor, 15-second revocation without logout, and fail-closed access loading. API responses are simulated.
