# Product Admin Dashboard

A small admin dashboard built with Next.js (App Router), React, TypeScript, Tailwind CSS, and Axios, using the [DummyJSON](https://dummyjson.com) API. Users log in, then browse, search, filter, sort, view, add, edit, and delete products.

**Live demo:** https://product-admin-dashboard-w9n2-taupe.vercel.app
**Login credentials:** username `emilys`, password `emilyspass`

## Setup

```bash
git clone https://github.com/numanmaldar/product-admin-dashboard.git
cd product-admin-dashboard
npm install
npm run dev
```

Open `http://localhost:3000` — it redirects to `/login`.

## Tech stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- Axios (single shared instance with request/response interceptors)
- No external state/data-fetching libraries — all fetching, caching, and pagination logic is hand-written per the assignment rules

## Features completed

- **Auth** — login against `/auth/login`, token stored client-side, route protection via a layout-level guard, logout button
- **Product list** — responsive: table on desktop, cards on mobile
- **Pagination** — `limit`/`skip`-based, page-size selector (10/20/50), Previous/Next, page numbers, "Showing X–Y of Z", all kept in the URL
- **Search** — debounced (400ms), old/slow responses can never overwrite newer ones (guarded with a cancellation flag per request)
- **Category filter** — populated from `/products/categories`
- **Sort** — by price, rating, or title
- **Product detail page** — `/products/[id]`, with a proper "not found" state for invalid IDs
- **Add / edit / delete** — form validation, confirm-before-delete modal, changes persisted locally so they survive refresh (see below)
- **Loading / empty / error states** — spinners, empty messages, and a Retry button on failure
- **Invalid URL protection** — `?page=abc` or `?page=999` fall back safely instead of crashing
- **Double-submit protection** — Login and Save buttons disable while a request is in flight

## Key decisions and tradeoffs

**Search vs. category filter.** DummyJSON's API can't combine a search query with a category filter in one request. I chose to let search take priority: entering a search term disables the category dropdown (visually greyed out) until the search is cleared. This matches how most e-commerce search UIs behave and keeps the URL state unambiguous (only one of `q` or `category` is ever active).

**Add/edit/delete aren't really persisted by the API.** DummyJSON's write endpoints don't actually save anything server-side — a POST to `/products/add` always returns the same placeholder response regardless of what you send, and deleted/edited products reappear on the next fetch. To make the app feel real despite this, I keep a small `localOverrides` layer in `localStorage`: after a successful API call, the change (edit, delete, or new product) is recorded there and merged into every subsequent fetch — deleted items are filtered out, edited items show their new values, and added items are prepended with a locally generated ID (`Date.now()`, since the API doesn't return a real persistent one). This survives page refreshes, which plain React state wouldn't.

**Auth storage.** Token is stored in `localStorage` rather than a cookie, so route protection happens client-side (a guard component checking for a token on mount) rather than via Next.js middleware. This was the simpler option for the assignment's scope — the known tradeoff is that it isn't a true server-side security boundary, just a UI gate.

## A problem I hit, and how I fixed it

While wiring up the API layer, I had a file genuinely named `lib/api/clients.ts` (plural) but every import across the app referenced `./client` (singular) — the whole app silently failed to compile with no clear error surfaced in the browser, since the import resolution error only showed in the dev server terminal. I found it by checking the terminal output directly rather than only the browser console, renamed the file to match every import, and after that made a habit of double-checking file names against import paths whenever I created a new module — this came up a few more times (case-sensitivity issues between Windows' case-insensitive filesystem and Next.js's case-sensitive bundler resolution).

A related one: the production build (`next build`) caught issues `next dev` never flagged — a missing `axios` entry in `package.json` (it worked locally off a stale `node_modules` but wasn't actually a saved dependency) and a `useSearchParams()` call that needed a `Suspense` boundary for static prerendering to succeed. Both only surfaced once I deployed to Vercel, which was a good reminder to run `npm run build` locally before pushing, rather than relying on `next dev` alone.

## Where AI helped

I used Claude throughout this project — planning the phase-by-phase architecture (auth → list/pagination → search/filter → detail page → CRUD → styling → deploy), generating the initial implementation of each piece (the Axios interceptor setup, the debounce hook, the race-condition-safe fetch pattern with a cancellation flag, the local-overrides persistence layer), and debugging build/runtime errors as they came up (module resolution issues, a TypeScript duplicate-key error, the Suspense boundary requirement). I reviewed, tested, and fixed each piece myself rather than pasting code blindly — in particular the file-naming bugs and the missing `axios` dependency were things I had to trace through the actual terminal/build output myself to resolve.

## Known limitations

- Auth is client-side only (see tradeoffs above) — not a real security boundary
- Add/edit/delete changes are local-only (stored in `localStorage`), since the underlying API doesn't persist writes
- Sort is applied client-side when combined with search or category filtering, since DummyJSON's `sortBy`/`order` params aren't supported on those specific endpoints
