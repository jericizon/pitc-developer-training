# PITC Developer Training

Monorepo of training exercises. Two apps share one product catalog:

- **`express-js/`**: the Stockroom JSON API (Express 5, SQL Server in Docker via `mssql`).
- **`nextjs-dashboard/`**: the Next.js app (React, TypeScript) with the Stockroom UI. It calls the API through its `/api` proxy.

## Prerequisites

- Node.js 20.12 or newer
- pnpm (the root pins `pnpm@12.18.0`)
- Docker with Compose

## First-time setup

1. Install dependencies. The root workspace installs the Express app. `nextjs-dashboard` has its own lockfile, so install it separately:

   ```bash
   pnpm install
   pnpm -C nextjs-dashboard install
   ```

2. Create `express-js/.env` from `express-js/.env.example` and fill in the database settings. See [Database (SQL Server)](express-js/README.md#database-sql-server).

3. Start SQL Server and run the migration:

   ```bash
   pnpm server:up
   ```

## Daily development

```bash
pnpm dev
```

This starts the API and the web app together. Press Ctrl+C to stop both.

Open http://localhost:3000/ (or your `WEB_PORT`). It redirects to `/dashboard`, and products are at `/dashboard/products`.

## Ports

| App | Default | Example in root `.env` | Variable |
| --- | --- | --- | --- |
| Web (Next.js) | 3000 | 3001 | `WEB_PORT` |
| API (Express) | 3001 | 3002 | `API_PORT` |

The root `.env` (git-ignored) sets these for `pnpm dev`, and its values override shell variables:

```bash
WEB_PORT=3001
API_PORT=3002
```

- `pnpm dev` passes `API_PORT` to Express as `PORT`, so the `PORT` line in `express-js/.env` only applies when Express runs alone.
- The `/api` proxy in the web app also reads `API_PORT`.
- Restart `pnpm dev` after changing a port. If a web port is busy, the app fails to start instead of moving to another port.

## Scripts

| Command | Run from | What it does |
| --- | --- | --- |
| `pnpm dev` | root | Starts the API and the web app together |
| `pnpm server:up` | root | Starts SQL Server, waits until healthy, runs the migration. Does not start the API |
| `pnpm dev` | `express-js/` | API only, restarts on file changes |
| `pnpm start` | `express-js/` | API only, no auto-restart |
| `pnpm seed` | `express-js/` | Migration, plus sample products if the table is empty |
| `pnpm seed --reset` | `express-js/` | Replaces the products with the sample set |
| `pnpm test` | `express-js/` | API tests. SQL Server must be running and seeded |
| `pnpm dev` | `nextjs-dashboard/` | Web app only, on `WEB_PORT` (default 3000) |
| `pnpm build` | `nextjs-dashboard/` | Production build |

## Routes

### Web app (`nextjs-dashboard`)

| Path | Page |
| --- | --- |
| `/` | Redirects to `/dashboard` |
| `/dashboard` | Stock stats, low-stock panel, recent activity |
| `/dashboard/products` | Product table with search, filters, favorites, and bulk select, delete, or favorite |
| `/dashboard/products/create` | Add a product |
| `/dashboard/products/[id]` | Product details, `−`/`+` stock buttons, favorite, edit, delete |
| `/dashboard/products/[id]/edit` | Edit a product |
| `/dashboard/customers`, `/dashboard/invoices` | Placeholder pages with no data |
| `/seed`, `/query` | Course starter routes, unrelated to Stockroom |

### API (`express-js`)

The web app reaches these through `/api/...`, for example `/api/products`.

| Method and path | Purpose |
| --- | --- |
| `GET /` | JSON home response |
| `GET /products` | List products. Query: `search`, `category`, `status` |
| `GET /products/:id` | One product |
| `POST /products` | Create a product |
| `PUT /products/:id` | Update a product |
| `DELETE /products/:id` | Delete a product |
| `GET /activity` | Latest 50 changes, kept in memory |

Full request and response details are in [express-js/README.md](express-js/README.md).

## Troubleshooting

- **`pnpm dev` stops with a port error:** another program holds `WEB_PORT` or `API_PORT`. Change it in the root `.env`.
- **`ECONNREFUSED` in the web logs:** the API is not running. Check the `[api]` lines in the `pnpm dev` output.
- **`Could not connect to SQL Server`:** the container is not healthy, or `DB_PASSWORD` differs from `MSSQL_SA_PASSWORD`. Run `docker compose ps` in `express-js/`.
- **Nodemon says `app crashed - waiting for file changes`:** fix the error and save a file. Nodemon does not watch `.env`, so restart `pnpm dev` after editing it.

## Environment files

| File | Tracked by git | Contents |
| --- | --- | --- |
| `.env` (root) | No | `WEB_PORT`, `API_PORT` |
| `express-js/.env` | No | `PORT`, `MSSQL_SA_PASSWORD`, `DB_*` |
| `express-js/.env.example` | Yes | Template for `express-js/.env` |

`.env` files hold passwords. Do not commit them.

## Project layout

```text
pitc-developer-training/
├── .env                      Ports for pnpm dev (git-ignored)
├── package.json              Root scripts: dev, server:up
├── express-js/               Stockroom API
│   ├── app.js, db.js         Express app, SQL Server connection pool
│   ├── docker-compose.yml    SQL Server container
│   ├── routes/               products.js, activity.js
│   ├── scripts/              seed.js (migration), server-up.js
│   └── test/                 api.test.js
└── nextjs-dashboard/         Next.js app
    ├── app/dashboard/        Stockroom pages and placeholder pages
    ├── app/ui/products/      Product list, form, and detail components
    └── app/lib/              API client and favorites hook
```
