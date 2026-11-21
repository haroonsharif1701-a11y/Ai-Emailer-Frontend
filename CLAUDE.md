# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a static frontend project. There is no build step, package manager, or automated test suite.

- **Serve the app**: Use a static HTTP server to avoid CORS and file protocol issues.
  ```powershell
  python -m http.server 8000
  ```
  Then visit `http://localhost:8000/login.html` or `http://localhost:8000/index.html`.

## Architecture & Structure

The project is a vanilla HTML/CSS/JS application with a simple directory structure:

- `app/index.html`: The main authenticated dashboard and its page sections.
- `app/login.html`: The sign-in screen.
- `app/css/style.css`: Shared presentation and styles for the dashboard.
- `app/css/auth.css`: Shared presentation and styles for the login page.
- `app/js/script.js`: Handles dashboard interactions and browser logic.
- `app/js/auth.js`: Handles login validation and authentication logic.
- `app/js/theme.js`: Controls theme persistence (light/dark mode).
- `app/js/data.js`: Supplies demo data for the UI.
- `app/js/api.js`: Centralizes backend requests. Use `apiFetch()` or `apiUpload()`—do not call `fetch()` directly from feature code.

## Coding Style & Conventions

- **Language**: Vanilla HTML, CSS, and JavaScript (uses jQuery).
- **Indentation**: Use two-space indentation.
- **Naming**:
  - Functions and variables: `camelCase` (e.g., `renderInbox`).
  - Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`).
  - CSS classes: `kebab-case` (e.g., `inbox-item`).
  - Semantic IDs: Use page prefixes (e.g., `page-dashboard`).
- **CSS**: Reuse CSS custom properties in `:root` instead of hard-coding colors.
- **API**: All authenticated requests must go through `apiFetch()` or `apiUpload()` in `js/api.js`.

## Testing & Verification

- **Manual Testing**: Verify affected flows in Chromium- and Firefox-based browsers at both desktop and mobile widths.
- **API Testing**: Test success, validation failure, network failure, and expired-token (`401`) behavior.
- **Checklist**: Verify light/dark themes, responsive layouts, navigation, login validation, and check browser console for errors.

## Project Requirements

- **Session Logs**: After every complete session, create a session log markdown file in `app/SessionLog/`.
- **Permissions**: Always ask for permission before editing any files.
- **Verification**: After any change, review and cross-verify that the change did not break existing code, workflow, or logic.
