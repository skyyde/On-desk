# On Desk

A warm student workspace: tasks, a weekly/monthly calendar, recurring classes, subject notes, an academic planner, journal, shortcuts, and JSON backups. Built with React, Vite, JavaScript and Lucide icons.

## Run locally

Use Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, including `/On-desk/`. Production:

```sh
npm run build
npm run preview
```

## How to use

- **Add Task** opens the editor. Dates use a month browser; times use 15-minute increments. Selecting a scheduled date fills an empty due date. End times can cross midnight. The duration and multi-day span are persisted.
- Drag an unscheduled task's **grip** onto the week or month grid. Drag a scheduled grip vertically/horizontally; use its bottom edge for duration and its left/right edges for day span. Drop onto **Unscheduled** to remove scheduling. Resize spans inside the displayed Monday–Sunday week. Drag previews snap to 15 minutes; the week scrolls near top/bottom edges.
- Task grip arrow keys move time/day. Resize handle arrow keys work too. On touch devices, drag grips or edit date/time/span using the form. Double-click an empty week or month slot to create a task, or use **Schedule with a form**.
- The **Today** button opens an agenda. Calendar navigation is bounded to September–December 2026. The week scroll position is remembered.
- Recurring classes are separate from tasks. Moving a class changes every week's schedule. Click a class for notes, or use **Manage class schedule** to edit, add, or delete classes.
- **Subjects** opens the academic planner. Its topics, deadlines, dates, and grading weights are clearly labeled examples, not official academic information. Every field is editable. Reset affects only that planner.
- **Journal** saves title/date/body automatically and sorts by last update. Subject notes and resources also autosave.
- **Customize links** reveals the shortcut controls. The **+** uploads a photo, center-cropped to 240×240 JPEG. Pencil buttons edit destinations. Expand **Course links** in the sidebar to edit course URLs. Exact Canvas course IDs and ArchersHub URLs were not supplied: course shortcuts initially open Canvas; configure exact destinations before using them as direct course links. ArchersHub opens its link editor until configured.

## Tablet app links and home screen

Open https://skyyde.github.io/On-desk/ in Chrome on your Honor Pad. Use Chrome's menu → **Add to Home screen** if offered. The manifest and icons are included; there is no offline service worker.

Shortcuts use HTTPS links. Android may open an installed service app if it registers the destination and **Settings → Apps → [service] → Open by default → Open supported links** is enabled. This depends on Android and each app; On Desk cannot force all websites into native apps. Edit links for your account or school's destinations.

## Data and backups

All data is stored only in this browser on this device under `on-desk-v2`. It does not synchronize. Export regularly under **Backups & storage** in the sidebar. A reminder becomes stronger after seven days. Imports validate the complete schema before replacement, require confirmation, and retain current data when invalid. Storage failures produce a visible alert.

Version 1 data is migrated automatically: tasks/calendar sessions and journals are converted, and course notes are retained. Custom subject content maps to Extracurricular where no known subject matches. The entire original state—including custom shortcuts and other unmatched fields—is preserved in `legacy` in v2 exports; the original `on-desk-v1` key remains untouched. A malformed saved workspace is never silently overwritten.

## Source layout

```
src/
  main.jsx                 React entry
  v2/
    App.jsx                State, routing, completion, backup orchestration
    Sidebar.jsx            Task bank, archive, course links, backups
    Calendar.jsx           Week/month, drag/resize, classes, agenda
    TaskEditor.jsx         Task form
    Pickers.jsx            Custom date/time controls
    ClassEditor.jsx        Recurring class schedule form
    Extras.jsx             Journal, notes, image shortcuts
    Planner.jsx            Academic overview, weekly table, deadlines, grading
    constants.js           Subject palette, external URLs, semester bounds
    seedPlanner.js         Centralized editable example academic data
    date.js                Date/time helpers
    storage.js             Versioned persistence, migration, backup validation
    *.css                  Component and shared styles
public/                    Manifest and icons
tests/                     Storage and browser regression tests
.github/workflows/         GitHub Pages deployment
```

## Verification

```sh
npm test
npx playwright install chromium
npm run dev -- --port 4174
# In another terminal:
npm run test:e2e
```

Browser tests default to `http://localhost:4174/On-desk/`. Override with `TEST_URL`. Set `BROWSER_PATH` for a system Chromium executable; otherwise Playwright's installed Chromium is used. Tests use isolated browser storage and create only local demo records. They cover task CRUD, completion/reopening, pickers, drag/snap/resize, recurring classes, month popup/navigation, journal, academic table changes/reset, image crop, backup import/export, and responsive overflow checks. Physical Honor Pad/iOS hardware testing has not been performed.

## Deployment and future changes

Vite uses `/On-desk/`. GitHub Pages source must be **GitHub Actions**. Pushes to `main` run the production build and Pages deployment. Open the repository in Codex, describe the change, and ask it to run the build and relevant regression tests before pushing. Keep a JSON backup before storage-format changes.
