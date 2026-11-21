# Plan: Refactor Monolithic index.html into Multi-Page Architecture

## Context
The current application is built as a Single Page Application (SPA) where all pages are contained within one `index.html` and toggled via CSS classes. This has led to a massive HTML file and a monolithic `script.js`, making the codebase harder to maintain, slower to load, and prone to redundancy. 

The goal is to split the application into separate HTML, CSS, and JS files for each page, improving organization, maintainability, and code quality while preserving all existing UI/UX and functionality.

## Recommended Approach

### 1. New File Structure
I will move from a single-file approach to a modular structure:

**HTML Files**:
- `app/index.html` $\rightarrow$ (Refactored to be the Dashboard page)
- `app/inbox.html`
- `app/threats.html`
- `app/classification.html`
- `app/sentiment.html`
- `app/reply.html`
- `app/attachments.html`
- `app/search.html`
- `app/organization.html`
- `app/license.html`
- `app/settings.html`
- `app/login.html` (Existing)

**CSS Files**:
- `app/css/shared.css`: Global layout, sidebar, topbar, and common UI components (cards, badges, etc.).
- `app/css/[page].css`: Page-specific styles (e.g., `dashboard.css`, `inbox.css`).
- `app/css/auth.css`: Login-specific styles (Existing).

**JS Files**:
- `app/js/shared.js`: Global utilities (`initials`, `riskBadge`), theme management, user profile UI, and a layout injector for shared HTML components.
- `app/js/api.js`: API centralization (Existing).
- `app/js/data.js`: Demo data (Existing).
- `app/js/[page].js`: Page-specific logic (e.g., `dashboard.js`, `inbox.js`).
- `app/js/auth.js`: Login logic (Existing).
- `app/js/theme.js`: (Will be merged into `shared.js` for simplicity).

### 2. Implementation Strategy

#### Phase A: Foundations (Shared Assets)
1. **Extract Shared CSS**: Identify and move all global layout, sidebar, topbar, and component styles from `style.css` into `shared.css`.
2. **Extract Shared JS**: Move utility functions and global state management from `script.js` into `shared.js`.
3. **Layout Injection**: To avoid duplicating the Sidebar and Topbar HTML across 11 files, I will implement an `injectLayout()` function in `shared.js`. This function will programmatically insert the sidebar and topbar HTML into a placeholder (e.g., `<div id="layout-root"></div>`) on each page.

#### Phase B: Page Splitting
For each of the 11 pages:
1. **Create HTML**: Extract the corresponding `<section class="page">` content and place it into a new `[page].html` file with a standard base template (including links to `shared.css`, `shared.js`, and the page-specific CSS/JS).
2. **Create JS**: Extract the relevant functions and event listeners from `script.js` and place them into `[page].js`.
3. **Create CSS**: Extract page-specific styles from `style.css` into `[page].css`.
4. **Update Init**: Move the logic inside `goTo(page)` for that specific page into the `$(function() { ... })` block of the new `[page].js`.

#### Phase C: Navigation & Modals
1. **Update Links**: Change the `.nav-item` links in the shared layout from `href="#"` to the actual `.html` file paths.
2. **Modularize Modals**: Modals that are used globally will be moved to a shared HTML snippet injected by `shared.js`. Modals specific to the Settings page will stay within `settings.html`.

### 3. Critical Files to be Modified
- `app/index.html` (Extensive rewrite)
- `app/css/style.css` $\rightarrow$ `app/css/shared.css` + `app/css/[page].css`
- `app/js/script.js` $\rightarrow$ `app/js/shared.js` + `app/js/[page].js`

### 4. Verification Plan
- **End-to-End Navigation**: Click every link in the sidebar to ensure pages load and the "active" state is correctly applied to the nav item.
- **Feature Parity**: Verify that all charts, tables, and API-driven data load correctly on each separate page.
- **UI/UX Integrity**: Check that the layout remains consistent and the theme (light/dark) persists across page transitions.
- **Modal Functionality**: Test all Add/Edit modals in the Settings and Attachments pages to ensure they still open and save correctly.
- **Console Audit**: Ensure no 404 errors for missing assets or JS errors due to missing dependencies.


## Implementation completed — 14 November 2026

The eleven application screens now have independent HTML documents and page scripts/styles. `index.html` remains the dashboard and `threats.html` contains Threat Detection. Shared layout injection, navigation, theme handling, profile-header rendering, chart theming, and utilities live in `js/shared.js`. API and demo-data helpers remain shared.

`css/shared.css` contains common primitives and reusable modal/form styles. `css/shared-overrides.css` preserves the existing responsive and cross-page refinement cascade; page styles are loaded between these two files. Pages built entirely from shared components have a documented page stylesheet for future additions.

Settings owns its dialogs, and Attachments owns its analysis dialog. Only the dashboard and sentiment page load Chart.js. The existing OAuth callback paths are retained. Old `script.js` and `theme.js` contain retirement comments, and `style.css` remains a small compatibility entry point for callback pages.

See `app/SessionLog/page_split_20261114.md` and `tests/ui-smoke.cjs` for verification and backup details.
