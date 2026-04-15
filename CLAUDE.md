# Percy Lodge No. 1427 — Summons Generator

Sean Lyons is the incoming Secretary of Percy Lodge No. 1427 (Freemasonry, Province of Northumberland). This webapp replaces two Word documents with a web UI for generating the lodge summons as a print-ready 2-page A4 landscape PDF.

## Running locally
```bash
npm install
npm start   # http://localhost:3000
```

## Architecture
- `server.js` — Express routes, form parsers, PDF generation (Puppeteer + pdf-lib)
- `views/summons-outer.js` — Outer sheet HTML: left = back cover (officers list), right = front cover (logo)
- `views/summons-inner.js` — Inner sheet HTML: left = formal letter, centre = spine (past masters), right = business section
- `views/dashboard.js`, `edit-meeting.js`, `edit-annual.js`, `edit-static.js`, `shell.js` — Admin UI
- `data/lodge_static.json` — Province, ancient charge, warrant dates (rarely changes)
- `data/lodge_annual.json` — Officers, past masters, contacts, meeting dates (updated each October)
- `data/meetings/YYYY-MM.json` — One file per meeting, monthly business items

## Summons layout (A4 landscape, 2 pages)
**Page 1 — Outer sheet:**
- Left half: back cover — officers list with dot leaders, committees, contacts
- Right half: front cover — Percy Lodge logo (`public/images/cover.png`), RMBI note in red

**Page 2 — Inner sheet:**
- Left (~108mm): inside front — Province of Northumberland header, formal summons letter
- Centre (~39mm): spine — subscribing past masters + honorary members listed top to bottom
- Right (remainder): inside back — BUSINESS heading, monthly agenda items, meals section, meeting dates

## PDF generation
Route `GET /meeting/:id/pdf` launches Puppeteer, renders outer and inner preview pages, merges with pdf-lib, returns 2-page landscape PDF. Use `--no-sandbox` flag (required for Railway).

## Deployment
Hosted on Railway. `npm start` is the start command. Uses `process.env.PORT`.
Repo: https://github.com/slyons110671/percy-lodge-summons

## Status
Core app is working. Layout tweaks to the summons print templates are in progress — font sizes, column proportions, spacing, and fidelity to the original printed layout.
