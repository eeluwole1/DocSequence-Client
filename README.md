# DocSequence Client

[![CI](https://github.com/eeluwole1/DocSequence-Client/actions/workflows/ci.yml/badge.svg)](https://github.com/eeluwole1/DocSequence-Client/actions/workflows/ci.yml)

The **Angular frontend** for **DocSequence, the Engineering Document Number Management System**. Engineers use it to generate unique, sequential document identifiers such as `CXY-10431` and to look up past allocations.

**Live demo:** [purple-flower-04ffe8110.2.azurestaticapps.net](https://purple-flower-04ffe8110.2.azurestaticapps.net)

> Angular 21 · TypeScript 5.9 · Tailwind CSS 4 · Signals · Vitest

The API, the database design, the concurrency guarantees and the full documentation live in the companion repository **[DocSequence-Api](https://github.com/eeluwole1/DocSequence-Api)** (backend).

---

## What it is for

> **As an engineer**, I want to select the type of engineering document I am creating and request the next available document number,
> **so that** I can uniquely identify my document without checking a shared ledger or risking a duplicate when another engineer generates one at the same time.

Engineers used to take the next number from a paper ledger. This app replaces that ledger: fill in three fields, click **Generate**, copy the identifier into your drawing. The backend guarantees that no two engineers ever receive the same number, even when they click at the same moment.

---

## Screens

### Generate

| Element | Behaviour |
|---|---|
| Engineer name, document name | Required; whitespace-only is rejected; 100 / 200 character limits |
| Document type | Dropdown loaded from `GET /api/document-types` (e.g. **CXY · CXY Drawing**) |
| **Generate** button | Disabled with a spinner while the request is in flight, so a double click can't send two requests |
| Result | The identifier in large monospace with a **Copy** button, plus the document, engineer and local creation time (UTC in the tooltip) |
| Failure | A red panel: **"Generation was not confirmed"** plus the server's reason, and a note that retrying is safe |
| After success | The document name clears; engineer and type are kept for the next document |

### History

| Element | Behaviour |
|---|---|
| Filters | Type, identifier (e.g. `cxy-104`), engineer, From / To dates |
| Table | Identifier, document, engineer, created (local time, UTC tooltip), newest first |
| Paging | "N results · page X of Y" with Previous / Next |

The From / To pickers select **your local days**; the app converts the start and end of those days to UTC before calling the API, so "today" means today in your time zone.

---

## Retry safety

Each logical submission carries a **`requestKey`** (a UUID created in the browser):

| Situation | Key sent |
|---|---|
| First attempt | New key |
| **Retry after a failure, form unchanged** | **Same key**, so the server returns the original number if the first attempt had actually succeeded |
| User edits any field | New key |
| After a successful generation | New key |

This covers the case where the server saved a number but the response was lost on the way back. Retrying never consumes a second number.

---

## Getting started

### Prerequisites

- Node.js 24 and Angular CLI 21
- The **[DocSequence API](https://github.com/eeluwole1/DocSequence-Api)** running on `http://localhost:5294` (see its README)

### Run

```bash
npm install
npm start
```

Open **http://localhost:4200**.

`npm start` runs `ng serve --proxy-config proxy.conf.json`: every request to `/api/...` is forwarded to the API on port 5294, so the browser only ever talks to port 4200 and no CORS setup is needed during development. Start the API first.

### Test

```bash
npx ng test --watch=false
```

| Test (`generate-form.spec.ts`) | Proves |
|---|---|
| fills the document type dropdown from the API | Types load on start |
| shows validation messages and sends nothing when the form is empty | Client-side validation; no request sent |
| disables Generate while the request is pending, then shows the identifier | Double-submit guard; correct request body; result display |
| **reuses the request key when retrying after a failure…** | **Retry safety: same key on retry, new key after success** |
| uses a new request key when the user edits the form after a failure | Edited input is a new logical request |
| shows the API error and says generation was not confirmed | ProblemDetails `detail` is shown to the user |

The tests drive the form through the DOM, as a user would, and use Angular's `HttpTestingController` in place of a real server.

### Build

```bash
npx ng build
```

Output goes to `dist/docsequence-client/browser`. The production build swaps `environment.ts` for `environment.prod.ts`, which holds the deployed API URL.

---

## Project structure

```
src/
├── app/
│   ├── components/
│   │   ├── generate-form/     Generate page
│   │   ├── history-list/      History page
│   │   ├── header/            Logo + Generate | History navigation
│   │   ├── footer/
│   │   └── shared/
│   │       ├── button/        Tailwind button (primary / secondary, loading spinner)
│   │       ├── card/          Card container with optional title
│   │       └── toast-container/  Success and error toasts
│   ├── models/                TypeScript mirrors of the API contracts
│   ├── services/              DocumentTypeService, DocumentNumberService, ToastService
│   ├── app.config.ts          Providers (router, HttpClient)
│   ├── app.routes.ts          /generate, /history
│   └── app.ts / app.html      Shell: header, routed page, footer, toasts
├── environments/
│   ├── environment.ts         apiUrl: '/api' (proxied in development)
│   └── environment.prod.ts    apiUrl for the deployed API
└── styles.css                 Tailwind v4 entry point
```

## Technical notes

- **Standalone components and signals** for all state, with `@if` / `@for` control flow. Angular 21 runs without Zone.js, and signals tell it when to update the view.
- **Tailwind CSS v4** through PostCSS (`.postcssrc.json`); no `tailwind.config.js` is needed.
- **One service per API resource.** Components never build URLs; the base URL comes from `environment.apiUrl`.
- **Native form controls** (`<select>`, `<input type="date">`, `<table>`) styled with Tailwind, so the screens are keyboard-accessible without a component library.

---

*DocSequence is an independent portfolio project based on an interview exercise. It does not describe any company's production system.*
