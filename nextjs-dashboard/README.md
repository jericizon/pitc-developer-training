# Stockroom web app

Next.js (App Router) app with React and TypeScript. It serves the Stockroom product pages under `/dashboard/products`, plus some starter routes from the Next.js course. For the full setup, see the [root README](../README.md).

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server on `WEB_PORT` (default 3000) |
| `pnpm build` | Production build |
| `pnpm start` | Serves the production build on port 3000 |

## Environment

| Variable | Default | Used for |
| --- | --- | --- |
| `WEB_PORT` | `3000` | Port for `pnpm dev` |
| `API_PORT` | `3001` | Port of the Express API that the `/api` proxy forwards to |
| `POSTGRES_URL` | none | Connection string for the course `/seed` route only |

Product pages need the Express API running. From the repo root, `pnpm dev` starts both.
