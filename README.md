# On Desk

A personal student workspace built with React and Vite. Plan tasks and study sessions, keep course notes and journal entries, and collect your favorite links in one calm space.

## Getting started

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. Run `npm run build` to produce the production site in `dist/`, or `npm run preview` to preview that build. The base path is `/On-desk/` for GitHub Pages.

## Your data

Your data is stored in this browser's local storage, on this device. It does not synchronize across browsers or devices. Clearing browser data can remove it. Use Settings to export regular JSON backups and to import them on another device. Backups contain your private content: keep them somewhere safe.

## Publishing

The workflow in `.github/workflows/deploy.yml` builds and deploys pushes to `main` using GitHub Pages. In repository Settings → Pages, select **GitHub Actions** as the source if it is not already selected. Check the Actions tab for the deployment result. The intended address is `https://skyyde.github.io/On-desk/`.

The manifest supports adding On Desk to a home screen on supported devices. An internet connection is required to load the app; no offline service worker is provided.

## Future development

Open this repository in Codex and describe the change you want. Components live in `src/`; after edits, run `npm run build`. The data lives locally, so take a backup before making storage-format changes or testing data migration.
